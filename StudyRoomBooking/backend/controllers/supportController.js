const db = require("../config/db");

function normalizeCategory(category) {
    const allowed = ["booking", "checkin", "maintenance", "account", "other"];
    return allowed.includes(category) ? category : "other";
}

function normalizeStatus(status) {
    const allowed = ["open", "pending", "closed"];
    return allowed.includes(status) ? status : "open";
}

function canAccessThread(user, thread) {
    return user.role === "admin" || Number(thread.user_id) === Number(user.id);
}

// NOTE: Chuc nang chinh - Sinh vien lay hoi thoai ho tro dang mo gan nhat.
exports.getMyThread = (req, res) => {
    db.query(
        `
            SELECT
                support_threads.*,
                users.fullname,
                users.email
            FROM support_threads
            JOIN users ON users.id = support_threads.user_id
            WHERE support_threads.user_id = ?
            ORDER BY
                FIELD(support_threads.status, 'open', 'pending', 'closed'),
                support_threads.last_message_at DESC
            LIMIT 1
        `,
        [req.user.id],
        (err, threads) => {
            if (err) {
                return res.status(500).json({ message: err.message });
            }

            if (threads.length === 0) {
                return res.json(null);
            }

            return res.json(threads[0]);
        }
    );
};

// NOTE: Chuc nang chinh - Sinh vien tao hoi thoai moi va gui tin nhan dau tien.
exports.createThread = (req, res) => {
    const {
        subject,
        category,
        message
    } = req.body;

    if (!subject || !message) {
        return res.status(400).json({
            message: "Vui lòng nhập tiêu đề và nội dung cần hỗ trợ"
        });
    }

    db.beginTransaction((transactionErr) => {
        if (transactionErr) {
            return res.status(500).json({ message: transactionErr.message });
        }

        const rollback = (err) => {
            db.rollback(() => res.status(500).json({ message: err.message }));
        };

        db.query(
            `
                INSERT INTO support_threads
                    (user_id, subject, category, status, last_message_at)
                VALUES (?, ?, ?, 'open', NOW())
            `,
            [req.user.id, subject, normalizeCategory(category)],
            (threadErr, result) => {
                if (threadErr) return rollback(threadErr);

                const threadId = result.insertId;

                db.query(
                    `
                        INSERT INTO support_messages
                            (thread_id, sender_id, sender_role, message, is_read)
                        VALUES (?, ?, 'student', ?, 0)
                    `,
                    [threadId, req.user.id, message],
                    (messageErr) => {
                        if (messageErr) return rollback(messageErr);

                        db.commit((commitErr) => {
                            if (commitErr) return rollback(commitErr);

                            return res.status(201).json({
                                message: "Đã gửi tin nhắn hỗ trợ",
                                id: threadId
                            });
                        });
                    }
                );
            }
        );
    });
};

// NOTE: Chuc nang chinh - Lay danh sach tin nhan cua mot hoi thoai.
exports.getMessages = (req, res) => {
    const threadId = req.params.id;

    db.query(
        "SELECT * FROM support_threads WHERE id = ?",
        [threadId],
        (threadErr, threads) => {
            if (threadErr) {
                return res.status(500).json({ message: threadErr.message });
            }

            if (threads.length === 0) {
                return res.status(404).json({ message: "Không tìm thấy hội thoại" });
            }

            if (!canAccessThread(req.user, threads[0])) {
                return res.status(403).json({ message: "Bạn không có quyền xem hội thoại này" });
            }

            db.query(
                `
                    SELECT
                        support_messages.*,
                        users.fullname
                    FROM support_messages
                    JOIN users ON users.id = support_messages.sender_id
                    WHERE support_messages.thread_id = ?
                    ORDER BY support_messages.created_at ASC, support_messages.id ASC
                `,
                [threadId],
                (messageErr, messages) => {
                    if (messageErr) {
                        return res.status(500).json({ message: messageErr.message });
                    }

                    return res.json({
                        thread: threads[0],
                        messages
                    });
                }
            );
        }
    );
};

