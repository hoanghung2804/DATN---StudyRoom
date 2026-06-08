import { useEffect, useMemo, useState } from "react";
import AppToast from "../../components/AppToast";
import ConfirmModal from "../../components/ConfirmModal";
import Navbar from "../../components/Navbar";
import PromptModal from "../../components/PromptModal";
import {
    approvePasswordResetRequest,
    getPasswordResetRequests,
    rejectPasswordResetRequest
} from "../../services/authService";

const statusLabel = {
    pending: "Chờ duyệt",
    approved: "Đã duyệt",
    rejected: "Từ chối"
};

function statusClass(status) {
    if (status === "pending") return "bg-warning text-dark";
    if (status === "approved") return "bg-success";
    if (status === "rejected") return "bg-danger";
    return "bg-secondary";
}

function AdminPasswordRequests() {
    const [requests, setRequests] = useState([]);
    const [status, setStatus] = useState("pending");
    const [keyword, setKeyword] = useState("");
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [toast, setToast] = useState(null);
    const [approveTarget, setApproveTarget] = useState(null);
    const [rejectTarget, setRejectTarget] = useState(null);
    const [rejectReason, setRejectReason] = useState("");

    async function loadRequests() {
        try {
            setLoading(true);
            const res = await getPasswordResetRequests();
            setRequests(res.data || []);
        } catch (err) {
            setToast({
                type: "danger",
                text: err.response?.data?.message || "Không tải được danh sách yêu cầu."
            });
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        let ignore = false;

        const fetchRequests = async () => {
            try {
                setLoading(true);
                const res = await getPasswordResetRequests();
                if (!ignore) {
                    setRequests(res.data || []);
                }
            } catch (err) {
                if (!ignore) {
                    setToast({
                        type: "danger",
                        text: err.response?.data?.message || "Không tải được danh sách yêu cầu."
                    });
                }
            } finally {
                if (!ignore) {
                    setLoading(false);
                }
            }
        };

        fetchRequests();

        return () => {
            ignore = true;
        };
    }, []);

    const filteredRequests = useMemo(() => {
        const normalizedKeyword = keyword.trim().toLowerCase();

        return requests.filter((request) => {
            const matchStatus = !status || request.status === status;
            const matchKeyword =
                !normalizedKeyword ||
                request.fullname?.toLowerCase().includes(normalizedKeyword) ||
                request.email?.toLowerCase().includes(normalizedKeyword);

            return matchStatus && matchKeyword;
        });
    }, [keyword, requests, status]);

    const showToast = (type, text) => {
        setToast({ type, text });
        window.setTimeout(() => setToast(null), 3400);
    };

    const confirmApprove = async () => {
        if (!approveTarget) return;
        setProcessing(true);

        try {
            await approvePasswordResetRequest(approveTarget.id);
            setApproveTarget(null);
            showToast("success", "Đã duyệt yêu cầu và cập nhật mật khẩu mới.");
            await loadRequests();
        } catch (err) {
            showToast("danger", err.response?.data?.message || "Duyệt yêu cầu thất bại.");
        } finally {
            setProcessing(false);
        }
    };

    const confirmReject = async () => {
        if (!rejectTarget) return;
        setProcessing(true);

        try {
            await rejectPasswordResetRequest(rejectTarget.id, rejectReason.trim());
            setRejectTarget(null);
            setRejectReason("");
            showToast("success", "Đã từ chối yêu cầu đặt lại mật khẩu.");
            await loadRequests();
        } catch (err) {
            showToast("danger", err.response?.data?.message || "Từ chối yêu cầu thất bại.");
        } finally {
            setProcessing(false);
        }
    };

    return (
        <>
            <Navbar />
            <AppToast message={toast} />

            <div className="container app-shell">
                <div className="page-heading">
                    <div>
                        <h1>Yêu cầu mật khẩu</h1>
                        <p>Phê duyệt hoặc từ chối yêu cầu đặt lại mật khẩu do sinh viên gửi.</p>
                    </div>
                    <button
                        className="btn btn-outline-primary"
                        onClick={loadRequests}
                        disabled={loading}
                        type="button"
                    >
                        Tải lại
                    </button>
                </div>

                <div className="row g-3 mb-3">
                    <div className="col-md-4">
                        <div className="password-request-stat pending">
                            <span>Chờ duyệt</span>
                            <strong>{requests.filter((request) => request.status === "pending").length}</strong>
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div className="password-request-stat approved">
                            <span>Đã duyệt</span>
                            <strong>{requests.filter((request) => request.status === "approved").length}</strong>
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div className="password-request-stat rejected">
                            <span>Từ chối</span>
                            <strong>{requests.filter((request) => request.status === "rejected").length}</strong>
                        </div>
                    </div>
                </div>

                <div className="admin-filter-bar mb-3">
                    <div>
                        <label className="form-label">Tìm kiếm</label>
                        <input
                            className="form-control"
                            placeholder="Nhập tên hoặc email"
                            value={keyword}
                            onChange={(event) => setKeyword(event.target.value)}
                        />
                    </div>
                    <div>
                        <label className="form-label">Trạng thái</label>
                        <select
                            className="form-select"
                            value={status}
                            onChange={(event) => setStatus(event.target.value)}
                        >
                            <option value="">Tất cả</option>
                            <option value="pending">Chờ duyệt</option>
                            <option value="approved">Đã duyệt</option>
                            <option value="rejected">Từ chối</option>
                        </select>
                    </div>
                    <button
                        className="btn btn-primary"
                        onClick={loadRequests}
                        disabled={loading}
                        type="button"
                    >
                        Lọc
                    </button>
                </div>

                {loading ? (
                    <div className="alert alert-secondary">Đang tải yêu cầu...</div>
                ) : (
                    <div className="password-request-list">
                        {filteredRequests.length === 0 && (
                            <div className="empty-state">Chưa có yêu cầu phù hợp.</div>
                        )}

                        {filteredRequests.map((request) => (
                            <article className={`password-request-card ${request.status}`} key={request.id}>
                                <div className="password-request-main">
                                    <div>
                                        <h3>{request.fullname}</h3>
                                        <p>{request.email}</p>
                                    </div>
                                    <span className={`badge ${statusClass(request.status)}`}>
                                        {statusLabel[request.status] || request.status}
                                    </span>
                                </div>

                                <div className="password-request-meta">
                                    <span>
                                        <strong>Ngày gửi</strong>
                                        {request.created_at?.slice(0, 10) || "-"}
                                    </span>
                                    <span>
                                        <strong>Admin xử lý</strong>
                                        {request.reviewed_by_name || "Chưa xử lý"}
                                    </span>
                                    <span>
                                        <strong>Ngày xử lý</strong>
                                        {request.reviewed_at?.slice(0, 10) || "-"}
                                    </span>
                                </div>

                                <div className="password-request-note">
                                    <strong>Ghi chú sinh viên</strong>
                                    <p>{request.note || "Không có ghi chú."}</p>
                                </div>

                                {request.admin_note && (
                                    <div className="password-request-note admin-note">
                                        <strong>Phản hồi admin</strong>
                                        <p>{request.admin_note}</p>
                                    </div>
                                )}

                                <div className="password-request-actions">
                                    {request.status === "pending" ? (
                                        <>
                                            <button
                                                className="btn btn-success"
                                                onClick={() => setApproveTarget(request)}
                                                type="button"
                                            >
                                                Duyệt
                                            </button>
                                            <button
                                                className="btn btn-outline-danger"
                                                onClick={() => {
                                                    setRejectTarget(request);
                                                    setRejectReason("");
                                                }}
                                                type="button"
                                            >
                                                Từ chối
                                            </button>
                                        </>
                                    ) : (
                                        <span className="text-muted">Yêu cầu đã được xử lý.</span>
                                    )}
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </div>

            <ConfirmModal
                open={Boolean(approveTarget)}
                title="Duyệt yêu cầu đặt lại mật khẩu?"
                message={`Mật khẩu của ${approveTarget?.fullname || "sinh viên"} sẽ được đổi sang mật khẩu mới mà sinh viên đã nhập.`}
                detail="Sau khi duyệt, sinh viên có thể đăng nhập bằng mật khẩu mới."
                confirmText="Duyệt yêu cầu"
                loading={processing}
                onCancel={() => setApproveTarget(null)}
                onConfirm={confirmApprove}
            />

            <PromptModal
                open={Boolean(rejectTarget)}
                title="Từ chối yêu cầu đặt lại mật khẩu"
                label="Lý do từ chối"
                value={rejectReason}
                textarea
                placeholder="Ví dụ: Thông tin chưa đủ để xác minh tài khoản."
                confirmText="Từ chối"
                loading={processing}
                onChange={setRejectReason}
                onCancel={() => setRejectTarget(null)}
                onConfirm={confirmReject}
            />
        </>
    );
}

export default AdminPasswordRequests;
