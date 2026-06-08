import { useEffect, useMemo, useState } from "react";
import Navbar from "../../components/Navbar";
import {
    dashboard,
    getAllBookings,
    getAdvancedStatistics,
    getBookingStatusStatistics,
    getRoomStatistics
} from "../../services/bookingService";

const statusLabel = {
    approved: "Đã duyệt",
    pending: "Chờ duyệt",
    rejected: "Từ chối",
    cancelled: "Đã hủy"
};

const statusClass = {
    approved: "success",
    pending: "warning",
    rejected: "danger",
    cancelled: "neutral"
};

function formatDate(value) {
    return value?.slice(0, 10) || "-";
}

function MonthlyChart({ data }) {
    const maxValue = Math.max(
        ...data.map((item) => Number(item.total || 0)),
        1
    );

    if (data.length === 0) {
        return <div className="empty-state">Chưa có dữ liệu theo tháng.</div>;
    }

    return (
        <div className="dashboard-chart">
            {data.map((item) => {
                const value = Number(item.total || 0);
                const height = Math.max((value / maxValue) * 210, 18);

                return (
                    <div className="dashboard-chart-column" key={item.month}>
                        <div className="dashboard-chart-value">{value}</div>
                        <div className="dashboard-chart-track">
                            <div
                                className="dashboard-chart-bar"
                                style={{ height }}
                                title={`${item.month}: ${value} lượt`}
                            />
                        </div>
                        <div className="dashboard-chart-label">{item.month}</div>
                    </div>
                );
            })}
        </div>
    );
}

