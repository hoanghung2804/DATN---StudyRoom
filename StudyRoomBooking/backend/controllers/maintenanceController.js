const db = require("../config/db");

function hasInvalidTime(startTime, endTime) {
    return !startTime || !endTime || startTime >= endTime;
}

// NOTE: Chuc nang chinh - Admin xem danh sach lich bao tri phong.
exports.getMaintenanceSchedules = (req, res) => {
    const sql = `
        SELECT
            maintenance_schedules.*,
            rooms.room_name,
            users.fullname AS created_by_name
        FROM maintenance_schedules
        JOIN rooms ON maintenance_schedules.room_id = rooms.id
        JOIN users ON maintenance_schedules.created_by = users.id
        ORDER BY maintenance_date DESC, start_time ASC
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

// NOTE: Chuc nang chinh - Admin tao lich bao tri va chan dat phong bi trung gio.
exports.createMaintenanceSchedule = (req, res) => {
    const {
        room_id,
        maintenance_date,
        start_time,
        end_time,
        reason
    } = req.body;

    if (
        !room_id ||
        !maintenance_date ||
        hasInvalidTime(start_time, end_time) ||
        !reason
    ) {
        return res.status(400).json({
            message: "Vui long nhap day du thong tin bao tri"
        });
    }

    const bookingConflictSql = `
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
        bookingConflictSql,
        [room_id, maintenance_date, end_time, start_time],
        (bookingErr, bookingResult) => {
            if (bookingErr) {
                return res.status(500).json({
                    message: bookingErr.message
                });
            }

            if (bookingResult.length > 0) {
                return res.status(400).json({
                    message: "Phong da co lich dat trong khung gio nay"
                });
            }

            const maintenanceConflictSql = `
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
                maintenanceConflictSql,
                [room_id, maintenance_date, end_time, start_time],
                (maintenanceErr, maintenanceResult) => {
                    if (maintenanceErr) {
                        return res.status(500).json({
                            message: maintenanceErr.message
                        });
                    }

                    if (maintenanceResult.length > 0) {
                        return res.status(400).json({
                            message: "Phong da co lich bao tri trung thoi gian"
                        });
                    }

                    const insertSql = `
                        INSERT INTO maintenance_schedules
                        (
                            room_id,
                            maintenance_date,
                            start_time,
                            end_time,
                            reason,
                            created_by
                        )
                        VALUES (?, ?, ?, ?, ?, ?)
                    `;

                    db.query(
                        insertSql,
                        [
                            room_id,
                            maintenance_date,
                            start_time,
                            end_time,
                            reason,
                            req.user.id
                        ],
                        (insertErr) => {
                            if (insertErr) {
                                return res.status(500).json({
                                    message: insertErr.message
                                });
                            }

                            return res.status(201).json({
                                message: "Tao lich bao tri thanh cong"
                            });
                        }
                    );
                }
            );
        }
    );
};

// NOTE: Chuc nang chinh - Admin cap nhat trang thai bao tri.
exports.updateMaintenanceStatus = (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!["scheduled", "completed", "cancelled"].includes(status)) {
        return res.status(400).json({
            message: "Trang thai bao tri khong hop le"
        });
    }

    db.query(
        "UPDATE maintenance_schedules SET status = ? WHERE id = ?",
        [status, id],
        (err) => {
            if (err) {
                return res.status(500).json({
                    message: err.message
                });
            }

            return res.json({
                message: "Cap nhat lich bao tri thanh cong"
            });
        }
    );
};

// NOTE: Chuc nang chinh - Admin xoa lich bao tri khong con su dung.
exports.deleteMaintenanceSchedule = (req, res) => {
    const { id } = req.params;

    db.query(
        "DELETE FROM maintenance_schedules WHERE id = ?",
        [id],
        (err) => {
            if (err) {
                return res.status(500).json({
                    message: err.message
                });
            }

            return res.json({
                message: "Xoa lich bao tri thanh cong"
            });
        }
    );
};
