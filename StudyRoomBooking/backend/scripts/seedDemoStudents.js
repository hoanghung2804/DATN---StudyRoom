const path = require("path");
const bcrypt = require("bcrypt");
const mysql = require("mysql2/promise");

require("dotenv").config({
    path: path.join(__dirname, "..", ".env")
});

const dbConfig = {
    host: "localhost",
    user: "root",
    password: "hung2000",
    database: "study_room_booking",
    port: 3306,
    charset: "utf8mb4"
};

const students = [
    ["Nguyễn Minh Anh", "sv001.studyroom@gmail.com"],
    ["Trần Thị Bảo Ngọc", "sv002.studyroom@gmail.com"],
    ["Lê Hoàng Phúc", "sv003.studyroom@gmail.com"],
    ["Phạm Gia Hân", "sv004.studyroom@gmail.com"],
    ["Huỳnh Quốc Bảo", "sv005.studyroom@gmail.com"],
    ["Võ Thảo Vy", "sv006.studyroom@gmail.com"],
    ["Đặng Tuấn Kiệt", "sv007.studyroom@gmail.com"],
    ["Bùi Khánh Linh", "sv008.studyroom@gmail.com"],
    ["Đỗ Nhật Nam", "sv009.studyroom@gmail.com"],
    ["Ngô Phương Thảo", "sv010.studyroom@gmail.com"],
    ["Hồ Đức Anh", "sv011.studyroom@gmail.com"],
    ["Mai Thanh Trúc", "sv012.studyroom@gmail.com"],
    ["Cao Minh Quân", "sv013.studyroom@gmail.com"],
    ["Lâm Ngọc Mai", "sv014.studyroom@gmail.com"],
    ["Dương Hải Đăng", "sv015.studyroom@gmail.com"],
    ["Tạ Hồng Nhung", "sv016.studyroom@gmail.com"],
    ["Phan Nhật Minh", "sv017.studyroom@gmail.com"],
    ["Vũ Mỹ Duyên", "sv018.studyroom@gmail.com"],
    ["Châu Thành Đạt", "sv019.studyroom@gmail.com"],
    ["Đinh Yến Nhi", "sv020.studyroom@gmail.com"]
];

const requiredRooms = [
    ["A101", 20, "Phòng học tầng 1", "available", "A", 1, "classroom", "Máy chiếu, Bảng trắng"],
    ["A102", 15, "Phòng học tầng 1", "available", "A", 1, "classroom", "Máy chiếu, Bảng trắng"],
    ["A103", 25, "Phòng học tầng 1", "available", "A", 1, "classroom", "Máy chiếu, Bảng trắng"],
    ["B201", 30, "Phòng học tầng 2", "available", "B", 2, "classroom", "Máy chiếu, Điều hòa"],
    ["B202", 30, "Phòng học tầng 2", "available", "B", 2, "classroom", "Máy chiếu, Điều hòa"],
    ["B204", 40, "Phòng học tầng 2", "available", "B", 2, "classroom", "Máy chiếu, Điều hòa, Micro"],
    ["C301", 50, "Phòng học tầng 3", "available", "C", 3, "seminar", "Máy chiếu, Điều hòa, Micro"],
    ["C302", 45, "Phòng học tầng 3", "available", "C", 3, "seminar", "Máy chiếu, Điều hòa, Micro"],
    ["C303", 40, "Phòng lab tầng 3", "available", "C", 3, "lab", "Máy tính, Máy chiếu, Điều hòa"],
    ["D401", 80, "Phòng hội thảo", "available", "D", 4, "seminar", "Màn hình LED, Âm thanh, Micro"]
];

