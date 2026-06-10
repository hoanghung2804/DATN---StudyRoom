function PromptModal({
    open,
    title,
    label,
    value,
    type = "text",
    textarea = false,
    placeholder,
    helpText,
    confirmText = "Lưu",
    cancelText = "Hủy",
    loading = false,
    onChange,
    onCancel,
    onConfirm
}) {
    if (!open) return null;

    const inputProps = {
        className: "form-control",
        value,
        placeholder,
        onChange: (event) => onChange(event.target.value),
        autoFocus: true
    };

    return (
        <div className="app-modal-backdrop">
            <div className="app-confirm-modal" role="dialog" aria-modal="true">
                <h4>{title}</h4>
                {label && <label className="form-label fw-bold mt-2">{label}</label>}
                {textarea ? (
                    <textarea {...inputProps} rows="4" />
                ) : (
                    <input {...inputProps} type={type} />
                )}
                {helpText && <div className="form-text text-start">{helpText}</div>}
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
                        className="btn btn-primary"
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

export default PromptModal;
