import { useEffect, useMemo, useState } from "react";
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

const weekDayNames = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"];

function toDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function bookingDateKey(booking) {
    return booking?.booking_date?.slice(0, 10);
}

function startOfWeek(date) {
    const current = new Date(date);
    const day = current.getDay() || 7;
    current.setHours(0, 0, 0, 0);
    current.setDate(current.getDate() - day + 1);
    return current;
}

function addDays(date, days) {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
}

function addMonths(date, months) {
    const next = new Date(date);
    next.setMonth(next.getMonth() + months);
    return next;
}

function getWeekDays(anchorDate) {
    const start = startOfWeek(anchorDate);
    return Array.from({ length: 7 }, (_, index) => addDays(start, index));
}

function getMonthDays(anchorDate) {
    const firstDay = new Date(anchorDate.getFullYear(), anchorDate.getMonth(), 1);
    const start = startOfWeek(firstDay);
    return Array.from({ length: 42 }, (_, index) => addDays(start, index));
}

function formatRangeTitle(mode, anchorDate) {
    if (mode === "month") {
        return `Tháng ${anchorDate.getMonth() + 1}/${anchorDate.getFullYear()}`;
    }

    const days = getWeekDays(anchorDate);
    return `${toDateKey(days[0])} - ${toDateKey(days[6])}`;
}

function eventClass(booking) {
    if (booking.no_show) return "noshow";
    return booking.status || "pending";
}

