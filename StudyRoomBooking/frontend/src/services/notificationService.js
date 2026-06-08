import axiosClient from "../api/axiosClient";

export const getNotifications = () => {
    return axiosClient.get("/notifications");
};

export const getUnreadNotificationCount = () => {
    return axiosClient.get("/notifications/unread-count");
};

export const markNotificationAsRead = (id) => {
    return axiosClient.put(`/notifications/read/${id}`);
};

export const markAllNotificationsAsRead = () => {
    return axiosClient.put("/notifications/read-all");
};