const bookings = [
    ["sv001.studyroom@gmail.com", "A101", "2026-06-03", "08:00:00", "10:00:00", "Học nhóm môn Cơ sở dữ liệu", 5, "approved", null, 1, "A1B2C3", "2026-06-03 08:04:00"],
    ["sv002.studyroom@gmail.com", "A102", "2026-06-03", "10:30:00", "12:00:00", "Ôn tập kiểm tra giữa kỳ", 4, "approved", null, 1, "D4E5F6", "2026-06-03 10:36:00"],
    ["sv003.studyroom@gmail.com", "B201", "2026-06-04", "13:00:00", "15:00:00", "Thảo luận bài tập lớn", 8, "approved", null, 1, "G7H8I9", "2026-06-04 13:02:00"],
    ["sv004.studyroom@gmail.com", "B202", "2026-06-04", "15:30:00", "17:00:00", "Tập thuyết trình nhóm", 6, "approved", null, 1, "J1K2L3", "2026-06-04 15:37:00"],
    ["sv005.studyroom@gmail.com", "C301", "2026-06-05", "08:30:00", "10:30:00", "Sinh hoạt câu lạc bộ học thuật", 18, "approved", null, 1, "M4N5O6", "2026-06-05 08:35:00"],
    ["sv006.studyroom@gmail.com", "C302", "2026-06-05", "14:00:00", "16:00:00", "Luyện đề thi cuối kỳ", 10, "approved", null, 1, "P7Q8R9", "2026-06-05 14:03:00"],
    ["sv007.studyroom@gmail.com", "C303", "2026-06-06", "09:00:00", "11:00:00", "Thực hành lập trình", 12, "approved", null, 1, "S1T2U3", "2026-06-06 09:06:00"],
    ["sv008.studyroom@gmail.com", "D401", "2026-06-06", "13:30:00", "16:00:00", "Tổ chức seminar sinh viên", 35, "approved", null, 1, "V4W5X6", "2026-06-06 13:40:00"],
    ["sv009.studyroom@gmail.com", "A103", "2026-06-07", "07:30:00", "09:00:00", "Tự học buổi sáng", 2, "approved", null, 0, "Y7Z8A9", null],
    ["sv010.studyroom@gmail.com", "B204", "2026-06-07", "09:30:00", "11:30:00", "Học nhóm môn Mạng máy tính", 7, "approved", null, 0, "B1C2D3", null],
    ["sv011.studyroom@gmail.com", "A101", "2026-06-09", "08:00:00", "10:00:00", "Chuẩn bị báo cáo đồ án", 5, "approved", null, 0, "E4F5G6", null],
    ["sv012.studyroom@gmail.com", "B201", "2026-06-09", "13:00:00", "15:00:00", "Học nhóm môn Java", 6, "pending", null, 0, null, null],
    ["sv013.studyroom@gmail.com", "C301", "2026-06-10", "09:00:00", "11:00:00", "Luyện thuyết trình tiếng Anh", 10, "pending", null, 0, null, null],
    ["sv014.studyroom@gmail.com", "C302", "2026-06-10", "14:00:00", "16:00:00", "Ôn tập môn Trí tuệ nhân tạo", 9, "rejected", "Phòng được ưu tiên cho lịch hội thảo của khoa", 0, null, null],
    ["sv015.studyroom@gmail.com", "D401", "2026-06-11", "08:00:00", "10:00:00", "Tập dượt chương trình câu lạc bộ", 30, "cancelled", null, 0, null, null],
    ["sv016.studyroom@gmail.com", "A102", "2026-06-11", "10:30:00", "12:00:00", "Làm bài tập nhóm", 4, "approved", null, 0, "H7I8J9", null],
    ["sv017.studyroom@gmail.com", "B202", "2026-06-12", "13:00:00", "15:00:00", "Họp nhóm nghiên cứu khoa học", 8, "pending", null, 0, null, null],
    ["sv018.studyroom@gmail.com", "C303", "2026-06-12", "15:30:00", "17:30:00", "Thực hành dự án phần mềm", 14, "approved", null, 0, "K1L2M3", null],
    ["sv019.studyroom@gmail.com", "A103", "2026-06-13", "08:30:00", "10:30:00", "Ôn tập môn Hệ điều hành", 5, "rejected", "Mục đích sử dụng chưa rõ ràng", 0, null, null],
    ["sv020.studyroom@gmail.com", "B204", "2026-06-13", "14:00:00", "16:00:00", "Học nhóm môn Kiểm thử phần mềm", 7, "cancelled", null, 0, null, null],
    ["sv001.studyroom@gmail.com", "C301", "2026-06-14", "08:00:00", "10:00:00", "Chuẩn bị bảo vệ đề tài", 10, "approved", null, 0, "N4O5P6", null],
    ["sv002.studyroom@gmail.com", "D401", "2026-06-15", "09:00:00", "11:00:00", "Workshop kỹ năng học tập", 40, "pending", null, 0, null, null],
    ["sv003.studyroom@gmail.com", "A101", "2026-06-15", "13:00:00", "15:00:00", "Tự học có hướng dẫn", 3, "approved", null, 0, "Q7R8S9", null],
    ["sv004.studyroom@gmail.com", "B201", "2026-06-16", "15:00:00", "17:00:00", "Họp nhóm môn Phân tích thiết kế", 6, "pending", null, 0, null, null]
];

