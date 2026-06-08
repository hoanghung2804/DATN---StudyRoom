import { useEffect, useMemo, useState } from "react";
import Navbar from "../../components/Navbar";
import PromptModal from "../../components/PromptModal";
import {
    changePassword,
    getProfile,
    updateProfile
} from "../../services/authService";
import {
    createAdminUser,
    getAdminUsers,
    resetUserPassword
} from "../../services/userService";
import { readImageAsDataUrl } from "../../utils/imageFile";

const emptyAdminForm = {
    fullname: "",
    email: "",
    password: "",
    role: "admin"
};

function AdminProfile() {
    const [profile, setProfile] = useState({});
    const [fullname, setFullname] = useState("");
    const [avatarUrl, setAvatarUrl] = useState("");
    const [admins, setAdmins] = useState([]);
    const [adminForm, setAdminForm] = useState(emptyAdminForm);
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [message, setMessage] = useState(null);
    const [passwordMessage, setPasswordMessage] = useState(null);
    const [adminMessage, setAdminMessage] = useState(null);
    const [loading, setLoading] = useState(true);
    const [resetTarget, setResetTarget] = useState(null);
    const [resetPassword, setResetPassword] = useState("");
    const [resetting, setResetting] = useState(false);

    const initials = useMemo(() => {
        const displayName = fullname || profile.fullname || profile.email || "AD";

        return displayName
            .trim()
            .split(/\s+/)
            .slice(-2)
            .map((word) => word[0])
            .join("")
            .toUpperCase();
    }, [fullname, profile.fullname, profile.email]);

    async function loadData() {
        const [profileRes, adminRes] = await Promise.all([
            getProfile(),
            getAdminUsers({
                role: "admin"
            })
        ]);

        setProfile(profileRes.data || {});
        setFullname(profileRes.data?.fullname || "");
        setAvatarUrl(profileRes.data?.avatar_url || "");
        setAdmins(adminRes.data || []);
    }

    useEffect(() => {
        let ignore = false;

        Promise.all([
            getProfile(),
            getAdminUsers({
                role: "admin"
            })
        ])
            .then(([profileRes, adminRes]) => {
                if (!ignore) {
                    setProfile(profileRes.data || {});
                    setFullname(profileRes.data?.fullname || "");
                    setAvatarUrl(profileRes.data?.avatar_url || "");
                    setAdmins(adminRes.data || []);
                }
            })
            .catch((err) => {
                if (!ignore) {
                    setMessage({
                        type: "danger",
                        text: err.response?.data?.message || "Không tải được hồ sơ admin"
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

    const handleAvatarChange = async (e) => {
        try {
            const imageData = await readImageAsDataUrl(e.target.files?.[0]);
            setAvatarUrl(imageData);
        } catch (err) {
            setMessage({
                type: "danger",
                text: err.message || "Không thể đọc ảnh đại diện"
            });
        } finally {
            e.target.value = "";
        }
    };

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setMessage(null);

        try {
            await updateProfile({
                fullname,
                avatar_url: avatarUrl
            });

            const currentUser = JSON.parse(localStorage.getItem("user") || "null");

            if (currentUser) {
                localStorage.setItem(
                    "user",
                    JSON.stringify({
                        ...currentUser,
                        fullname
                    })
                );
                window.dispatchEvent(new Event("user-updated"));
            }

            setMessage({
                type: "success",
                text: "Cập nhật hồ sơ admin thành công"
            });

            await loadData();
        } catch (err) {
            setMessage({
                type: "danger",
                text: err.response?.data?.message || "Cập nhật hồ sơ thất bại"
            });
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setPasswordMessage(null);

        if (newPassword.length < 6) {
            setPasswordMessage({
                type: "warning",
                text: "Mật khẩu mới nên có tối thiểu 6 ký tự"
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
        } catch (err) {
            setPasswordMessage({
                type: "danger",
                text: err.response?.data?.message || "Đổi mật khẩu thất bại"
            });
        }
    };

    const handleAdminChange = (e) => {
        const {
            name,
            value
        } = e.target;

        setAdminForm((current) => ({
            ...current,
            [name]: value
        }));
    };

    const handleCreateAdmin = async (e) => {
        e.preventDefault();
        setAdminMessage(null);

        try {
            await createAdminUser({
                ...adminForm,
                role: "admin"
            });

            setAdminMessage({
                type: "success",
                text: "Tạo tài khoản admin thành công"
            });
            setAdminForm(emptyAdminForm);
            await loadData();
        } catch (err) {
            setAdminMessage({
                type: "danger",
                text: err.response?.data?.message || "Tạo admin thất bại"
            });
        }
    };

    const handleResetAdminPassword = async () => {
        if (resetTarget) {
            if (!resetPassword || resetPassword.length < 6) {
                setAdminMessage({
                    type: "danger",
                    text: "Mật khẩu mới nên có tối thiểu 6 ký tự"
                });
                return;
            }

            setResetting(true);

            try {
                await resetUserPassword(resetTarget.id, resetPassword);
                setResetTarget(null);
                setResetPassword("");
                setAdminMessage({
                    type: "success",
                    text: "Đặt lại mật khẩu admin thành công"
                });
            } catch (err) {
                setAdminMessage({
                    type: "danger",
                    text: err.response?.data?.message || "Đặt lại mật khẩu admin thất bại"
                });
            } finally {
                setResetting(false);
            }
            return;
        }
    };

    return (
        <>
            <Navbar />

            <main className="container app-shell">
                <div className="page-heading">
                    <div>
                        <h1>Hồ sơ admin</h1>
                        <p>Quản lý thông tin cá nhân, ảnh đại diện, bảo mật tài khoản và tạo thêm quản trị viên.</p>
                    </div>
                </div>

                <section className="profile-hero">
                    <div className="profile-avatar">
                        {avatarUrl ? (
                            <img src={avatarUrl} alt="Ảnh đại diện admin" />
                        ) : (
                            initials
                        )}
                    </div>
                    <div className="profile-identity">
                        <span className="profile-eyebrow">Tài khoản quản trị</span>
                        <h2>{profile.fullname || "Quản trị viên Study Room"}</h2>
                        <div className="profile-meta">
                            <span>{profile.email || "Chưa có email"}</span>
                            <span>Quản trị viên</span>
                        </div>
                    </div>
                    <div className="profile-quick">
                        <strong>{admins.length}</strong>
                        <span>Admin hệ thống</span>
                    </div>
                </section>

                {loading ? (
                    <div className="empty-state mt-4">
                        Đang tải hồ sơ admin...
                    </div>
                ) : (
                    <>
                        <section className="profile-layout mt-4">
                            <div className="profile-panel">
                                <div className="profile-panel-header">
                                    <div>
                                        <h3>Thông tin cá nhân</h3>
                                        <p>Cập nhật tên hiển thị và ảnh đại diện của tài khoản quản trị.</p>
                                    </div>
                                </div>

                                {message && (
                                    <div className={`alert alert-${message.type}`}>
                                        {message.text}
                                    </div>
                                )}

                                <form onSubmit={handleProfileSubmit}>
                                    <div className="row g-3">
                                        <div className="col-md-6">
                                            <label className="form-label">Họ tên</label>
                                            <input
                                                className="form-control"
                                                value={fullname}
                                                onChange={(e) => setFullname(e.target.value)}
                                                required
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

                                    <button className="btn btn-primary mt-3">
                                        Cập nhật hồ sơ
                                    </button>
                                </form>
                            </div>

                            <div className="profile-panel security-panel">
                                <div className="profile-panel-header">
                                    <div>
                                        <h3>Bảo mật</h3>
                                        <p>Đổi mật khẩu tài khoản admin đang đăng nhập.</p>
                                    </div>
                                </div>

                                {passwordMessage && (
                                    <div className={`alert alert-${passwordMessage.type}`}>
                                        {passwordMessage.text}
                                    </div>
                                )}

                                <form onSubmit={handlePasswordSubmit}>
                                    <div className="mb-3">
                                        <label className="form-label">Mật khẩu hiện tại</label>
                                        <input
                                            className="form-control"
                                            type="password"
                                            value={oldPassword}
                                            onChange={(e) => setOldPassword(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Mật khẩu mới</label>
                                        <input
                                            className="form-control"
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Xác nhận mật khẩu mới</label>
                                        <input
                                            className="form-control"
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <button className="btn btn-warning">
                                        Đổi mật khẩu
                                    </button>
                                </form>
                            </div>
                        </section>

                        <section className="profile-layout mt-4">
                            <div className="profile-panel">
                                <div className="profile-panel-header">
                                    <div>
                                        <h3>Thêm admin mới</h3>
                                        <p>Dùng khi cần cấp quyền quản trị cho cán bộ phụ trách phòng học.</p>
                                    </div>
                                </div>

                                {adminMessage && (
                                    <div className={`alert alert-${adminMessage.type}`}>
                                        {adminMessage.text}
                                    </div>
                                )}

                                <form onSubmit={handleCreateAdmin}>
                                    <div className="row g-3">
                                        <div className="col-md-6">
                                            <label className="form-label">Họ tên</label>
                                            <input
                                                className="form-control"
                                                name="fullname"
                                                value={adminForm.fullname}
                                                onChange={handleAdminChange}
                                                required
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label">Email</label>
                                            <input
                                                className="form-control"
                                                name="email"
                                                value={adminForm.email}
                                                onChange={handleAdminChange}
                                                required
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label">Mật khẩu</label>
                                            <input
                                                className="form-control"
                                                name="password"
                                                type="password"
                                                value={adminForm.password}
                                                onChange={handleAdminChange}
                                                placeholder="Tối thiểu 6 ký tự"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <button className="btn btn-primary mt-3">
                                        Tạo admin
                                    </button>
                                </form>
                            </div>

                            <div className="profile-panel">
                                <div className="profile-panel-header">
                                    <div>
                                        <h3>Danh sách admin</h3>
                                        <p>Các tài khoản đang có quyền quản trị hệ thống.</p>
                                    </div>
                                </div>

                                <div className="profile-activity-list">
                                    {admins.map((admin) => (
                                        <div className="profile-activity-item" key={admin.id}>
                                            <div>
                                                <strong>{admin.fullname}</strong>
                                                <span>{admin.email}</span>
                                            </div>
                                            <button
                                                className="btn btn-outline-danger btn-sm"
                                                type="button"
                                                onClick={() => {
                                                    setResetTarget(admin);
                                                    setResetPassword("");
                                                }}
                                            >
                                                Reset mật khẩu
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>
                    </>
                )}
            </main>
            <PromptModal
                open={Boolean(resetTarget)}
                title="Reset mật khẩu admin"
                label={`Mật khẩu mới cho ${resetTarget?.fullname || ""}`}
                value={resetPassword}
                type="password"
                placeholder="Tối thiểu 6 ký tự"
                confirmText="Reset mật khẩu"
                loading={resetting}
                onChange={setResetPassword}
                onCancel={() => setResetTarget(null)}
                onConfirm={handleResetAdminPassword}
            />
        </>
    );
}

export default AdminProfile;
