import { useEffect, useState } from "react";
import AppToast from "../../components/AppToast";
import ConfirmModal from "../../components/ConfirmModal";
import Navbar from "../../components/Navbar";
import {
    createMaintenanceSchedule,
    deleteMaintenanceSchedule,
    getMaintenanceSchedules,
    updateMaintenanceStatus
} from "../../services/maintenanceService";
import { getRooms } from "../../services/roomService";

const emptyForm = {
    room_id: "",
    maintenance_date: "",
    start_time: "",
    end_time: "",
    reason: ""
};

const maintenanceStatusLabel = {
    scheduled: "Đã lên lịch",
    completed: "Hoàn tất",
    cancelled: "Đã hủy"
};

function AdminMaintenance() {
    const [rooms, setRooms] = useState([]);
    const [schedules, setSchedules] = useState([]);
    const [form, setForm] = useState(emptyForm);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState("");
    const [toast, setToast] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);

    const showToast = (type, text) => {
        setToast({ type, text });
        window.setTimeout(() => setToast(null), 3400);
    };

    async function loadData() {
        try {
            setLoading(true);
            setError("");
            const [roomRes, maintenanceRes] = await Promise.all([
                getRooms(),
                getMaintenanceSchedules()
            ]);
            setRooms(roomRes.data || []);
            setSchedules(maintenanceRes.data || []);
        } catch (err) {
            setError(err.response?.data?.message || "Không tải được dữ liệu bảo trì");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        let ignore = false;

        const fetchData = async () => {
            try {
                setLoading(true);
                setError("");
                const [roomRes, maintenanceRes] = await Promise.all([
                    getRooms(),
                    getMaintenanceSchedules()
                ]);

                if (!ignore) {
                    setRooms(roomRes.data || []);
                    setSchedules(maintenanceRes.data || []);
                }
            } catch (err) {
                if (!ignore) {
                    setError(err.response?.data?.message || "Không tải được dữ liệu bảo trì");
                }
            } finally {
                if (!ignore) {
                    setLoading(false);
                }
            }
        };

        fetchData();

        return () => {
            ignore = true;
        };
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((current) => ({
            ...current,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setProcessing(true);

        try {
            await createMaintenanceSchedule(form);
            setForm(emptyForm);
            showToast("success", "Đã tạo lịch bảo trì");
            await loadData();
        } catch (err) {
            showToast("danger", err.response?.data?.message || "Tạo lịch bảo trì thất bại");
        } finally {
            setProcessing(false);
        }
    };

    const handleStatus = async (id, status) => {
        setProcessing(true);

        try {
            await updateMaintenanceStatus(id, status);
            showToast("success", "Đã cập nhật trạng thái bảo trì");
            await loadData();
        } catch (err) {
            showToast("danger", err.response?.data?.message || "Cập nhật bảo trì thất bại");
        } finally {
            setProcessing(false);
        }
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        setProcessing(true);

        try {
            await deleteMaintenanceSchedule(deleteTarget.id);
            setDeleteTarget(null);
            showToast("success", "Đã xóa lịch bảo trì");
            await loadData();
        } catch (err) {
            showToast("danger", err.response?.data?.message || "Xóa lịch bảo trì thất bại");
        } finally {
            setProcessing(false);
        }
    };

    const badgeClass = (status) => {
        if (status === "scheduled") return "bg-warning text-dark";
        if (status === "completed") return "bg-success";
        return "bg-secondary";
    };

    return (
        <>
            <Navbar />
            <AppToast message={toast} />

            <div className="container app-shell">
                <div className="page-heading">
                    <div>
                        <h1>Quản lý bảo trì phòng</h1>
                        <p>Tạo lịch bảo trì và ngăn người dùng đặt trùng khung giờ.</p>
                    </div>
                    <button
                        className="btn btn-outline-primary"
                        onClick={loadData}
                        disabled={loading}
                        type="button"
                    >
                        Tải lại
                    </button>
                </div>

                {error && <div className="alert alert-danger">{error}</div>}

                <form className="card filter-card mb-4" onSubmit={handleSubmit}>
                    <div className="card-body">
                        <h5 className="card-title">Tạo lịch bảo trì</h5>
                        <div className="row g-3">
                            <div className="col-md-3">
                                <label className="form-label">Phòng</label>
                                <select
                                    className="form-select"
                                    name="room_id"
                                    value={form.room_id}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">Chọn phòng</option>
                                    {rooms.map((room) => (
                                        <option value={room.id} key={room.id}>
                                            {room.room_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="col-md-3">
                                <label className="form-label">Ngày bảo trì</label>
                                <input
                                    className="form-control"
                                    name="maintenance_date"
                                    type="date"
                                    value={form.maintenance_date}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="col-md-2">
                                <label className="form-label">Từ giờ</label>
                                <input
                                    className="form-control"
                                    name="start_time"
                                    type="time"
                                    value={form.start_time}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="col-md-2">
                                <label className="form-label">Đến giờ</label>
                                <input
                                    className="form-control"
                                    name="end_time"
                                    type="time"
                                    value={form.end_time}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="col-md-12">
                                <label className="form-label">Lý do</label>
                                <input
                                    className="form-control"
                                    name="reason"
                                    value={form.reason}
                                    onChange={handleChange}
                                    placeholder="Bảo trì máy chiếu, sửa điều hòa..."
                                    required
                                />
                            </div>
                        </div>

                        <button className="btn btn-primary mt-3" disabled={processing}>
                            {processing ? "Đang xử lý..." : "Tạo lịch bảo trì"}
                        </button>
                    </div>
                </form>

                {loading ? (
                    <div className="alert alert-secondary">Đang tải lịch bảo trì...</div>
                ) : (
                    <div className="table-responsive">
                        <table className="table table-bordered table-hover align-middle">
                            <thead className="table-light">
                                <tr>
                                    <th>Phòng</th>
                                    <th>Ngày</th>
                                    <th>Giờ</th>
                                    <th>Lý do</th>
                                    <th>Người tạo</th>
                                    <th>Trạng thái</th>
                                    <th>Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {schedules.length === 0 && (
                                    <tr>
                                        <td colSpan="7" className="text-center">
                                            Chưa có lịch bảo trì.
                                        </td>
                                    </tr>
                                )}

                                {schedules.map((item) => (
                                    <tr key={item.id}>
                                        <td>{item.room_name}</td>
                                        <td>{item.maintenance_date?.slice(0, 10)}</td>
                                        <td>
                                            {item.start_time} - {item.end_time}
                                        </td>
                                        <td>{item.reason}</td>
                                        <td>{item.created_by_name}</td>
                                        <td>
                                            <span className={`badge ${badgeClass(item.status)}`}>
                                                {maintenanceStatusLabel[item.status] || item.status}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="d-flex gap-2">
                                                {item.status === "scheduled" && (
                                                    <>
                                                        <button
                                                            className="btn btn-success btn-sm"
                                                            onClick={() => handleStatus(item.id, "completed")}
                                                            type="button"
                                                        >
                                                            Hoàn tất
                                                        </button>
                                                        <button
                                                            className="btn btn-secondary btn-sm"
                                                            onClick={() => handleStatus(item.id, "cancelled")}
                                                            type="button"
                                                        >
                                                            Hủy
                                                        </button>
                                                    </>
                                                )}
                                                <button
                                                    className="btn btn-danger btn-sm"
                                                    onClick={() => setDeleteTarget(item)}
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

            <ConfirmModal
                open={Boolean(deleteTarget)}
                title="Xóa lịch bảo trì?"
                message={`Bạn có muốn xóa lịch bảo trì phòng ${deleteTarget?.room_name || ""} không?`}
                detail="Thao tác này chỉ xóa lịch bảo trì, không xóa phòng học."
                confirmText="Xóa"
                danger
                loading={processing}
                onCancel={() => setDeleteTarget(null)}
                onConfirm={confirmDelete}
            />
        </>
    );
}

export default AdminMaintenance;