function AdminCalendar() {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState("week");
    const [anchorDate, setAnchorDate] = useState(new Date());
    const [toast, setToast] = useState(null);
    const [approveTarget, setApproveTarget] = useState(null);
    const [rejectTarget, setRejectTarget] = useState(null);
    const [rejectReason, setRejectReason] = useState("");
    const [processing, setProcessing] = useState(false);

    async function loadBookings() {
        try {
            setLoading(true);
            const res = await getAllBookings();
            setBookings(res.data || []);
        } catch (err) {
            setToast({
                type: "danger",
                text: err.response?.data?.message || "Không tải được lịch đặt phòng."
            });
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        let ignore = false;

        const fetchBookings = async () => {
            try {
                setLoading(true);
                const res = await getAllBookings();
                if (!ignore) {
                    setBookings(res.data || []);
                }
            } catch (err) {
                if (!ignore) {
                    setToast({
                        type: "danger",
                        text: err.response?.data?.message || "Không tải được lịch đặt phòng."
                    });
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

    const calendarDays = useMemo(() => {
        return viewMode === "month" ? getMonthDays(anchorDate) : getWeekDays(anchorDate);
    }, [anchorDate, viewMode]);

    const bookingsByDate = useMemo(() => {
        return bookings.reduce((grouped, booking) => {
            const key = bookingDateKey(booking);
            if (!key) return grouped;
            grouped[key] = grouped[key] || [];
            grouped[key].push(booking);
            grouped[key].sort((a, b) => String(a.start_time).localeCompare(String(b.start_time)));
            return grouped;
        }, {});
    }, [bookings]);

    const pendingCount = bookings.filter((booking) => booking.status === "pending").length;

    const showToast = (type, text) => {
        setToast({ type, text });
        window.setTimeout(() => setToast(null), 3400);
    };

    const moveCalendar = (direction) => {
        setAnchorDate((current) => {
            if (viewMode === "month") {
                return addMonths(current, direction);
            }
            return addDays(current, direction * 7);
        });
    };

    const confirmApprove = async () => {
        if (!approveTarget) return;
        setProcessing(true);

        try {
            await approveBooking(approveTarget.id);
            setApproveTarget(null);
            showToast("success", "Đã duyệt lịch đặt phòng.");
            await loadBookings();
        } catch (err) {
            showToast("danger", err.response?.data?.message || "Duyệt lịch thất bại.");
        } finally {
            setProcessing(false);
        }
    };

    const confirmReject = async () => {
        if (!rejectTarget || !rejectReason.trim()) {
            showToast("danger", "Vui lòng nhập lý do từ chối.");
            return;
        }

        setProcessing(true);

        try {
            await rejectBookingWithReason(rejectTarget.id, rejectReason.trim());
            setRejectTarget(null);
            setRejectReason("");
            showToast("success", "Đã từ chối lịch đặt phòng.");
            await loadBookings();
        } catch (err) {
            showToast("danger", err.response?.data?.message || "Từ chối lịch thất bại.");
        } finally {
            setProcessing(false);
        }
    };

    return (
        <>
            <Navbar />
            <AppToast message={toast} />

            <div className="container app-shell">
                <div className="page-heading">
                    <div>
                        <h1>Lịch phòng</h1>
                        <p>Duyệt lịch đặt phòng theo tuần hoặc theo tháng như lịch vận hành thực tế.</p>
                    </div>
                    <button className="btn btn-outline-primary" onClick={loadBookings} disabled={loading} type="button">
                        Tải lại
                    </button>
                </div>

                <div className="admin-calendar-toolbar">
                    <div>
                        <span className="calendar-kicker">Đang xem</span>
                        <h2>{formatRangeTitle(viewMode, anchorDate)}</h2>
                    </div>

                    <div className="calendar-controls">
                        <div className="calendar-mode-group">
                            <button className={viewMode === "week" ? "active" : ""} onClick={() => setViewMode("week")} type="button">
                                Tuần
                            </button>
                            <button className={viewMode === "month" ? "active" : ""} onClick={() => setViewMode("month")} type="button">
                                Tháng
                            </button>
                        </div>

                        <button className="btn btn-light" onClick={() => moveCalendar(-1)} type="button">Trước</button>
                        <button className="btn btn-light" onClick={() => setAnchorDate(new Date())} type="button">Hôm nay</button>
                        <button className="btn btn-light" onClick={() => moveCalendar(1)} type="button">Sau</button>
                    </div>
                </div>

                <div className="row g-3 mb-3">
                    <div className="col-md-4">
                        <div className="calendar-summary-card primary">
                            <span>Lịch chờ duyệt</span>
                            <strong>{pendingCount}</strong>
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div className="calendar-summary-card success">
                            <span>Lịch đã duyệt</span>
                            <strong>{bookings.filter((booking) => booking.status === "approved").length}</strong>
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div className="calendar-summary-card warning">
                            <span>Vắng mặt sau giờ đặt</span>
                            <strong>{bookings.filter((booking) => booking.no_show).length}</strong>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="alert alert-secondary">Đang tải lịch phòng...</div>
                ) : (
                    <div className={`admin-calendar-grid ${viewMode}`}>
                        {calendarDays.map((day, index) => {
                            const dateKey = toDateKey(day);
                            const dayBookings = bookingsByDate[dateKey] || [];
                            const outMonth = viewMode === "month" && day.getMonth() !== anchorDate.getMonth();

                            return (
                                <section className={`admin-calendar-day ${outMonth ? "is-muted" : ""}`} key={dateKey}>
                                    <header className="admin-calendar-day-header">
                                        <span>{weekDayNames[index % 7]}</span>
                                        <strong>{dateKey}</strong>
                                    </header>

                                    <div className="admin-calendar-events">
                                        {dayBookings.length === 0 ? (
                                            <div className="calendar-empty">Chưa có lịch</div>
                                        ) : (
                                            dayBookings.map((booking) => (
                                                <article className={`admin-calendar-event ${eventClass(booking)}`} key={booking.id}>
                                                    <div className="calendar-event-time">{booking.start_time} - {booking.end_time}</div>
                                                    <div className="calendar-event-room">{booking.room_name}</div>
                                                    <div className="calendar-event-meta">{booking.fullname} · {booking.participants || 1} người</div>
                                                    <div className="calendar-event-purpose">{booking.purpose || "Không ghi mục đích"}</div>
                                                    <span className="calendar-event-status">
                                                        {booking.no_show ? "Vắng mặt" : statusLabel[booking.status] || booking.status}
                                                    </span>

                                                    {booking.status === "pending" && (
                                                        <div className="admin-calendar-event-actions">
                                                            <button className="btn btn-success btn-sm" onClick={() => setApproveTarget(booking)} type="button">
                                                                Duyệt
                                                            </button>
                                                            <button
                                                                className="btn btn-outline-danger btn-sm"
                                                                onClick={() => {
                                                                    setRejectTarget(booking);
                                                                    setRejectReason("");
                                                                }}
                                                                type="button"
                                                            >
                                                                Từ chối
                                                            </button>
                                                        </div>
                                                    )}
                                                </article>
                                            ))
                                        )}
                                    </div>
                                </section>
                            );
                        })}
                    </div>
                )}
            </div>

            <ConfirmModal
                open={Boolean(approveTarget)}
                title="Duyệt lịch đặt phòng?"
                message={`Bạn có muốn duyệt lịch phòng ${approveTarget?.room_name || ""} vào ngày ${bookingDateKey(approveTarget) || ""} không?`}
                confirmText="Duyệt lịch"
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
                placeholder="Ví dụ: Phòng đang có lịch ưu tiên hoặc thông tin đặt phòng chưa phù hợp..."
                confirmText="Từ chối"
                loading={processing}
                onChange={setRejectReason}
                onCancel={() => setRejectTarget(null)}
                onConfirm={confirmReject}
            />
        </>
    );
}

export default AdminCalendar;
