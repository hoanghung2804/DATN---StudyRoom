import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "../services/authService";

function ForgotPassword() {
    const [form, setForm] = useState({
        email: "",
        newPassword: "",
        confirmPassword: "",
        note: ""
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        document.title = "Study Room";
    }, []);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setForm((current) => ({
            ...current,
            [name]: value
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        setMessage(null);

        if (form.newPassword !== form.confirmPassword) {
            setMessage({
                type: "danger",
                text: "Mật khẩu xác nhận không khớp."
            });
            setLoading(false);
            return;
        }

        try {
            const res = await forgotPassword(form);
            setMessage({
                type: "success",
                text: res.data.message || "Đã gửi yêu cầu đặt lại mật khẩu. Vui lòng chờ admin phê duyệt."
            });
            setForm((current) => ({
                ...current,
                newPassword: "",
                confirmPassword: "",
                note: ""
            }));
        } catch (error) {
            setMessage({
                type: "danger",
                text: error.response?.data?.message || "Không thể gửi yêu cầu đặt lại mật khẩu."
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card p-4">
                <div className="mb-4">
                    <div className="auth-eyebrow mb-2">Khôi phục tài khoản</div>
                    <h1 className="h3 fw-bold mb-2">Quên mật khẩu</h1>
                    <p className="mb-0 text-white-50">
                        Nhập email tài khoản và mật khẩu mới. Admin sẽ kiểm tra rồi phê duyệt yêu cầu của bạn.
                    </p>
                </div>

                {message && (
                    <div className={`alert alert-${message.type} py-2`}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label className="form-label">Email tài khoản</label>
                        <input
                            className="form-control"
                            type="email"
                            name="email"
                            placeholder="Nhập email tài khoản"
                            value={form.email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="mb-3">
                        <label className="form-label">Mật khẩu mới</label>
                        <input
                            className="form-control"
                            type="password"
                            name="newPassword"
                            placeholder="Tối thiểu 6 ký tự"
                            value={form.newPassword}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="mb-3">
                        <label className="form-label">Xác nhận mật khẩu mới</label>
                        <input
                            className="form-control"
                            type="password"
                            name="confirmPassword"
                            placeholder="Nhập lại mật khẩu mới"
                            value={form.confirmPassword}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="mb-3">
                        <label className="form-label">Ghi chú cho admin</label>
                        <textarea
                            className="form-control"
                            name="note"
                            rows="3"
                            placeholder="Ví dụ: Em quên mật khẩu tài khoản đặt phòng."
                            value={form.note}
                            onChange={handleChange}
                        />
                    </div>

                    <button className="btn btn-primary w-100" disabled={loading}>
                        {loading ? "Đang gửi yêu cầu..." : "Gửi yêu cầu cho admin"}
                    </button>
                </form>

                <div className="d-flex justify-content-between align-items-center mt-4">
                    <span className="text-white-50">Đã nhớ mật khẩu?</span>
                    <Link to="/">Đăng nhập</Link>
                </div>
            </div>
        </div>
    );
}

export default ForgotPassword;
