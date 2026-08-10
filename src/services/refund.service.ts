import { api } from "../lib/api";

export const getRefunds = async (params?: any) => {
  const { data } = await api.get("/refunds", { params });
  return data;
};

export const getRefundById = async (id: string) => {
  const { data } = await api.get(`/refunds/${id}`);
  return data.data;
};

export const approveRefund = async (id: string, payload?: any) => {
  const { data } = await api.post(`/refunds/${id}/approve`, payload);
  return data.data;
};

export const rejectRefund = async (id: string, reason: string) => {
  const { data } = await api.post(`/refunds/${id}/reject`, { reason });
  return data.data;
};
