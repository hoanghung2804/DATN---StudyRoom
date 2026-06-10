import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import {
    changePassword,
    getProfile,
    updateProfile
} from "../services/authService";
import { getMyBookings } from "../services/bookingService";
import { readImageAsDataUrl } from "../utils/imageFile";
import {
    STUDENT_PASSWORD_HINT,
    validateStudentPassword
} from "../utils/passwordPolicy";

const roleLabel = {
    admin: "Quản trị viên",
    student: "Sinh viên"
};

const statusLabel = {
    pending: "Chờ duyệt",
    approved: "Đã duyệt",
    rejected: "Từ chối",
    cancelled: "Đã hủy"
};

const statusClass = {
    pending: "warning",
    approved: "success",
    rejected: "danger",
    cancelled: "secondary"
};

function Profile() {
    const [profile, setProfile] = useState({});
    const [fullname, setFullname] = useState("");
    const [avatarUrl, setAvatarUrl] = useState("");
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [profileMessage, setProfileMessage] = useState(null);
    const [passwordMessage, setPasswordMessage] = useState(null);

    useEffect(() => {
        let ignore = false;

        Promise.all([
            getProfile(),
            getMyBookings()
        ])
            .then(([profileRes, bookingRes]) => {
                if (!ignore) {
                    setProfile(profileRes.data || {});
                    setFullname(profileRes.data?.fullname || "");
                    setAvatarUrl(profileRes.data?.avatar_url || "");
                    setBookings(bookingRes.data || []);
                }
            })
            .catch((error) => {
                if (!ignore) {
                    setProfileMessage({
                        type: "danger",
                        text: error.response?.data?.message || "Không thể tải thông tin hồ sơ"
                    });
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

    async function loadProfilePage() {
        const [profileRes, bookingRes] = await Promise.all([
            getProfile(),
            getMyBookings()
        ]);

        setProfile(profileRes.data || {});
        setFullname(profileRes.data?.fullname || "");
        setAvatarUrl(profileRes.data?.avatar_url || "");
        setBookings(bookingRes.data || []);
    }

    const bookingStats = useMemo(() => {
        const now = new Date();

        return bookings.reduce(
            (stats, booking) => {
                const endAt = new Date(`${booking.booking_date}T${booking.end_time}`);

                stats.total += 1;

                if (booking.status === "pending") stats.pending += 1;
                if (booking.status === "approved") stats.approved += 1;
                if (booking.checked_in_at) stats.checkedIn += 1;
                if (booking.my_rating) stats.reviewed += 1;
                if (booking.status === "approved" && endAt >= now) stats.upcoming += 1;

                return stats;
            },
            {
                total: 0,
                pending: 0,
                approved: 0,
                checkedIn: 0,
                reviewed: 0,
                upcoming: 0
            }
        );
    }, [bookings]);

    const recentBookings = useMemo(() => {
        return [...bookings]
            .sort((a, b) => {
                const left = new Date(`${a.booking_date}T${a.start_time}`);
                const right = new Date(`${b.booking_date}T${b.start_time}`);

                return right - left;
            })
            .slice(0, 5);
    }, [bookings]);

    const initials = useMemo(() => {
        const displayName = fullname || profile.fullname || profile.email || "SR";

        return displayName
            .trim()
            .split(/\s+/)
            .slice(-2)
            .map((word) => word[0])
            .join("")
            .toUpperCase();
    }, [fullname, profile.fullname, profile.email]);

    const handleAvatarChange = async (e) => {
        try {
            const imageData = await readImageAsDataUrl(e.target.files?.[0]);
            setAvatarUrl(imageData);
        } catch (err) {
            setProfileMessage({
                type: "danger",
                text: err.message || "Không thể đọc ảnh đại diện"
            });
        } finally {
            e.target.value = "";
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setProfileMessage(null);

        if (!fullname.trim()) {
            setProfileMessage({
                type: "warning",
                text: "Họ tên không được để trống"
            });
            return;
        }

        try {
            await updateProfile({
                fullname: fullname.trim(),
                avatar_url: avatarUrl
            });

            setProfileMessage({
                type: "success",
                text: "Cập nhật hồ sơ thành công"
            });

            await loadProfilePage();
        } catch (error) {
            setProfileMessage({
                type: "danger",
                text: error.response?.data?.message || "Cập nhật hồ sơ thất bại"
            });
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setPasswordMessage(null);

        const passwordError = validateStudentPassword(newPassword);

        if (passwordError) {
            setPasswordMessage({
                type: "warning",
                text: passwordError
            });
            return;
        }

        if (newPassword !== confirmPassword) {
            setPasswordMessage({
                type: "warning",
                text: "Mật khẩu mới và xác nhận mật khẩu chưa trùng khớp"
            });
            return;
        }

        try {
            await changePassword({
                oldPassword,
                newPassword
            });

            setPasswordMessage({
                type: "success",
                text: "Đổi mật khẩu thành công"
            });
            setOldPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (error) {
            setPasswordMessage({
                type: "danger",
                text: error.response?.data?.message || "Đổi mật khẩu thất bại"
            });
        }
    };

    return (
        <>
            <Navbar />

            <main className="container app-shell">
                <div className="page-heading">
                    <div>
                        <h1>Hồ sơ sinh viên</h1>
                        <p>Quản lý thông tin cá nhân, ảnh đại diện, bảo mật tài khoản và lịch sử đặt phòng.</p>
                    </div>
                </div>

                <section className="profile-hero">
                    <div className="profile-avatar">
                        {avatarUrl ? (
                            <img src={avatarUrl} alt="Ảnh đại diện" />
                        ) : (
                            initials
                        )}
                    </div>
                    <div className="profile-identity">
                        <span className="profile-eyebrow">Tài khoản sinh viên</span>
                        <h2>{profile.fullname || fullname || "Sinh viên Study Room"}</h2>
                        <div className="profile-meta">
                            <span>{profile.email || "Chưa có email"}</span>
                            <span>{roleLabel[profile.role] || profile.role || "Sinh viên"}</span>
                        </div>
                    </div>
                    <div className="profile-quick">
                        <strong>{bookingStats.upcoming}</strong>
                        <span>Lịch sắp tới</span>
                    </div>
                </section>

                {loading ? (
                    <div className="empty-state mt-4">
                        Đang tải thông tin hồ sơ...
                    </div>
                ) : (
                    <>
                        <section className="profile-stats">
                            <div className="profile-stat-card">
                                <span>Tổng lịch</span>
                                <strong>{bookingStats.total}</strong>
                            </div>
                            <div className="profile-stat-card success">
                                <span>Đã duyệt</span>
                                <strong>{bookingStats.approved}</strong>
                            </div>
                            <div className="profile-stat-card warning">
                                <span>Chờ duyệt</span>
                                <strong>{bookingStats.pending}</strong>
                            </div>
                            <div className="profile-stat-card info">
                                <span>Đã check-in</span>
                                <strong>{bookingStats.checkedIn}</strong>
                            </div>
                            <div className="profile-stat-card neutral">
                                <span>Đã đánh giá</span>
                                <strong>{bookingStats.reviewed}</strong>
                            </div>
                        </section>

                        <section className="profile-layout">
                            <div className="profile-panel">
                                <div className="profile-panel-header">
                                    <div>
                                        <h3>Thông tin cá nhân</h3>
                                        <p>Thông tin này được dùng khi đặt phòng và hiển thị trong lịch của bạn.</p>
                                    </div>
                                </div>

                                {profileMessage && (
                                    <div className={`alert alert-${profileMessage.type}`}>
                                        {profileMessage.text}
                                    </div>
                                )}

                                <form onSubmit={handleUpdate}>
                                    <div className="row g-3">
                                        <div className="col-md-6">
                                            <label className="form-label">Họ tên</label>
                                            <input
                                                className="form-control"
                                                value={fullname}
                                                onChange={(e) => setFullname(e.target.value)}
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label">Email</label>
                                            <input
                                                className="form-control"
                                                value={profile.email || ""}
                                                disabled
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label">Vai trò</label>
                                            <input
                                                className="form-control"
                                                value={roleLabel[profile.role] || profile.role || "Sinh viên"}
                                                disabled
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label">Ảnh đại diện</label>
                                            <div>
                                                <label className="btn btn-outline-primary">
                                                    Chọn ảnh từ máy
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        className="d-none"
                                                        onChange={handleAvatarChange}
                                                    />
                                                </label>
                                                {avatarUrl && (
                                                    <button
                                                        className="btn btn-outline-secondary ms-2"
                                                        type="button"
                                                        onClick={() => setAvatarUrl("")}
                                                    >
                                                        Xóa ảnh
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <button className="btn btn-primary mt-4">
                                        Cập nhật hồ sơ
                                    </button>
                                </form>
                            </div>

                            <div className="profile-panel security-panel">
                                <div className="profile-panel-header">
                                    <div>
                                        <h3>Bảo mật tài khoản</h3>
                                        <p>Đổi mật khẩu định kỳ để bảo vệ lịch đặt phòng của bạn.</p>
                                    </div>
                                </div>

                                {passwordMessage && (
                                    <div className={`alert alert-${passwordMessage.type}`}>
                                        {passwordMessage.text}
                                    </div>
                                )}

                                <form onSubmit={handleChangePassword}>
                                    <div className="mb-3">
                                        <label className="form-label">Mật khẩu hiện tại</label>
                                        <input
                                            type="password"
                                            className="form-control"
                                            value={oldPassword}
                                            onChange={(e) => setOldPassword(e.target.value)}
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Mật khẩu mới</label>
                                        <input
                                            type="password"
                                            className="form-control"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            minLength={8}
                                        />
                                        <div className="form-text">{STUDENT_PASSWORD_HINT}</div>
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Xác nhận mật khẩu mới</label>
                                        <input
                                            type="password"
                                            className="form-control"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                        />
                                    </div>
                                    <button className="btn btn-warning">
                                        Đổi mật khẩu
                                    </button>
                                </form>
                            </div>
                        </section>

                        <section className="profile-panel mt-4">
                            <div className="profile-panel-header">
                                <div>
                                    <h3>Hoạt động gần đây</h3>
                                    <p>Các lịch đặt phòng mới nhất của tài khoản này.</p>
                                </div>
                            </div>

                            {recentBookings.length === 0 ? (
                                <div className="empty-state">
                                    Bạn chưa có lịch đặt phòng nào.
                                </div>
                            ) : (
                                <div className="profile-activity-list">
                                    {recentBookings.map((booking) => (
                                        <div className="profile-activity-item" key={booking.id}>
                                            <div>
                                                <strong>{booking.room_name || booking.room}</strong>
                                                <span>
                                                    {booking.booking_date} - {booking.start_time} đến {booking.end_time}
                                                </span>
                                            </div>
                                            <span className={`badge bg-${statusClass[booking.status] || "secondary"}`}>
                                                {statusLabel[booking.status] || booking.status}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    </>
                )}
            </main>

            <Footer />
        </>
    );
}

export default Profile;
