import axiosClient from "../api/axiosClient";

export const login = (data) => {
    return axiosClient.post(
        "/auth/login",
        data
    );
};

export const googleLogin = (credential) => {
    return axiosClient.post(
        "/auth/google",
        {
            credential
        }
    );
};

export const forgotPassword = (data) => {
    return axiosClient.post(
        "/auth/forgot-password",
        data
    );
};

export const getPasswordResetRequests = () => {
    return axiosClient.get("/auth/admin/password-reset-requests");
};

export const approvePasswordResetRequest = (id) => {
    return axiosClient.put(`/auth/admin/password-reset-requests/${id}/approve`);
};

export const rejectPasswordResetRequest = (id, admin_note) => {
    return axiosClient.put(
        `/auth/admin/password-reset-requests/${id}/reject`,
        {
            admin_note
        }
    );
};

export const register = (data) => {
    return axiosClient.post(
        "/auth/register",
        data
    );
};

export const getProfile = () => {
    return axiosClient.get(
        "/auth/profile"
    );
};

export const updateProfile = (data) => {
    return axiosClient.put(
        "/auth/profile",
        data
    );
};

export const changePassword = (data) => {
    return axiosClient.put(
        "/auth/change-password",
        data
    );
};
