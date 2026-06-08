const express = require("express");
const router = express.Router();

const bookingController =
    require("../controllers/bookingController");

const verifyToken =
    require("../middleware/authMiddleware");

const isAdmin =
    require("../middleware/adminMiddleware");

/*
====================================
SINH VIÊN
====================================
*/

// Đặt phòng
router.post(
    "/",
    verifyToken,
    bookingController.createBooking
);

// Xem lịch sử đặt phòng của chính mình
router.get(
    "/my-bookings",
    verifyToken,
    bookingController.getMyBookings
);

// Hủy lịch đặt phòng
router.put(
    "/cancel/:id",
    verifyToken,
    bookingController.cancelBooking
);

router.get(
    "/room/:roomId/schedule",
    verifyToken,
    bookingController.getRoomSchedule
);

router.put(
    "/check-in/:id",
    verifyToken,
    bookingController.checkInBooking
);

/*
====================================
ADMIN
====================================
*/

// Duyệt lịch đặt phòng
router.put(
    "/approve/:id",
    verifyToken,
    isAdmin,
    bookingController.approveBooking
);

// Từ chối lịch đặt phòng
router.put(
    "/reject/:id",
    verifyToken,
    isAdmin,
    bookingController.rejectBooking
);

// Xem tất cả lịch đặt phòng
router.get(
    "/admin/all",
    verifyToken,
    isAdmin,
    bookingController.getAllBookings
);

// Dashboard thống kê
router.get(
    "/dashboard",
    verifyToken,
    isAdmin,
    bookingController.dashboard
);

router.get(
    "/dashboard/rooms",
    verifyToken,
    isAdmin,
    bookingController.roomStatistics
);

router.get(
    "/dashboard/status",
    verifyToken,
    isAdmin,
    bookingController.bookingStatusStatistics
);

router.get(
    "/dashboard/advanced",
    verifyToken,
    isAdmin,
    bookingController.advancedStatistics
);

module.exports = router;
