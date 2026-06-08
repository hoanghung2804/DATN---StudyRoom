USE study_room_booking;

ALTER TABLE bookings
ADD COLUMN checkin_code VARCHAR(20) DEFAULT NULL,
ADD COLUMN checked_in_at DATETIME DEFAULT NULL,
ADD COLUMN no_show BOOLEAN DEFAULT FALSE;

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
    FOREIGN KEY (room_id) REFERENCES rooms(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);
