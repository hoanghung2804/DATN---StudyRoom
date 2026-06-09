import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import StudentSupportChat from "../components/StudentSupportChat";
import { getMyBookings } from "../services/bookingService";
import { getRooms } from "../services/roomService";

const initialFilters = {
    keyword: "",
    bookingDate: "",
    startTime: "",
    endTime: "",
    minCapacity: "",
    roomType: "",
    equipment: "",
    status: "available"
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

const roomPrefixLabel = {
    TV: "Phòng thư viện",
    LAB: "Phòng thực hành",
    TN: "Phòng thí nghiệm",
    HT: "Hội trường",
    A: "Phòng học khu A",
    B: "Phòng học khu B",
    C: "Phòng học khu C"
};

const bookingStatusLabel = {
    approved: "Đã duyệt",
    pending: "Chờ duyệt",
    rejected: "Từ chối",
    cancelled: "Đã hủy"
};

function renderStars(rating) {
    const value = Math.round(Number(rating || 0));
    return "★".repeat(value) + "☆".repeat(5 - value);
}

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

    return roomPrefixLabel[getRoomPrefix(roomName)] ||
        roomTypeLabel[room.room_type] ||
        "Phòng học";
}

function getRoomMeta(room) {
    const parts = [];

    if (room.building) parts.push(`Tòa ${room.building}`);
    if (room.floor) parts.push(`tầng ${room.floor}`);
    parts.push(`${room.capacity || 0} chỗ`);

    return parts.join(" · ");
}

function getCurrentUser() {
    try {
        return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
        return null;
    }
}

// NOTE: Chuc nang chinh - Card goi y phong cho trang chu sinh vien.
function RoomSuggestionCard({ room, onOpen }) {
    const displayName = getRoomDisplayName(room);

    return (
        <article className="student-room-card">
            <img
                src={room.image_url || "https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=900&q=80"}
                alt={displayName}
            />
            <div className="student-room-card-body">
                <div className="student-room-card-top">
                    <div>
                        <h3>{displayName}</h3>
                        <span>Mã phòng {room.room_name}</span>
                    </div>
                    <span className="room-status-chip badge bg-success">
                        {roomStatusLabel[room.status] || room.status}
                    </span>
                </div>

                <div className="student-room-rating">
                    <span className="rating-stars">{renderStars(room.average_rating)}</span>
                    <small>
                        {room.average_rating || "Chưa có"} / 5 · {room.review_count || 0} đánh giá
                    </small>
                </div>

                <div className="meta-row">
                    <span className="meta-pill">{getRoomMeta(room)}</span>
                    <span className="meta-pill">
                        {roomTypeLabel[room.room_type] || room.room_type || "Phòng học"}
                    </span>
                </div>

                <p>
                    <strong>Thiết bị:</strong> {room.equipment || "Chưa cập nhật"}
                </p>

                <button className="btn btn-primary mt-auto" onClick={() => onOpen(room.id)} type="button">
                    Xem và đặt phòng
                </button>
            </div>
        </article>
    );
}

