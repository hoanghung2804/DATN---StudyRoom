import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    createSupportThread,
    getMySupportThread,
    getSupportMessages,
    sendSupportMessage
} from "../services/supportService";

const quickQuestions = [
    {
        label: "Cách đặt phòng",
        category: "booking",
        message: "Em muốn hỏi cách đặt phòng học trên hệ thống."
    },
    {
        label: "Mã check-in",
        category: "checkin",
        message: "Em chưa nhận được mã check-in cho lịch đặt phòng."
    },
    {
        label: "Hủy lịch",
        category: "booking",
        message: "Em muốn hỏi về việc hủy hoặc đổi thời gian đặt phòng."
    },
    {
        label: "Thiết bị lỗi",
        category: "maintenance",
        message: "Em muốn báo phòng có thiết bị cần kiểm tra."
    }
];

function formatTime(value) {
    if (!value) return "";

    return new Date(value).toLocaleString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit"
    });
}

function StudentSupportChat() {
    const navigate = useNavigate();
    const messagesEndRef = useRef(null);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [thread, setThread] = useState(null);
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState("");
    const [error, setError] = useState("");

    const token = localStorage.getItem("token");
    const isLoggedIn = Boolean(token);

    const lastAdminMessage = useMemo(() => {
        return messages
            .slice()
            .reverse()
            .find((message) => message.sender_role === "admin");
    }, [messages]);

    const scrollToBottom = () => {
        window.setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 80);
    };

    const loadMessages = async (threadId) => {
        const res = await getSupportMessages(threadId);
        setThread(res.data.thread);
        setMessages(res.data.messages || []);
        scrollToBottom();
    };

    useEffect(() => {
        if (!open || !isLoggedIn) {
            return;
        }

        let ignore = false;

        getMySupportThread()
            .then(async (res) => {
                if (ignore) return;

                setThread(res.data);

                if (res.data?.id) {
                    const messageRes = await getSupportMessages(res.data.id);

                    if (!ignore) {
                        setThread(messageRes.data.thread);
                        setMessages(messageRes.data.messages || []);
                        scrollToBottom();
                    }
                }
            })
            .catch(() => {
                if (!ignore) {
                    setError("Không thể tải hộp hỗ trợ. Vui lòng thử lại sau.");
                }
            });

        return () => {
            ignore = true;
        };
    }, [open, isLoggedIn]);

    useEffect(() => {
        if (!open || !thread?.id) {
            return;
        }

        const timer = window.setInterval(() => {
            getSupportMessages(thread.id)
                .then((res) => {
                    setThread(res.data.thread);
                    setMessages(res.data.messages || []);
                    scrollToBottom();
                })
                .catch(() => {});
        }, 7000);

        return () => window.clearInterval(timer);
    }, [open, thread?.id]);

    const requireLogin = () => {
        if (!isLoggedIn) {
            navigate("/");
            return true;
        }

        return false;
    };

    const createOrSend = async (messageText, category = "other") => {
        if (requireLogin()) {
            return;
        }

        const cleanMessage = messageText.trim();

        if (!cleanMessage) {
            return;
        }

        try {
            setError("");
            setLoading(true);

            if (!thread?.id || thread.status === "closed") {
                const res = await createSupportThread({
                    subject: cleanMessage.slice(0, 80),
                    category,
                    message: cleanMessage
                });

                await loadMessages(res.data.id);
            } else {
                await sendSupportMessage(thread.id, cleanMessage);
                await loadMessages(thread.id);
            }

            setText("");
        } catch (err) {
            setError(err.response?.data?.message || "Không thể gửi tin nhắn.");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        createOrSend(text);
    };

    return (
        <div className={`support-widget ${open ? "is-open" : ""}`}>
            {open && (
                <section className="support-panel">
                    <div className="support-panel-header">
                        <div>
                            <strong>Hỗ trợ sinh viên</strong>
                            <span>
                                {thread?.status === "closed"
                                    ? "Hội thoại đã đóng"
                                    : "Admin sẽ phản hồi khi có thể"}
                            </span>
                        </div>
                        <button type="button" onClick={() => setOpen(false)} aria-label="Đóng hỗ trợ">
                            ×
                        </button>
                    </div>

                    <div className="support-panel-body">
                        {!isLoggedIn ? (
                            <div className="support-login-box">
                                <strong>Bạn cần đăng nhập để gửi tin nhắn.</strong>
                                <p>Trang Home vẫn xem được công khai, nhưng hỗ trợ cá nhân cần tài khoản sinh viên.</p>
                                <button className="btn btn-primary btn-sm" type="button" onClick={() => navigate("/")}>
                                    Đăng nhập
                                </button>
                            </div>
                        ) : (
                            <>
                                {lastAdminMessage && (
                                    <div className="support-admin-note">
                                        Phản hồi mới nhất: {lastAdminMessage.message}
                                    </div>
                                )}

                                {messages.length === 0 && (
                                    <div className="support-empty">
                                        <strong>Bạn cần hỗ trợ gì?</strong>
                                        <p>Chọn câu hỏi gợi ý hoặc nhập nội dung bên dưới.</p>
                                    </div>
                                )}

                                <div className="support-quick-list">
                                    {quickQuestions.map((question) => (
                                        <button
                                            type="button"
                                            key={question.label}
                                            onClick={() => createOrSend(question.message, question.category)}
                                            disabled={loading}
                                        >
                                            {question.label}
                                        </button>
                                    ))}
                                </div>

                                <div className="support-message-list">
                                    {messages.map((message) => (
                                        <div
                                            className={`support-message ${message.sender_role === "admin" ? "admin" : "student"}`}
                                            key={message.id}
                                        >
                                            <div>{message.message}</div>
                                            <span>
                                                {message.sender_role === "admin" ? "Admin" : "Bạn"} · {formatTime(message.created_at)}
                                            </span>
                                        </div>
                                    ))}
                                    <div ref={messagesEndRef}></div>
                                </div>

                                {error && <div className="alert alert-danger py-2">{error}</div>}

                                <form className="support-form" onSubmit={handleSubmit}>
                                    <textarea
                                        value={text}
                                        onChange={(event) => setText(event.target.value)}
                                        placeholder="Nhập nội dung cần hỏi admin..."
                                        rows="2"
                                        disabled={loading || thread?.status === "closed"}
                                    />
                                    <button
                                        className="btn btn-primary"
                                        type="submit"
                                        disabled={loading || !text.trim() || thread?.status === "closed"}
                                    >
                                        Gửi
                                    </button>
                                </form>
                            </>
                        )}
                    </div>
                </section>
            )}

            <button className="support-toggle" type="button" onClick={() => setOpen((current) => !current)}>
                <span>{open ? "Đóng" : "Hỗ trợ"}</span>
                {!open && <strong>?</strong>}
            </button>
        </div>
    );
}

export default StudentSupportChat;