const reviews = [
    ["sv001.studyroom@gmail.com", "A101", 5, "Phòng sạch, máy chiếu rõ và bàn ghế dễ sắp xếp."],
    ["sv002.studyroom@gmail.com", "A102", 4, "Phòng yên tĩnh, phù hợp học nhóm nhỏ."],
    ["sv003.studyroom@gmail.com", "B201", 5, "Điều hòa tốt, ánh sáng ổn, rất phù hợp thảo luận."],
    ["sv004.studyroom@gmail.com", "B202", 4, "Không gian vừa đủ, nên bổ sung thêm ổ cắm."],
    ["sv005.studyroom@gmail.com", "C301", 5, "Phòng rộng, micro và máy chiếu hoạt động tốt."],
    ["sv006.studyroom@gmail.com", "C302", 3, "Phòng ổn nhưng hơi ồn vào buổi chiều."],
    ["sv007.studyroom@gmail.com", "C303", 4, "Máy tính chạy ổn, phù hợp thực hành lập trình."],
    ["sv008.studyroom@gmail.com", "D401", 5, "Rất phù hợp seminar, âm thanh tốt."]
];

const notifications = [
    ["sv001.studyroom@gmail.com", "Lịch đặt phòng được duyệt", "Lịch phòng A101 của bạn đã được duyệt và đã check-in thành công.", 1],
    ["sv002.studyroom@gmail.com", "Lịch đặt phòng được duyệt", "Lịch phòng A102 của bạn đã được duyệt.", 1],
    ["sv009.studyroom@gmail.com", "Bạn đã vắng mặt", "Bạn chưa check-in lịch phòng A103 đúng thời gian sử dụng.", 0],
    ["sv010.studyroom@gmail.com", "Bạn đã vắng mặt", "Bạn chưa check-in lịch phòng B204 đúng thời gian sử dụng.", 0],
    ["sv012.studyroom@gmail.com", "Yêu cầu đang chờ duyệt", "Yêu cầu đặt phòng B201 của bạn đang chờ quản trị viên duyệt.", 0],
    ["sv014.studyroom@gmail.com", "Yêu cầu bị từ chối", "Yêu cầu đặt phòng C302 bị từ chối do phòng được ưu tiên cho lịch hội thảo.", 1],
    ["sv015.studyroom@gmail.com", "Bạn đã hủy lịch", "Lịch phòng D401 đã được hủy theo yêu cầu.", 1],
    ["sv018.studyroom@gmail.com", "Lịch đặt phòng được duyệt", "Lịch phòng C303 của bạn đã được duyệt. Vui lòng check-in đúng giờ.", 0]
];

