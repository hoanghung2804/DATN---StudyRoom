import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register } from "../services/authService";

function Register() {
    const navigate = useNavigate();

    const [fullname, setFullname] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        document.title = "Study Room";
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setLoading(true);
            setMessage(null);
            await register({
                fullname,
                email,
                password
            });

            setMessage({
                type: "success",
                text: "Đăng ký thành công. Đang chuyển đến trang đăng nhập..."
            });
            window.setTimeout(() => navigate("/"), 900);
        } catch (error) {
            setMessage({
                type: "danger",
                text: error.response?.data?.message || "Đăng ký thất bại"
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card p-4">
                <div className="mb-4">
                    <div className="auth-eyebrow mb-2">Tài khoản sinh viên</div>
                    <h1 className="h3 fw-bold mb-2">Tạo tài khoản</h1>
                    <p className="mb-0 text-white-50">
                        Đăng ký tài khoản sinh viên để đặt phòng học trong trường.
                    </p>
                </div>

                {message && (
                    <div className={`alert alert-${message.type === "danger" ? "danger" : "success"} py-2`}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label className="form-label">Họ tên</label>
                        <input
                            className="form-control"
                            placeholder="Nguyễn Văn A"
                            value={fullname}
                            onChange={(e) => setFullname(e.target.value)}
                            required
                        />
                    </div>

                    <div className="mb-3">
                        <label className="form-label">Email</label>
                        <input
                            className="form-control"
                            placeholder="Nhập email sinh viên"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="mb-3">
                        <label className="form-label">Mật khẩu</label>
                        <input
                            type="password"
                            className="form-control"
                            placeholder="Tối thiểu 6 ký tự"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button className="btn btn-primary w-100" disabled={loading}>
                        {loading ? "Đang tạo..." : "Đăng ký"}
                    </button>
                </form>

                <div className="d-flex justify-content-between align-items-center mt-4">
                    <span className="text-white-50">Đã có tài khoản?</span>
                    <Link to="/">Đăng nhập</Link>
                </div>
            </div>
        </div>
    );
}

export default Register;
