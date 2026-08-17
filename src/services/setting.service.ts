import { api } from "../lib/api";

export const getSettings = async (group: string) => {
  const { data } = await api.get(`/settings/${group}`);
  return data.data;
};

export const updateSettings = async (group: string, payload: any) => {
  const { data } = await api.put(`/settings/${group}`, payload);
  return data.data;
};
