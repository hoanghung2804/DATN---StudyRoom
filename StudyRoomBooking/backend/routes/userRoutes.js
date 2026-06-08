const express = require("express");
const router = express.Router();

const userController = require("../controllers/userController");
const verifyToken = require("../middleware/authMiddleware");
const isAdmin = require("../middleware/adminMiddleware");

router.use(verifyToken, isAdmin);

router.get(
    "/admin",
    userController.listUsers
);

router.post(
    "/admin",
    userController.createUser
);

router.put(
    "/admin/:id",
    userController.updateUser
);

router.put(
    "/admin/:id/reset-password",
    userController.resetPassword
);

router.delete(
    "/admin/:id",
    userController.deleteStudent
);

module.exports = router;
