import { prisma } from "../../config/db";

export class StorefrontSettingService {
  static async getPublicSettings() {
    let [branding, seo, analytics] = await Promise.all([
      prisma.brandingSetting.findFirst(),
      prisma.sEOSetting.findFirst(),
      prisma.analyticsSetting.findFirst()
    ]);

    if (!analytics) {
      analytics = await prisma.analyticsSetting.create({
        data: {
          enableAnalytics: true,
          googleAnalyticsId: process.env.GA_MEASUREMENT_ID || null,
        }
      });
    }

    return {
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
      } : null
    };
  }
}
