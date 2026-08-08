import { api } from "../lib/api";

export const getUsers = async (params?: any) => {
  const { data } = await api.get("/users", { params });
  return data;
};

export const getUserById = async (id: string) => {
  const { data } = await api.get(`/users/${id}`);
  return data.data;
};

export const createUser = async (userData: any) => {
  const { data } = await api.post("/users", userData);
  return data.data;
};

export const updateUser = async (id: string, userData: any) => {
  const { data } = await api.put(`/users/${id}`, userData);
  return data.data;
};

export const deleteUser = async (id: string) => {
  await api.delete(`/users/${id}`);
};

export const updateUserStatus = async (id: string, isActive: boolean) => {
  const { data } = await api.patch(`/users/${id}/status`, { isActive });
  return data.data;
};

export const updateUserRole = async (id: string, roleId: string) => {
  const { data } = await api.patch(`/users/${id}/role`, { roleId });
  return data.data;
};

export const adminResetPassword = async (id: string, newPassword: string) => {
  const { data } = await api.patch(`/users/${id}/reset-password`, { newPassword });
  return data.data;
};

export const forceLogoutUser = async (id: string) => {
  const { data } = await api.post(`/users/${id}/force-logout`);
  return data.data;
};
