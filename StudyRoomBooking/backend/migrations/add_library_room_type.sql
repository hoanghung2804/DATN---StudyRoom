ALTER TABLE rooms
    MODIFY room_type ENUM('classroom','meeting','lab','seminar','library') DEFAULT 'classroom';
