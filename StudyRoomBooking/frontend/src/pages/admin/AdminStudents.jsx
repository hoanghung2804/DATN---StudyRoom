import { useEffect, useMemo, useRef, useState } from "react";
import Navbar from "../../components/Navbar";
import PromptModal from "../../components/PromptModal";
import {
    createAdminUser,
    deleteStudentUser,
    getAdminUsers,
    resetUserPassword,
    updateAdminUser
} from "../../services/userService";
import {
    STUDENT_PASSWORD_HINT,
    validateStudentPassword
} from "../../utils/passwordPolicy";

const emptyForm = {
    fullname: "",
    email: "",
    password: "",
    role: "student"
};

function formatDate(value) {
    if (!value) return "-";
    return new Date(value).toLocaleDateString("vi-VN");
}

function getRoleLabel(role) {
    return role === "admin" ? "Quản trị viên" : "Sinh viên";
}

function validatePasswordByRole(password, role) {
    if (role === "student") {
        return validateStudentPassword(password);
    }

    if (!password || password.length < 6) {
        return "Mật khẩu admin nên có tối thiểu 6 ký tự.";
    }

    return "";
}

// NOTE: Chuc nang chinh - Admin quan ly hoc sinh/admin, thong ke lich va thao tac tai khoan.
function AdminStudents() {
    const [users, setUsers] = useState([]);
    const [form, setForm] = useState(emptyForm);
    const [editing, setEditing] = useState(null);
    const [keyword, setKeyword] = useState("");
    const [roleFilter, setRoleFilter] = useState("student");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [statusMessage, setStatusMessage] = useState(null);
    const [resetTarget, setResetTarget] = useState(null);
    const [newPassword, setNewPassword] = useState("");
    const [resetting, setResetting] = useState(false);
    const statusTimer = useRef(null);

    const summary = useMemo(() => {
        const students = users.filter((user) => user.role === "student");
        const admins = users.filter((user) => user.role === "admin");

        return {
            students: students.length,
            admins: admins.length,
            bookings: students.reduce((total, user) => total + Number(user.total_bookings || 0), 0),
            reviews: students.reduce((total, user) => total + Number(user.review_count || 0), 0)
        };
    }, [users]);

    const formPasswordHint = form.role === "student"
        ? STUDENT_PASSWORD_HINT
        : "Tài khoản admin giữ quy tắc tối thiểu 6 ký tự.";
    const resetPasswordHint = resetTarget?.role === "student"
        ? STUDENT_PASSWORD_HINT
        : "Tài khoản admin giữ quy tắc tối thiểu 6 ký tự.";

    const showStatus = (type, text) => {
        setStatusMessage({ type, text });
        window.clearTimeout(statusTimer.current);
        statusTimer.current = window.setTimeout(() => {
            setStatusMessage(null);
        }, 3600);
    };

    // NOTE: Tai danh sach tai khoan theo bo loc vai tro/tu khoa.
    const loadUsers = async (params = {}) => {
        setLoading(true);
        setError("");

        try {
            const res = await getAdminUsers(params);
            setUsers(res.data || []);
        } catch (err) {
            setError(err.response?.data?.message || "Không thể tải danh sách tài khoản");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let ignore = false;

        const fetchUsers = async () => {
            setLoading(true);
            setError("");

            try {
                const res = await getAdminUsers({ role: "student" });
                if (!ignore) {
                    setUsers(res.data || []);
                }
            } catch (err) {
                if (!ignore) {
                    setError(err.response?.data?.message || "Không thể tải danh sách tài khoản");
                }
            } finally {
                if (!ignore) {
                    setLoading(false);
                }
            }
        };

        fetchUsers();

        return () => {
            ignore = true;
            window.clearTimeout(statusTimer.current);
        };
    }, []);

    const handleSearch = (event) => {
        event.preventDefault();
        loadUsers({
            keyword,
            role: roleFilter
        });
    };

    const handleChange = (event) => {
        const { name, value } = event.target;
        setForm((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const resetForm = () => {
        setEditing(null);
        setForm(emptyForm);
    };

    const startEdit = (user) => {
        setEditing(user);
        setForm({
            fullname: user.fullname || "",
            email: user.email || "",
            password: "",
            role: user.role || "student"
        });
    };

    // NOTE: Tao moi hoac cap nhat tai khoan trong form ben trai.
    const handleSubmit = async (event) => {
        event.preventDefault();

        try {
            if (!editing) {
                const passwordError = validatePasswordByRole(form.password, form.role);

                if (passwordError) {
                    showStatus("danger", passwordError);
                    return;
                }
            }

            if (editing) {
                await updateAdminUser(editing.id, {
                    fullname: form.fullname,
                    role: form.role
                });
                showStatus("success", "Cập nhật tài khoản thành công");
            } else {
                await createAdminUser(form);
                showStatus("success", "Thêm tài khoản thành công");
            }

            resetForm();
            loadUsers({
                keyword,
                role: roleFilter
            });
        } catch (err) {
            showStatus("danger", err.response?.data?.message || "Không thể lưu tài khoản");
        }
    };

    // NOTE: Admin dat lai mat khau truc tiep khi sinh vien can ho tro.
    const handleResetPassword = async () => {
        if (!resetTarget) return;

        const passwordError = validatePasswordByRole(newPassword, resetTarget.role);

        if (passwordError) {
            showStatus("danger", passwordError);
            return;
        }

        setResetting(true);

        try {
            await resetUserPassword(resetTarget.id, newPassword);
            setResetTarget(null);
            setNewPassword("");
            showStatus("success", "Đặt lại mật khẩu thành công");
        } catch (err) {
            showStatus("danger", err.response?.data?.message || "Không thể đặt lại mật khẩu");
        } finally {
            setResetting(false);
        }
    };

    // NOTE: Xoa hoc sinh bang modal xac nhan trong web va hien thong bao trang thai.
    const confirmDeleteStudent = async () => {
        if (!deleteTarget) return;

        setDeleting(true);

        try {
            await deleteStudentUser(deleteTarget.id);
            setDeleteTarget(null);
            showStatus("success", `Đã xóa học sinh ${deleteTarget.fullname}`);
            loadUsers({
                keyword,
                role: roleFilter
            });
        } catch (err) {
            showStatus("danger", err.response?.data?.message || "Không thể xóa học sinh");
        } finally {
            setDeleting(false);
        }
    };

    return (
        <>
            <Navbar />

            {statusMessage && (
                <div className={`app-status-toast ${statusMessage.type}`} role="status">
                    <strong>{statusMessage.type === "success" ? "Thành công" : "Có lỗi"}</strong>
                    <span>{statusMessage.text}</span>
                </div>
            )}

            <main className="container app-shell">
                <div className="page-heading">
                    <div>
                        <h1>Quản lý học sinh</h1>
                        <p>Theo dõi tài khoản sinh viên, lịch đặt, check-in và đánh giá phòng học.</p>
                    </div>
                </div>

                <div className="row g-3 mb-4">
                    <div className="col-md-3">
                        <div className="stat-card">
                            <span>Sinh viên</span>
                            <strong>{summary.students}</strong>
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="stat-card success">
                            <span>Quản trị viên</span>
                            <strong>{summary.admins}</strong>
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="stat-card info">
                            <span>Tổng lịch đặt</span>
                            <strong>{summary.bookings}</strong>
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="stat-card warning">
                            <span>Đánh giá</span>
                            <strong>{summary.reviews}</strong>
                        </div>
                    </div>
                </div>

                <div className="row g-4">
                    <div className="col-lg-4">
                        <div className="card p-4 admin-form-card">
                            <h3 className="card-title mb-3">
                                {editing ? "Cập nhật tài khoản" : "Thêm tài khoản"}
                            </h3>
                            <form onSubmit={handleSubmit}>
                                <label className="form-label fw-bold">Họ tên</label>
                                <input
                                    className="form-control mb-3"
                                    name="fullname"
                                    value={form.fullname}
                                    onChange={handleChange}
                                    required
                                />

                                <label className="form-label fw-bold">Email</label>
                                <input
                                    className="form-control mb-3"
                                    name="email"
                                    type="email"
                                    value={form.email}
                                    onChange={handleChange}
                                    disabled={Boolean(editing)}
                                    required
                                />

                                {!editing && (
                                    <>
                                        <label className="form-label fw-bold">Mật khẩu</label>
                                        <input
                                            className="form-control mb-3"
                                            name="password"
                                            type="password"
                                            value={form.password}
                                            onChange={handleChange}
                                            minLength={form.role === "student" ? 8 : 6}
                                            placeholder={form.role === "student" ? "Ví dụ: Student@123" : "Tối thiểu 6 ký tự"}
                                            required
                                        />
                                        <div className="form-text mb-3">{formPasswordHint}</div>
                                    </>
                                )}

                                <label className="form-label fw-bold">Vai trò</label>
                                <select
                                    className="form-select mb-4"
                                    name="role"
                                    value={form.role}
                                    onChange={handleChange}
                                >
                                    <option value="student">Sinh viên</option>
                                    <option value="admin">Quản trị viên</option>
                                </select>

                                <div className="d-flex gap-2">
                                    <button className="btn btn-primary" type="submit">
                                        {editing ? "Lưu thay đổi" : "Thêm tài khoản"}
                                    </button>
                                    {editing && (
                                        <button className="btn btn-outline-secondary" type="button" onClick={resetForm}>
                                            Hủy
                                        </button>
                                    )}
                                </div>
                            </form>
                        </div>
                    </div>

                    <div className="col-lg-8">
                        <div className="card p-4">
                            <form className="admin-filter-bar mb-3" onSubmit={handleSearch}>
                                <div>
                                    <label className="form-label fw-bold">Tìm kiếm</label>
                                    <input
                                        className="form-control"
                                        placeholder="Nhập tên, email hoặc vai trò"
                                        value={keyword}
                                        onChange={(event) => setKeyword(event.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="form-label fw-bold">Vai trò</label>
                                    <select
                                        className="form-select"
                                        value={roleFilter}
                                        onChange={(event) => setRoleFilter(event.target.value)}
                                    >
                                        <option value="student">Sinh viên</option>
                                        <option value="admin">Quản trị viên</option>
                                        <option value="">Tất cả</option>
                                    </select>
                                </div>
                                <button className="btn btn-primary" type="submit">
                                    Lọc danh sách
                                </button>
                            </form>

                            {error && <div className="alert alert-danger">{error}</div>}
                            {loading ? (
                                <div className="text-muted py-4">Đang tải danh sách tài khoản...</div>
                            ) : users.length === 0 ? (
                                <div className="empty-state">Không tìm thấy tài khoản phù hợp.</div>
                            ) : (
                                <div className="admin-user-list">
                                    {users.map((user) => (
                                        <article className="admin-user-row" key={user.id}>
                                            <div className="admin-user-main">
                                                <div className="admin-user-avatar">
                                                    {(user.fullname || user.email || "U").charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <h4>{user.fullname}</h4>
                                                    <p>{user.email}</p>
                                                    <span className={`admin-role-pill ${user.role}`}>
                                                        {getRoleLabel(user.role)}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="admin-user-stats">
                                                <span>
                                                    <strong>{user.total_bookings || 0}</strong>
                                                    Tổng lịch
                                                </span>
                                                <span>
                                                    <strong>{user.approved_bookings || 0}</strong>
                                                    Đã duyệt
                                                </span>
                                                <span>
                                                    <strong>{user.checked_in_count || 0}</strong>
                                                    Check-in
                                                </span>
                                                <span>
                                                    <strong>{user.review_count || 0}</strong>
                                                    Đánh giá
                                                </span>
                                            </div>

                                            <div className="admin-user-date">
                                                <span>Ngày tạo</span>
                                                <strong>{formatDate(user.created_at)}</strong>
                                            </div>

                                            <div className="admin-actions">
                                                <button
                                                    className="btn btn-warning btn-sm"
                                                    type="button"
                                                    onClick={() => startEdit(user)}
                                                >
                                                    Sửa
                                                </button>
                                                <button
                                                                className="btn btn-outline-danger btn-sm"
                                                                type="button"
                                                                onClick={() => {
                                                                    setResetTarget(user);
                                                                    setNewPassword("");
                                                                }}
                                                            >
                                                                Reset mật khẩu
                                                </button>
                                                {user.role === "student" && (
                                                    <button
                                                        className="btn btn-danger btn-sm"
                                                        type="button"
                                                        onClick={() => setDeleteTarget(user)}
                                                    >
                                                        Xóa
                                                    </button>
                                                )}
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {deleteTarget && (
                <div className="app-modal-backdrop">
                    <div className="app-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="delete-student-title">
                        <div className="app-confirm-icon">!</div>
                        <h4 id="delete-student-title">Xóa học sinh?</h4>
                        <p>
                            Bạn có muốn xóa học sinh <strong>{deleteTarget.fullname}</strong> không?
                        </p>
                        <p className="text-muted">
                            Toàn bộ lịch đặt, thông báo và đánh giá của học sinh này cũng sẽ bị xóa.
                        </p>
                        <div className="d-flex justify-content-end gap-2 mt-4">
                            <button
                                className="btn btn-outline-secondary"
                                type="button"
                                onClick={() => setDeleteTarget(null)}
                                disabled={deleting}
                            >
                                Hủy
                            </button>
                            <button
                                className="btn btn-danger"
                                type="button"
                                onClick={confirmDeleteStudent}
                                disabled={deleting}
                            >
                                {deleting ? "Đang xóa..." : "Xóa"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <PromptModal
                open={Boolean(resetTarget)}
                title="Reset mật khẩu"
                label={`Mật khẩu mới cho ${resetTarget?.fullname || ""}`}
                value={newPassword}
                type="password"
                placeholder={resetTarget?.role === "student" ? "Ví dụ: Student@123" : "Tối thiểu 6 ký tự"}
                helpText={resetPasswordHint}
                confirmText="Reset mật khẩu"
                loading={resetting}
                onChange={setNewPassword}
                onCancel={() => setResetTarget(null)}
                onConfirm={handleResetPassword}
            />
        </>
    );
}

export default AdminStudents;
