import { useEffect, useState } from "react";
import AppToast from "../../components/AppToast";
import ConfirmModal from "../../components/ConfirmModal";
import Navbar from "../../components/Navbar";
import PromptModal from "../../components/PromptModal";
import {
    approveBooking,
    getAllBookings,
    rejectBookingWithReason
} from "../../services/bookingService";

const statusLabel = {
    approved: "Đã duyệt",
    pending: "Chờ duyệt",
    rejected: "Từ chối",
    cancelled: "Đã hủy"
};

function badgeClass(status, noShow) {
    if (noShow) return "bg-dark";
    if (status === "approved") return "bg-success";
    if (status === "pending") return "bg-warning text-dark";
    if (status === "rejected") return "bg-danger";
    return "bg-secondary";
}

function AdminBookings() {
    const [bookings, setBookings] = useState([]);
    const [filters, setFilters] = useState({
        status: "",
        date: "",
        keyword: ""
    });
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState("");
    const [toast, setToast] = useState(null);
    const [approveTarget, setApproveTarget] = useState(null);
    const [rejectTarget, setRejectTarget] = useState(null);
    const [rejectReason, setRejectReason] = useState("");

    async function loadBookings() {
        try {
            setLoading(true);
            setError("");
            const res = await getAllBookings();
            setBookings(res.data || []);
        } catch (err) {
            setError(err.response?.data?.message || "Không tải được danh sách đặt phòng");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        let ignore = false;

        const fetchBookings = async () => {
            try {
                setLoading(true);
                setError("");
                const res = await getAllBookings();
                if (!ignore) {
                    setBookings(res.data || []);
                }
            } catch (err) {
                if (!ignore) {
                    setError(err.response?.data?.message || "Không tải được danh sách đặt phòng");
                }
            } finally {
                if (!ignore) {
                    setLoading(false);
                }
            }
        };

        fetchBookings();

        return () => {
            ignore = true;
        };
    }, []);

    const showToast = (type, text) => {
        setToast({ type, text });
        window.setTimeout(() => setToast(null), 3400);
    };

    const confirmApprove = async () => {
        if (!approveTarget) return;
        setProcessing(true);

        try {
            await approveBooking(approveTarget.id);
            setApproveTarget(null);
            showToast("success", "Đã duyệt lịch đặt phòng");
            await loadBookings();
        } catch (err) {
            showToast("danger", err.response?.data?.message || "Duyệt lịch thất bại");
        } finally {
            setProcessing(false);
        }
    };

    const confirmReject = async () => {
        if (!rejectTarget || !rejectReason.trim()) {
            showToast("danger", "Vui lòng nhập lý do từ chối");
            return;
        }

        setProcessing(true);

        try {
            await rejectBookingWithReason(rejectTarget.id, rejectReason.trim());
            setRejectTarget(null);
            setRejectReason("");
            showToast("success", "Đã từ chối lịch đặt phòng");
            await loadBookings();
        } catch (err) {
            showToast("danger", err.response?.data?.message || "Từ chối lịch thất bại");
        } finally {
            setProcessing(false);
        }
    };

    const filteredBookings = bookings.filter((booking) => {
        const matchStatus =
            !filters.status || booking.status === filters.status;
        const matchDate =
            !filters.date || booking.booking_date?.slice(0, 10) === filters.date;
        const keyword = filters.keyword.toLowerCase();
        const matchKeyword =
            !keyword ||
            booking.fullname?.toLowerCase().includes(keyword) ||
            booking.email?.toLowerCase().includes(keyword) ||
            booking.room_name?.toLowerCase().includes(keyword) ||
            booking.purpose?.toLowerCase().includes(keyword);

        return matchStatus && matchDate && matchKeyword;
    });

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters((current) => ({
            ...current,
            [name]: value
        }));
    };

    const exportCsv = () => {
        const headers = [
            "Người đặt",
            "Email",
            "Phòng",
            "Ngày",
            "Giờ bắt đầu",
            "Giờ kết thúc",
            "Mục đích",
            "Số người",
            "Trạng thái",
            "Vắng mặt",
            "Lý do từ chối"
        ];

        const rows = filteredBookings.map((booking) => [
            booking.fullname,
            booking.email,
            booking.room_name,
            booking.booking_date?.slice(0, 10),
            booking.start_time,
            booking.end_time,
            booking.purpose || "",
            booking.participants || "",
            booking.status,
            booking.no_show ? "Có" : "Không",
            booking.rejection_reason || ""
        ]);

        const csv = [headers, ...rows]
            .map((row) =>
                row
                    .map((cell) => `"${String(cell ?? "").replaceAll("\"", "\"\"")}"`)
                    .join(",")
            )
            .join("\n");

        const blob = new Blob([csv], {
            type: "text/csv;charset=utf-8;"
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "bookings.csv";
        link.click();
        URL.revokeObjectURL(url);
    };

    return (
        <>
            <Navbar />
            <AppToast message={toast} />

            <div className="container app-shell">
                <div className="page-heading">
                    <div>
                        <h1>Quản lý đặt phòng</h1>
                        <p>Duyệt, từ chối, lọc và xuất danh sách yêu cầu đặt phòng.</p>
                    </div>
                    <button
                        className="btn btn-outline-primary"
                        onClick={loadBookings}
                        disabled={loading}
                        type="button"
                    >
                        Tải lại
                    </button>
                </div>

                <div className="card filter-card mb-3">
                    <div className="card-body">
                        <div className="row g-3 align-items-end">
                            <div className="col-md-3">
                                <label className="form-label">Trạng thái</label>
                                <select
                                    className="form-select"
                                    name="status"
                                    value={filters.status}
                                    onChange={handleFilterChange}
                                >
                                    <option value="">Tất cả</option>
                                    <option value="pending">Chờ duyệt</option>
                                    <option value="approved">Đã duyệt</option>
                                    <option value="rejected">Từ chối</option>
                                    <option value="cancelled">Đã hủy</option>
                                </select>
                            </div>

                            <div className="col-md-3">
                                <label className="form-label">Ngày đặt</label>
                                <input
                                    className="form-control"
                                    name="date"
                                    type="date"
                                    value={filters.date}
                                    onChange={handleFilterChange}
                                />
                            </div>

                            <div className="col-md-4">
                                <label className="form-label">Tìm kiếm</label>
                                <input
                                    className="form-control"
                                    name="keyword"
                                    value={filters.keyword}
                                    onChange={handleFilterChange}
                                    placeholder="Người đặt, email, phòng, mục đích"
                                />
                            </div>

                            <div className="col-md-2">
                                <button
                                    className="btn btn-outline-success w-100"
                                    onClick={exportCsv}
                                    type="button"
                                >
                                    Xuất CSV
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {error && <div className="alert alert-danger">{error}</div>}

                {loading ? (
                    <div className="alert alert-secondary">Đang tải danh sách...</div>
                ) : (
                    <div className="table-responsive">
                        <table className="table table-bordered table-hover align-middle">
                            <thead className="table-light">
                                <tr>
                                    <th>Người đặt</th>
                                    <th>Email</th>
                                    <th>Phòng</th>
                                    <th>Ngày</th>
                                    <th>Giờ</th>
                                    <th>Mục đích</th>
                                    <th>Số người</th>
                                    <th>Trạng thái</th>
                                    <th>Lý do từ chối</th>
                                    <th>Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredBookings.length === 0 && (
                                    <tr>
                                        <td colSpan="10" className="text-center">
                                            Chưa có lịch đặt phòng.
                                        </td>
                                    </tr>
                                )}

                                {filteredBookings.map((booking) => (
                                    <tr key={booking.id}>
                                        <td>{booking.fullname}</td>
                                        <td>{booking.email}</td>
                                        <td>{booking.room_name}</td>
                                        <td>{booking.booking_date?.slice(0, 10)}</td>
                                        <td>
                                            {booking.start_time} - {booking.end_time}
                                        </td>
                                        <td>{booking.purpose || "-"}</td>
                                        <td>{booking.participants || "-"}</td>
                                        <td>
                                            <span className={`badge ${badgeClass(booking.status, booking.no_show)}`}>
                                                {booking.no_show ? "Vắng mặt" : statusLabel[booking.status] || booking.status}
                                            </span>
                                        </td>
                                        <td>{booking.rejection_reason || "-"}</td>
                                        <td>
                                            {booking.status === "pending" ? (
                                                <div className="d-flex gap-2">
                                                    <button
                                                        className="btn btn-success btn-sm"
                                                        onClick={() => setApproveTarget(booking)}
                                                        type="button"
                                                    >
                                                        Duyệt
                                                    </button>
                                                    <button
                                                        className="btn btn-danger btn-sm"
                                                        onClick={() => {
                                                            setRejectTarget(booking);
                                                            setRejectReason("");
                                                        }}
                                                        type="button"
                                                    >
                                                        Từ chối
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="text-muted">Đã xử lý</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <ConfirmModal
                open={Boolean(approveTarget)}
                title="Duyệt lịch đặt phòng?"
                message={`Bạn có muốn duyệt lịch phòng ${approveTarget?.room_name || ""} không?`}
                confirmText="Duyệt"
                loading={processing}
                onCancel={() => setApproveTarget(null)}
                onConfirm={confirmApprove}
            />

            <PromptModal
                open={Boolean(rejectTarget)}
                title="Từ chối lịch đặt phòng"
                label="Lý do từ chối"
                value={rejectReason}
                textarea
                placeholder="Ví dụ: Phòng đã có lịch ưu tiên, mục đích chưa phù hợp..."
                confirmText="Từ chối"
                loading={processing}
                onChange={setRejectReason}
                onCancel={() => setRejectTarget(null)}
                onConfirm={confirmReject}
            />
        </>
    );
}

export default AdminBookings;
