import { api } from "../lib/api";

export interface Coupon {
  id: string;
  code: string;
  discountType: "fixed" | "percentage" | "free_shipping";
  discountValue: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  usagePerCustomer?: number;
  usedCount: number;
  applicableCategories?: string;
  applicableProducts?: string;
  applicableBrands?: string;
  stats?: {
    totalUses: number;
    revenueGenerated: number;
    conversionRate: string;
  };
}

export const couponService = {
  getAll: async (params?: { search?: string; status?: string }) => {
    const response = await api.get("/coupons", { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/coupons/${id}`);
    return response.data;
  },

  create: async (data: Partial<Coupon>) => {
    const response = await api.post("/coupons", data);
    return response.data;
  },

  update: async (id: string, data: Partial<Coupon>) => {
    const response = await api.put(`/coupons/${id}`, data);
    return response.data;
  },

  toggleActive: async (id: string) => {
    const response = await api.patch(`/coupons/${id}/toggle`);
    return response.data;
  },

  duplicate: async (id: string) => {
    const response = await api.post(`/coupons/${id}/duplicate`);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/coupons/${id}`);
    return response.data;
  },

  validate: async (code: string, cartAmount: number, cartItems?: any[]) => {
    const response = await api.post("/coupons/validate", { code, cartAmount, cartItems });
    return response.data;
  },
};
