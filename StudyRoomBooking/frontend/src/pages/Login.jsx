import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { googleLogin, login } from "../services/authService";

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const hasGoogleConfig =
    Boolean(googleClientId) &&
    !googleClientId.startsWith("your-google-client-id");

function Login() {
    const navigate = useNavigate();
    const googleButtonRef = useRef(null);
    const googleRendered = useRef(false);

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        document.title = "Study Room";
    }, []);

    const completeLogin = useCallback((data) => {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        navigate(data.user?.role === "admin" ? "/admin/dashboard" : "/home");
    }, [navigate]);

    const handleGoogleCredential = useCallback(async (response) => {
        if (!response?.credential) {
            setError("Không nhận được mã xác thực từ Google.");
            return;
        }

        try {
            setError("");
            setGoogleLoading(true);
            const res = await googleLogin(response.credential);
            completeLogin(res.data);
        } catch (err) {
            setError(err.response?.data?.message || "Đăng nhập Google thất bại.");
        } finally {
            setGoogleLoading(false);
        }
    }, [completeLogin]);

    useEffect(() => {
        if (!hasGoogleConfig || googleRendered.current) {
            return;
        }

        const renderGoogleButton = () => {
            if (!window.google || !googleButtonRef.current || googleRendered.current) {
                return;
            }

            window.google.accounts.id.initialize({
                client_id: googleClientId,
                callback: handleGoogleCredential
            });

            window.google.accounts.id.renderButton(
                googleButtonRef.current,
                {
                    theme: "outline",
                    size: "large",
                    shape: "rectangular",
                    text: "signin_with",
                    width: googleButtonRef.current.offsetWidth || 360
                }
            );

            googleRendered.current = true;
        };

        const existingScript = document.querySelector(
            'script[src="https://accounts.google.com/gsi/client"]'
        );

        if (existingScript) {
            renderGoogleButton();
            return;
        }

        const script = document.createElement("script");
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;
        script.onload = renderGoogleButton;
        script.onerror = () => {
            setError("Không thể tải Google Login. Vui lòng kiểm tra kết nối mạng.");
        };
        document.body.appendChild(script);
    }, [handleGoogleCredential]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setError("");
            setLoading(true);
            const res = await login({ email, password });
            completeLogin(res.data);
        } catch (err) {
            setError(err.response?.data?.message || "Đăng nhập thất bại.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card p-4">
                <div className="mb-4">
                    <div className="auth-eyebrow mb-2">Cổng đặt phòng đại học</div>
                    <h1 className="h3 fw-bold mb-2">Đăng nhập hệ thống</h1>
                    <p className="mb-0 text-white-50">
                        Quản lý đặt phòng học, lịch bảo trì và check-in phòng học.
                    </p>
                </div>

                {error && <div className="alert alert-danger py-2">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label className="form-label">Email</label>
                        <input
                            className="form-control"
                            placeholder="admin@gmail.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="mb-3">
                        <div className="d-flex justify-content-between gap-3">
                            <label className="form-label">Mật khẩu</label>
                            <Link className="small" to="/forgot-password">
                                Quên mật khẩu?
                            </Link>
                        </div>
                        <input
                            type="password"
                            className="form-control"
                            placeholder="Nhập mật khẩu"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button className="btn btn-primary w-100" disabled={loading || googleLoading}>
                        {loading ? "Đang xử lý..." : "Đăng nhập"}
                    </button>
                </form>

                <div className="auth-divider">
                    <span>hoặc</span>
                </div>

                {hasGoogleConfig ? (
                    <div className="google-login-wrap">
                        <div ref={googleButtonRef}></div>
                        {googleLoading && (
                            <div className="text-white-50 small mt-2">
                                Đang xác thực tài khoản Google...
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="google-login-disabled">
                        Cần cấu hình Google Client ID để bật đăng nhập bằng Google.
                    </div>
                )}

                <div className="d-flex justify-content-between align-items-center mt-4">
                    <span className="text-white-50">Chưa có tài khoản?</span>
                    <Link to="/register">Đăng ký</Link>
                </div>
            </div>
        </div>
    );
}

export default Login;
