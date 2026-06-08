USE study_room_booking;

ALTER TABLE rooms
ADD COLUMN building VARCHAR(50) DEFAULT NULL,
ADD COLUMN floor INT DEFAULT NULL,
ADD COLUMN room_type ENUM('classroom','meeting','lab','seminar','library') DEFAULT 'classroom',
ADD COLUMN equipment TEXT DEFAULT NULL;

ALTER TABLE bookings
ADD COLUMN purpose VARCHAR(255) DEFAULT NULL,
ADD COLUMN participants INT DEFAULT 1,
ADD COLUMN rejection_reason TEXT DEFAULT NULL,
ADD COLUMN reviewed_by INT DEFAULT NULL,
ADD COLUMN reviewed_at DATETIME DEFAULT NULL,
ADD CONSTRAINT fk_bookings_reviewed_by
    FOREIGN KEY (reviewed_by) REFERENCES users(id);

UPDATE rooms
SET
    building = LEFT(room_name, 1),
    floor = CAST(SUBSTRING(room_name, 2, 1) AS UNSIGNED),
    room_type = CASE
        WHEN capacity >= 60 THEN 'seminar'
        ELSE 'classroom'
    END,
    equipment = CASE
        WHEN capacity >= 40 THEN 'May chieu, Dieu hoa, Micro'
        ELSE 'May chieu, Bang trang'
    END
WHERE building IS NULL;
