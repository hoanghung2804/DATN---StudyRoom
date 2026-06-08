CREATE DATABASE IF NOT EXISTS study_room_booking
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE study_room_booking;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS room_reviews;
DROP TABLE IF EXISTS maintenance_schedules;
DROP TABLE IF EXISTS password_reset_requests;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS rooms;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fullname VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin','student') DEFAULT 'student',
    avatar_url LONGTEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE rooms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    room_name VARCHAR(50) NOT NULL,
    capacity INT NOT NULL,
    description TEXT,
    status ENUM('available','occupied','maintenance') DEFAULT 'available',
    building VARCHAR(50) DEFAULT NULL,
    floor INT DEFAULT NULL,
    room_type ENUM('classroom','meeting','lab','seminar','library') DEFAULT 'classroom',
    equipment TEXT DEFAULT NULL,
    image_url LONGTEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    room_id INT NOT NULL,
    booking_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    purpose VARCHAR(255) DEFAULT NULL,
    participants INT DEFAULT 1,
    status ENUM('pending','approved','rejected','cancelled') DEFAULT 'pending',
    rejection_reason TEXT DEFAULT NULL,
    reviewed_by INT DEFAULT NULL,
    reviewed_at DATETIME DEFAULT NULL,
    checkin_code VARCHAR(20) DEFAULT NULL,
    checked_in_at DATETIME DEFAULT NULL,
    no_show BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_bookings_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_bookings_room FOREIGN KEY (room_id) REFERENCES rooms(id),
    CONSTRAINT fk_bookings_reviewed_by FOREIGN KEY (reviewed_by) REFERENCES users(id),
    INDEX idx_bookings_room_time (room_id, booking_date, start_time, end_time),
    INDEX idx_bookings_user_status (user_id, status)
);

CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255),
    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE password_reset_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    requested_password_hash VARCHAR(255) NOT NULL,
    note TEXT,
    status ENUM('pending','approved','rejected') DEFAULT 'pending',
    admin_note TEXT,
    reviewed_by INT NULL,
    reviewed_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_password_reset_requests_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_password_reset_requests_admin FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_password_reset_requests_user_status (user_id, status),
    INDEX idx_password_reset_requests_status_created (status, created_at)
);

CREATE TABLE maintenance_schedules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    room_id INT NOT NULL,
    maintenance_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    reason VARCHAR(255) NOT NULL,
    status ENUM('scheduled','completed','cancelled') DEFAULT 'scheduled',
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_maintenance_room FOREIGN KEY (room_id) REFERENCES rooms(id),
    CONSTRAINT fk_maintenance_user FOREIGN KEY (created_by) REFERENCES users(id),
    INDEX idx_maintenance_room_time (room_id, maintenance_date, start_time, end_time)
);

CREATE TABLE room_reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    room_id INT NOT NULL,
    user_id INT NOT NULL,
    rating INT NOT NULL,
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_room_user_review (room_id, user_id),
    CONSTRAINT fk_room_reviews_room FOREIGN KEY (room_id) REFERENCES rooms(id),
    CONSTRAINT fk_room_reviews_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT chk_room_reviews_rating CHECK (rating BETWEEN 1 AND 5)
);

INSERT INTO users (fullname, email, password, role)
VALUES
('Administrator', 'admin@gmail.com', '123456', 'admin'),
('Vo Ngoc Hoang Hung', 'hungn28@gmail.com', '123456', 'student'),
('Tran Thi B', 'b@gmail.com', '123456', 'student'),
('Le Van C', 'c@gmail.com', '123456', 'student'),
('Pham Thi D', 'd@gmail.com', '123456', 'student'),
('Hoang Van E', 'e@gmail.com', '123456', 'student'),
('Vo Thi F', 'f@gmail.com', '123456', 'student'),
('Dang Van G', 'g@gmail.com', '123456', 'student'),
('Bui Thi H', 'h@gmail.com', '123456', 'student'),
('Do Van I', 'i@gmail.com', '123456', 'student'),
('Nguyen Thi Kieu', 'k@gmail.com', '123456', 'student');

