import axiosClient from "../api/axiosClient";

export const getRooms = (params = {}) => {
    return axiosClient.get("/rooms", {
        params
    });
};

export const getRoom = (id) => {
    return axiosClient.get(`/rooms/${id}`);
};

export const createRoom = (data) => {
    return axiosClient.post("/rooms", data);
};

export const updateRoom = (id, data) => {
    return axiosClient.put(`/rooms/${id}`, data);
};

export const deleteRoom = (id) => {
    return axiosClient.delete(`/rooms/${id}`);
};

export const getRoomReviews = (id) => {
    return axiosClient.get(`/rooms/${id}/reviews`);
};

export const saveRoomReview = (id, data) => {
    return axiosClient.post(`/rooms/${id}/reviews`, data);
};
