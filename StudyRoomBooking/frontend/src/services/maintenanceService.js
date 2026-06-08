import axiosClient from "../api/axiosClient";

export const getMaintenanceSchedules = () => {
    return axiosClient.get("/maintenance");
};

export const createMaintenanceSchedule = (data) => {
    return axiosClient.post("/maintenance", data);
};

export const updateMaintenanceStatus = (id, status) => {
    return axiosClient.put(
        `/maintenance/${id}/status`,
        {
            status
        }
    );
};

export const deleteMaintenanceSchedule = (id) => {
    return axiosClient.delete(`/maintenance/${id}`);
};
