import { useEffect, useMemo, useState } from "react";
import Footer from "../../components/Footer";
import Navbar from "../../components/Navbar";
import {
    getAdminSupportThreads,
    getSupportMessages,
    sendSupportMessage,
    updateSupportThreadStatus
} from "../../services/supportService";

const statusLabel = {
    open: "Chưa trả lời",
    pending: "Đang xử lý",
    closed: "Đã đóng"
};

const categoryLabel = {
    booking: "Đặt phòng",
    checkin: "Check-in",
    maintenance: "Bảo trì",
    account: "Tài khoản",
    other: "Khác"
};

function formatTime(value) {
    if (!value) return "-";

    return new Date(value).toLocaleString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    });
}

function AdminSupport() {
    const [threads, setThreads] = useState([]);
    const [selectedThread, setSelectedThread] = useState(null);
    const [messages, setMessages] = useState([]);
    const [statusFilter, setStatusFilter] = useState("");
    const [keyword, setKeyword] = useState("");
    const [reply, setReply] = useState("");
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState("");

    const summary = useMemo(() => {
        return {
            open: threads.filter((thread) => thread.status === "open").length,
            pending: threads.filter((thread) => thread.status === "pending").length,
            closed: threads.filter((thread) => thread.status === "closed").length
        };
    }, [threads]);

    const loadThreads = async (params = {}) => {
        setLoading(true);
        setError("");

        try {
            const res = await getAdminSupportThreads(params);
            setThreads(res.data || []);

            if (!selectedThread && res.data?.[0]) {
                await loadMessages(res.data[0]);
            }
        } catch (err) {
            setError(err.response?.data?.message || "Không thể tải danh sách hỗ trợ");
        } finally {
            setLoading(false);
        }
    };

    const loadMessages = async (thread) => {
        setSelectedThread(thread);
        setError("");

        try {
            const res = await getSupportMessages(thread.id);
            setSelectedThread(res.data.thread);
            setMessages(res.data.messages || []);
        } catch (err) {
            setError(err.response?.data?.message || "Không thể tải hội thoại");
        }
    };

    useEffect(() => {
        let ignore = false;

        getAdminSupportThreads()
            .then(async (res) => {
                if (ignore) return;

                setThreads(res.data || []);

                if (res.data?.[0]) {
                    const messageRes = await getSupportMessages(res.data[0].id);

                    if (!ignore) {
                        setSelectedThread(messageRes.data.thread);
                        setMessages(messageRes.data.messages || []);
                    }
                }
            })
            .catch((err) => {
                if (!ignore) {
                    setError(err.response?.data?.message || "Không thể tải danh sách hỗ trợ");
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

    useEffect(() => {
        if (!selectedThread?.id) {
            return;
        }

        const timer = window.setInterval(() => {
            getSupportMessages(selectedThread.id)
                .then((res) => {
                    setSelectedThread(res.data.thread);
                    setMessages(res.data.messages || []);
                })
                .catch(() => {});
        }, 7000);

        return () => window.clearInterval(timer);
    }, [selectedThread?.id]);

    const handleSearch = (event) => {
        event.preventDefault();
        loadThreads({
            status: statusFilter,
            keyword
        });
    };

    const handleReply = async (event) => {
        event.preventDefault();

        if (!selectedThread?.id || !reply.trim()) {
            return;
        }

        try {
            setSending(true);
            await sendSupportMessage(selectedThread.id, reply);
            setReply("");
            await loadMessages(selectedThread);
            await loadThreads({
                status: statusFilter,
                keyword
            });
        } catch (err) {
            setError(err.response?.data?.message || "Không thể gửi phản hồi");
        } finally {
            setSending(false);
        }
    };

    const changeStatus = async (status) => {
        if (!selectedThread?.id) {
            return;
        }

        try {
            setSending(true);
            await updateSupportThreadStatus(selectedThread.id, status);
            await loadMessages(selectedThread);
            await loadThreads({
                status: statusFilter,
                keyword
            });
        } catch (err) {
            setError(err.response?.data?.message || "Không thể cập nhật trạng thái");
        } finally {
            setSending(false);
        }
    };

    return (
        <>
            <Navbar />

            <div className="container app-shell admin-support-page">
                <div className="page-heading">
                    <div>
                        <h1>Hỗ trợ sinh viên</h1>
                        <p>Tiếp nhận câu hỏi, phản hồi và đóng các hội thoại đã giải quyết.</p>
                    </div>
                </div>

                <section className="support-admin-summary">
                    <div>
                        <span>Chưa trả lời</span>
                        <strong>{summary.open}</strong>
                    </div>
                    <div>
                        <span>Đang xử lý</span>
                        <strong>{summary.pending}</strong>
                    </div>
                    <div>
                        <span>Đã đóng</span>
                        <strong>{summary.closed}</strong>
                    </div>
                </section>

                <form className="support-admin-filter" onSubmit={handleSearch}>
                    <input
                        className="form-control"
                        value={keyword}
                        onChange={(event) => setKeyword(event.target.value)}
                        placeholder="Tìm theo tên, email hoặc tiêu đề"
                    />
                    <select
                        className="form-select"
                        value={statusFilter}
                        onChange={(event) => setStatusFilter(event.target.value)}
                    >
                        <option value="">Tất cả trạng thái</option>
                        <option value="open">Chưa trả lời</option>
                        <option value="pending">Đang xử lý</option>
                        <option value="closed">Đã đóng</option>
                    </select>
                    <button className="btn btn-primary" type="submit">
                        Lọc
                    </button>
                </form>

                {error && <div className="alert alert-danger">{error}</div>}

                <div className="support-admin-layout">
                    <aside className="support-thread-list">
                        {loading ? (
                            <div className="empty-state">Đang tải hội thoại...</div>
                        ) : threads.length === 0 ? (
                            <div className="empty-state">Chưa có hội thoại hỗ trợ.</div>
                        ) : (
                            threads.map((thread) => (
                                <button
                                    type="button"
                                    className={`support-thread-item ${selectedThread?.id === thread.id ? "active" : ""}`}
                                    onClick={() => loadMessages(thread)}
                                    key={thread.id}
                                >
                                    <span className={`support-status-dot ${thread.status}`}></span>
                                    <div>
                                        <strong>{thread.fullname}</strong>
                                        <small>{thread.email}</small>
                                        <p>{thread.latest_message || thread.subject}</p>
                                    </div>
                                    <span className="support-thread-meta">
                                        {categoryLabel[thread.category] || thread.category}
                                    </span>
                                </button>
                            ))
                        )}
                    </aside>

                    <section className="support-conversation">
                        {!selectedThread ? (
                            <div className="empty-state">Chọn một hội thoại để phản hồi.</div>
                        ) : (
                            <>
                                <div className="support-conversation-header">
                                    <div>
                                        <h2>{selectedThread.subject}</h2>
                                        <p>
                                            {selectedThread.fullname || "Sinh viên"} · {categoryLabel[selectedThread.category] || selectedThread.category} · {formatTime(selectedThread.last_message_at)}
                                        </p>
                                    </div>
                                    <span className={`badge support-status-badge ${selectedThread.status}`}>
                                        {statusLabel[selectedThread.status] || selectedThread.status}
                                    </span>
                                </div>

                                <div className="support-conversation-actions">
                                    <button
                                        className="btn btn-outline-primary btn-sm"
                                        type="button"
                                        onClick={() => changeStatus("pending")}
                                        disabled={sending || selectedThread.status === "pending"}
                                    >
                                        Đang xử lý
                                    </button>
                                    <button
                                        className="btn btn-outline-success btn-sm"
                                        type="button"
                                        onClick={() => changeStatus("closed")}
                                        disabled={sending || selectedThread.status === "closed"}
                                    >
                                        Đóng yêu cầu
                                    </button>
                                    <button
                                        className="btn btn-outline-secondary btn-sm"
                                        type="button"
                                        onClick={() => changeStatus("open")}
                                        disabled={sending || selectedThread.status === "open"}
                                    >
                                        Mở lại
                                    </button>
                                </div>

                                <div className="support-admin-messages">
                                    {messages.map((message) => (
                                        <div
                                            className={`support-message ${message.sender_role === "admin" ? "admin" : "student"}`}
                                            key={message.id}
                                        >
                                            <div>{message.message}</div>
                                            <span>
                                                {message.sender_role === "admin" ? "Admin" : message.fullname} · {formatTime(message.created_at)}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                <form className="support-admin-reply" onSubmit={handleReply}>
                                    <textarea
                                        className="form-control"
                                        value={reply}
                                        onChange={(event) => setReply(event.target.value)}
                                        rows="3"
                                        placeholder="Nhập phản hồi cho sinh viên..."
                                        disabled={sending || selectedThread.status === "closed"}
                                    />
                                    <button
                                        className="btn btn-primary"
                                        type="submit"
                                        disabled={sending || !reply.trim() || selectedThread.status === "closed"}
                                    >
                                        Gửi phản hồi
                                    </button>
                                </form>
                            </>
                        )}
                    </section>
                </div>
            </div>

            <Footer />
        </>
    );
}

export default AdminSupport;
