function ConfirmModal({
    open,
    title,
    message,
    detail,
    confirmText = "Xác nhận",
    cancelText = "Hủy",
    danger = false,
    loading = false,
    onCancel,
    onConfirm
}) {
    if (!open) return null;

    return (
        <div className="app-modal-backdrop">
            <div className="app-confirm-modal" role="dialog" aria-modal="true">
                <div className="app-confirm-icon">!</div>
                <h4>{title}</h4>
                <p>{message}</p>
                {detail && <p className="text-muted">{detail}</p>}
                <div className="d-flex justify-content-end gap-2 mt-4">
                    <button
                        className="btn btn-outline-secondary"
                        type="button"
                        onClick={onCancel}
                        disabled={loading}
                    >
                        {cancelText}
                    </button>
                    <button
                        className={`btn ${danger ? "btn-danger" : "btn-primary"}`}
                        type="button"
                        onClick={onConfirm}
                        disabled={loading}
                    >
                        {loading ? "Đang xử lý..." : confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ConfirmModal;
