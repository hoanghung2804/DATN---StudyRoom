const db = require("../config/db");

const OPEN_TIME = "07:00";
const CLOSE_TIME = "21:00";
const MAX_ADVANCE_DAYS = 14;
const MAX_ACTIVE_BOOKINGS = 3;
const CHECKIN_EARLY_MINUTES = 120;

function notifyUser(userId, title, message) {
    const sql = `
        INSERT INTO notifications (user_id, title, message)
        VALUES (?, ?, ?)
    `;

    db.query(sql, [userId, title, message]);
}

function notifyAdmins(title, message) {
    db.query(
        "SELECT id FROM users WHERE role = 'admin'",
        (err, admins) => {
            if (err || admins.length === 0) {
                return;
            }

            const values = admins.map((admin) => [
                admin.id,
                title,
                message
            ]);

            db.query(
                "INSERT INTO notifications (user_id, title, message) VALUES ?",
                [values]
            );
        }
    );
}

function isOutsideSchoolHours(startTime, endTime) {
    return startTime < OPEN_TIME || endTime > CLOSE_TIME;
}

function isTooFarInFuture(bookingDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + MAX_ADVANCE_DAYS);

    const selectedDate = new Date(bookingDate);
    selectedDate.setHours(0, 0, 0, 0);

    return selectedDate > maxDate;
}

function isPastDate(bookingDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const selectedDate = new Date(bookingDate);
    selectedDate.setHours(0, 0, 0, 0);

    return selectedDate < today;
}

function createCheckinCode() {
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    return Array.from({ length: 6 }, () =>
        alphabet[Math.floor(Math.random() * alphabet.length)]
    ).join("");
}