INSERT INTO rooms
(room_name, capacity, description, status, building, floor, room_type, equipment, image_url)
VALUES
('A101', 20, 'Phong hoc tang 1', 'available', 'A', 1, 'classroom', 'May chieu, Bang trang', 'https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=900&q=80'),
('A102', 15, 'Phong hoc tang 1', 'available', 'A', 1, 'classroom', 'May chieu, Bang trang', 'https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=900&q=80'),
('A103', 25, 'Phong hoc tang 1', 'available', 'A', 1, 'classroom', 'May chieu, Bang trang', 'https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=900&q=80'),
('A104', 20, 'Phong bao tri tang 1', 'maintenance', 'A', 1, 'classroom', 'May chieu, Dieu hoa', 'https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=900&q=80'),
('B201', 30, 'Phong hoc tang 2', 'available', 'B', 2, 'classroom', 'May chieu, Dieu hoa', 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=900&q=80'),
('B202', 30, 'Phong hoc tang 2', 'available', 'B', 2, 'classroom', 'May chieu, Dieu hoa', 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=900&q=80'),
('B203', 35, 'Phong dang su dung', 'occupied', 'B', 2, 'classroom', 'May chieu, Dieu hoa, Micro', 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=900&q=80'),
('B204', 40, 'Phong hoc tang 2', 'available', 'B', 2, 'classroom', 'May chieu, Dieu hoa, Micro', 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=900&q=80'),
('C301', 50, 'Phong hoc tang 3', 'available', 'C', 3, 'seminar', 'May chieu, Dieu hoa, Micro', 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=900&q=80'),
('C302', 45, 'Phong hoc tang 3', 'available', 'C', 3, 'seminar', 'May chieu, Dieu hoa, Micro', 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=900&q=80'),
('C303', 40, 'Phong lab tang 3', 'available', 'C', 3, 'lab', 'May tinh, May chieu, Dieu hoa', 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=900&q=80'),
('C304', 60, 'Phong bao tri tang 3', 'maintenance', 'C', 3, 'seminar', 'May chieu, Dieu hoa, Micro', 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=900&q=80'),
('D401', 80, 'Phong hoi thao', 'available', 'D', 4, 'seminar', 'Man hinh LED, Am thanh, Micro', 'https://images.unsplash.com/photo-1582833639049-2cf35c207e83?auto=format&fit=crop&w=900&q=80');

INSERT INTO bookings
(user_id, room_id, booking_date, start_time, end_time, purpose, participants, status, checkin_code, checked_in_at)
VALUES
(2, 1, '2026-06-05', '16:21:00', '16:22:00', 'Hoc nhom', 1, 'approved', 'ABC123', '2026-06-05 16:21:30'),
(3, 3, '2026-06-11', '09:00:00', '11:00:00', 'Hoc nhom', 5, 'approved', 'B202AA', NULL),
(4, 4, '2026-06-11', '14:00:00', '16:00:00', 'Bao ve do an', 8, 'rejected', NULL, NULL),
(5, 5, '2026-06-12', '08:00:00', '10:00:00', 'On tap', 4, 'cancelled', NULL, NULL),
(6, 6, '2026-06-12', '10:00:00', '12:00:00', 'Thao luan nhom', 10, 'approved', 'C301BB', NULL),
(7, 7, '2026-06-13', '13:00:00', '15:00:00', 'Hoc cau lac bo', 12, 'pending', NULL, NULL),
(8, 8, '2026-06-13', '15:00:00', '17:00:00', 'Seminar', 20, 'approved', 'D401CC', NULL),
(9, 9, '2026-06-14', '08:00:00', '10:00:00', 'Tu hoc', 6, 'pending', NULL, NULL),
(10, 10, '2026-06-14', '14:00:00', '16:00:00', 'Hoc nhom', 9, 'approved', 'A101DD', NULL);

INSERT INTO notifications (user_id, title, message, is_read)
VALUES
(2, 'Dat phong thanh cong', 'Yeu cau dat phong da duoc duyet', 1),
(3, 'Cho duyet', 'Yeu cau dang cho admin xac nhan', 0),
(4, 'Tu choi yeu cau', 'Yeu cau dat phong bi tu choi', 1),
(7, 'Dat phong moi', 'Yeu cau cua ban dang cho duyet', 0),
(8, 'Dat phong thanh cong', 'Phong hoc da duoc phe duyet', 0);

INSERT INTO maintenance_schedules
(room_id, maintenance_date, start_time, end_time, reason, status, created_by)
VALUES
(4, '2026-06-18', '08:00:00', '11:00:00', 'Bao tri may chieu', 'scheduled', 1),
(12, '2026-06-19', '13:00:00', '16:00:00', 'Sua dieu hoa', 'scheduled', 1);

INSERT INTO room_reviews (room_id, user_id, rating, comment)
VALUES
(1, 2, 5, 'Phong sach va thiet bi hoat dong tot');

-- Demo data for testing student/admin workflows
INSERT INTO users (fullname, email, password, role)
VALUES
('Nguyễn Minh Anh', 'sv001.studyroom@gmail.com', '123456', 'student'),
('Trần Thị Bảo Ngọc', 'sv002.studyroom@gmail.com', '123456', 'student'),
('Lê Hoàng Phúc', 'sv003.studyroom@gmail.com', '123456', 'student'),
('Phạm Gia Hân', 'sv004.studyroom@gmail.com', '123456', 'student'),
('Huỳnh Quốc Bảo', 'sv005.studyroom@gmail.com', '123456', 'student'),
('Võ Thảo Vy', 'sv006.studyroom@gmail.com', '123456', 'student'),
('Đặng Tuấn Kiệt', 'sv007.studyroom@gmail.com', '123456', 'student'),
('Bùi Khánh Linh', 'sv008.studyroom@gmail.com', '123456', 'student'),
('Đỗ Nhật Nam', 'sv009.studyroom@gmail.com', '123456', 'student'),
('Ngô Phương Thảo', 'sv010.studyroom@gmail.com', '123456', 'student'),
('Hồ Đức Anh', 'sv011.studyroom@gmail.com', '123456', 'student'),
('Mai Thanh Trúc', 'sv012.studyroom@gmail.com', '123456', 'student'),
('Cao Minh Quân', 'sv013.studyroom@gmail.com', '123456', 'student'),
('Lâm Ngọc Mai', 'sv014.studyroom@gmail.com', '123456', 'student'),
('Dương Hải Đăng', 'sv015.studyroom@gmail.com', '123456', 'student'),
('Tạ Hồng Nhung', 'sv016.studyroom@gmail.com', '123456', 'student'),
('Phan Nhật Minh', 'sv017.studyroom@gmail.com', '123456', 'student'),
('Vũ Mỹ Duyên', 'sv018.studyroom@gmail.com', '123456', 'student'),
('Châu Thành Đạt', 'sv019.studyroom@gmail.com', '123456', 'student'),
('Đinh Yến Nhi', 'sv020.studyroom@gmail.com', '123456', 'student');

SET @admin_id = (SELECT id FROM users WHERE role = 'admin' ORDER BY id ASC LIMIT 1);

INSERT INTO bookings
(user_id, room_id, booking_date, start_time, end_time, purpose, participants, status, rejection_reason, reviewed_by, reviewed_at, checkin_code, checked_in_at, no_show)
VALUES
((SELECT id FROM users WHERE email = 'sv001.studyroom@gmail.com'), (SELECT id FROM rooms WHERE room_name = 'A101'), '2026-06-03', '08:00:00', '10:00:00', 'Học nhóm môn Cơ sở dữ liệu', 5, 'approved', NULL, @admin_id, '2026-06-03 07:45:00', 'A1B2C3', '2026-06-03 08:04:00', 0),
((SELECT id FROM users WHERE email = 'sv002.studyroom@gmail.com'), (SELECT id FROM rooms WHERE room_name = 'A102'), '2026-06-03', '10:30:00', '12:00:00', 'Ôn tập kiểm tra giữa kỳ', 4, 'approved', NULL, @admin_id, '2026-06-03 07:45:00', 'D4E5F6', '2026-06-03 10:36:00', 0),
((SELECT id FROM users WHERE email = 'sv003.studyroom@gmail.com'), (SELECT id FROM rooms WHERE room_name = 'B201'), '2026-06-04', '13:00:00', '15:00:00', 'Thảo luận bài tập lớn', 8, 'approved', NULL, @admin_id, '2026-06-04 07:45:00', 'G7H8I9', '2026-06-04 13:02:00', 0),
((SELECT id FROM users WHERE email = 'sv004.studyroom@gmail.com'), (SELECT id FROM rooms WHERE room_name = 'B202'), '2026-06-04', '15:30:00', '17:00:00', 'Tập thuyết trình nhóm', 6, 'approved', NULL, @admin_id, '2026-06-04 07:45:00', 'J1K2L3', '2026-06-04 15:37:00', 0),
((SELECT id FROM users WHERE email = 'sv005.studyroom@gmail.com'), (SELECT id FROM rooms WHERE room_name = 'C301'), '2026-06-05', '08:30:00', '10:30:00', 'Sinh hoạt câu lạc bộ học thuật', 18, 'approved', NULL, @admin_id, '2026-06-05 07:45:00', 'M4N5O6', '2026-06-05 08:35:00', 0),
((SELECT id FROM users WHERE email = 'sv006.studyroom@gmail.com'), (SELECT id FROM rooms WHERE room_name = 'C302'), '2026-06-05', '14:00:00', '16:00:00', 'Luyện đề thi cuối kỳ', 10, 'approved', NULL, @admin_id, '2026-06-05 07:45:00', 'P7Q8R9', '2026-06-05 14:03:00', 0),
((SELECT id FROM users WHERE email = 'sv007.studyroom@gmail.com'), (SELECT id FROM rooms WHERE room_name = 'C303'), '2026-06-06', '09:00:00', '11:00:00', 'Thực hành lập trình', 12, 'approved', NULL, @admin_id, '2026-06-06 07:45:00', 'S1T2U3', '2026-06-06 09:06:00', 0),
((SELECT id FROM users WHERE email = 'sv008.studyroom@gmail.com'), (SELECT id FROM rooms WHERE room_name = 'D401'), '2026-06-06', '13:30:00', '16:00:00', 'Tổ chức seminar sinh viên', 35, 'approved', NULL, @admin_id, '2026-06-06 07:45:00', 'V4W5X6', '2026-06-06 13:40:00', 0),
((SELECT id FROM users WHERE email = 'sv009.studyroom@gmail.com'), (SELECT id FROM rooms WHERE room_name = 'A103'), '2026-06-07', '07:30:00', '09:00:00', 'Tự học buổi sáng', 2, 'approved', NULL, @admin_id, '2026-06-07 07:45:00', 'Y7Z8A9', NULL, 1),
((SELECT id FROM users WHERE email = 'sv010.studyroom@gmail.com'), (SELECT id FROM rooms WHERE room_name = 'B204'), '2026-06-07', '09:30:00', '11:30:00', 'Học nhóm môn Mạng máy tính', 7, 'approved', NULL, @admin_id, '2026-06-07 07:45:00', 'B1C2D3', NULL, 1),
((SELECT id FROM users WHERE email = 'sv011.studyroom@gmail.com'), (SELECT id FROM rooms WHERE room_name = 'A101'), '2026-06-09', '08:00:00', '10:00:00', 'Chuẩn bị báo cáo đồ án', 5, 'approved', NULL, @admin_id, '2026-06-08 07:45:00', 'E4F5G6', NULL, 0),
((SELECT id FROM users WHERE email = 'sv012.studyroom@gmail.com'), (SELECT id FROM rooms WHERE room_name = 'B201'), '2026-06-09', '13:00:00', '15:00:00', 'Học nhóm môn Java', 6, 'pending', NULL, NULL, NULL, NULL, NULL, 0),
((SELECT id FROM users WHERE email = 'sv013.studyroom@gmail.com'), (SELECT id FROM rooms WHERE room_name = 'C301'), '2026-06-10', '09:00:00', '11:00:00', 'Luyện thuyết trình tiếng Anh', 10, 'pending', NULL, NULL, NULL, NULL, NULL, 0),
((SELECT id FROM users WHERE email = 'sv014.studyroom@gmail.com'), (SELECT id FROM rooms WHERE room_name = 'C302'), '2026-06-10', '14:00:00', '16:00:00', 'Ôn tập môn Trí tuệ nhân tạo', 9, 'rejected', 'Phòng được ưu tiên cho lịch hội thảo của khoa', @admin_id, '2026-06-08 07:45:00', NULL, NULL, 0),
((SELECT id FROM users WHERE email = 'sv015.studyroom@gmail.com'), (SELECT id FROM rooms WHERE room_name = 'D401'), '2026-06-11', '08:00:00', '10:00:00', 'Tập dượt chương trình câu lạc bộ', 30, 'cancelled', NULL, NULL, NULL, NULL, NULL, 0),
((SELECT id FROM users WHERE email = 'sv016.studyroom@gmail.com'), (SELECT id FROM rooms WHERE room_name = 'A102'), '2026-06-11', '10:30:00', '12:00:00', 'Làm bài tập nhóm', 4, 'approved', NULL, @admin_id, '2026-06-08 07:45:00', 'H7I8J9', NULL, 0),
((SELECT id FROM users WHERE email = 'sv017.studyroom@gmail.com'), (SELECT id FROM rooms WHERE room_name = 'B202'), '2026-06-12', '13:00:00', '15:00:00', 'Họp nhóm nghiên cứu khoa học', 8, 'pending', NULL, NULL, NULL, NULL, NULL, 0),
((SELECT id FROM users WHERE email = 'sv018.studyroom@gmail.com'), (SELECT id FROM rooms WHERE room_name = 'C303'), '2026-06-12', '15:30:00', '17:30:00', 'Thực hành dự án phần mềm', 14, 'approved', NULL, @admin_id, '2026-06-08 07:45:00', 'K1L2M3', NULL, 0),
((SELECT id FROM users WHERE email = 'sv019.studyroom@gmail.com'), (SELECT id FROM rooms WHERE room_name = 'A103'), '2026-06-13', '08:30:00', '10:30:00', 'Ôn tập môn Hệ điều hành', 5, 'rejected', 'Mục đích sử dụng chưa rõ ràng', @admin_id, '2026-06-08 07:45:00', NULL, NULL, 0),
((SELECT id FROM users WHERE email = 'sv020.studyroom@gmail.com'), (SELECT id FROM rooms WHERE room_name = 'B204'), '2026-06-13', '14:00:00', '16:00:00', 'Học nhóm môn Kiểm thử phần mềm', 7, 'cancelled', NULL, NULL, NULL, NULL, NULL, 0),
((SELECT id FROM users WHERE email = 'sv001.studyroom@gmail.com'), (SELECT id FROM rooms WHERE room_name = 'C301'), '2026-06-14', '08:00:00', '10:00:00', 'Chuẩn bị bảo vệ đề tài', 10, 'approved', NULL, @admin_id, '2026-06-08 07:45:00', 'N4O5P6', NULL, 0),
((SELECT id FROM users WHERE email = 'sv002.studyroom@gmail.com'), (SELECT id FROM rooms WHERE room_name = 'D401'), '2026-06-15', '09:00:00', '11:00:00', 'Workshop kỹ năng học tập', 40, 'pending', NULL, NULL, NULL, NULL, NULL, 0),
((SELECT id FROM users WHERE email = 'sv003.studyroom@gmail.com'), (SELECT id FROM rooms WHERE room_name = 'A101'), '2026-06-15', '13:00:00', '15:00:00', 'Tự học có hướng dẫn', 3, 'approved', NULL, @admin_id, '2026-06-08 07:45:00', 'Q7R8S9', NULL, 0),
((SELECT id FROM users WHERE email = 'sv004.studyroom@gmail.com'), (SELECT id FROM rooms WHERE room_name = 'B201'), '2026-06-16', '15:00:00', '17:00:00', 'Họp nhóm môn Phân tích thiết kế', 6, 'pending', NULL, NULL, NULL, NULL, NULL, 0);

INSERT INTO room_reviews (room_id, user_id, rating, comment)
VALUES
((SELECT id FROM rooms WHERE room_name = 'A101'), (SELECT id FROM users WHERE email = 'sv001.studyroom@gmail.com'), 5, 'Phòng sạch, máy chiếu rõ và bàn ghế dễ sắp xếp.'),
((SELECT id FROM rooms WHERE room_name = 'A102'), (SELECT id FROM users WHERE email = 'sv002.studyroom@gmail.com'), 4, 'Phòng yên tĩnh, phù hợp học nhóm nhỏ.'),
((SELECT id FROM rooms WHERE room_name = 'B201'), (SELECT id FROM users WHERE email = 'sv003.studyroom@gmail.com'), 5, 'Điều hòa tốt, ánh sáng ổn, rất phù hợp thảo luận.'),
((SELECT id FROM rooms WHERE room_name = 'B202'), (SELECT id FROM users WHERE email = 'sv004.studyroom@gmail.com'), 4, 'Không gian vừa đủ, nên bổ sung thêm ổ cắm.'),
((SELECT id FROM rooms WHERE room_name = 'C301'), (SELECT id FROM users WHERE email = 'sv005.studyroom@gmail.com'), 5, 'Phòng rộng, micro và máy chiếu hoạt động tốt.'),
((SELECT id FROM rooms WHERE room_name = 'C302'), (SELECT id FROM users WHERE email = 'sv006.studyroom@gmail.com'), 3, 'Phòng ổn nhưng hơi ồn vào buổi chiều.'),
((SELECT id FROM rooms WHERE room_name = 'C303'), (SELECT id FROM users WHERE email = 'sv007.studyroom@gmail.com'), 4, 'Máy tính chạy ổn, phù hợp thực hành lập trình.'),
((SELECT id FROM rooms WHERE room_name = 'D401'), (SELECT id FROM users WHERE email = 'sv008.studyroom@gmail.com'), 5, 'Rất phù hợp seminar, âm thanh tốt.');

INSERT INTO notifications (user_id, title, message, is_read)
VALUES
((SELECT id FROM users WHERE email = 'sv001.studyroom@gmail.com'), 'Lịch đặt phòng được duyệt', 'Lịch phòng A101 của bạn đã được duyệt và đã check-in thành công.', 1),
((SELECT id FROM users WHERE email = 'sv002.studyroom@gmail.com'), 'Lịch đặt phòng được duyệt', 'Lịch phòng A102 của bạn đã được duyệt.', 1),
((SELECT id FROM users WHERE email = 'sv009.studyroom@gmail.com'), 'Bạn đã vắng mặt', 'Bạn chưa check-in lịch phòng A103 đúng thời gian sử dụng.', 0),
((SELECT id FROM users WHERE email = 'sv010.studyroom@gmail.com'), 'Bạn đã vắng mặt', 'Bạn chưa check-in lịch phòng B204 đúng thời gian sử dụng.', 0),
((SELECT id FROM users WHERE email = 'sv012.studyroom@gmail.com'), 'Yêu cầu đang chờ duyệt', 'Yêu cầu đặt phòng B201 của bạn đang chờ quản trị viên duyệt.', 0),
((SELECT id FROM users WHERE email = 'sv014.studyroom@gmail.com'), 'Yêu cầu bị từ chối', 'Yêu cầu đặt phòng C302 bị từ chối do phòng được ưu tiên cho lịch hội thảo.', 1),
((SELECT id FROM users WHERE email = 'sv015.studyroom@gmail.com'), 'Bạn đã hủy lịch', 'Lịch phòng D401 đã được hủy theo yêu cầu.', 1),
((SELECT id FROM users WHERE email = 'sv018.studyroom@gmail.com'), 'Lịch đặt phòng được duyệt', 'Lịch phòng C303 của bạn đã được duyệt. Vui lòng check-in đúng giờ.', 0);
