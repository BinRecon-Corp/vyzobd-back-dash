import { api } from "../lib/api";

export const getReturns = async (params?: any) => {
  const { data } = await api.get("/returns", { params });
  return data;
};

export const getReturnById = async (id: string) => {
  const { data } = await api.get(`/returns/${id}`);
  return data.data;
};

export const updateReturnStatus = async (id: string, status: string) => {
  const { data } = await api.put(`/returns/${id}`, { status });
  return data.data;
};
