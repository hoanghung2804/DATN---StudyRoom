const express = require("express");
const router = express.Router();

const notificationController =
    require("../controllers/notificationController");

const verifyToken =
    require("../middleware/authMiddleware");

router.get(
    "/",
    verifyToken,
    notificationController.getNotifications
);

router.get(
    "/unread-count",
    verifyToken,
    notificationController.unreadCount
);

router.put(
    "/read/:id",
    verifyToken,
    notificationController.markAsRead
);

router.put(
    "/read-all",
    verifyToken,
    notificationController.markAllAsRead
);

module.exports = router;
