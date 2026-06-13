import { useEffect, useMemo, useState } from "react";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import { getRoomSchedule } from "../services/bookingService";
import { getRooms } from "../services/roomService";

function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function getWeekDates(startDateText) {
    const base = startDateText ? new Date(startDateText) : new Date();
    base.setHours(0, 0, 0, 0);

    const day = base.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const monday = new Date(base);
    monday.setDate(base.getDate() + diffToMonday);

    return Array.from({ length: 7 }, (_, index) => {
        const date = new Date(monday);
        date.setDate(monday.getDate() + index);
        return formatDate(date);
    });
}

function dayLabel(dateText) {
    const date = new Date(dateText);

    return date.toLocaleDateString("vi-VN", {
        weekday: "short",
        day: "2-digit",
        month: "2-digit"
    });
}

const scheduleStatusLabel = {
    approved: "Đã duyệt",
    pending: "Chờ duyệt",
    rejected: "Từ chối",
    cancelled: "Đã hủy"
};

function WeeklySchedule() {
    const [rooms, setRooms] = useState([]);
    const [roomId, setRoomId] = useState("");
    const [weekStart, setWeekStart] = useState(formatDate(new Date()));
    const [scheduleByDate, setScheduleByDate] = useState({});
    const [loading, setLoading] = useState(false);

    const weekDates = useMemo(
        () => getWeekDates(weekStart),
        [weekStart]
    );

    useEffect(() => {
        let ignore = false;

        getRooms()
            .then((res) => {
                if (!ignore) {
                    setRooms(res.data);
                    setRoomId(String(res.data[0]?.id || ""));
                }
            })
            .catch(() => {
                setRooms([]);
            });

        return () => {
            ignore = true;
        };
    }, []);

    useEffect(() => {
        if (!roomId) {
            return;
        }

        let ignore = false;

        Promise.all(
            weekDates.map((date) =>
                getRoomSchedule(roomId, date)
                    .then((res) => [date, res.data])
            )
        )
            .then((entries) => {
                if (!ignore) {
                    setScheduleByDate(Object.fromEntries(entries));
                }
            })
            .catch(() => {
                setScheduleByDate({});
            })
            .finally(() => {
                if (!ignore) {
                    setLoading(false);
                }
            });

        return () => {
            ignore = true;
        };
    }, [roomId, weekDates]);

    const badgeClass = (item) => {
        if (item.item_type === "maintenance") return "bg-warning text-dark";
        if (item.status === "approved") return "bg-success";
        return "bg-secondary";
    };

    const eventClass = (item) => {
        if (item.item_type === "maintenance") return "maintenance";
        if (item.status === "approved") return "approved";
        return "pending";
    };

    return (
        <>
            <Navbar />

            <div className="container app-shell">
                <div className="page-heading">
                    <div>
                        <h1>Lịch phòng theo tuần</h1>
                        <p>Xem lịch đặt phòng và bảo trì theo từng ngày trong tuần.</p>
                    </div>
                </div>

                <div className="card mb-3">
                    <div className="card-body">
                        <div className="row g-3 align-items-end">
                            <div className="col-md-4">
                                <label className="form-label">Phòng</label>
                                <select
                                    className="form-select"
                                    value={roomId}
                                    onChange={(e) => {
                                        setLoading(true);
                                        setRoomId(e.target.value);
                                    }}
                                >
                                    {rooms.map((room) => (
                                        <option value={room.id} key={room.id}>
                                            {room.room_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="col-md-4">
                                <label className="form-label">
                                    Chọn ngày trong tuần
                                </label>
                                <input
                                    className="form-control"
                                    type="date"
                                    value={weekStart}
                                    onChange={(e) => {
                                        setLoading(true);
                                        setWeekStart(e.target.value);
                                    }}
                                />
                            </div>

                            <div className="col-md-4">
                                <div className="d-flex gap-2 flex-wrap">
                                    <span className="badge bg-success">Đã duyệt</span>
                                    <span className="badge bg-secondary">Chờ duyệt</span>
                                    <span className="badge bg-warning text-dark">Bảo trì</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="alert alert-secondary">
                        Đang tải lịch tuần...
                    </div>
                ) : (
                    <div className="calendar-grid">
                        {weekDates.map((date) => (
                            <div className="calendar-day" key={date}>
                                <div className="calendar-day-header">
                                    <div className="calendar-day-title">
                                        {dayLabel(date)}
                                    </div>
                                    <small className="text-muted">{date}</small>
                                </div>

                                <div className="calendar-events">
                                    {(scheduleByDate[date] || []).length === 0 ? (
                                        <div className="empty-state">
                                            Trống lịch
                                        </div>
                                    ) : (
                                        scheduleByDate[date].map((item) => (
                                            <div
                                                className={`calendar-event ${eventClass(item)}`}
                                                key={`${item.item_type}-${item.id}`}
                                            >
                                                <div className="d-flex justify-content-between gap-2">
                                                    <div className="calendar-time">
                                                        {item.start_time} - {item.end_time}
                                                    </div>
                                                    <span className={`badge ${badgeClass(item)}`}>
                                                        {item.item_type === "maintenance"
                                                            ? "Bảo trì"
                                                            : scheduleStatusLabel[item.status] || item.status}
                                                    </span>
                                                </div>
                                                <div className="mt-2 fw-semibold">
                                                    {item.purpose || "-"}
                                                </div>
                                                <small className="text-muted">
                                                    {item.fullname}
                                                </small>
                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <Footer />
        </>
    );
}

export default WeeklySchedule;
