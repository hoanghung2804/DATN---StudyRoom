const express = require("express");
const router = express.Router();

const authController =
    require("../controllers/authController");

const verifyToken =
    require("../middleware/authMiddleware");

const isAdmin =
    require("../middleware/adminMiddleware");

/*
====================================
PUBLIC ROUTES
====================================
*/

router.post(
    "/register",
    authController.register
);

router.post(
    "/login",
    authController.login
);

router.post(
    "/google",
    authController.googleLogin
);

router.post(
    "/forgot-password",
    authController.forgotPassword
);

/*
====================================
PROTECTED ROUTES
====================================
*/

router.get(
    "/admin/password-reset-requests",
    verifyToken,
    isAdmin,
    authController.getPasswordResetRequests
);

router.put(
    "/admin/password-reset-requests/:id/approve",
    verifyToken,
    isAdmin,
    authController.approvePasswordResetRequest
);

router.put(
    "/admin/password-reset-requests/:id/reject",
    verifyToken,
    isAdmin,
    authController.rejectPasswordResetRequest
);

router.get(
    "/profile",
    verifyToken,
    authController.getProfile
);

router.put(
    "/profile",
    verifyToken,
    authController.updateProfile
);

router.put(
    "/change-password",
    verifyToken,
    authController.changePassword
);

module.exports = router;
