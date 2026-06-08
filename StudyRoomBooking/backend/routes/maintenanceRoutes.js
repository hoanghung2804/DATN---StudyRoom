const express = require("express");
const router = express.Router();

const maintenanceController =
    require("../controllers/maintenanceController");

const verifyToken =
    require("../middleware/authMiddleware");

const isAdmin =
    require("../middleware/adminMiddleware");

router.get(
    "/",
    verifyToken,
    isAdmin,
    maintenanceController.getMaintenanceSchedules
);

router.post(
    "/",
    verifyToken,
    isAdmin,
    maintenanceController.createMaintenanceSchedule
);

router.put(
    "/:id/status",
    verifyToken,
    isAdmin,
    maintenanceController.updateMaintenanceStatus
);

router.delete(
    "/:id",
    verifyToken,
    isAdmin,
    maintenanceController.deleteMaintenanceSchedule
);

module.exports = router;
