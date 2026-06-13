import axiosClient from "../api/axiosClient";

/*
====================================
Sinh viên
====================================
*/

// Đặt phòng
export const createBooking = (data) => {
    return axiosClient.post("/bookings", data);
};

// Lịch sử đặt phòng của bản thân
export const getMyBookings = () => {
    return axiosClient.get("/bookings/my-bookings");
};

// Hủy đặt phòng
export const cancelBooking = (id) => {
    return axiosClient.put(`/bookings/cancel/${id}`);
};

export const getRoomSchedule = (roomId, date) => {
    return axiosClient.get(
        `/bookings/room/${roomId}/schedule`,
        {
            params: {
                date
            }
        }
    );
};

export const checkInBooking = (id, checkin_code) => {
    return axiosClient.put(
        `/bookings/check-in/${id}`,
        {
            checkin_code
        }
    );
};

/*
====================================
Admin
====================================
*/

// Xem tất cả booking
export const getAllBookings = () => {
    return axiosClient.get("/bookings/admin/all");
};

export const getPendingBookingCount = () => {
    return axiosClient.get("/bookings/admin/pending-count");
};

// Duyệt booking
export const approveBooking = (id) => {
    return axiosClient.put(`/bookings/approve/${id}`);
};

// Từ chối booking
export const rejectBooking = (id) => {
    return axiosClient.put(`/bookings/reject/${id}`);
};

export const rejectBookingWithReason = (id, rejection_reason) => {
    return axiosClient.put(
        `/bookings/reject/${id}`,
        {
            rejection_reason
        }
    );
};

// Dashboard thống kê
export const dashboard = () => {
    return axiosClient.get("/bookings/dashboard");
};

export const getRoomStatistics = () => {
    return axiosClient.get("/bookings/dashboard/rooms");
};

export const getBookingStatusStatistics = () => {
    return axiosClient.get("/bookings/dashboard/status");
};

export const getAdvancedStatistics = () => {
    return axiosClient.get("/bookings/dashboard/advanced");
};
