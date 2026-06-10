const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const db = require("../config/db");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

function normalizeEmail(email) {
    return String(email || "").trim().toLowerCase();
}

function isAllowedEmail(email) {
    const allowedDomain = String(process.env.ALLOWED_EMAIL_DOMAIN || "").trim().toLowerCase();

    if (!allowedDomain) {
        return true;
    }

    return normalizeEmail(email).endsWith(`@${allowedDomain}`);
}

function createAuthPayload(user) {
    const token = jwt.sign(
        {
            id: user.id,
            email: user.email,
            role: user.role
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "1d"
        }
    );

    return {
        token,
        user: {
            id: user.id,
            fullname: user.fullname,
            email: user.email,
            role: user.role,
            avatar_url: user.avatar_url || null
        }
    };
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

// NOTE: Chuc nang chinh - Dang ky tai khoan sinh vien bang email va mat khau.
exports.register = async (req, res) => {
    try {
        const { fullname, password } = req.body;
        const email = normalizeEmail(req.body.email);

        if (!fullname || !email || !password) {
            return res.status(400).json({
                message: "Vui lòng nhập đầy đủ thông tin"
            });
        }

        if (!isAllowedEmail(email)) {
            return res.status(403).json({
                message: "Email này không thuộc phạm vi được phép đăng ký"
            });
        }

        const passwordError = validateStudentPassword(password);

        if (passwordError) {
            return res.status(400).json({
                message: passwordError
            });
        }

        db.query(
            "SELECT id FROM users WHERE email = ?",
            [email],
            async (checkErr, users) => {
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

                const hashedPassword = await bcrypt.hash(password, 10);

                db.query(
                    "INSERT INTO users (fullname, email, password, role) VALUES (?, ?, ?, 'student')",
                    [fullname, email, hashedPassword],
                    (insertErr) => {
                        if (insertErr) {
                            return res.status(500).json({
                                message: insertErr.message
                            });
                        }

                        return res.status(201).json({
                            message: "Đăng ký thành công"
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

// NOTE: Chuc nang chinh - Dang nhap bang email/mat khau va tra JWT cho frontend.
exports.login = (req, res) => {
    const email = normalizeEmail(req.body.email);
    const { password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            message: "Vui lòng nhập email và mật khẩu"
        });
    }

    db.query(
        "SELECT * FROM users WHERE email = ?",
        [email],
        async (err, users) => {
            if (err) {
                return res.status(500).json({
                    message: err.message
                });
            }

            if (users.length === 0) {
                return res.status(404).json({
                    message: "Email không tồn tại"
                });
            }

            const user = users[0];
            const passwordLooksHashed =
                typeof user.password === "string" &&
                user.password.startsWith("$2");

            const isMatch = passwordLooksHashed
                ? await bcrypt.compare(password, user.password)
                : password === user.password;

            if (!isMatch) {
                return res.status(400).json({
                    message: "Sai mật khẩu"
                });
            }

            if (!passwordLooksHashed) {
                const hashedPassword = await bcrypt.hash(password, 10);
                db.query(
                    "UPDATE users SET password = ? WHERE id = ?",
                    [hashedPassword, user.id]
                );
            }

            return res.json({
                message: "Đăng nhập thành công",
                ...createAuthPayload(user)
            });
        }
    );
};

// NOTE: Chuc nang chinh - Dang nhap bang Google OAuth, tu tao tai khoan sinh vien neu can.
exports.googleLogin = async (req, res) => {
    try {
        const { credential } = req.body;

        if (!process.env.GOOGLE_CLIENT_ID) {
            return res.status(500).json({
                message: "Chưa cấu hình GOOGLE_CLIENT_ID cho backend"
            });
        }

        if (!credential) {
            return res.status(400).json({
                message: "Thiếu mã xác thực Google"
            });
        }

        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();

        if (!payload?.email || !payload.email_verified) {
            return res.status(400).json({
                message: "Email Google chưa được xác thực"
            });
        }

        const email = normalizeEmail(payload.email);

        if (!isAllowedEmail(email)) {
            return res.status(403).json({
                message: "Email Google này không thuộc phạm vi được phép đăng nhập"
            });
        }

        const fullname = payload.name || email.split("@")[0];
        const avatarUrl = payload.picture || null;

        db.query(
            "SELECT * FROM users WHERE email = ?",
            [email],
            async (findErr, users) => {
                if (findErr) {
                    return res.status(500).json({
                        message: findErr.message
                    });
                }

                if (users.length > 0) {
                    const user = users[0];

                    if (avatarUrl && !user.avatar_url) {
                        db.query(
                            "UPDATE users SET avatar_url = ? WHERE id = ?",
                            [avatarUrl, user.id]
                        );
                    }

                    return res.json({
                        message: "Đăng nhập Google thành công",
                        ...createAuthPayload({
                            ...user,
                            avatar_url: user.avatar_url || avatarUrl
                        })
                    });
                }

                const randomPassword = await bcrypt.hash(
                    `google:${payload.sub}:${Date.now()}`,
                    10
                );

                db.query(
                    `
                        INSERT INTO users
                            (fullname, email, password, role, avatar_url)
                        VALUES (?, ?, ?, 'student', ?)
                    `,
                    [fullname, email, randomPassword, avatarUrl],
                    (insertErr, result) => {
                        if (insertErr) {
                            return res.status(500).json({
                                message: insertErr.message
                            });
                        }

                        return res.status(201).json({
                            message: "Đăng nhập Google thành công",
                            ...createAuthPayload({
                                id: result.insertId,
                                fullname,
                                email,
                                role: "student",
                                avatar_url: avatarUrl
                            })
                        });
                    }
                );
            }
        );
    } catch (error) {
        return res.status(401).json({
            message: "Không thể xác thực tài khoản Google"
        });
    }
};

// NOTE: Chuc nang chinh - Sinh vien gui yeu cau dat mat khau moi cho admin duyet.
exports.forgotPassword = async (req, res) => {
    const email = normalizeEmail(req.body.email);
    const { newPassword, confirmPassword, note } = req.body;

    if (!email || !newPassword || !confirmPassword) {
        return res.status(400).json({
            message: "Vui lòng nhập email và mật khẩu mới"
        });
    }

    if (newPassword !== confirmPassword) {
        return res.status(400).json({
            message: "Mật khẩu xác nhận không khớp"
        });
    }

    db.query(
        "SELECT id, fullname, email, role FROM users WHERE email = ?",
        [email],
        async (err, users) => {
            if (err) {
                return res.status(500).json({
                    message: err.message
                });
            }

            if (users.length === 0) {
                return res.status(404).json({
                    message: "Không tìm thấy tài khoản với email này"
                });
            }

            const user = users[0];
            const passwordError = validatePasswordByRole(newPassword, user.role);

            if (passwordError) {
                return res.status(400).json({
                    message: passwordError
                });
            }

            const hashedPassword = await bcrypt.hash(newPassword, 10);

            db.query(
                `
                    SELECT id
                    FROM password_reset_requests
                    WHERE user_id = ?
                    AND status = 'pending'
                    LIMIT 1
                `,
                [user.id],
                (pendingErr, requests) => {
                    if (pendingErr) {
                        return res.status(500).json({
                            message: pendingErr.message
                        });
                    }

                    if (requests.length > 0) {
                        return db.query(
                            `
                                UPDATE password_reset_requests
                                SET
                                    requested_password_hash = ?,
                                    note = ?,
                                    updated_at = CURRENT_TIMESTAMP
                                WHERE id = ?
                            `,
                            [hashedPassword, note || null, requests[0].id],
                            (updateErr) => {
                                if (updateErr) {
                                    return res.status(500).json({
                                        message: updateErr.message
                                    });
                                }

                                return res.json({
                                    message: "Đã cập nhật yêu cầu đặt lại mật khẩu. Vui lòng chờ admin phê duyệt."
                                });
                            }
                        );
                    }

                    db.query(
                        `
                            INSERT INTO password_reset_requests
                                (user_id, requested_password_hash, note)
                            VALUES (?, ?, ?)
                        `,
                        [user.id, hashedPassword, note || null],
                        (insertErr) => {
                            if (insertErr) {
                                return res.status(500).json({
                                    message: insertErr.message
                                });
                            }

                            return res.status(201).json({
                                message: "Đã gửi yêu cầu đặt lại mật khẩu. Vui lòng chờ admin phê duyệt."
                            });
                        }
                    );
                }
            );
        }
    );
};

// NOTE: Chuc nang chinh - Admin xem danh sach yeu cau dat lai mat khau.
exports.getPasswordResetRequests = (req, res) => {
    db.query(
        `
            SELECT
                requests.id,
                requests.user_id,
                requests.note,
                requests.status,
                requests.admin_note,
                requests.reviewed_at,
                requests.created_at,
                requests.updated_at,
                users.fullname,
                users.email,
                admins.fullname AS reviewed_by_name
            FROM password_reset_requests AS requests
            JOIN users ON users.id = requests.user_id
            LEFT JOIN users AS admins ON admins.id = requests.reviewed_by
            ORDER BY
                FIELD(requests.status, 'pending', 'approved', 'rejected'),
                requests.created_at DESC
        `,
        (err, requests) => {
            if (err) {
                return res.status(500).json({
                    message: err.message
                });
            }

            return res.json(requests);
        }
    );
};

// NOTE: Chuc nang chinh - Dem yeu cau dat lai mat khau dang cho admin xu ly.
exports.getPasswordResetPendingCount = (req, res) => {
    db.query(
        `
            SELECT COUNT(*) AS total
            FROM password_reset_requests
            WHERE status = 'pending'
        `,
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

// NOTE: Chuc nang chinh - Admin phe duyet va cap nhat mat khau moi cho sinh vien.
exports.approvePasswordResetRequest = (req, res) => {
    const { id } = req.params;

    db.query(
        `
            SELECT *
            FROM password_reset_requests
            WHERE id = ?
            AND status = 'pending'
            LIMIT 1
        `,
        [id],
        (err, requests) => {
            if (err) {
                return res.status(500).json({
                    message: err.message
                });
            }

            if (requests.length === 0) {
                return res.status(404).json({
                    message: "Không tìm thấy yêu cầu chờ duyệt"
                });
            }

            const request = requests[0];

            db.beginTransaction((transactionErr) => {
                if (transactionErr) {
                    return res.status(500).json({
                        message: transactionErr.message
                    });
                }

                db.query(
                    "UPDATE users SET password = ? WHERE id = ?",
                    [request.requested_password_hash, request.user_id],
                    (updateUserErr) => {
                        if (updateUserErr) {
                            return db.rollback(() =>
                                res.status(500).json({
                                    message: updateUserErr.message
                                })
                            );
                        }

                        db.query(
                            `
                                UPDATE password_reset_requests
                                SET
                                    status = 'approved',
                                    reviewed_by = ?,
                                    reviewed_at = NOW(),
                                    updated_at = CURRENT_TIMESTAMP
                                WHERE id = ?
                            `,
                            [req.user.id, id],
                            (updateRequestErr) => {
                                if (updateRequestErr) {
                                    return db.rollback(() =>
                                        res.status(500).json({
                                            message: updateRequestErr.message
                                        })
                                    );
                                }

                                db.commit((commitErr) => {
                                    if (commitErr) {
                                        return db.rollback(() =>
                                            res.status(500).json({
                                                message: commitErr.message
                                            })
                                        );
                                    }

                                    return res.json({
                                        message: "Đã duyệt yêu cầu và cập nhật mật khẩu mới"
                                    });
                                });
                            }
                        );
                    }
                );
            });
        }
    );
};

// NOTE: Chuc nang chinh - Admin tu choi yeu cau dat lai mat khau.
exports.rejectPasswordResetRequest = (req, res) => {
    const { id } = req.params;
    const { admin_note } = req.body;

    db.query(
        `
            UPDATE password_reset_requests
            SET
                status = 'rejected',
                admin_note = ?,
                reviewed_by = ?,
                reviewed_at = NOW(),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
            AND status = 'pending'
        `,
        [admin_note || null, req.user.id, id],
        (err, result) => {
            if (err) {
                return res.status(500).json({
                    message: err.message
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    message: "Không tìm thấy yêu cầu chờ duyệt"
                });
            }

            return res.json({
                message: "Đã từ chối yêu cầu đặt lại mật khẩu"
            });
        }
    );
};

// NOTE: Chuc nang chinh - Lay ho so ca nhan cua tai khoan dang dang nhap.
exports.getProfile = (req, res) => {
    db.query(
        `
            SELECT
                id,
                fullname,
                email,
                role,
                avatar_url,
                created_at
            FROM users
            WHERE id = ?
        `,
        [req.user.id],
        (err, result) => {
            if (err) {
                return res.status(500).json({
                    message: err.message
                });
            }

            if (result.length === 0) {
                return res.status(404).json({
                    message: "Không tìm thấy tài khoản"
                });
            }

            return res.json(result[0]);
        }
    );
};

// NOTE: Chuc nang chinh - Cap nhat ho ten va anh dai dien ca nhan.
exports.updateProfile = (req, res) => {
    const { fullname, avatar_url } = req.body;

    if (!fullname) {
        return res.status(400).json({
            message: "Vui lòng nhập họ tên"
        });
    }

    db.query(
        `
            UPDATE users
            SET
                fullname = ?,
                avatar_url = ?
            WHERE id = ?
        `,
        [fullname, avatar_url || null, req.user.id],
        (err) => {
            if (err) {
                return res.status(500).json({
                    message: err.message
                });
            }

            return res.json({
                message: "Cập nhật hồ sơ thành công"
            });
        }
    );
};

// NOTE: Chuc nang chinh - Nguoi dung doi mat khau khi con nho mat khau cu.
exports.changePassword = (req, res) => {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
        return res.status(400).json({
            message: "Vui lòng nhập đầy đủ thông tin"
        });
    }

    db.query(
        "SELECT * FROM users WHERE id = ?",
        [req.user.id],
        async (err, result) => {
            if (err) {
                return res.status(500).json({
                    message: err.message
                });
            }

            if (result.length === 0) {
                return res.status(404).json({
                    message: "Không tìm thấy tài khoản"
                });
            }

            const user = result[0];
            const passwordError = validatePasswordByRole(newPassword, user.role);

            if (passwordError) {
                return res.status(400).json({
                    message: passwordError
                });
            }

            const isHashed =
                typeof user.password === "string" &&
                user.password.startsWith("$2");

            const isMatch = isHashed
                ? await bcrypt.compare(oldPassword, user.password)
                : oldPassword === user.password;

            if (!isMatch) {
                return res.status(400).json({
                    message: "Mật khẩu cũ không đúng"
                });
            }

            const hashedPassword = await bcrypt.hash(newPassword, 10);

            db.query(
                "UPDATE users SET password = ? WHERE id = ?",
                [hashedPassword, req.user.id],
                (updateErr) => {
                    if (updateErr) {
                        return res.status(500).json({
                            message: updateErr.message
                        });
                    }

                    return res.json({
                        message: "Đổi mật khẩu thành công"
                    });
                }
            );
        }
    );
};