// NOTE: Chuc nang chinh - Gui tin nhan trong hoi thoai ho tro.
exports.sendMessage = (req, res) => {
    const threadId = req.params.id;
    const { message } = req.body;

    if (!message || !message.trim()) {
        return res.status(400).json({ message: "Vui lòng nhập nội dung tin nhắn" });
    }

    db.query(
        "SELECT * FROM support_threads WHERE id = ?",
        [threadId],
        (threadErr, threads) => {
            if (threadErr) {
                return res.status(500).json({ message: threadErr.message });
            }

            if (threads.length === 0) {
                return res.status(404).json({ message: "Không tìm thấy hội thoại" });
            }

            const thread = threads[0];

            if (!canAccessThread(req.user, thread)) {
                return res.status(403).json({ message: "Bạn không có quyền gửi tin nhắn" });
            }

            if (thread.status === "closed") {
                return res.status(400).json({ message: "Hội thoại đã đóng" });
            }

            db.beginTransaction((transactionErr) => {
                if (transactionErr) {
                    return res.status(500).json({ message: transactionErr.message });
                }

                const rollback = (err) => {
                    db.rollback(() => res.status(500).json({ message: err.message }));
                };

                const senderRole = req.user.role === "admin" ? "admin" : "student";
                const nextStatus = senderRole === "admin" ? "pending" : "open";

                db.query(
                    `
                        INSERT INTO support_messages
                            (thread_id, sender_id, sender_role, message, is_read)
                        VALUES (?, ?, ?, ?, 0)
                    `,
                    [threadId, req.user.id, senderRole, message.trim()],
                    (messageErr) => {
                        if (messageErr) return rollback(messageErr);

                        db.query(
                            `
                                UPDATE support_threads
                                SET
                                    status = ?,
                                    assigned_admin_id = IF(? = 'admin', ?, assigned_admin_id),
                                    last_message_at = NOW()
                                WHERE id = ?
                            `,
                            [nextStatus, senderRole, req.user.id, threadId],
                            (updateErr) => {
                                if (updateErr) return rollback(updateErr);

                                db.commit((commitErr) => {
                                    if (commitErr) return rollback(commitErr);

                                    return res.status(201).json({
                                        message: "Đã gửi tin nhắn"
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

// NOTE: Chuc nang chinh - Admin xem va loc danh sach hoi thoai ho tro.
exports.getAdminThreads = (req, res) => {
    const {
        status,
        keyword
    } = req.query;

    const params = [];
    const conditions = [];

    if (status && ["open", "pending", "closed"].includes(status)) {
        conditions.push("support_threads.status = ?");
        params.push(status);
    }

    if (keyword) {
        conditions.push("(support_threads.subject LIKE ? OR users.fullname LIKE ? OR users.email LIKE ?)");
        params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }

    const whereSql = conditions.length
        ? `WHERE ${conditions.join(" AND ")}`
        : "";

    db.query(
        `
            SELECT
                support_threads.*,
                users.fullname,
                users.email,
                admins.fullname AS assigned_admin_name,
                latest.message AS latest_message,
                latest.sender_role AS latest_sender_role
            FROM support_threads
            JOIN users ON users.id = support_threads.user_id
            LEFT JOIN users AS admins ON admins.id = support_threads.assigned_admin_id
            LEFT JOIN support_messages AS latest
                ON latest.id = (
                    SELECT id
                    FROM support_messages
                    WHERE thread_id = support_threads.id
                    ORDER BY created_at DESC, id DESC
                    LIMIT 1
                )
            ${whereSql}
            ORDER BY
                FIELD(support_threads.status, 'open', 'pending', 'closed'),
                support_threads.last_message_at DESC
        `,
        params,
        (err, threads) => {
            if (err) {
                return res.status(500).json({ message: err.message });
            }

            return res.json(threads);
        }
    );
};

// NOTE: Chuc nang chinh - Admin cap nhat trang thai hoi thoai.
exports.updateThreadStatus = (req, res) => {
    const threadId = req.params.id;
    const status = normalizeStatus(req.body.status);

    db.query(
        `
            UPDATE support_threads
            SET
                status = ?,
                assigned_admin_id = IF(assigned_admin_id IS NULL, ?, assigned_admin_id)
            WHERE id = ?
        `,
        [status, req.user.id, threadId],
        (err, result) => {
            if (err) {
                return res.status(500).json({ message: err.message });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: "Không tìm thấy hội thoại" });
            }

            return res.json({ message: "Đã cập nhật trạng thái hội thoại" });
        }
    );
};
