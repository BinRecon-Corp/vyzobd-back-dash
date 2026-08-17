import { z } from "zod";

export const updateGeneralSettingsSchema = z.object({
  key: z.string(),
  value: z.string(),
  description: z.string().optional(),
});

export const updateBrandingSettingsSchema = z.object({
  siteName: z.string().optional(),
  siteTitle: z.string().optional(),
  siteTagline: z.string().optional(),
  logoUrl: z.string().optional(),
  faviconUrl: z.string().optional(),
  adminPanelName: z.string().optional(),
  adminPanelLogo: z.string().optional(),
  invoiceLogo: z.string().optional(),
  primaryColor: z.string().optional(),
  footerText: z.string().optional(),
  defaultLanguage: z.string().optional(),
  defaultCurrency: z.string().optional(),
  defaultTimezone: z.string().optional(),
});

export const updateSEOSettingsSchema = z.object({
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  metaKeywords: z.string().optional(),
  ogTitle: z.string().optional(),
  ogDescription: z.string().optional(),
  ogImage: z.string().optional(),
  twitterTitle: z.string().optional(),
  twitterDescription: z.string().optional(),
  twitterImage: z.string().optional(),
  robotsTxt: z.string().optional(),
  customHeadCode: z.string().optional(),
});

export const updateSMTPSettingsSchema = z.object({
  host: z.string().optional(),
  port: z.number().int().optional(),
  username: z.string().optional(),
  password: z.string().optional(),
  fromEmail: z.string().email().optional(),
  fromName: z.string().optional(),
  secure: z.boolean().optional(),
  enabled: z.boolean().optional(),
});

export const updateAnalyticsSettingsSchema = z.object({
  googleAnalyticsId: z.string().optional(),
  ga4MeasurementId: z.string().optional(),
  googleTagManagerId: z.string().optional(),
  gtmContainerId: z.string().optional(),
  facebookPixelId: z.string().optional(),
  metaPixelId: z.string().optional(),
  tiktokPixelId: z.string().optional(),
  googleAdsId: z.string().optional(),
  ga4ApiSecret: z.string().optional(),
  hotjarId: z.string().optional(),
  enableAnalytics: z.boolean().optional(),
});

export const updateSecuritySettingsSchema = z.object({
  enable2FA: z.boolean().optional(),
  passwordMinLength: z.number().int().min(1).optional(),
  sessionTimeoutMinutes: z.number().int().min(1).optional(),
  maxLoginAttempts: z.number().int().min(1).optional(),
  enableMaintenanceMode: z.boolean().optional(),
  maintenanceMessage: z.string().optional(),
});

export const updateShippingSettingsSchema = z.object({
  defaultShippingCost: z.number().min(0).optional(),
  freeShippingThreshold: z.number().min(0).optional(),
  enableFreeShipping: z.boolean().optional(),
});

export const updateTaxSettingsSchema = z.object({
  defaultTaxRate: z.number().min(0).optional(),
  pricesIncludeTax: z.boolean().optional(),
});
