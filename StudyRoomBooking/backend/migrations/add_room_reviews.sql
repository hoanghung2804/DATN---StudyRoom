USE study_room_booking;

ALTER TABLE rooms
ADD COLUMN image_url TEXT DEFAULT NULL;

CREATE TABLE room_reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    room_id INT NOT NULL,
    user_id INT NOT NULL,
    rating INT NOT NULL,
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_room_user_review (room_id, user_id),
    CONSTRAINT fk_room_reviews_room
        FOREIGN KEY (room_id) REFERENCES rooms(id),
    CONSTRAINT fk_room_reviews_user
        FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT chk_room_reviews_rating
        CHECK (rating BETWEEN 1 AND 5)
);

UPDATE rooms
SET image_url = CASE
    WHEN room_name LIKE 'A%' THEN 'https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=900&q=80'
    WHEN room_name LIKE 'B%' THEN 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=900&q=80'
    WHEN room_name LIKE 'C%' THEN 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=900&q=80'
    ELSE 'https://images.unsplash.com/photo-1582833639049-2cf35c207e83?auto=format&fit=crop&w=900&q=80'
END
WHERE image_url IS NULL;
