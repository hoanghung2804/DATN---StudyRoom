import axiosClient from "../api/axiosClient";

export const getMySupportThread = () => {
    return axiosClient.get("/support/my-thread");
};

export const getMySupportUnreadCount = () => {
    return axiosClient.get("/support/my-unread-count");
};

export const createSupportThread = (data) => {
    return axiosClient.post("/support/threads", data);
};

export const getSupportMessages = (threadId) => {
    return axiosClient.get(`/support/threads/${threadId}/messages`);
};

export const sendSupportMessage = (threadId, message) => {
    return axiosClient.post(
        `/support/threads/${threadId}/messages`,
        {
            message
        }
    );
};

export const getAdminSupportThreads = (params = {}) => {
    return axiosClient.get("/support/admin/threads", {
        params
    });
};

export const getAdminSupportUnreadCount = () => {
    return axiosClient.get("/support/admin/unread-count");
};

export const updateSupportThreadStatus = (threadId, status) => {
    return axiosClient.patch(
        `/support/admin/threads/${threadId}/status`,
        {
            status
        }
    );
};
