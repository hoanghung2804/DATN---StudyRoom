import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getUnreadNotificationCount } from "../services/notificationService";

const roleLabel = {
    admin: "Quản trị viên",
    student: "Sinh viên"
};

function Navbar() {
    const navigate = useNavigate();
    const [unreadCount, setUnreadCount] = useState(0);
    const [menuOpen, setMenuOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState(
        JSON.parse(localStorage.getItem("user") || "null")
    );

    const user = currentUser;
    const userId = user?.id;
    const isAdmin = user?.role === "admin";

    useEffect(() => {
        document.title = isAdmin ? "Admin Study Room" : "Study Room";
    }, [isAdmin]);

    useEffect(() => {
        const syncUser = () => {
            setCurrentUser(JSON.parse(localStorage.getItem("user") || "null"));
        };

        window.addEventListener("storage", syncUser);
        window.addEventListener("user-updated", syncUser);

        return () => {
            window.removeEventListener("storage", syncUser);
            window.removeEventListener("user-updated", syncUser);
        };
    }, []);

    useEffect(() => {
        if (!userId || isAdmin) {
            return;
        }

        let ignore = false;

        getUnreadNotificationCount()
            .then((res) => {
                if (!ignore) {
                    setUnreadCount(res.data.total || 0);
                }
            })
            .catch(() => {
                if (!ignore) {
                    setUnreadCount(0);
                }
            });

        return () => {
            ignore = true;
        };
    }, [userId, isAdmin]);

    const closeMenu = () => {
        setMenuOpen(false);
    };

    const goTo = (path) => {
        closeMenu();
        navigate(path);
    };

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setCurrentUser(null);
        closeMenu();
        navigate("/");
    };

    return (
        <nav className="navbar navbar-expand-lg navbar-dark app-navbar">
            <div className="container">
                <Link
                    className="navbar-brand fw-bold"
                    to={isAdmin ? "/admin/dashboard" : "/home"}
                    onClick={closeMenu}
                >
                    <span className="brand-mark">SR</span>
                    <span>{isAdmin ? "Admin Study Room" : "Study Room"}</span>
                </Link>

                <button
                    className={`navbar-toggler ${menuOpen ? "is-open" : ""}`}
                    type="button"
                    aria-controls="navbarNav"
                    aria-expanded={menuOpen}
                    aria-label={menuOpen ? "Đóng menu" : "Mở menu"}
                    onClick={() => setMenuOpen((current) => !current)}
                >
                    <span className="navbar-toggler-icon"></span>
                </button>

                <div className={`collapse navbar-collapse ${menuOpen ? "show" : ""}`} id="navbarNav">
                    <ul className="navbar-nav app-nav-list me-auto">
                        {isAdmin ? (
                            <>
                                <li className="nav-item">
                                    <Link className="nav-link" to="/admin/dashboard" onClick={closeMenu}>
                                        Dashboard
                                    </Link>
                                </li>

                                <li className="nav-item">
                                    <Link className="nav-link" to="/admin/rooms" onClick={closeMenu}>
                                        Phòng
                                    </Link>
                                </li>

                                <li className="nav-item">
                                    <Link className="nav-link" to="/admin/students" onClick={closeMenu}>
                                        Học sinh
                                    </Link>
                                </li>

                                <li className="nav-item">
                                    <Link className="nav-link" to="/admin/bookings" onClick={closeMenu}>
                                        Duyệt lịch
                                    </Link>
                                </li>

                                <li className="nav-item">
                                    <Link className="nav-link" to="/admin/calendar" onClick={closeMenu}>
                                        Lịch phòng
                                    </Link>
                                </li>

                                <li className="nav-item">
                                    <Link className="nav-link" to="/admin/maintenance" onClick={closeMenu}>
                                        Bảo trì
                                    </Link>
                                </li>

                                <li className="nav-item">
                                    <Link className="nav-link" to="/admin/password-requests" onClick={closeMenu}>
                                        Mật khẩu
                                    </Link>
                                </li>

                                <li className="nav-item">
                                    <Link className="nav-link" to="/admin/profile" onClick={closeMenu}>
                                        Hồ sơ
                                    </Link>
                                </li>
                            </>
                        ) : (
                            <>
                                <li className="nav-item">
                                    <Link className="nav-link" to="/home" onClick={closeMenu}>
                                        Trang chủ
                                    </Link>
                                </li>

                                <li className="nav-item">
                                    <Link className="nav-link" to="/rooms" onClick={closeMenu}>
                                        Phòng học
                                    </Link>
                                </li>

                                {user && (
                                    <>
                                        <li className="nav-item">
                                            <Link className="nav-link" to="/my-bookings" onClick={closeMenu}>
                                                Lịch của tôi
                                            </Link>
                                        </li>

                                        <li className="nav-item">
                                            <Link className="nav-link" to="/schedule" onClick={closeMenu}>
                                                Lịch tuần
                                            </Link>
                                        </li>

                                        <li className="nav-item">
                                            <Link className="nav-link" to="/notifications" onClick={closeMenu}>
                                                Thông báo
                                                {unreadCount > 0 && (
                                                    <span className="badge bg-danger ms-2">
                                                        {unreadCount}
                                                    </span>
                                                )}
                                            </Link>
                                        </li>

                                        <li className="nav-item">
                                            <Link className="nav-link" to="/profile" onClick={closeMenu}>
                                                Hồ sơ
                                            </Link>
                                        </li>
                                    </>
                                )}
                            </>
                        )}
                    </ul>

                    <div className="navbar-user-actions">
                        {user ? (
                            <>
                                <span className="user-chip">
                                    <span>{user.fullname}</span>
                                    <span className="badge bg-primary">
                                        {roleLabel[user.role] || user.role}
                                    </span>
                                </span>

                                <button
                                    className="btn btn-outline-light btn-sm"
                                    onClick={logout}
                                    type="button"
                                >
                                    Đăng xuất
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    className="btn btn-outline-light btn-sm"
                                    onClick={() => goTo("/")}
                                    type="button"
                                >
                                    Đăng nhập
                                </button>
                                <button
                                    className="btn btn-primary btn-sm"
                                    onClick={() => goTo("/register")}
                                    type="button"
                                >
                                    Đăng ký
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}

export default Navbar;
