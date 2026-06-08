import { useEffect, useRef, useState } from "react";
import Navbar from "../../components/Navbar";
import {
    createRoom,
    deleteRoom,
    getRooms,
    updateRoom
} from "../../services/roomService";
import { readImageAsDataUrl } from "../../utils/imageFile";

const emptyForm = {
    room_name: "",
    capacity: "",
    description: "",
    status: "available",
    building: "",
    floor: "",
    room_type: "classroom",
    equipment: "",
    image_url: ""
};

const roomStatusLabel = {
    available: "Sẵn sàng",
    occupied: "Đang sử dụng",
    maintenance: "Bảo trì"
};

const roomTypeLabel = {
    classroom: "Phòng học",
    meeting: "Phòng họp",
    lab: "Phòng lab",
    seminar: "Phòng seminar",
    library: "Phòng thư viện"
};

function getStatusClass(status) {
    if (status === "available") return "available";
    if (status === "occupied") return "occupied";
    if (status === "maintenance") return "maintenance";
    return "neutral";
}

// NOTE: Chuc nang chinh - Admin quan ly phong, anh phong, trang thai va thong tin thiet bi.
function AdminRooms() {
    const [rooms, setRooms] = useState([]);
    const [form, setForm] = useState(emptyForm);
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [error, setError] = useState("");
    const [statusMessage, setStatusMessage] = useState(null);
    const statusTimer = useRef(null);

    const showStatus = (type, text) => {
        setStatusMessage({ type, text });
        window.clearTimeout(statusTimer.current);
        statusTimer.current = window.setTimeout(() => {
            setStatusMessage(null);
        }, 3600);
    };

    useEffect(() => {
        let ignore = false;

        const fetchRooms = async () => {
            setLoading(true);
            setError("");

            try {
                const res = await getRooms();
                if (!ignore) {
                    setRooms(res.data || []);
                }
            } catch (err) {
                if (!ignore) {
                    setError(err.response?.data?.message || "Không tải được danh sách phòng");
                }
            } finally {
                if (!ignore) {
                    setLoading(false);
                }
            }
        };

        fetchRooms();

        return () => {
            ignore = true;
            window.clearTimeout(statusTimer.current);
        };
    }, []);

    async function loadRooms() {
        try {
            setLoading(true);
            setError("");
            const res = await getRooms();
            setRooms(res.data || []);
        } catch (err) {
            setError(err.response?.data?.message || "Không tải được danh sách phòng");
        } finally {
            setLoading(false);
        }
    }

    const handleChange = (e) => {
        const { name, value } = e.target;

        setForm((current) => ({
            ...current,
            [name]: value
        }));
    };

    // NOTE: Chon anh tu may va chuyen thanh Data URL de luu/hien thi cung phong.
    const handleRoomImageChange = async (e) => {
        try {
            const imageData = await readImageAsDataUrl(e.target.files?.[0]);

            setForm((current) => ({
                ...current,
                image_url: imageData
            }));
            showStatus("success", "Đã chọn ảnh phòng từ máy");
        } catch (err) {
            showStatus("danger", err.message || "Không thể đọc ảnh phòng");
        } finally {
            e.target.value = "";
        }
    };

    const resetForm = () => {
        setForm(emptyForm);
        setEditingId(null);
    };

    // NOTE: Tao moi hoac cap nhat phong, sau do hien thanh trang thai trong web.
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            const payload = {
                ...form,
                capacity: Number(form.capacity),
                floor: form.floor ? Number(form.floor) : null
            };

            if (editingId) {
                await updateRoom(editingId, payload);
                showStatus("success", "Đã cập nhật thông tin phòng thành công");
            } else {
                await createRoom(payload);
                showStatus("success", "Đã tạo phòng học mới thành công");
            }

            resetForm();
            await loadRooms();
        } catch (err) {
            showStatus("danger", err.response?.data?.message || "Lưu thông tin phòng thất bại");
        } finally {
            setSaving(false);
        }
    };

    const startEdit = (room) => {
        setEditingId(room.id);
        setForm({
            room_name: room.room_name,
            capacity: room.capacity,
            description: room.description || "",
            status: room.status || "available",
            building: room.building || "",
            floor: room.floor || "",
            room_type: room.room_type || "classroom",
            equipment: room.equipment || "",
            image_url: room.image_url || ""
        });
        showStatus("success", `Đang chỉnh sửa phòng ${room.room_name}`);
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    };

    // NOTE: Xoa phong bang hop thoai trong web thay cho alert cua trinh duyet.
    const confirmDeleteRoom = async () => {
        if (!deleteTarget) return;
        setDeleting(true);

        try {
            await deleteRoom(deleteTarget.id);
            setDeleteTarget(null);
            showStatus("success", `Đã xóa phòng ${deleteTarget.room_name}`);
            await loadRooms();
        } catch (err) {
            showStatus("danger", err.response?.data?.message || "Xóa phòng thất bại");
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

            <div className="container app-shell">
                <div className="page-heading">
                    <div>
                        <h1>Quản lý phòng học</h1>
                        <p>Cập nhật sức chứa, thiết bị, tòa nhà, ảnh thực tế và trạng thái phòng.</p>
                    </div>
                    <button
                        className="btn btn-outline-primary"
                        onClick={loadRooms}
                        disabled={loading}
                        type="button"
                    >
                        Tải lại
                    </button>
                </div>

                {error && (
                    <div className="alert alert-danger">
                        {error}
                    </div>
                )}

                <form className="card filter-card mb-4" onSubmit={handleSubmit}>
                    <div className="card-body">
                        <h5 className="card-title">
                            {editingId ? "Cập nhật phòng" : "Thêm phòng mới"}
                        </h5>

                        <div className="row g-3">
                            <div className="col-md-3">
                                <label className="form-label">Tên phòng</label>
                                <input
                                    className="form-control"
                                    name="room_name"
                                    value={form.room_name}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="col-md-2">
                                <label className="form-label">Sức chứa</label>
                                <input
                                    className="form-control"
                                    min="1"
                                    name="capacity"
                                    type="number"
                                    value={form.capacity}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="col-md-3">
                                <label className="form-label">Trạng thái</label>
                                <select
                                    className="form-select"
                                    name="status"
                                    value={form.status}
                                    onChange={handleChange}
                                >
                                    <option value="available">Sẵn sàng</option>
                                    <option value="occupied">Đang sử dụng</option>
                                    <option value="maintenance">Bảo trì</option>
                                </select>
                            </div>

                            <div className="col-md-2">
                                <label className="form-label">Tòa nhà</label>
                                <input
                                    className="form-control"
                                    name="building"
                                    value={form.building}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="col-md-2">
                                <label className="form-label">Tầng</label>
                                <input
                                    className="form-control"
                                    name="floor"
                                    type="number"
                                    value={form.floor}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="col-md-3">
                                <label className="form-label">Loại phòng</label>
                                <select
                                    className="form-select"
                                    name="room_type"
                                    value={form.room_type}
                                    onChange={handleChange}
                                >
                                    <option value="classroom">Phòng học</option>
                                    <option value="meeting">Phòng họp</option>
                                    <option value="lab">Phòng lab</option>
                                    <option value="seminar">Phòng seminar</option>
                                    <option value="library">Phòng thư viện</option>
                                </select>
                            </div>

                            <div className="col-md-6">
                                <label className="form-label">Thiết bị</label>
                                <input
                                    className="form-control"
                                    name="equipment"
                                    value={form.equipment}
                                    onChange={handleChange}
                                    placeholder="Máy chiếu, điều hòa, micro"
                                />
                            </div>

                            <div className="col-md-6">
                                <label className="form-label">Ảnh phòng</label>
                                <div className="input-group">
                                    <input
                                        className="form-control"
                                        name="image_url"
                                        value={
                                            form.image_url?.startsWith("data:")
                                                ? "Ảnh đã được chọn từ máy"
                                                : form.image_url
                                        }
                                        onChange={handleChange}
                                        readOnly={form.image_url?.startsWith("data:")}
                                        placeholder="Dán URL ảnh hoặc chọn ảnh từ máy"
                                    />
                                    <label className="btn btn-outline-primary mb-0">
                                        Chọn ảnh từ máy
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="d-none"
                                            onChange={handleRoomImageChange}
                                        />
                                    </label>
                                    {form.image_url && (
                                        <button
                                            className="btn btn-outline-secondary"
                                            type="button"
                                            onClick={() =>
                                                setForm((current) => ({
                                                    ...current,
                                                    image_url: ""
                                                }))
                                            }
                                        >
                                            Xóa ảnh
                                        </button>
                                    )}
                                </div>
                                {form.image_url && (
                                    <img
                                        className="room-image mt-2 rounded"
                                        src={form.image_url}
                                        alt="Xem trước ảnh phòng"
                                    />
                                )}
                            </div>

                            <div className="col-md-6">
                                <label className="form-label">Mô tả</label>
                                <input
                                    className="form-control"
                                    name="description"
                                    value={form.description}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="d-flex gap-2 mt-3">
                            <button className="btn btn-primary" disabled={saving} type="submit">
                                {saving ? "Đang lưu..." : editingId ? "Cập nhật" : "Thêm phòng"}
                            </button>
                            {editingId && (
                                <button
                                    className="btn btn-outline-secondary"
                                    onClick={resetForm}
                                    type="button"
                                >
                                    Hủy sửa
                                </button>
                            )}
                        </div>
                    </div>
                </form>

                {loading ? (
                    <div className="alert alert-secondary">
                        Đang tải danh sách...
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table className="table table-bordered table-hover align-middle">
                            <thead className="table-light">
                                <tr>
                                    <th>Tên phòng</th>
                                    <th>Sức chứa</th>
                                    <th>Mô tả</th>
                                    <th>Tòa/tầng</th>
                                    <th>Loại</th>
                                    <th>Thiết bị</th>
                                    <th>Trạng thái</th>
                                    <th>Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rooms.length === 0 && (
                                    <tr>
                                        <td colSpan="8" className="text-center">
                                            Chưa có phòng học.
                                        </td>
                                    </tr>
                                )}

                                {rooms.map((room) => (
                                    <tr key={room.id}>
                                        <td className="fw-semibold">{room.room_name}</td>
                                        <td>{room.capacity}</td>
                                        <td>{room.description || "-"}</td>
                                        <td>
                                            {room.building || "-"}
                                            {room.floor ? ` / ${room.floor}` : ""}
                                        </td>
                                        <td>{roomTypeLabel[room.room_type] || room.room_type || "-"}</td>
                                        <td>{room.equipment || "-"}</td>
                                        <td>
                                            <span className={`room-status-badge ${getStatusClass(room.status)}`}>
                                                {roomStatusLabel[room.status] || room.status}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="room-actions">
                                                <button
                                                    className="btn btn-warning btn-sm"
                                                    onClick={() => startEdit(room)}
                                                    type="button"
                                                >
                                                    Sửa
                                                </button>
                                                <button
                                                    className="btn btn-danger btn-sm"
                                                    onClick={() => setDeleteTarget(room)}
                                                    type="button"
                                                >
                                                    Xóa
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {deleteTarget && (
                <div className="app-modal-backdrop">
                    <div className="app-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="delete-room-title">
                        <div className="app-confirm-icon">!</div>
                        <h4 id="delete-room-title">Xóa phòng học?</h4>
                        <p>
                            Bạn có muốn xóa phòng <strong>{deleteTarget.room_name}</strong> không?
                        </p>
                        <p className="text-muted">
                            Chỉ nên xóa phòng khi chắc chắn không còn sử dụng trong hệ thống đặt phòng.
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
                                onClick={confirmDeleteRoom}
                                disabled={deleting}
                            >
                                {deleting ? "Đang xóa..." : "Xóa"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default AdminRooms;
