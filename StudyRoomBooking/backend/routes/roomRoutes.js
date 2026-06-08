const express = require("express");
const router = express.Router();

const roomController =
    require("../controllers/roomController");

const verifyToken =
    require("../middleware/authMiddleware");

const isAdmin =
    require("../middleware/adminMiddleware");

/*
====================================
PUBLIC
====================================
*/

// Danh sách phòng
router.get(
    "/",
    roomController.getAllRooms
);

// Chi tiết phòng
router.get(
    "/:id",
    roomController.getRoomById
);

router.get(
    "/:id/reviews",
    verifyToken,
    roomController.getRoomReviews
);

router.post(
    "/:id/reviews",
    verifyToken,
    roomController.createOrUpdateRoomReview
);

/*
====================================
ADMIN
====================================
*/

// Thêm phòng
router.post(
    "/",
    verifyToken,
    isAdmin,
    roomController.createRoom
);

// Sửa phòng
router.put(
    "/:id",
    verifyToken,
    isAdmin,
    roomController.updateRoom
);

// Xóa phòng
router.delete(
    "/:id",
    verifyToken,
    isAdmin,
    roomController.deleteRoom
);

module.exports = router;
