import { useEffect, useState } from "react";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import {
    getNotifications,
    markAllNotificationsAsRead,
    markNotificationAsRead
} from "../services/notificationService";

function Notifications() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    async function loadNotifications() {
        try {
            setLoading(true);
            setError("");
            const res = await getNotifications();
            setNotifications(res.data);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Không tải được thông báo"
            );
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        let ignore = false;

        getNotifications()
            .then((res) => {
                if (!ignore) {
                    setNotifications(res.data);
                }
            })
            .catch((err) => {
                if (!ignore) {
                    setError(
                        err.response?.data?.message ||
                        "Không tải được thông báo"
                    );
                }
            })
            .finally(() => {
                if (!ignore) {
                    setLoading(false);
                }
            });

        return () => {
            ignore = true;
        };
    }, []);

    const handleRead = async (id) => {
        await markNotificationAsRead(id);
        await loadNotifications();
    };

    const handleReadAll = async () => {
        await markAllNotificationsAsRead();
        await loadNotifications();
    };

    return (
        <>
            <Navbar />

            <div className="container app-shell">
                <div className="page-heading">
                    <div>
                        <h1>Thông báo</h1>
                        <p>Cập nhật trạng thái đặt phòng, duyệt lịch và hệ thống.</p>
                    </div>
                    <button
                        className="btn btn-outline-primary"
                        onClick={handleReadAll}
                        disabled={notifications.length === 0}
                    >
                        Đánh dấu tất cả đã đọc
                    </button>
                </div>

                {error && (
                    <div className="alert alert-danger">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="alert alert-secondary">
                        Đang tải thông báo...
                    </div>
                ) : (
                    <div className="list-group">
                        {notifications.length === 0 && (
                            <div className="list-group-item">
                                Chưa có thông báo.
                            </div>
                        )}

                        {notifications.map((item) => (
                            <div
                                className={`list-group-item ${
                                    item.is_read ? "" : "list-group-item-warning"
                                }`}
                                key={item.id}
                            >
                                <div className="d-flex justify-content-between gap-3">
                                    <div>
                                        <h5 className="mb-1">{item.title}</h5>
                                        <p className="mb-1">{item.message}</p>
                                        <small className="text-muted">
                                            {new Date(item.created_at).toLocaleString()}
                                        </small>
                                    </div>

                                    {!item.is_read && (
                                        <button
                                            className="btn btn-sm btn-outline-success align-self-start"
                                            onClick={() => handleRead(item.id)}
                                        >
                                            Đã đọc
                                        </button>
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

export default Notifications;
