const db = require("../config/db");

// NOTE: Chuc nang chinh - Lay danh sach phong, co ho tro loc va kiem tra lich trong.
exports.getAllRooms = (req, res) => {
    const {
        keyword,
        status,
        minCapacity,
        building,
        roomType,
        equipment,
        bookingDate,
        startTime,
        endTime
    } = req.query;

    const conditions = [];
    const params = [];

    if (keyword) {
        conditions.push("(room_name LIKE ? OR description LIKE ?)");
        params.push(`%${keyword}%`, `%${keyword}%`);
    }

    if (status) {
        conditions.push("status = ?");
        params.push(status);
    }

    if (minCapacity) {
        conditions.push("capacity >= ?");
        params.push(Number(minCapacity));
    }

    if (building) {
        conditions.push("building = ?");
        params.push(building);
    }

    if (roomType) {
        conditions.push("room_type = ?");
        params.push(roomType);
    }

    if (equipment) {
        conditions.push("equipment LIKE ?");
        params.push(`%${equipment}%`);
    }

    if (bookingDate && startTime && endTime) {
        conditions.push(`
            NOT EXISTS (
                SELECT 1
                FROM bookings
                WHERE bookings.room_id = rooms.id
                AND bookings.booking_date = ?
                AND bookings.status IN ('pending', 'approved')
                AND bookings.start_time < ?
                AND bookings.end_time > ?
            )
            AND NOT EXISTS (
                SELECT 1
                FROM maintenance_schedules
                WHERE maintenance_schedules.room_id = rooms.id
                AND maintenance_schedules.maintenance_date = ?
                AND maintenance_schedules.status = 'scheduled'
                AND maintenance_schedules.start_time < ?
                AND maintenance_schedules.end_time > ?
            )
        `);
        params.push(
            bookingDate,
            endTime,
            startTime,
            bookingDate,
            endTime,
            startTime
        );
    }

    const whereSql = conditions.length
        ? `WHERE ${conditions.join(" AND ")}`
        : "";

    const sql = `
        SELECT
            rooms.*,
            ROUND(AVG(room_reviews.rating), 1) AS average_rating,
            COUNT(room_reviews.id) AS review_count
        FROM rooms
        LEFT JOIN room_reviews
            ON rooms.id = room_reviews.room_id
        ${whereSql}
        GROUP BY rooms.id
        ORDER BY rooms.id DESC
    `;

    db.query(sql, params, (err, result) => {
        if (err) {
            return res.status(500).json({
                message: err.message
            });
        }

        return res.json(result);
    });
};

// NOTE: Chuc nang chinh - Lay chi tiet mot phong kem diem danh gia trung binh.
exports.getRoomById = (req, res) => {
    const roomId = req.params.id;

    const sql = `
        SELECT
            rooms.*,
            ROUND(AVG(room_reviews.rating), 1) AS average_rating,
            COUNT(room_reviews.id) AS review_count
        FROM rooms
        LEFT JOIN room_reviews
            ON rooms.id = room_reviews.room_id
        WHERE rooms.id = ?
        GROUP BY rooms.id
    `;

    db.query(sql, [roomId], (err, result) => {
        if (err) {
            return res.status(500).json({
                message: err.message
            });
        }

        if (result.length === 0) {
            return res.status(404).json({
                message: "Khong tim thay phong"
            });
        }

        return res.json(result[0]);
    });
};