async function main() {
    const connection = await mysql.createConnection(dbConfig);
    const passwordHash = await bcrypt.hash("123456", 10);
    const demoEmails = students.map((student) => student[1]);

    try {
        await connection.beginTransaction();
        await connection.query("SET NAMES utf8mb4");

        for (const room of requiredRooms) {
            const [roomName, capacity, description, status, building, floor, roomType, equipment] = room;
            const [[existingRoom]] = await connection.query(
                "SELECT id FROM rooms WHERE room_name = ? LIMIT 1",
                [roomName]
            );

            if (!existingRoom) {
                await connection.query(
                    `
                        INSERT INTO rooms
                            (room_name, capacity, description, status, building, floor, room_type, equipment)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    `,
                    [roomName, capacity, description, status, building, floor, roomType, equipment]
                );
            }
        }

        const [oldUsers] = await connection.query(
            "SELECT id FROM users WHERE email IN (?)",
            [demoEmails]
        );
        const oldUserIds = oldUsers.map((user) => user.id);

        if (oldUserIds.length > 0) {
            await connection.query("DELETE FROM room_reviews WHERE user_id IN (?)", [oldUserIds]);
            await connection.query("DELETE FROM notifications WHERE user_id IN (?)", [oldUserIds]);
            await connection.query("UPDATE bookings SET reviewed_by = NULL WHERE reviewed_by IN (?)", [oldUserIds]);
            await connection.query("DELETE FROM bookings WHERE user_id IN (?)", [oldUserIds]);
            await connection.query("DELETE FROM users WHERE id IN (?)", [oldUserIds]);
        }

        for (const [fullname, email] of students) {
            await connection.query(
                "INSERT INTO users (fullname, email, password, role) VALUES (?, ?, ?, 'student')",
                [fullname, email, passwordHash]
            );
        }

        const [userRows] = await connection.query(
            "SELECT id, email FROM users WHERE email IN (?)",
            [demoEmails]
        );
        const usersByEmail = Object.fromEntries(userRows.map((user) => [user.email, user.id]));

        const [roomRows] = await connection.query("SELECT id, room_name FROM rooms");
        const roomsByName = Object.fromEntries(roomRows.map((room) => [room.room_name, room.id]));

        const [[admin]] = await connection.query(
            "SELECT id FROM users WHERE role = 'admin' ORDER BY id ASC LIMIT 1"
        );
        const adminId = admin?.id || null;

        for (const booking of bookings) {
            const [
                email,
                roomName,
                bookingDate,
                startTime,
                endTime,
                purpose,
                participants,
                status,
                rejectionReason,
                checkedIn,
                checkinCode,
                checkedInAt
            ] = booking;

            await connection.query(
                `
                    INSERT INTO bookings
                    (
                        user_id,
                        room_id,
                        booking_date,
                        start_time,
                        end_time,
                        purpose,
                        participants,
                        status,
                        rejection_reason,
                        reviewed_by,
                        reviewed_at,
                        checkin_code,
                        checked_in_at,
                        no_show
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `,
                [
                    usersByEmail[email],
                    roomsByName[roomName],
                    bookingDate,
                    startTime,
                    endTime,
                    purpose,
                    participants,
                    status,
                    rejectionReason,
                    ["approved", "rejected"].includes(status) ? adminId : null,
                    ["approved", "rejected"].includes(status) ? `${bookingDate} 07:45:00` : null,
                    checkinCode,
                    checkedInAt,
                    status === "approved" && !checkedIn && bookingDate < "2026-06-08" ? 1 : 0
                ]
            );
        }

        for (const [email, roomName, rating, comment] of reviews) {
            await connection.query(
                `
                    INSERT INTO room_reviews (room_id, user_id, rating, comment)
                    VALUES (?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE
                        rating = VALUES(rating),
                        comment = VALUES(comment)
                `,
                [roomsByName[roomName], usersByEmail[email], rating, comment]
            );
        }

        for (const [email, title, message, isRead] of notifications) {
            await connection.query(
                "INSERT INTO notifications (user_id, title, message, is_read) VALUES (?, ?, ?, ?)",
                [usersByEmail[email], title, message, isRead]
            );
        }

        await connection.commit();
        console.log(`Seeded ${students.length} demo students, ${bookings.length} bookings, ${reviews.length} reviews.`);
    } catch (error) {
        await connection.rollback();
        console.error(error);
        process.exitCode = 1;
    } finally {
        await connection.end();
    }
}

main();
