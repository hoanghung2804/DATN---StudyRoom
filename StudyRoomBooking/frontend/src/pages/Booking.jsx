import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppToast from "../components/AppToast";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import {
    createBooking,
    getRoomSchedule
} from "../services/bookingService";
import {
    getRoom,
    getRoomReviews
} from "../services/roomService";

function renderStars(rating) {
    const value = Math.round(Number(rating || 0));

    return "★".repeat(value) + "☆".repeat(5 - value);
}

const roomStatusLabel = {
    available: "Sẵn sàng",
    occupied: "Đang sử dụng",
    maintenance: "Bảo trì"
};

const roomTypeLabel = {
    classroom: "Phòng học",
    meeting: "Phòng họp",
    lab: "Phòng lab",
    seminar: "Phòng seminar"
};

const bookingStatusLabel = {
    approved: "Đã duyệt",
    pending: "Chờ duyệt",
    rejected: "Từ chối",
    cancelled: "Đã hủy"
};

function Booking() {
    const { roomId } = useParams();
    const navigate = useNavigate();

    const [room, setRoom] = useState(null);
    const [bookingDate, setBookingDate] = useState("");
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [purpose, setPurpose] = useState("");
    const [participants, setParticipants] = useState(1);
    const [schedule, setSchedule] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState(null);

    const showToast = (type, text) => {
        setToast({ type, text });
        window.setTimeout(() => setToast(null), 3400);
    };

    useEffect(() => {
        let ignore = false;

        Promise.all([
            getRoom(roomId),
            getRoomReviews(roomId)
        ])
            .then(([roomRes, reviewRes]) => {
                if (!ignore) {
                    setRoom(roomRes.data);
                    setReviews(reviewRes.data);
                }
            })
            .catch((err) => {
                showToast("danger", err.response?.data?.message || "Không tải được phòng");
            });

        return () => {
            ignore = true;
        };
    }, [roomId]);

    useEffect(() => {
        if (!bookingDate) {
            return;
        }

        let ignore = false;

        getRoomSchedule(roomId, bookingDate)
            .then((res) => {
                if (!ignore) {
                    setSchedule(res.data);
                }
            })
            .catch(() => {
                if (!ignore) {
                    setSchedule([]);
                }
            });

        return () => {
            ignore = true;
        };
    }, [bookingDate, roomId]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setLoading(true);

            await createBooking({
                room_id: roomId,
                booking_date: bookingDate,
                start_time: startTime,
                end_time: endTime,
                purpose,
                participants: Number(participants)
            });

            showToast("success", "Đặt phòng thành công, vui lòng chờ quản trị viên duyệt");
            window.setTimeout(() => navigate("/my-bookings"), 800);
        } catch (error) {
            showToast("danger", error.response?.data?.message || "Đặt phòng thất bại");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Navbar />
            <AppToast message={toast} />

            <div className="container app-shell">
                <div className="page-heading">
                    <div>
                        <h1>Đặt phòng</h1>
                        <p>Nhập mục đích, số người và khung giờ cần sử dụng phòng.</p>
                    </div>
                </div>

                {room && (
                    <div className="row g-4 mb-4">
                        <div className="col-lg-7">
                            <img
                                className="room-hero"
                                src={room.image_url || "https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=900&q=80"}
                                alt={room.room_name}
                            />
                        </div>
                        <div className="col-lg-5">
                            <div className="card h-100">
                                <div className="card-body">
                                    <div className="d-flex justify-content-between gap-2 mb-2">
                                        <h2 className="h4 mb-0">{room.room_name}</h2>
                                        <span className="badge bg-primary">
                                            {roomStatusLabel[room.status] || room.status}
                                        </span>
                                    </div>
                                    <div className="rating-stars mb-2">
                                        {renderStars(room.average_rating)}
                                    </div>
                                    <p className="text-muted">
                                        {room.average_rating || "Chưa có"} / 5 từ{" "}
                                        {room.review_count || 0} đánh giá
                                    </p>
                                    <div className="meta-row">
                                        <span className="meta-pill">
                                            {room.capacity} chỗ
                                        </span>
                                        <span className="meta-pill">
                                            Tòa {room.building || "-"}
                                            {room.floor ? ` / tầng ${room.floor}` : ""}
                                        </span>
                                        <span className="meta-pill">
                                            {roomTypeLabel[room.room_type] || room.room_type || "Phòng học"}
                                        </span>
                                    </div>
                                    <p>{room.description || "Chưa có mô tả phòng."}</p>
                                    <p className="mb-0">
                                        <strong>Thiết bị:</strong>{" "}
                                        {room.equipment || "Chưa cập nhật"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <form className="card filter-card p-3" onSubmit={handleSubmit}>
                    <div className="row g-3">
                        <div className="col-md-4">
                            <label className="form-label">Ngày đặt</label>
                            <input
                                type="date"
                                className="form-control"
                                value={bookingDate}
                                onChange={(e) => setBookingDate(e.target.value)}
                                required
                            />
                        </div>

                        <div className="col-md-4">
                            <label className="form-label">Giờ bắt đầu</label>
                            <input
                                type="time"
                                className="form-control"
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                                required
                            />
                        </div>

                        <div className="col-md-4">
                            <label className="form-label">Giờ kết thúc</label>
                            <input
                                type="time"
                                className="form-control"
                                value={endTime}
                                onChange={(e) => setEndTime(e.target.value)}
                                required
                            />
                        </div>

                        <div className="col-md-4">
                            <label className="form-label">Số người tham gia</label>
                            <input
                                type="number"
                                min="1"
                                max={room?.capacity || undefined}
                                className="form-control"
                                value={participants}
                                onChange={(e) => setParticipants(e.target.value)}
                                required
                            />
                        </div>

                        <div className="col-md-8">
                            <label className="form-label">Mục đích sử dụng</label>
                            <input
                                className="form-control"
                                value={purpose}
                                onChange={(e) => setPurpose(e.target.value)}
                                placeholder="Ví dụ: học nhóm, bảo vệ đồ án, sinh hoạt CLB"
                                required
                            />
                        </div>
                    </div>

                    <button
                        className="btn btn-success mt-3"
                        disabled={loading}
                    >
                        {loading ? "Đang gửi..." : "Xác nhận đặt phòng"}
                    </button>
                </form>

                {bookingDate && (
                    <div className="card mt-4">
                        <div className="card-body">
                            <h5 className="card-title">
                                Lịch phòng trong ngày {bookingDate}
                            </h5>

                            {schedule.length === 0 ? (
                                <div className="alert alert-success mb-0">
                                    Chưa có lịch chờ duyệt/đã duyệt trong ngày này.
                                </div>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table table-sm align-middle mb-0">
                                        <thead>
                                            <tr>
                                                <th>Giờ</th>
                                                <th>Trạng thái</th>
                                                <th>Mục đích</th>
                                                <th>Người đặt</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {schedule.map((item) => (
                                                <tr key={item.id}>
                                                    <td>
                                                        {item.start_time} - {item.end_time}
                                                    </td>
                                                    <td>
                                                        <span className="badge bg-secondary">
                                                            {bookingStatusLabel[item.status] || item.status}
                                                        </span>
                                                    </td>
                                                    <td>{item.purpose || "-"}</td>
                                                    <td>{item.fullname}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <div className="row g-4 mt-1">
                    <div className="col-lg-12">
                        <div className="card">
                            <div className="card-body">
                                <h5 className="card-title">Nhận xét của sinh viên</h5>
                                <p className="text-muted">
                                    Các đánh giá này đến từ sinh viên đã sử dụng xong phòng.
                                </p>
                                {reviews.length === 0 ? (
                                    <div className="empty-state">
                                        Chưa có đánh giá nào cho phòng này.
                                    </div>
                                ) : (
                                    reviews.map((review) => (
                                        <div className="review-item" key={review.id}>
                                            <div className="d-flex justify-content-between gap-3">
                                                <strong>{review.fullname}</strong>
                                                <span className="rating-stars">
                                                    {renderStars(review.rating)}
                                                </span>
                                            </div>
                                            <p className="mb-1 mt-2">
                                                {review.comment || "Không có nhận xét."}
                                            </p>
                                            <small className="text-muted">
                                                {new Date(review.created_at).toLocaleString()}
                                            </small>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </>
    );
}

export default Booking;
