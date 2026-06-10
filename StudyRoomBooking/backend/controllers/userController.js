const bcrypt = require("bcrypt");
const db = require("../config/db");

function normalizeRole(role) {
    return ["admin", "student"].includes(role) ? role : "student";
}

function validateStudentPassword(password) {
    if (!password || password.length < 8) {
        return "Mật khẩu sinh viên phải có tối thiểu 8 ký tự";
    }

    if (!/[A-Z]/.test(password)) {
        return "Mật khẩu sinh viên phải có ít nhất 1 chữ viết hoa";
    }

    if (!/[^A-Za-z0-9]/.test(password)) {
        return "Mật khẩu sinh viên phải có ít nhất 1 ký tự đặc biệt";
    }

    return "";
}

function validatePasswordByRole(password, role) {
    if (role === "student") {
        return validateStudentPassword(password);
    }

    if (!password || password.length < 6) {
        return "Mật khẩu mới nên có tối thiểu 6 ký tự";
    }

    return "";
}

// NOTE: Chuc nang chinh - Admin xem, loc va thong ke tai khoan trong he thong.
exports.listUsers = (req, res) => {
    const role = req.query.role;
    const keyword = `%${req.query.keyword || ""}%`;
    const params = [];

    let roleFilter = "";

    if (role && ["admin", "student"].includes(role)) {
        roleFilter = "AND u.role = ?";
        params.push(role);
    }

    params.push(keyword, keyword, keyword);

    const sql = `
        SELECT
            u.id,
            u.fullname,
            u.email,
            u.role,
            u.avatar_url,
            u.created_at,
            COALESCE(bs.total_bookings, 0) AS total_bookings,
            COALESCE(bs.approved_bookings, 0) AS approved_bookings,
            COALESCE(bs.pending_bookings, 0) AS pending_bookings,
            COALESCE(bs.checked_in_count, 0) AS checked_in_count,
            COALESCE(rs.review_count, 0) AS review_count
        FROM users u
        LEFT JOIN (
            SELECT
                user_id,
                COUNT(*) AS total_bookings,
                SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) AS approved_bookings,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending_bookings,
                SUM(CASE WHEN checked_in_at IS NOT NULL THEN 1 ELSE 0 END) AS checked_in_count
            FROM bookings
            GROUP BY user_id
        ) bs ON bs.user_id = u.id
        LEFT JOIN (
            SELECT
                user_id,
                COUNT(*) AS review_count
            FROM room_reviews
            GROUP BY user_id
        ) rs ON rs.user_id = u.id
        WHERE 1 = 1
            ${roleFilter}
            AND (
                u.fullname LIKE ?
                OR u.email LIKE ?
                OR u.role LIKE ?
            )
        ORDER BY u.created_at DESC, u.id DESC
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

// NOTE: Chuc nang chinh - Admin tao tai khoan hoc sinh hoac quan tri vien.
exports.createUser = async (req, res) => {
    try {
        const {
            fullname,
            email,
            password,
            role = "student"
        } = req.body;

        if (!fullname || !email || !password) {
            return res.status(400).json({
                message: "Vui lòng nhập đầy đủ họ tên, email và mật khẩu"
            });
        }

        const safeRole = normalizeRole(role);
        const passwordError = validatePasswordByRole(password, safeRole);

        if (passwordError) {
            return res.status(400).json({
                message: passwordError
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        db.query(
            "SELECT id FROM users WHERE email = ?",
            [email],
            (checkErr, users) => {
                if (checkErr) {
                    return res.status(500).json({
                        message: checkErr.message
                    });
                }

                if (users.length > 0) {
                    return res.status(400).json({
                        message: "Email đã tồn tại"
                    });
                }

                db.query(
                    `
                        INSERT INTO users
                            (fullname, email, password, role)
                        VALUES (?, ?, ?, ?)
                    `,
                    [fullname, email, hashedPassword, safeRole],
                    (insertErr, result) => {
                        if (insertErr) {
                            return res.status(500).json({
                                message: insertErr.message
                            });
                        }

                        return res.status(201).json({
                            message: "Tạo tài khoản thành công",
                            id: result.insertId
                        });
                    }
                );
            }
        );
    } catch (error) {
        return res.status(500).json({
            message: error.message
        });
    }
};

// NOTE: Chuc nang chinh - Admin cap nhat ho ten va vai tro tai khoan.
exports.updateUser = (req, res) => {
    const userId = Number(req.params.id);
    const {
        fullname,
        role
    } = req.body;

    if (!fullname || !role) {
        return res.status(400).json({
            message: "Vui lòng nhập họ tên và vai trò"
        });
    }

    const safeRole = normalizeRole(role);

    db.query(
        "UPDATE users SET fullname = ?, role = ? WHERE id = ?",
        [fullname, safeRole, userId],
        (err, result) => {
            if (err) {
                return res.status(500).json({
                    message: err.message
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    message: "Không tìm thấy tài khoản"
                });
            }

            return res.json({
                message: "Cập nhật tài khoản thành công"
            });
        }
    );
};

// NOTE: Chuc nang chinh - Admin dat lai mat khau truc tiep cho nguoi dung.
exports.resetPassword = async (req, res) => {
    try {
        const userId = Number(req.params.id);
        const { newPassword } = req.body;

        if (!newPassword) {
            return res.status(400).json({
                message: "Vui lòng nhập mật khẩu mới"
            });
        }

        db.query(
            "SELECT id, role FROM users WHERE id = ?",
            [userId],
            async (findErr, users) => {
                if (findErr) {
                    return res.status(500).json({
                        message: findErr.message
                    });
                }

                if (users.length === 0) {
                    return res.status(404).json({
                        message: "Không tìm thấy tài khoản"
                    });
                }

                const passwordError = validatePasswordByRole(newPassword, users[0].role);

                if (passwordError) {
                    return res.status(400).json({
                        message: passwordError
                    });
                }

                const hashedPassword = await bcrypt.hash(newPassword, 10);

                db.query(
                    "UPDATE users SET password = ? WHERE id = ?",
                    [hashedPassword, userId],
                    (err, result) => {
                if (err) {
                    return res.status(500).json({
                        message: err.message
                    });
                }

                if (result.affectedRows === 0) {
                    return res.status(404).json({
                        message: "Không tìm thấy tài khoản"
                    });
                }

                return res.json({
                    message: "Đặt lại mật khẩu thành công"
                });
                    }
                );
            }
        );
    } catch (error) {
        return res.status(500).json({
            message: error.message
        });
    }
};

// NOTE: Chuc nang chinh - Admin xoa hoc sinh va don cac du lieu lien quan.
exports.deleteStudent = (req, res) => {
    const userId = Number(req.params.id);
    const adminId = req.user.id;

    db.query(
        "SELECT id, role FROM users WHERE id = ?",
        [userId],
        (findErr, users) => {
            if (findErr) {
                return res.status(500).json({
                    message: findErr.message
                });
            }

            if (users.length === 0) {
                return res.status(404).json({
                    message: "Không tìm thấy tài khoản"
                });
            }

            if (users[0].role !== "student") {
                return res.status(400).json({
                    message: "Chỉ được xóa tài khoản học sinh"
                });
            }

            db.beginTransaction((transactionErr) => {
                if (transactionErr) {
                    return res.status(500).json({
                        message: transactionErr.message
                    });
                }

                const rollback = (err) => {
                    db.rollback(() => {
                        return res.status(500).json({
                            message: err.message
                        });
                    });
                };

                db.query(
                    "UPDATE bookings SET reviewed_by = NULL WHERE reviewed_by = ?",
                    [userId],
                    (reviewedErr) => {
                        if (reviewedErr) return rollback(reviewedErr);

                        db.query(
                            "UPDATE maintenance_schedules SET created_by = ? WHERE created_by = ?",
                            [adminId, userId],
                            (maintenanceErr) => {
                                if (maintenanceErr) return rollback(maintenanceErr);

                                db.query(
                                    "DELETE FROM room_reviews WHERE user_id = ?",
                                    [userId],
                                    (reviewErr) => {
                                        if (reviewErr) return rollback(reviewErr);

                                        db.query(
                                            "DELETE FROM notifications WHERE user_id = ?",
                                            [userId],
                                            (notificationErr) => {
                                                if (notificationErr) return rollback(notificationErr);

                                                db.query(
                                                    "DELETE FROM password_reset_requests WHERE user_id = ?",
                                                    [userId],
                                                    (passwordRequestErr) => {
                                                        if (passwordRequestErr) return rollback(passwordRequestErr);

                                                        db.query(
                                                            "DELETE FROM bookings WHERE user_id = ?",
                                                            [userId],
                                                            (bookingErr) => {
                                                                if (bookingErr) return rollback(bookingErr);

                                                                db.query(
                                                                    "DELETE FROM users WHERE id = ? AND role = 'student'",
                                                                    [userId],
                                                                    (deleteErr) => {
                                                                        if (deleteErr) return rollback(deleteErr);

                                                                        db.commit((commitErr) => {
                                                                            if (commitErr) return rollback(commitErr);

                                                                            return res.json({
                                                                                message: "Xóa học sinh thành công"
                                                                            });
                                                                        });
                                                                    }
                                                                );
                                                            }
                                                        );
                                                    }
                                                );
                                            }
                                        );
                                    }
                                );
                            }
                        );
                    }
                );
            });
        }
    );
};