// NOTE: Chuc nang chinh - Admin tao phong hoc moi.
exports.createRoom = (req, res) => {
    const {
        room_name,
        capacity,
        description,
        status = "available",
        building,
        floor,
        room_type = "classroom",
        equipment,
        image_url
    } = req.body;

    if (!room_name || !capacity) {
        return res.status(400).json({
            message: "Vui long nhap ten phong va suc chua"
        });
    }

    const sql = `
        INSERT INTO rooms
        (
            room_name,
            capacity,
            description,
            status,
            building,
            floor,
            room_type,
            equipment,
            image_url
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(
        sql,
        [
            room_name,
            Number(capacity),
            description || null,
            status,
            building || null,
            floor || null,
            room_type,
            equipment || null,
            image_url || null
        ],
        (err) => {
            if (err) {
                return res.status(500).json({
                    message: err.message
                });
            }

            return res.status(201).json({
                message: "Them phong thanh cong"
            });
        }
    );
};

// NOTE: Chuc nang chinh - Admin cap nhat thong tin, trang thai va anh phong.
exports.updateRoom = (req, res) => {
    const roomId = req.params.id;

    const {
        room_name,
        capacity,
        description,
        status,
        building,
        floor,
        room_type,
        equipment,
        image_url
    } = req.body;

    if (!room_name || !capacity || !status) {
        return res.status(400).json({
            message: "Vui long nhap day du thong tin phong"
        });
    }

    const sql = `
        UPDATE rooms
        SET
            room_name = ?,
            capacity = ?,
            description = ?,
            status = ?,
            building = ?,
            floor = ?,
            room_type = ?,
            equipment = ?,
            image_url = ?
        WHERE id = ?
    `;

    db.query(
        sql,
        [
            room_name,
            Number(capacity),
            description || null,
            status,
            building || null,
            floor || null,
            room_type || "classroom",
            equipment || null,
            image_url || null,
            roomId
        ],
        (err) => {
            if (err) {
                return res.status(500).json({
                    message: err.message
                });
            }

            return res.json({
                message: "Cap nhat thanh cong"
            });
        }
    );
};

// NOTE: Chuc nang chinh - Hien thi danh gia cua sinh vien da su dung phong.
exports.getRoomReviews = (req, res) => {
    const roomId = req.params.id;

    const sql = `
        SELECT
            room_reviews.*,
            users.fullname
        FROM room_reviews
        JOIN users ON room_reviews.user_id = users.id
        WHERE room_reviews.room_id = ?
        ORDER BY room_reviews.created_at DESC
    `;

    db.query(sql, [roomId], (err, result) => {
        if (err) {
            return res.status(500).json({
                message: err.message
            });
        }

        return res.json(result);
    });
};

// NOTE: Chuc nang chinh - Sinh vien danh gia/sua danh gia sau khi dung xong phong.
exports.createOrUpdateRoomReview = (req, res) => {
    const roomId = req.params.id;
    const userId = req.user.id;
    const { rating, comment } = req.body;
    const ratingNumber = Number(rating);

    if (!ratingNumber || ratingNumber < 1 || ratingNumber > 5) {
        return res.status(400).json({
            message: "Vui long chon so sao tu 1 den 5"
        });
    }

    const permissionSql = `
        SELECT id
        FROM bookings
        WHERE room_id = ?
        AND user_id = ?
        AND status = 'approved'
        AND checked_in_at IS NOT NULL
        AND TIMESTAMP(booking_date, end_time) < NOW()
        LIMIT 1
    `;

    db.query(permissionSql, [roomId, userId], (permissionErr, bookings) => {
        if (permissionErr) {
            return res.status(500).json({
                message: permissionErr.message
            });
        }

        if (bookings.length === 0) {
            return res.status(403).json({
                message: "Ban chi co the danh gia sau khi da check-in va su dung xong phong"
            });
        }

        const upsertSql = `
            INSERT INTO room_reviews
            (
                room_id,
                user_id,
                rating,
                comment
            )
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                rating = VALUES(rating),
                comment = VALUES(comment)
        `;

        db.query(
            upsertSql,
            [
                roomId,
                userId,
                ratingNumber,
                comment || null
            ],
            (err) => {
                if (err) {
                    return res.status(500).json({
                        message: err.message
                    });
                }

                return res.json({
                    message: "Cam on ban da danh gia phong"
                });
            }
        );
    });
};

// NOTE: Chuc nang chinh - Admin xoa phong neu phong chua co lich dat.
exports.deleteRoom = (req, res) => {
    const roomId = req.params.id;

    const checkSql = `
        SELECT id
        FROM bookings
        WHERE room_id = ?
        LIMIT 1
    `;

    db.query(checkSql, [roomId], (err, bookings) => {
        if (err) {
            return res.status(500).json({
                message: err.message
            });
        }

        if (bookings.length > 0) {
            return res.status(400).json({
                message: "Khong the xoa phong vi da co lich dat"
            });
        }

        db.query(
            "DELETE FROM rooms WHERE id = ?",
            [roomId],
            (deleteErr) => {
                if (deleteErr) {
                    return res.status(500).json({
                        message: deleteErr.message
                    });
                }

                return res.json({
                    message: "Xoa phong thanh cong"
                });
            }
        );
    });
};
