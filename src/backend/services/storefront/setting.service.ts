import { prisma } from "../../config/db";

let cachedPublicSettings: any = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 30 * 1000; // 30 seconds TTL

export class StorefrontSettingService {
  static clearCache() {
    cachedPublicSettings = null;
    lastCacheTime = 0;
  }

  static async getPublicSettings() {
    const now = Date.now();
    if (cachedPublicSettings && now - lastCacheTime < CACHE_TTL_MS) {
      return cachedPublicSettings;
    }

    const [branding, seo, analytics, store] = await Promise.all([
      prisma.brandingSetting.findFirst(),
      prisma.sEOSetting.findFirst(),
      prisma.analyticsSetting.findFirst(),
      prisma.storeSetting.findFirst()
    ]);

    const result = {
      branding: branding ? {
        siteName: branding.siteName,
        siteTitle: branding.siteTitle,
        siteTagline: branding.siteTagline,
        logoUrl: branding.logoUrl,
        faviconUrl: branding.faviconUrl,
        adminPanelName: branding.adminPanelName,
        adminPanelLogo: branding.adminPanelLogo,
        primaryColor: (branding as any).primaryColor,
        footerText: (branding as any).footerText,
        defaultLanguage: branding.defaultLanguage,
        defaultCurrency: branding.defaultCurrency,
        defaultTimezone: branding.defaultTimezone
      } : null,
      seo: seo ? {
        metaTitle: seo.metaTitle,
        metaDescription: seo.metaDescription,
        metaKeywords: seo.metaKeywords,
        ogTitle: seo.ogTitle,
        ogDescription: seo.ogDescription,
        ogImage: seo.ogImage,
        twitterTitle: seo.twitterTitle,
        twitterDescription: seo.twitterDescription,
        twitterImage: seo.twitterImage,
        customHeadCode: seo.customHeadCode
      } : null,
      analytics: analytics ? {
        googleAnalyticsId: analytics.googleAnalyticsId,
        ga4MeasurementId: analytics.googleAnalyticsId,
        googleTagManagerId: analytics.googleTagManagerId,        
        gtmContainerId: analytics.googleTagManagerId,
        facebookPixelId: analytics.facebookPixelId,
        metaPixelId: analytics.facebookPixelId,
        tiktokPixelId: analytics.tiktokPixelId,
        googleAdsId: analytics.googleAdsId,
        hotjarId: analytics.hotjarId,
        enableAnalytics: analytics.enableAnalytics
      } : {
        googleAnalyticsId: process.env.GA_MEASUREMENT_ID || null,
        ga4MeasurementId: process.env.GA_MEASUREMENT_ID || null,
        googleTagManagerId: null,
        gtmContainerId: null,
        facebookPixelId: null,
        metaPixelId: null,
        tiktokPixelId: null,
        googleAdsId: null,        
        hotjarId: null,
        enableAnalytics: false
      },
      store: store ? {
        whatsappOrderNumber: store.whatsappOrderNumber,
        callOrderNumber: store.callOrderNumber
      } : null
    };

    cachedPublicSettings = result;
    lastCacheTime = now;
    return result;
  }
}
