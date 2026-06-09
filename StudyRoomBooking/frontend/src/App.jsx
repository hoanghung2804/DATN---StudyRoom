import {
    BrowserRouter,
    Routes,
    Route
} from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import StudentHome from "./pages/StudentHome";
import Rooms from "./pages/Rooms";
import Booking from "./pages/Booking";
import MyBookings from "./pages/MyBookings";
import Profile from "./pages/Profile";
import Notifications from "./pages/Notifications";
import WeeklySchedule from "./pages/WeeklySchedule";

import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminRooms from "./pages/admin/AdminRooms";
import AdminStudents from "./pages/admin/AdminStudents";
import AdminBookings from "./pages/admin/AdminBookings";
import AdminCalendar from "./pages/admin/AdminCalendar";
import AdminMaintenance from "./pages/admin/AdminMaintenance";
import AdminPasswordRequests from "./pages/admin/AdminPasswordRequests";
import AdminProfile from "./pages/admin/AdminProfile";
import AdminSupport from "./pages/admin/AdminSupport";

import ProtectedRoute from "./components/ProtectedRoute";

function App() {

    return (

        <BrowserRouter>

            <Routes>

                {/* NOTE: Nhom chuc nang cong khai - dang nhap, dang ky va quen mat khau. */}
                <Route path="/" element={<Login />} />

                <Route
                    path="/register"
                    element={<Register />}
                />

                <Route
                    path="/forgot-password"
                    element={<ForgotPassword />}
                />

                {/* NOTE: Nhom chuc nang sinh vien - xem phong, dat phong va quan ly lich ca nhan. */}
                <Route
                    path="/home"
                    element={<StudentHome />}
                />

                <Route
                    path="/rooms"
                    element={<Rooms />}
                />

                <Route
                    path="/booking/:roomId"
                    element={
                        <ProtectedRoute>
                            <Booking />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/my-bookings"
                    element={
                        <ProtectedRoute>
                            <MyBookings />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/profile"
                    element={
                        <ProtectedRoute>
                            <Profile />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/notifications"
                    element={
                        <ProtectedRoute>
                            <Notifications />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/schedule"
                    element={
                        <ProtectedRoute>
                            <WeeklySchedule />
                        </ProtectedRoute>
                    }
                />

                {/* NOTE: Nhom chuc nang quan tri - dashboard, phong, hoc sinh, duyet lich va bao tri. */}
                <Route
                    path="/admin/dashboard"
                    element={
                        <ProtectedRoute requiredRole="admin">
                            <AdminDashboard />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/admin/rooms"
                    element={
                        <ProtectedRoute requiredRole="admin">
                            <AdminRooms />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/admin/students"
                    element={
                        <ProtectedRoute requiredRole="admin">
                            <AdminStudents />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/admin/bookings"
                    element={
                        <ProtectedRoute requiredRole="admin">
                            <AdminBookings />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/admin/calendar"
                    element={
                        <ProtectedRoute requiredRole="admin">
                            <AdminCalendar />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/admin/maintenance"
                    element={
                        <ProtectedRoute requiredRole="admin">
                            <AdminMaintenance />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/admin/password-requests"
                    element={
                        <ProtectedRoute requiredRole="admin">
                            <AdminPasswordRequests />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/admin/support"
                    element={
                        <ProtectedRoute requiredRole="admin">
                            <AdminSupport />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/admin/profile"
                    element={
                        <ProtectedRoute requiredRole="admin">
                            <AdminProfile />
                        </ProtectedRoute>
                    }
                />

            </Routes>

        </BrowserRouter>

    );

}

export default App;
