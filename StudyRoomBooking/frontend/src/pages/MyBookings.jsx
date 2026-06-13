import { useEffect, useState } from "react";
import AppToast from "../components/AppToast";
import ConfirmModal from "../components/ConfirmModal";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import {
    cancelBooking,
    checkInBooking,
    getMyBookings
} from "../services/bookingService";
import { saveRoomReview } from "../services/roomService";

const statusLabel = {
    approved: "Đã duyệt",
    pending: "Chờ duyệt",
    rejected: "Từ chối",
    cancelled: "Đã hủy"
};

const CHECKIN_EARLY_MINUTES = 120;

function MyBookings() {
    const [bookings, setBookings] = useState([]);
    const [checkinCodes, setCheckinCodes] = useState({});
    const [reviewForms, setReviewForms] = useState({});
    const [editingReviews, setEditingReviews] = useState({});
    const [toast, setToast] = useState(null);
    const [cancelTarget, setCancelTarget] = useState(null);
    const [processing, setProcessing] = useState(false);

    const showToast = (type, text) => {
        setToast({ type, text });
        window.setTimeout(() => setToast(null), 3400);
    };

    async function loadBookings() {
        try {
            const res = await getMyBookings();
            setBookings(res.data || []);
        } catch (error) {
            showToast("danger", error.response?.data?.message || "Không tải được lịch của tôi");
        }
    }

    useEffect(() => {
        let ignore = false;

        const fetchBookings = async () => {
            try {
                const res = await getMyBookings();
                if (!ignore) {
                    setBookings(res.data || []);
                }
            } catch (error) {
                if (!ignore) {
                    showToast("danger", error.response?.data?.message || "Không tải được lịch của tôi");
                }
            }
        };

        fetchBookings();

        return () => {
            ignore = true;
        };
    }, []);

    const confirmCancel = async () => {
        if (!cancelTarget) return;
        setProcessing(true);

        try {
            await cancelBooking(cancelTarget.id);
            setCancelTarget(null);
            showToast("success", "Hủy lịch thành công");
            await loadBookings();
        } catch (error) {
            showToast("danger", error.response?.data?.message || "Hủy lịch thất bại");
        } finally {
            setProcessing(false);
        }
    };

    const handleCodeChange = (id, value) => {
        setCheckinCodes((current) => ({
            ...current,
            [id]: value.toUpperCase()
        }));
    };

    const handleCheckIn = async (id) => {
        try {
            await checkInBooking(id, checkinCodes[id] || "");
            showToast("success", "Check-in thành công");
            await loadBookings();
        } catch (error) {
            showToast("danger", error.response?.data?.message || "Check-in thất bại");
        }
    };

    const codePattern = (code) => {
        const safeCode = String(code || "");
        const chars = safeCode.padEnd(9, "X").slice(0, 9).split("");

        return chars.map((char) => char.charCodeAt(0) % 2 === 0);
    };

    const renderStars = (rating) => {
        const value = Math.round(Number(rating || 0));
        return "★".repeat(value) + "☆".repeat(5 - value);
    };

    const badgeClass = (booking) => {
        if (booking.no_show) return "bg-dark";
        if (booking.status === "approved") return "bg-success";
        if (booking.status === "pending") return "bg-warning text-dark";
        if (booking.status === "rejected") return "bg-danger";
        return "bg-secondary";
    };

    const canReview = (booking) => {
        if (
            booking.status !== "approved" ||
            !booking.checked_in_at ||
            !booking.booking_date ||
            !booking.end_time
        ) {
            return false;
        }

        const finishedAt = new Date(
            `${booking.booking_date.slice(0, 10)}T${booking.end_time}`
        );

        return finishedAt < new Date();
    };

    const getCheckinState = (booking) => {
        if (
            booking.status !== "approved" ||
            booking.no_show ||
            booking.checked_in_at ||
            !booking.booking_date ||
            !booking.start_time ||
            !booking.end_time
        ) {
            return "hidden";
        }

        const now = new Date();
        const startAt = new Date(`${booking.booking_date.slice(0, 10)}T${booking.start_time}`);
        const endAt = new Date(`${booking.booking_date.slice(0, 10)}T${booking.end_time}`);
        const earliestCheckinAt = new Date(
            startAt.getTime() - CHECKIN_EARLY_MINUTES * 60 * 1000
        );

        if (now < earliestCheckinAt) {
            return "too_early";
        }

        if (now > endAt) {
            return "expired";
        }

        return "open";
    };

    const handleReviewChange = (id, field, value) => {
        setReviewForms((current) => ({
            ...current,
            [id]: {
                rating: 5,
                comment: "",
                ...(current[id] || {}),
                [field]: value
            }
        }));
    };

    const handleReviewSubmit = async (booking) => {
        const form = reviewForms[booking.id] || {
            rating: booking.my_rating || 5,
            comment: booking.my_review_comment || ""
        };

        try {
            await saveRoomReview(booking.room_id, {
                rating: form.rating,
                comment: form.comment
            });

            showToast("success", "Cảm ơn bạn đã đánh giá phòng");
            setEditingReviews((current) => ({
                ...current,
                [booking.id]: false
            }));
            await loadBookings();
        } catch (error) {
            showToast("danger", error.response?.data?.message || "Gửi đánh giá thất bại");
        }
    };

    const startEditReview = (booking) => {
        setReviewForms((current) => ({
            ...current,
            [booking.id]: {
                rating: booking.my_rating || 5,
                comment: booking.my_review_comment || ""
            }
        }));
        setEditingReviews((current) => ({
            ...current,
            [booking.id]: true
        }));
    };

    return (
        <>
            <Navbar />
            <AppToast message={toast} />

            <div className="container app-shell">
                <div className="page-heading">
                    <div>
                        <h1>Lịch của tôi</h1>
                        <p>Theo dõi trạng thái duyệt, mã check-in và lịch sử đặt phòng.</p>
                    </div>
                </div>

                <div className="table-responsive mt-3">
                    <table className="table table-bordered align-middle">
                        <thead className="table-light">
                            <tr>
                                <th>Phòng</th>
                                <th>Ngày</th>
                                <th>Giờ</th>
                                <th>Mục đích</th>
                                <th>Số người</th>
                                <th>Trạng thái</th>
                                <th>Lý do từ chối</th>
                                <th>Check-in</th>
                                <th>Đánh giá</th>
                                <th>Thao tác</th>
                            </tr>
                        </thead>

                        <tbody>
                            {bookings.length === 0 && (
                                <tr>
                                    <td colSpan="10" className="text-center">
                                        Bạn chưa có lịch đặt phòng.
                                    </td>
                                </tr>
                            )}

                            {bookings.map((booking) => (
                                <tr key={booking.id}>
                                    <td>{booking.room_name}</td>
                                    <td>{booking.booking_date?.slice(0, 10)}</td>
                                    <td>
                                        {booking.start_time} - {booking.end_time}
                                    </td>
                                    <td>{booking.purpose || "-"}</td>
                                    <td>{booking.participants || "-"}</td>
                                    <td>
                                        <span className={`badge ${badgeClass(booking)}`}>
                                            {booking.no_show ? "Vắng mặt" : statusLabel[booking.status] || booking.status}
                                        </span>
                                    </td>
                                    <td>{booking.rejection_reason || "-"}</td>
                                    <td>
                                        {booking.status === "approved" && !booking.no_show ? (
                                            booking.checked_in_at ? (
                                                <span className="badge bg-success">Đã check-in</span>
                                            ) : getCheckinState(booking) === "too_early" ? (
                                                <span className="badge bg-secondary">
                                                    Check-in mở trước giờ học 2 giờ
                                                </span>
                                            ) : getCheckinState(booking) === "expired" ? (
                                                <span className="badge bg-dark">Đã quá hạn check-in</span>
                                            ) : (
                                                <div style={{ minWidth: 180 }}>
                                                    <div className="d-flex align-items-center gap-2 mb-2">
                                                        <div
                                                            className="border p-1"
                                                            style={{
                                                                display: "grid",
                                                                gridTemplateColumns: "repeat(3, 10px)",
                                                                gap: 2
                                                            }}
                                                            title="Mã QR demo"
                                                        >
                                                            {codePattern(booking.checkin_code).map((filled, index) => (
                                                                <span
                                                                    key={index}
                                                                    style={{
                                                                        width: 10,
                                                                        height: 10,
                                                                        background: filled ? "#111" : "#fff",
                                                                        border: "1px solid #111"
                                                                    }}
                                                                />
                                                            ))}
                                                        </div>
                                                        <code>{booking.checkin_code || "Chưa có mã"}</code>
                                                    </div>
                                                    <div className="input-group input-group-sm">
                                                        <input
                                                            className="form-control"
                                                            placeholder="Nhập mã"
                                                            value={checkinCodes[booking.id] || ""}
                                                            onChange={(e) =>
                                                                handleCodeChange(booking.id, e.target.value)
                                                            }
                                                        />
                                                        <button
                                                            className="btn btn-outline-success"
                                                            onClick={() => handleCheckIn(booking.id)}
                                                            type="button"
                                                        >
                                                            Check-in
                                                        </button>
                                                    </div>
                                                </div>
                                            )
                                        ) : (
                                            "-"
                                        )}
                                    </td>
                                    <td>
                                        {canReview(booking) ? (
                                            booking.my_rating && !editingReviews[booking.id] ? (
                                                <div
                                                    className="p-2 rounded border bg-light text-muted"
                                                    style={{ minWidth: 240, opacity: 0.78 }}
                                                >
                                                    <div className="d-flex justify-content-between gap-2 mb-1">
                                                        <span className="rating-stars">
                                                            {renderStars(booking.my_rating)}
                                                        </span>
                                                        <button
                                                            className="btn btn-outline-primary btn-sm"
                                                            onClick={() => startEditReview(booking)}
                                                            type="button"
                                                        >
                                                            Sửa đánh giá
                                                        </button>
                                                    </div>
                                                    <div>
                                                        {booking.my_review_comment ||
                                                            "Bạn đã đánh giá phòng này."}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div style={{ minWidth: 240 }}>
                                                    <select
                                                        className="form-select form-select-sm mb-2"
                                                        value={
                                                            reviewForms[booking.id]?.rating ||
                                                            booking.my_rating ||
                                                            5
                                                        }
                                                        onChange={(e) =>
                                                            handleReviewChange(
                                                                booking.id,
                                                                "rating",
                                                                Number(e.target.value)
                                                            )
                                                        }
                                                    >
                                                        <option value="5">5 sao - Xuất sắc</option>
                                                        <option value="4">4 sao - Tốt</option>
                                                        <option value="3">3 sao - Tạm ổn</option>
                                                        <option value="2">2 sao - Cần cải thiện</option>
                                                        <option value="1">1 sao - Rất tệ</option>
                                                    </select>
                                                    <textarea
                                                        className="form-control form-control-sm mb-2"
                                                        rows="2"
                                                        placeholder="Nhận xét sau khi sử dụng phòng"
                                                        value={
                                                            reviewForms[booking.id]?.comment ||
                                                            booking.my_review_comment ||
                                                            ""
                                                        }
                                                        onChange={(e) =>
                                                            handleReviewChange(
                                                                booking.id,
                                                                "comment",
                                                                e.target.value
                                                            )
                                                        }
                                                    />
                                                    <div className="d-flex gap-2">
                                                        <button
                                                            className="btn btn-primary btn-sm"
                                                            onClick={() => handleReviewSubmit(booking)}
                                                            type="button"
                                                        >
                                                            {booking.my_rating ? "Lưu đánh giá" : "Gửi đánh giá"}
                                                        </button>
                                                        {booking.my_rating && (
                                                            <button
                                                                className="btn btn-outline-secondary btn-sm"
                                                                onClick={() =>
                                                                    setEditingReviews((current) => ({
                                                                        ...current,
                                                                        [booking.id]: false
                                                                    }))
                                                                }
                                                                type="button"
                                                            >
                                                                Hủy
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            )
                                        ) : (
                                            <span className="text-muted">
                                                Chỉ hiện sau khi sử dụng xong
                                            </span>
                                        )}
                                    </td>
                                    <td>
                                        {booking.status === "pending" && (
                                            <button
                                                className="btn btn-danger btn-sm"
                                                onClick={() => setCancelTarget(booking)}
                                                type="button"
                                            >
                                                Hủy
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <ConfirmModal
                open={Boolean(cancelTarget)}
                title="Hủy lịch đặt phòng?"
                message={`Bạn có muốn hủy lịch phòng ${cancelTarget?.room_name || ""} không?`}
                detail="Bạn chỉ có thể hủy lịch đang chờ duyệt."
                confirmText="Hủy lịch"
                danger
                loading={processing}
                onCancel={() => setCancelTarget(null)}
                onConfirm={confirmCancel}
            />

            <Footer />
        </>
    );
}

export default MyBookings;
