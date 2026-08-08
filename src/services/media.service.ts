import { api } from "../lib/api";

export const mediaService = {
  getAssets: () => api.get('/media').then(res => res.data),
  getAssetById: (id: string) => api.get(`/media/${id}`).then(res => res.data),
  uploadAsset: (data: any) => api.post('/media', data).then(res => res.data),
  deleteAsset: (id: string) => api.delete(`/media/${id}`).then(res => res.data),
};
