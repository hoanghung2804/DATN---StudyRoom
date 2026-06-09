const express = require("express");
const router = express.Router();

const supportController = require("../controllers/supportController");
const verifyToken = require("../middleware/authMiddleware");
const isAdmin = require("../middleware/adminMiddleware");

router.use(verifyToken);

router.get(
    "/my-thread",
    supportController.getMyThread
);

router.post(
    "/threads",
    supportController.createThread
);

router.get(
    "/threads/:id/messages",
    supportController.getMessages
);

router.post(
    "/threads/:id/messages",
    supportController.sendMessage
);

router.get(
    "/admin/threads",
    isAdmin,
    supportController.getAdminThreads
);

router.patch(
    "/admin/threads/:id/status",
    isAdmin,
    supportController.updateThreadStatus
);

module.exports = router;
