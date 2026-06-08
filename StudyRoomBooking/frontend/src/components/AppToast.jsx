function AppToast({ message }) {
    if (!message) return null;

    return (
        <div className={`app-status-toast ${message.type || "success"}`} role="status">
            <strong>{message.type === "danger" ? "Có lỗi" : "Thành công"}</strong>
            <span>{message.text}</span>
        </div>
    );
}

export default AppToast;
