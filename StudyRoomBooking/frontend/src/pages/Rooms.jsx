import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import { getRooms } from "../services/roomService";

function renderStars(rating) {
    const value = Math.round(Number(rating || 0));

    return "★".repeat(value) + "☆".repeat(5 - value);
}

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

const roomPrefixLabel = {
    TV: "Phòng thư viện",
    LAB: "Phòng thực hành",
    TN: "Phòng thí nghiệm",
    HT: "Hội trường",
    A: "Phòng học khu A",
    B: "Phòng học khu B",
    C: "Phòng học khu C"
};

function normalizeText(value) {
    return String(value || "").trim();
}

function getRoomPrefix(roomName) {
    return normalizeText(roomName).match(/^[A-Za-z]+/)?.[0]?.toUpperCase() || "";
}

function getRoomDisplayName(room) {
    const description = normalizeText(room.description);
    const roomName = normalizeText(room.room_name);

    if (description && description.toLowerCase() !== roomName.toLowerCase()) {
        return description;
    }

    const prefixLabel = roomPrefixLabel[getRoomPrefix(roomName)];
    if (prefixLabel) {
        return prefixLabel;
    }

    return roomTypeLabel[room.room_type] || "Phòng học";
}

function getRoomShortInfo(room) {
    const parts = [];

    if (room.building) {
        parts.push(`Tòa ${room.building}`);
    }

    if (room.floor) {
        parts.push(`tầng ${room.floor}`);
    }

    parts.push(`${room.capacity || 0} chỗ`);

    return parts.join(" · ");
}

function Rooms() {
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        let ignore = false;

        getRooms()
            .then((res) => {
                if (!ignore) {
                    setRooms(res.data || []);
                }
            })
            .catch(() => {
                setRooms([]);
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

    const statusBadge = (status) => {
        if (status === "available") return "bg-success";
        if (status === "maintenance") return "bg-warning text-dark";
        return "bg-danger";
    };

    return (
        <>
            <Navbar />

            <div className="container app-shell">
                <div className="page-heading">
                    <div>
                        <h1>Phòng học</h1>
                        <p>Xem danh sách phòng, ảnh thực tế, thiết bị và đánh giá của sinh viên.</p>
                    </div>
                    <button
                        className="btn btn-outline-primary"
                        onClick={() => navigate("/home")}
                        type="button"
                    >
                        Tìm phòng nâng cao
                    </button>
                </div>

                {loading ? (
                    <div className="alert alert-secondary">Đang tải phòng...</div>
                ) : (
                    <div className="row">
                        {rooms.length === 0 && (
                            <div className="empty-state">
                                Chưa có phòng học.
                            </div>
                        )}

                        {rooms.map((room) => {
                            const displayName = getRoomDisplayName(room);

                            return (
                                <div className="col-md-4 mb-3" key={room.id}>
                                    <div className="card h-100 room-card">
                                        <img
                                            className="room-image"
                                            src={room.image_url || "https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=900&q=80"}
                                            alt={displayName}
                                        />
                                        <div className="card-body d-flex flex-column">
                                            <div className="d-flex justify-content-between gap-2">
                                                <div>
                                                    <div className="room-name">{displayName}</div>
                                                    <div className="room-code">Mã phòng {room.room_name}</div>
                                                </div>
                                                <span className={`badge room-status-chip ${statusBadge(room.status)}`}>
                                                    {roomStatusLabel[room.status] || room.status}
                                                </span>
                                            </div>

                                            <div className="d-flex align-items-center gap-2 mt-2">
                                                <span className="rating-stars">
                                                    {renderStars(room.average_rating)}
                                                </span>
                                                <small className="text-muted">
                                                    {room.average_rating || "Chưa có"} / 5{" "}
                                                    ({room.review_count || 0} đánh giá)
                                                </small>
                                            </div>

                                            <div className="meta-row">
                                                <span className="meta-pill">
                                                    {getRoomShortInfo(room)}
                                                </span>
                                                <span className="meta-pill">
                                                    {roomTypeLabel[room.room_type] || room.room_type || "Phòng học"}
                                                </span>
                                            </div>

                                            <p className="small text-muted">
                                                <strong>Thiết bị:</strong>{" "}
                                                {room.equipment || "Chưa cập nhật"}
                                            </p>

                                            <button
                                                className="btn btn-primary mt-auto"
                                                disabled={room.status !== "available"}
                                                onClick={() => navigate(`/booking/${room.id}`)}
                                                type="button"
                                            >
                                                Xem chi tiết và đặt phòng
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
            <Footer />
        </>
    );
}

export default Rooms;
