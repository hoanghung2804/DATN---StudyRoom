const express = require("express");
const cors = require("cors");
const path = require("path");

require("dotenv").config({
    path: path.join(__dirname, ".env")
});
require("./config/db");

const roomRoutes = require("./routes/roomRoutes");
const authRoutes = require("./routes/authRoutes");

const app = express();
const bookingRoutes =
    require("./routes/bookingRoutes");

const notificationRoutes =
    require("./routes/notificationRoutes");

const maintenanceRoutes =
    require("./routes/maintenanceRoutes");

const userRoutes =
    require("./routes/userRoutes");

const supportRoutes =
    require("./routes/supportRoutes");

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use("/api/bookings", bookingRoutes);
app.use(
    "/api/notifications",
    notificationRoutes
);
app.use(
    "/api/maintenance",
    maintenanceRoutes
);
app.use(
    "/api/users",
    userRoutes
);
app.use(
    "/api/support",
    supportRoutes
);

// Test
app.get("/", (req, res) => {
    res.send("Study Room Booking API Running");
});

// Routes
app.use("/api/rooms", roomRoutes);
app.use("/api/auth", authRoutes);

const PORT = 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
