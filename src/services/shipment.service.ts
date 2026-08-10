import { api } from "../lib/api";

export const getShipments = async (params?: any) => {
  const { data } = await api.get("/shipments", { params });
  return data;
};

export const getShipmentById = async (id: string) => {
  const { data } = await api.get(`/shipments/${id}`);
  return data.data;
};

export const updateShipmentStatus = async (id: string, status: string, trackingInfo?: any) => {
  const { data } = await api.put(`/shipments/${id}`, { status, ...trackingInfo });
  return data.data;
};