// NOTE: Chuc nang chinh - Trang chu sinh vien gom tim phong, goi y phong va lich gan day.
function StudentHome() {
    const navigate = useNavigate();
    const [rooms, setRooms] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [filters, setFilters] = useState(initialFilters);
    const [loading, setLoading] = useState(true);

    const user = getCurrentUser();
    const isLoggedIn = Boolean(localStorage.getItem("token"));

    async function loadRooms(params = filters) {
        try {
            setLoading(true);
            const cleanParams = Object.fromEntries(
                Object.entries(params).filter(([, value]) => value !== "")
            );
            const res = await getRooms(cleanParams);
            setRooms(res.data || []);
        } catch {
            setRooms([]);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        let ignore = false;
        const requests = isLoggedIn
            ? [getRooms({ status: "available" }), getMyBookings()]
            : [getRooms({ status: "available" })];

        Promise.all(requests)
            .then(([roomRes, bookingRes]) => {
                if (!ignore) {
                    setRooms(roomRes.data || []);
                    setBookings(bookingRes?.data || []);
                }
            })
            .catch(() => {
                setBookings([]);
            })
            .finally(() => {
                if (!ignore) {
                    setLoading(false);
                }
            });

        return () => {
            ignore = true;
        };
    }, [isLoggedIn]);

    const handleFilterChange = (event) => {
        const { name, value } = event.target;
        setFilters((current) => ({
            ...current,
            [name]: value
        }));
    };

    // NOTE: Xu ly tim phong; neu chua dang nhap van cho xem danh sach phong.
    const handleSubmit = (event) => {
        event.preventDefault();
        loadRooms();
    };

    // NOTE: Chi yeu cau dang nhap khi sinh vien bat dau dat phong.
    const openBooking = (roomId) => {
        navigate(isLoggedIn ? `/booking/${roomId}` : "/");
    };

    const availableRooms = rooms.filter((room) => room.status === "available");
    const reviewedRooms = rooms.filter((room) => Number(room.review_count || 0) > 0);
    const pendingBookings = bookings.filter((booking) => booking.status === "pending");
    const approvedBookings = bookings.filter((booking) => booking.status === "approved");
    const upcomingBookings = bookings
        .filter((booking) => ["pending", "approved"].includes(booking.status))
        .slice(0, 3);

    const recommendedRooms = useMemo(() => {
        return availableRooms
            .slice()
            .sort((a, b) => Number(b.average_rating || 0) - Number(a.average_rating || 0))
            .slice(0, 4);
    }, [availableRooms]);

    const roomGroups = [
        {
            label: "Học nhóm",
            description: "Phòng sức chứa tốt, phù hợp trao đổi bài hoặc làm đồ án.",
            rooms: availableRooms.filter((room) => Number(room.capacity || 0) >= 6).slice(0, 3)
        },
        {
            label: "Thư viện",
            description: "Không gian yên tĩnh, phù hợp tự học và đọc tài liệu.",
            rooms: availableRooms.filter((room) =>
                getRoomPrefix(room.room_name) === "TV" ||
                getRoomDisplayName(room).toLowerCase().includes("thư viện")
            ).slice(0, 3)
        },
        {
            label: "Có máy chiếu",
            description: "Phù hợp thuyết trình, seminar hoặc bảo vệ đồ án.",
            rooms: availableRooms.filter((room) =>
                normalizeText(room.equipment).toLowerCase().includes("máy chiếu") ||
                normalizeText(room.equipment).toLowerCase().includes("may chieu")
            ).slice(0, 3)
        }
    ];

    return (
        <>
            <Navbar />

            <div className="container app-shell student-home">
                <section className="student-dashboard-hero">
                    <div className="student-dashboard-copy">
                        <span className="dashboard-eyebrow">Cổng sinh viên</span>
                        {isLoggedIn ? (
                            <h1 className="student-welcome-title">
                                <span>Chào</span>
                                <strong>{user?.fullname || "bạn"}</strong>
                                <span>hôm nay bạn cần phòng nào?</span>
                            </h1>
                        ) : (
                            <h1>Tìm phòng học phù hợp trước khi đăng nhập</h1>
                        )}
                        <p>
                            Tìm nhanh phòng theo thời gian, sức chứa, thiết bị và xem đánh giá thực tế trước khi gửi yêu cầu đặt phòng.
                        </p>
                    </div>

                    <div className="student-dashboard-actions">
                        <button className="btn btn-light" onClick={() => navigate("/rooms")} type="button">
                            Xem tất cả phòng
                        </button>
                        <button
                            className="btn btn-outline-light"
                            onClick={() => navigate(isLoggedIn ? "/my-bookings" : "/")}
                            type="button"
                        >
                            {isLoggedIn ? "Lịch của tôi" : "Đăng nhập"}
                        </button>
                    </div>
                </section>

                <section className="student-search-panel">
                    <div className="student-search-heading">
                        <div>
                            <h2>Tìm phòng nhanh</h2>
                            <p>Nhập nhu cầu của bạn, hệ thống sẽ lọc các phòng phù hợp nhất.</p>
                        </div>
                    </div>

                    <form className="student-search-grid" onSubmit={handleSubmit}>
                        <div className="student-search-field wide">
                            <label>Tên phòng, thiết bị hoặc mô tả</label>
                            <input
                                className="form-control"
                                name="keyword"
                                value={filters.keyword}
                                onChange={handleFilterChange}
                                placeholder="Ví dụ: thư viện, máy chiếu, seminar"
                            />
                        </div>

                        <div className="student-search-field">
                            <label>Ngày sử dụng</label>
                            <input
                                className="form-control"
                                name="bookingDate"
                                type="date"
                                value={filters.bookingDate}
                                onChange={handleFilterChange}
                            />
                        </div>

                        <div className="student-search-field">
                            <label>Bắt đầu</label>
                            <input
                                className="form-control"
                                name="startTime"
                                type="time"
                                value={filters.startTime}
                                onChange={handleFilterChange}
                            />
                        </div>

                        <div className="student-search-field">
                            <label>Kết thúc</label>
                            <input
                                className="form-control"
                                name="endTime"
                                type="time"
                                value={filters.endTime}
                                onChange={handleFilterChange}
                            />
                        </div>

                        <div className="student-search-field">
                            <label>Số người</label>
                            <input
                                className="form-control"
                                name="minCapacity"
                                type="number"
                                min="1"
                                value={filters.minCapacity}
                                onChange={handleFilterChange}
                                placeholder="6"
                            />
                        </div>

                        <div className="student-search-field">
                            <label>Thiết bị</label>
                            <input
                                className="form-control"
                                name="equipment"
                                value={filters.equipment}
                                onChange={handleFilterChange}
                                placeholder="Máy chiếu"
                            />
                        </div>

                        <button className="btn btn-primary student-search-submit" type="submit">
                            Tìm phòng
                        </button>
                    </form>
                </section>

                <section className="student-overview-grid">
                    <div className="student-overview-card primary">
                        <span>Phòng sẵn sàng</span>
                        <strong>{availableRooms.length}</strong>
                        <small>Có thể gửi yêu cầu đặt ngay</small>
                    </div>
                    <div className="student-overview-card success">
                        <span>Phòng có đánh giá</span>
                        <strong>{reviewedRooms.length}</strong>
                        <small>Dựa trên trải nghiệm sinh viên</small>
                    </div>
                    <div className="student-overview-card warning">
                        <span>Lịch chờ duyệt</span>
                        <strong>{pendingBookings.length}</strong>
                        <small>{isLoggedIn ? "Theo dõi trong Lịch của tôi" : "Đăng nhập để xem lịch cá nhân"}</small>
                    </div>
                    <div className="student-overview-card info">
                        <span>Lịch đã duyệt</span>
                        <strong>{approvedBookings.length}</strong>
                        <small>Sẵn sàng check-in khi đến giờ</small>
                    </div>
                </section>

                <div className="student-main-grid">
                    <section className="student-home-section">
                        <div className="section-heading mb-3">
                            <div>
                                <h2>Gợi ý phù hợp</h2>
                                <p>Các phòng nổi bật dựa trên trạng thái và đánh giá.</p>
                            </div>
                            <button className="btn btn-outline-primary" onClick={() => navigate("/rooms")} type="button">
                                Xem tất cả
                            </button>
                        </div>

                        {loading ? (
                            <div className="alert alert-secondary">Đang tải gợi ý phòng...</div>
                        ) : (
                            <div className="student-room-grid">
                                {recommendedRooms.length === 0 && (
                                    <div className="empty-state">Chưa tìm thấy phòng phù hợp. Hãy thử đổi bộ lọc.</div>
                                )}

                                {recommendedRooms.map((room) => (
                                    <RoomSuggestionCard room={room} onOpen={openBooking} key={room.id} />
                                ))}
                            </div>
                        )}
                    </section>

                    <aside className="student-side-panel">
                        <div className="student-side-card">
                            <h2>{isLoggedIn ? "Lịch gần đây" : "Bắt đầu sử dụng"}</h2>
                            <p>
                                {isLoggedIn
                                    ? "Theo dõi các yêu cầu đặt phòng mới nhất của bạn."
                                    : "Bạn có thể xem phòng công khai. Khi đặt phòng, hệ thống sẽ yêu cầu đăng nhập."}
                            </p>

                            {!isLoggedIn ? (
                                <button className="btn btn-primary w-100" onClick={() => navigate("/")} type="button">
                                    Đăng nhập để đặt phòng
                                </button>
                            ) : upcomingBookings.length === 0 ? (
                                <div className="empty-state">Bạn chưa có lịch đặt phòng gần đây.</div>
                            ) : (
                                <div className="student-booking-list">
                                    {upcomingBookings.map((booking) => (
                                        <div className="student-booking-item" key={booking.id}>
                                            <div>
                                                <strong>{booking.room_name}</strong>
                                                <span>{booking.booking_date?.slice(0, 10)} · {booking.start_time} - {booking.end_time}</span>
                                            </div>
                                            <span className="badge bg-secondary">
                                                {bookingStatusLabel[booking.status] || booking.status}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <button
                                className="btn btn-outline-primary w-100 mt-3"
                                onClick={() => navigate(isLoggedIn ? "/my-bookings" : "/")}
                                type="button"
                            >
                                {isLoggedIn ? "Xem lịch của tôi" : "Đăng nhập"}
                            </button>
                        </div>
                    </aside>
                </div>

                <section className="student-home-section">
                    <div className="section-heading mb-3">
                        <div>
                            <h2>Chọn theo nhu cầu</h2>
                            <p>Không cần nhớ mã phòng, chọn nhanh theo mục đích sử dụng.</p>
                        </div>
                    </div>

                    <div className="student-category-grid">
                        {roomGroups.map((group) => (
                            <article className="student-category-card" key={group.label}>
                                <h3>{group.label}</h3>
                                <p>{group.description}</p>
                                {group.rooms.length === 0 ? (
                                    <span className="text-muted">Chưa có phòng phù hợp.</span>
                                ) : (
                                    <div className="student-category-rooms">
                                        {group.rooms.map((room) => (
                                            <button
                                                type="button"
                                                onClick={() => openBooking(room.id)}
                                                key={room.id}
                                            >
                                                <strong>{getRoomDisplayName(room)}</strong>
                                                <span>{room.room_name} · {getRoomMeta(room)}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </article>
                        ))}
                    </div>
                </section>
            </div>
            <StudentSupportChat />
            <Footer />
        </>
    );
}

export default StudentHome;
