const db = require("../config/db");

/*
====================================
LẤY DANH SÁCH THÔNG BÁO
====================================
*/
exports.getNotifications = (req, res) => {

    const userId = req.user.id;

    const sql = `
        SELECT *
        FROM notifications
        WHERE user_id = ?
        ORDER BY created_at DESC
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

/*
====================================
ĐÁNH DẤU ĐÃ ĐỌC
====================================
*/
exports.markAsRead = (req, res) => {

    const notificationId = req.params.id;
    const userId = req.user.id;

    const sql = `
        UPDATE notifications
        SET is_read = true
        WHERE id = ?
        AND user_id = ?
    `;

    db.query(sql, [notificationId, userId], (err) => {

        if (err) {
            return res.status(500).json({
                message: err.message
            });
        }

        return res.json({
            message: "Đã đánh dấu đã đọc"
        });

    });

};

/*
====================================
ĐÁNH DẤU TẤT CẢ ĐÃ ĐỌC
====================================
*/
exports.markAllAsRead = (req, res) => {

    const userId = req.user.id;

    const sql = `
        UPDATE notifications
        SET is_read = true
        WHERE user_id = ?
    `;

    db.query(sql, [userId], (err) => {

        if (err) {
            return res.status(500).json({
                message: err.message
            });
        }

        return res.json({
            message: "Đã đánh dấu tất cả đã đọc"
        });

    });

};

exports.unreadCount = (req, res) => {

    const userId = req.user.id;

    const sql = `
        SELECT COUNT(*) AS total
        FROM notifications
        WHERE user_id = ?
        AND is_read = false
    `;

    db.query(sql, [userId], (err, result) => {

        if (err) {
            return res.status(500).json({
                message: err.message
            });
        }

        return res.json({
            total: result[0].total
        });

    });

};