function RankingList({ data, labelKey, valueKey, suffix = "", emptyText }) {
    const maxValue = Math.max(
        ...data.map((item) => Number(item[valueKey] || 0)),
        1
    );

    if (data.length === 0) {
        return <div className="empty-state">{emptyText}</div>;
    }

    return (
        <div className="dashboard-ranking-list">
            {data.slice(0, 6).map((item, index) => {
                const value = Number(item[valueKey] || 0);
                const percent = Math.max((value / maxValue) * 100, 6);

                return (
                    <div className="dashboard-ranking-item" key={`${item[labelKey]}-${index}`}>
                        <div className="dashboard-ranking-index">{index + 1}</div>
                        <div className="dashboard-ranking-content">
                            <div className="dashboard-ranking-row">
                                <strong>{item[labelKey] || "Không rõ"}</strong>
                                <span>
                                    {value}
                                    {suffix}
                                </span>
                            </div>
                            <div className="dashboard-ranking-track">
                                <div
                                    className="dashboard-ranking-fill"
                                    style={{ width: `${percent}%` }}
                                />
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function AdminDashboard() {
    const [stats, setStats] = useState(null);
    const [roomStats, setRoomStats] = useState([]);
    const [statusStats, setStatusStats] = useState([]);
    const [advancedStats, setAdvancedStats] = useState(null);
    const [latestPending, setLatestPending] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    async function loadDashboard() {
        try {
            setLoading(true);
            setError("");

            const [summaryRes, roomRes, statusRes, bookingsRes, advancedRes] =
                await Promise.all([
                    dashboard(),
                    getRoomStatistics(),
                    getBookingStatusStatistics(),
                    getAllBookings(),
                    getAdvancedStatistics()
                ]);

            setStats(summaryRes.data);
            setRoomStats(roomRes.data || []);
            setStatusStats(statusRes.data || []);
            setAdvancedStats(advancedRes.data || {});
            setLatestPending(
                (bookingsRes.data || [])
                    .filter((booking) => booking.status === "pending")
                    .slice(0, 5)
            );
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Không tải được dữ liệu dashboard."
            );
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        let ignore = false;

        const fetchDashboard = async () => {
            try {
                setLoading(true);
                setError("");

                const [summaryRes, roomRes, statusRes, bookingsRes, advancedRes] =
                    await Promise.all([
                        dashboard(),
                        getRoomStatistics(),
                        getBookingStatusStatistics(),
                        getAllBookings(),
                        getAdvancedStatistics()
                    ]);

                if (!ignore) {
                    setStats(summaryRes.data);
                    setRoomStats(roomRes.data || []);
                    setStatusStats(statusRes.data || []);
                    setAdvancedStats(advancedRes.data || {});
                    setLatestPending(
                        (bookingsRes.data || [])
                            .filter((booking) => booking.status === "pending")
                            .slice(0, 5)
                    );
                }
            } catch (err) {
                if (!ignore) {
                    setError(
                        err.response?.data?.message ||
                        "Không tải được dữ liệu dashboard."
                    );
                }
            } finally {
                if (!ignore) {
                    setLoading(false);
                }
            }
        };

        fetchDashboard();

        return () => {
            ignore = true;
        };
    }, []);

    const statusMap = useMemo(() => {
        return statusStats.reduce((result, item) => {
            result[item.status] = Number(item.total || 0);
            return result;
        }, {});
    }, [statusStats]);

    const summaryCards = [
        {
            label: "Phòng học",
            value: stats?.totalRooms,
            helper: "Tổng số phòng đang quản lý",
            tone: "primary"
        },
        {
            label: "Người dùng",
            value: stats?.totalUsers,
            helper: "Sinh viên và quản trị viên",
            tone: "success"
        },
        {
            label: "Lượt đặt",
            value: stats?.totalBookings,
            helper: "Tổng yêu cầu đặt phòng",
            tone: "info"
        },
        {
            label: "Chờ duyệt",
            value: stats?.pendingBookings,
            helper: "Cần admin xử lý",
            tone: "warning"
        }
    ];

    return (
        <>
            <Navbar />

            <div className="container app-shell admin-dashboard-shell">
                <div className="dashboard-hero">
                    <div>
                        <span className="dashboard-eyebrow">Quản trị hệ thống</span>
                        <h1>Bảng điều khiển</h1>
                        <p>
                            Theo dõi tình hình đặt phòng, trạng thái phê duyệt và các phòng được sử dụng nhiều nhất.
                        </p>
                    </div>
                    <button
                        className="btn btn-light"
                        onClick={loadDashboard}
                        disabled={loading}
                        type="button"
                    >
                        {loading ? "Đang tải..." : "Tải lại"}
                    </button>
                </div>

                {error && (
                    <div className="alert alert-danger">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="alert alert-secondary">
                        Đang tải dữ liệu dashboard...
                    </div>
                ) : (
                    <>
                        <div className="dashboard-summary-grid">
                            {summaryCards.map((card) => (
                                <div className={`dashboard-summary-card ${card.tone}`} key={card.label}>
                                    <span>{card.label}</span>
                                    <strong>{card.value ?? 0}</strong>
                                    <small>{card.helper}</small>
                                </div>
                            ))}
                        </div>

                        <div className="dashboard-grid">
                            <section className="dashboard-panel dashboard-panel-large">
                                <div className="dashboard-panel-header">
                                    <div>
                                        <h2>Lượt đặt theo tháng</h2>
                                        <p>So sánh nhu cầu sử dụng phòng theo từng tháng.</p>
                                    </div>
                                </div>
                                <MonthlyChart data={advancedStats?.monthlyBookings || []} />
                            </section>

                            <section className="dashboard-panel">
                                <div className="dashboard-panel-header">
                                    <div>
                                        <h2>Trạng thái lịch</h2>
                                        <p>Tổng quan các yêu cầu đặt phòng.</p>
                                    </div>
                                </div>

                                <div className="dashboard-status-grid">
                                    {["pending", "approved", "rejected", "cancelled"].map((status) => (
                                        <div
                                            className={`dashboard-status-card ${statusClass[status]}`}
                                            key={status}
                                        >
                                            <span>{statusLabel[status]}</span>
                                            <strong>{statusMap[status] || 0}</strong>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </div>

                        <div className="dashboard-grid dashboard-grid-even">
                            <section className="dashboard-panel">
                                <div className="dashboard-panel-header">
                                    <div>
                                        <h2>Top phòng</h2>
                                        <p>Các phòng được đặt nhiều nhất.</p>
                                    </div>
                                </div>
                                <RankingList
                                    data={advancedStats?.topRooms || roomStats}
                                    labelKey="room_name"
                                    valueKey="total"
                                    emptyText="Chưa có dữ liệu phòng."
                                />
                            </section>

                            <section className="dashboard-panel">
                                <div className="dashboard-panel-header">
                                    <div>
                                        <h2>Top sinh viên</h2>
                                        <p>Những tài khoản đặt phòng nhiều nhất.</p>
                                    </div>
                                </div>
                                <RankingList
                                    data={advancedStats?.topUsers || []}
                                    labelKey="fullname"
                                    valueKey="total"
                                    emptyText="Chưa có dữ liệu sinh viên."
                                />
                            </section>
                        </div>

                        <div className="dashboard-grid dashboard-grid-even">
                            <section className="dashboard-panel">
                                <div className="dashboard-panel-header">
                                    <div>
                                        <h2>Phòng đánh giá cao</h2>
                                        <p>Dựa trên nhận xét sau khi sử dụng phòng.</p>
                                    </div>
                                </div>
                                <RankingList
                                    data={advancedStats?.topRatedRooms || []}
                                    labelKey="room_name"
                                    valueKey="average_rating"
                                    suffix="/5"
                                    emptyText="Chưa có đánh giá phòng."
                                />
                            </section>

                            <section className="dashboard-panel">
                                <div className="dashboard-panel-header">
                                    <div>
                                        <h2>Phòng bảo trì nhiều</h2>
                                        <p>Các phòng cần theo dõi tình trạng thiết bị.</p>
                                    </div>
                                </div>
                                <RankingList
                                    data={advancedStats?.maintenanceRooms || []}
                                    labelKey="room_name"
                                    valueKey="total"
                                    emptyText="Chưa có dữ liệu bảo trì."
                                />
                            </section>
                        </div>

                        <section className="dashboard-panel">
                            <div className="dashboard-panel-header">
                                <div>
                                    <h2>Yêu cầu chờ duyệt mới nhất</h2>
                                    <p>Các lịch cần admin xem xét và xử lý sớm.</p>
                                </div>
                            </div>

                            <div className="dashboard-pending-list">
                                {latestPending.length === 0 && (
                                    <div className="empty-state">Không có yêu cầu chờ duyệt.</div>
                                )}

                                {latestPending.map((booking) => (
                                    <div className="dashboard-pending-item" key={booking.id}>
                                        <div>
                                            <strong>{booking.fullname}</strong>
                                            <span>{booking.purpose || "Không ghi mục đích"}</span>
                                        </div>
                                        <div>
                                            <strong>{booking.room_name}</strong>
                                            <span>{formatDate(booking.booking_date)}</span>
                                        </div>
                                        <div>
                                            <strong>{booking.start_time} - {booking.end_time}</strong>
                                            <span>Thời gian sử dụng</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </>
                )}
            </div>
        </>
    );
}

export default AdminDashboard;
