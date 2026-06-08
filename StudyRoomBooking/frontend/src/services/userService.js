import axiosClient from "../api/axiosClient";

export const getAdminUsers = (params = {}) => {
    return axiosClient.get("/users/admin", {
        params
    });
};

export const createAdminUser = (data) => {
    return axiosClient.post("/users/admin", data);
};

export const updateAdminUser = (id, data) => {
    return axiosClient.put(`/users/admin/${id}`, data);
};

export const resetUserPassword = (id, newPassword) => {
    return axiosClient.put(
        `/users/admin/${id}/reset-password`,
        {
            newPassword
        }
    );
};

export const deleteStudentUser = (id) => {
    return axiosClient.delete(`/users/admin/${id}`);
};