function formatDateOnly(value) {
    if (!value) return "";

    if (typeof value === "string") {
        return value.slice(0, 10);
    }

    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function normalizeCheckinCode(value) {
    return String(value || "")
        .trim()
        .replace(/[\s-]/g, "")
        .toUpperCase();
}

function getBookingDateTime(value, time) {
    return new Date(`${formatDateOnly(value)}T${time}`);
}

function isCheckinWindowOpen(booking) {
    const now = new Date();
    const startAt = getBookingDateTime(booking.booking_date, booking.start_time);
    const endAt = getBookingDateTime(booking.booking_date, booking.end_time);
    const earliestCheckinAt = new Date(
        startAt.getTime() - CHECKIN_EARLY_MINUTES * 60 * 1000
    );

    return now >= earliestCheckinAt && now <= endAt;
}

function hideEarlyCheckinCode(booking) {
    if (
        booking.status === "approved" &&
        !booking.checked_in_at &&
        !booking.no_show &&
        !isCheckinWindowOpen(booking)
    ) {
        return {
            ...booking,
            checkin_code: null
        };
    }

    return booking;
}

function refreshNoShows(callback) {
    const sql = `
        UPDATE bookings
        SET no_show = TRUE
        WHERE status = 'approved'
        AND checked_in_at IS NULL
        AND no_show = FALSE
        AND TIMESTAMP(booking_date, end_time) < NOW()
    `;

    db.query(sql, () => {
        callback();
    });
}

// NOTE: Chuc nang chinh - Sinh vien gui yeu cau dat phong va kiem tra trung lich.
exports.createBooking = (req, res) => {
    const {
        room_id,
        booking_date,
        start_time,
        end_time,
        purpose,
        participants
    } = req.body;

    const user_id = req.user.id;
    const participantCount = Number(participants || 1);

    if (
        !room_id ||
        !booking_date ||
        !start_time ||
        !end_time ||
        !purpose ||
        !participantCount
    ) {
        return res.status(400).json({
            message: "Vui long nhap day du thong tin dat phong"
        });
    }

    if (start_time >= end_time) {
        return res.status(400).json({
            message: "Gio ket thuc phai lon hon gio bat dau"
        });
    }

    if (isOutsideSchoolHours(start_time, end_time)) {
        return res.status(400).json({
            message: `Chi duoc dat phong trong khung ${OPEN_TIME} - ${CLOSE_TIME}`
        });
    }

    if (isPastDate(booking_date)) {
        return res.status(400).json({
            message: "Khong the dat ngay trong qua khu"
        });
    }

    if (isTooFarInFuture(booking_date)) {
        return res.status(400).json({
            message: `Chi duoc dat phong truoc toi da ${MAX_ADVANCE_DAYS} ngay`
        });
    }

    const roomSql = `
        SELECT *
        FROM rooms
        WHERE id = ?
    `;

    db.query(roomSql, [room_id], (roomErr, roomResult) => {
        if (roomErr) {
            return res.status(500).json({
                message: roomErr.message
            });
        }

        if (roomResult.length === 0) {
            return res.status(404).json({
                message: "Khong tim thay phong"
            });
        }

        const room = roomResult[0];

        if (room.status !== "available") {
            return res.status(400).json({
                message: "Phong hien khong kha dung"
            });
        }

        if (participantCount > room.capacity) {
            return res.status(400).json({
                message: "So nguoi tham gia vuot qua suc chua cua phong"
            });
        }

        const activeSql = `
            SELECT COUNT(*) AS total
            FROM bookings
            WHERE user_id = ?
            AND status IN ('pending', 'approved')
            AND no_show = FALSE
            AND (
                status = 'pending'
                OR TIMESTAMP(booking_date, end_time) >= NOW()
            )
        `;

        db.query(activeSql, [user_id], (activeErr, activeResult) => {
            if (activeErr) {
                return res.status(500).json({
                    message: activeErr.message
                });
            }

            if (activeResult[0].total >= MAX_ACTIVE_BOOKINGS) {
                return res.status(400).json({
                    message: `Moi nguoi chi duoc co toi da ${MAX_ACTIVE_BOOKINGS} lich dang hieu luc`
                });
            }

            const maintenanceSql = `
                SELECT id
                FROM maintenance_schedules
                WHERE room_id = ?
                AND maintenance_date = ?
                AND status = 'scheduled'
                AND start_time < ?
                AND end_time > ?
                LIMIT 1
            `;

            db.query(
                maintenanceSql,
                [room_id, booking_date, end_time, start_time],
                (maintenanceErr, maintenanceResult) => {
                    if (maintenanceErr) {
                        return res.status(500).json({
                            message: maintenanceErr.message
                        });
                    }

                    if (maintenanceResult.length > 0) {
                        return res.status(400).json({
                            message: "Phong dang co lich bao tri trong khung gio nay"
                        });
                    }

                    const conflictSql = `
                SELECT id
                FROM bookings
                WHERE room_id = ?
                AND booking_date = ?
                AND status IN ('pending', 'approved')
                AND start_time < ?
                AND end_time > ?
                LIMIT 1
            `;

                    db.query(
                        conflictSql,
                        [room_id, booking_date, end_time, start_time],
                        (conflictErr, conflictResult) => {
                            if (conflictErr) {
                                return res.status(500).json({
                                    message: conflictErr.message
                                });
                            }

                            if (conflictResult.length > 0) {
                                return res.status(400).json({
                                    message: "Phong da co lich trong khung gio nay"
                                });
                            }

                            const insertSql = `
                        INSERT INTO bookings
                        (
                            user_id,
                            room_id,
                            booking_date,
                            start_time,
                            end_time,
                            purpose,
                            participants
                        )
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    `;

                            db.query(
                                insertSql,
                                [
                                    user_id,
                                    room_id,
                                    booking_date,
                                    start_time,
                                    end_time,
                                    purpose,
                                    participantCount
                                ],
                                (insertErr) => {
                                    if (insertErr) {
                                        return res.status(500).json({
                                            message: insertErr.message
                                        });
                                    }

                                    notifyAdmins(
                                        "Yeu cau dat phong moi",
                                        `Co yeu cau dat phong ${room.room_name} dang cho duyet`
                                    );

                                    return res.status(201).json({
                                        message: "Dat phong thanh cong, vui long cho admin duyet"
                                    });
                                }
                            );
                        }
                    );
                }
            );
        });
    });
};

// NOTE: Chuc nang chinh - Lay lich dat phong cua mot sinh vien theo id.
exports.getBookingsByUser = (req, res) => {
    const userId = req.params.userId;

    const sql = `
        SELECT
            bookings.*,
            DATE_FORMAT(bookings.booking_date, '%Y-%m-%d') AS booking_date,
            rooms.room_name,
            room_reviews.rating AS my_rating,
            room_reviews.comment AS my_review_comment,
            room_reviews.updated_at AS my_review_updated_at
        FROM bookings
        JOIN rooms ON bookings.room_id = rooms.id
        LEFT JOIN room_reviews
            ON room_reviews.room_id = bookings.room_id
            AND room_reviews.user_id = bookings.user_id
        WHERE bookings.user_id = ?
        ORDER BY bookings.id DESC
    `;

    db.query(sql, [userId], (err, result) => {
        if (err) {
            return res.status(500).json({
                message: err.message
            });
        }

        return res.json(result);
    });
};

// NOTE: Chuc nang chinh - Sinh vien huy lich dat khi lich con cho phep huy.
exports.cancelBooking = (req, res) => {
    const bookingId = req.params.id;
    const userId = req.user.id;

    const checkSql = `
        SELECT *
        FROM bookings
        WHERE id = ?
        AND user_id = ?
        AND status = 'pending'
    `;

    db.query(checkSql, [bookingId, userId], (err, result) => {
        if (err) {
            return res.status(500).json({
                message: err.message
            });
        }

        if (result.length === 0) {
            return res.status(403).json({
                message: "Chi co the huy lich dang cho duyet cua ban"
            });
        }

        db.query(
            "UPDATE bookings SET status = 'cancelled' WHERE id = ?",
            [bookingId],
            (updateErr) => {
                if (updateErr) {
                    return res.status(500).json({
                        message: updateErr.message
                    });
                }

                return res.json({
                    message: "Huy lich thanh cong"
                });
            }
        );
    });
};

// NOTE: Chuc nang chinh - Admin duyet lich dat phong va gui thong bao.
exports.approveBooking = (req, res) => {
    const bookingId = req.params.id;
    const adminId = req.user.id;

    const getBookingSql = `
        SELECT bookings.*, rooms.room_name
        FROM bookings
        JOIN rooms ON bookings.room_id = rooms.id
        WHERE bookings.id = ?
        AND bookings.status = 'pending'
    `;

    db.query(getBookingSql, [bookingId], (err, bookingResult) => {
        if (err) {
            return res.status(500).json({
                message: err.message
            });
        }

        if (bookingResult.length === 0) {
            return res.status(400).json({
                message: "Booking khong ton tai hoac khong o trang thai cho duyet"
            });
        }

        const booking = bookingResult[0];

        const maintenanceSql = `
            SELECT id
            FROM maintenance_schedules
            WHERE room_id = ?
            AND maintenance_date = ?
            AND status = 'scheduled'
            AND start_time < ?
            AND end_time > ?
            LIMIT 1
        `;

        db.query(
            maintenanceSql,
            [
                booking.room_id,
                booking.booking_date,
                booking.end_time,
                booking.start_time
            ],
            (maintenanceErr, maintenanceResult) => {
                if (maintenanceErr) {
                    return res.status(500).json({
                        message: maintenanceErr.message
                    });
                }

                if (maintenanceResult.length > 0) {
                    return res.status(400).json({
                        message: "Phong co lich bao tri trong khung gio nay"
                    });
                }

                const conflictSql = `
            SELECT id
            FROM bookings
            WHERE room_id = ?
            AND booking_date = ?
            AND status = 'approved'
            AND id <> ?
            AND start_time < ?
            AND end_time > ?
            LIMIT 1
        `;

                db.query(
                    conflictSql,
                    [
                        booking.room_id,
                        booking.booking_date,
                        bookingId,
                        booking.end_time,
                        booking.start_time
                    ],
                    (conflictErr, conflictResult) => {
                        if (conflictErr) {
                            return res.status(500).json({
                                message: conflictErr.message
                            });
                        }

                        if (conflictResult.length > 0) {
                            return res.status(400).json({
                                message: "Phong da co lich duoc duyet trong khung gio nay"
                            });
                        }

                        const checkinCode = createCheckinCode();

                        const updateSql = `
                    UPDATE bookings
                    SET
                        status = 'approved',
                        rejection_reason = NULL,
                        reviewed_by = ?,
                        reviewed_at = NOW(),
                        checkin_code = ?
                    WHERE id = ?
                `;

                        db.query(
                            updateSql,
                            [adminId, checkinCode, bookingId],
                            (updateErr) => {
                                if (updateErr) {
                                    return res.status(500).json({
                                        message: updateErr.message
                                    });
                                }

                                notifyUser(
                                    booking.user_id,
                                    "Dat phong duoc duyet",
                                    `Yeu cau dat phong ${booking.room_name} cua ban da duoc duyet. Ma check-in: ${checkinCode}`
                                );

                                return res.json({
                                    message: "Duyet thanh cong"
                                });
                            }
                        );
                    }
                );
            }
        );
    });
};

// NOTE: Chuc nang chinh - Admin tu choi lich dat phong kem ly do.
exports.rejectBooking = (req, res) => {
    const bookingId = req.params.id;
    const adminId = req.user.id;
    const { rejection_reason } = req.body;

    if (!rejection_reason) {
        return res.status(400).json({
            message: "Vui long nhap ly do tu choi"
        });
    }

    const checkSql = `
        SELECT bookings.*, rooms.room_name
        FROM bookings
        JOIN rooms ON bookings.room_id = rooms.id
        WHERE bookings.id = ?
        AND bookings.status = 'pending'
    `;

    db.query(checkSql, [bookingId], (err, bookingResult) => {
        if (err) {
            return res.status(500).json({
                message: err.message
            });
        }

        if (bookingResult.length === 0) {
            return res.status(400).json({
                message: "Booking khong ton tai hoac khong o trang thai cho duyet"
            });
        }

        const booking = bookingResult[0];

        const updateSql = `
            UPDATE bookings
            SET
                status = 'rejected',
                rejection_reason = ?,
                reviewed_by = ?,
                reviewed_at = NOW()
            WHERE id = ?
        `;

        db.query(
            updateSql,
            [rejection_reason, adminId, bookingId],
            (updateErr) => {
                if (updateErr) {
                    return res.status(500).json({
                        message: updateErr.message
                    });
                }

                notifyUser(
                    booking.user_id,
                    "Dat phong bi tu choi",
                    `Yeu cau dat phong ${booking.room_name} bi tu choi: ${rejection_reason}`
                );

                return res.json({
                    message: "Da tu choi yeu cau"
                });
            }
        );
    });
};

// NOTE: Chuc nang chinh - Admin xem toan bo lich dat trong he thong.
exports.getAllBookings = (req, res) => {
    refreshNoShows(() => {
        const sql = `
        SELECT
            bookings.*,
            DATE_FORMAT(bookings.booking_date, '%Y-%m-%d') AS booking_date,
            users.fullname,
            users.email,
            rooms.room_name
        FROM bookings
        JOIN users ON bookings.user_id = users.id
        JOIN rooms ON bookings.room_id = rooms.id
        ORDER BY bookings.id DESC
    `;

        db.query(sql, (err, result) => {
            if (err) {
                return res.status(500).json({
                    message: err.message
                });
            }

            return res.json(result);
        });
    });
};

// NOTE: Chuc nang chinh - Dem lich dat phong dang cho admin phe duyet.
exports.getPendingBookingCount = (req, res) => {
    db.query(
        "SELECT COUNT(*) AS total FROM bookings WHERE status = 'pending'",
        (err, result) => {
            if (err) {
                return res.status(500).json({
                    message: err.message
                });
            }

            return res.json({
                total: result[0]?.total || 0
            });
        }
    );
};

// NOTE: Chuc nang chinh - Tong hop so lieu nhanh cho dashboard admin.
exports.dashboard = (req, res) => {
    const dashboard = {};

    db.query("SELECT COUNT(*) totalRooms FROM rooms", (roomErr, rooms) => {
        if (roomErr) {
            return res.status(500).json({
                message: roomErr.message
            });
        }

        dashboard.totalRooms = rooms[0].totalRooms;

        db.query("SELECT COUNT(*) totalUsers FROM users", (userErr, users) => {
            if (userErr) {
                return res.status(500).json({
                    message: userErr.message
                });
            }

            dashboard.totalUsers = users[0].totalUsers;

            db.query(
                "SELECT COUNT(*) totalBookings FROM bookings",
                (bookingErr, bookings) => {
                    if (bookingErr) {
                        return res.status(500).json({
                            message: bookingErr.message
                        });
                    }

                    dashboard.totalBookings = bookings[0].totalBookings;

                    db.query(
                        "SELECT COUNT(*) pendingBookings FROM bookings WHERE status='pending'",
                        (pendingErr, pending) => {
                            if (pendingErr) {
                                return res.status(500).json({
                                    message: pendingErr.message
                                });
                            }

                            dashboard.pendingBookings =
                                pending[0].pendingBookings;

                            return res.json(dashboard);
                        }
                    );
                }
            );
        });
    });
};

// NOTE: Chuc nang chinh - Sinh vien xem lich cua toi kem du lieu danh gia da gui.
exports.getMyBookings = (req, res) => {
    const userId = req.user.id;

    refreshNoShows(() => {
        const sql = `
        SELECT
            bookings.*,
            DATE_FORMAT(bookings.booking_date, '%Y-%m-%d') AS booking_date,
            rooms.room_name,
            room_reviews.rating AS my_rating,
            room_reviews.comment AS my_review_comment,
            room_reviews.updated_at AS my_review_updated_at
        FROM bookings
        JOIN rooms ON bookings.room_id = rooms.id
        LEFT JOIN room_reviews
            ON room_reviews.room_id = bookings.room_id
            AND room_reviews.user_id = bookings.user_id
        WHERE bookings.user_id = ?
        ORDER BY bookings.id DESC
    `;

        db.query(sql, [userId], (err, result) => {
            if (err) {
                return res.status(500).json({
                    message: err.message
                });
            }

            return res.json(result.map(hideEarlyCheckinCode));
        });
    });
};

// NOTE: Chuc nang chinh - Lay lich theo phong/ngay de hien thi calendar.
exports.getRoomSchedule = (req, res) => {
    const { roomId } = req.params;
    const { date } = req.query;

    if (!date) {
        return res.status(400).json({
            message: "Vui long chon ngay can xem lich"
        });
    }

    const sql = `
        SELECT
            bookings.id,
            DATE_FORMAT(bookings.booking_date, '%Y-%m-%d') AS booking_date,
            bookings.start_time,
            bookings.end_time,
            bookings.status,
            bookings.purpose,
            bookings.participants,
            users.fullname,
            'booking' AS item_type
        FROM bookings
        JOIN users ON bookings.user_id = users.id
        WHERE bookings.room_id = ?
        AND bookings.booking_date = ?
        AND bookings.status IN ('pending', 'approved')
        UNION ALL
        SELECT
            maintenance_schedules.id,
            DATE_FORMAT(maintenance_schedules.maintenance_date, '%Y-%m-%d') AS booking_date,
            maintenance_schedules.start_time,
            maintenance_schedules.end_time,
            maintenance_schedules.status,
            maintenance_schedules.reason AS purpose,
            NULL AS participants,
            'Admin' AS fullname,
            'maintenance' AS item_type
        FROM maintenance_schedules
        WHERE maintenance_schedules.room_id = ?
        AND maintenance_schedules.maintenance_date = ?
        AND maintenance_schedules.status = 'scheduled'
        ORDER BY start_time ASC
    `;

    db.query(sql, [roomId, date, roomId, date], (err, result) => {
        if (err) {
            return res.status(500).json({
                message: err.message
            });
        }

        return res.json(result);
    });
};

// NOTE: Chuc nang chinh - Sinh vien check-in lich da duoc duyet.
exports.checkInBooking = (req, res) => {
    const bookingId = req.params.id;
    const userId = req.user.id;
    const { checkin_code } = req.body;

    if (!checkin_code) {
        return res.status(400).json({
            message: "Vui long nhap ma check-in"
        });
    }

    const sql = `
        SELECT *
        FROM bookings
        WHERE id = ?
        AND user_id = ?
        AND status = 'approved'
    `;

    db.query(sql, [bookingId, userId], (err, result) => {
        if (err) {
            return res.status(500).json({
                message: err.message
            });
        }

        if (result.length === 0) {
            return res.status(404).json({
                message: "Khong tim thay lich dat phong can check-in"
            });
        }

        const booking = result[0];

        if (booking.checked_in_at) {
            return res.status(400).json({
                message: "Lich nay da check-in"
            });
        }

        const bookingStartAt = getBookingDateTime(booking.booking_date, booking.start_time);
        const bookingEndAt = getBookingDateTime(booking.booking_date, booking.end_time);
        const earliestCheckinAt = new Date(
            bookingStartAt.getTime() - CHECKIN_EARLY_MINUTES * 60 * 1000
        );

        if (new Date() < earliestCheckinAt) {
            return res.status(400).json({
                message: "Chi duoc check-in som toi da 2 gio truoc gio bat dau"
            });
        }

        if (booking.no_show || bookingEndAt < new Date()) {
            return res.status(400).json({
                message: "Lich nay da qua gio check-in"
            });
        }

        const storedCode = normalizeCheckinCode(booking.checkin_code);
        const submittedCode = normalizeCheckinCode(checkin_code);

        if (!storedCode) {
            return res.status(400).json({
                message: "Lich nay chua co ma check-in, vui long lien he admin"
            });
        }

        if (storedCode !== submittedCode) {
            return res.status(400).json({
                message: "Ma check-in khong dung"
            });
        }

        db.query(
            "UPDATE bookings SET checked_in_at = NOW() WHERE id = ?",
            [bookingId],
            (updateErr) => {
                if (updateErr) {
                    return res.status(500).json({
                        message: updateErr.message
                    });
                }

                return res.json({
                    message: "Check-in thanh cong"
                });
            }
        );
    });
};

// NOTE: Chuc nang chinh - Thong ke top phong duoc dat nhieu.
exports.roomStatistics = (req, res) => {
    const sql = `
        SELECT rooms.room_name, COUNT(bookings.id) AS total
        FROM rooms
        LEFT JOIN bookings ON rooms.id = bookings.room_id
        GROUP BY rooms.id
        ORDER BY total DESC
    `;

    db.query(sql, (err, result) => {
        if (err) {
            return res.status(500).json({
                message: err.message
            });
        }

        return res.json(result);
    });
};

// NOTE: Chuc nang chinh - Thong ke so luong lich theo trang thai.
exports.bookingStatusStatistics = (req, res) => {
    refreshNoShows(() => {
        const sql = `
        SELECT status, COUNT(*) AS total
        FROM bookings
        GROUP BY status
    `;

        db.query(sql, (err, result) => {
            if (err) {
                return res.status(500).json({
                    message: err.message
                });
            }

            return res.json(result);
        });
    });
};

// NOTE: Chuc nang chinh - Bao cao nang cao cho bieu do dashboard.
exports.advancedStatistics = (req, res) => {
    const stats = {};

    const monthlySql = `
        SELECT
            DATE_FORMAT(booking_date, '%Y-%m') AS month,
            COUNT(*) AS total
        FROM bookings
        GROUP BY DATE_FORMAT(booking_date, '%Y-%m')
        ORDER BY month ASC
        LIMIT 12
    `;

    db.query(monthlySql, (monthlyErr, monthlyBookings) => {
        if (monthlyErr) {
            return res.status(500).json({
                message: monthlyErr.message
            });
        }

        stats.monthlyBookings = monthlyBookings;

        const topRoomsSql = `
            SELECT
                rooms.room_name,
                COUNT(bookings.id) AS total
            FROM rooms
            LEFT JOIN bookings ON rooms.id = bookings.room_id
            GROUP BY rooms.id
            ORDER BY total DESC
            LIMIT 5
        `;

        db.query(topRoomsSql, (roomsErr, topRooms) => {
            if (roomsErr) {
                return res.status(500).json({
                    message: roomsErr.message
                });
            }

            stats.topRooms = topRooms;

            const topUsersSql = `
                SELECT
                    users.fullname,
                    users.email,
                    COUNT(bookings.id) AS total
                FROM users
                JOIN bookings ON users.id = bookings.user_id
                GROUP BY users.id
                ORDER BY total DESC
                LIMIT 5
            `;

            db.query(topUsersSql, (usersErr, topUsers) => {
                if (usersErr) {
                    return res.status(500).json({
                        message: usersErr.message
                    });
                }

                stats.topUsers = topUsers;

                const ratingSql = `
                    SELECT
                        rooms.room_name,
                        ROUND(AVG(room_reviews.rating), 1) AS average_rating,
                        COUNT(room_reviews.id) AS review_count
                    FROM rooms
                    JOIN room_reviews ON rooms.id = room_reviews.room_id
                    GROUP BY rooms.id
                    ORDER BY average_rating DESC, review_count DESC
                    LIMIT 5
                `;

                db.query(ratingSql, (ratingErr, topRatedRooms) => {
                    if (ratingErr) {
                        return res.status(500).json({
                            message: ratingErr.message
                        });
                    }

                    stats.topRatedRooms = topRatedRooms;

                    const maintenanceSql = `
                        SELECT
                            rooms.room_name,
                            COUNT(maintenance_schedules.id) AS total
                        FROM rooms
                        JOIN maintenance_schedules
                            ON rooms.id = maintenance_schedules.room_id
                        GROUP BY rooms.id
                        ORDER BY total DESC
                        LIMIT 5
                    `;

                    db.query(maintenanceSql, (maintenanceErr, maintenanceRooms) => {
                        if (maintenanceErr) {
                            return res.status(500).json({
                                message: maintenanceErr.message
                            });
                        }

                        stats.maintenanceRooms = maintenanceRooms;

                        return res.json(stats);
                    });
                });
            });
        });
    });
};
