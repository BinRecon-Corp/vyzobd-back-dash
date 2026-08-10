import { api } from "../lib/api";

export const getNotifications = async (params?: any) => {
  const { data } = await api.get("/notifications", { params });
  return data;
};

export const markAsRead = async (id: string) => {
  const { data } = await api.post(`/notifications/${id}/read`);
  return data.data;
};

export const sendBulkNotification = async (payload: any) => {
  const { data } = await api.post(`/notifications/send`, payload);
  return data.data;
};
