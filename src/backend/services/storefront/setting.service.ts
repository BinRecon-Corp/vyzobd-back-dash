import { prisma } from "../../config/db";

export class StorefrontSettingService {
  static async getPublicSettings() {
    const [branding, seo, analytics] = await Promise.all([
      prisma.brandingSetting.findFirst(),
      prisma.sEOSetting.findFirst(),
      prisma.analyticsSetting.findFirst()
    ]);

    return {
      branding: branding ? {
        siteName: branding.siteName,
        siteTitle: branding.siteTitle,
        siteTagline: branding.siteTagline,
        logoUrl: branding.logoUrl,
        faviconUrl: branding.faviconUrl,
        adminPanelName: branding.adminPanelName,
        adminPanelLogo: branding.adminPanelLogo,
        primaryColor: branding.primaryColor,
        footerText: branding.footerText,
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
        googleTagManagerId: analytics.googleTagManagerId,
        facebookPixelId: analytics.facebookPixelId,
        hotjarId: analytics.hotjarId,
        enableAnalytics: analytics.enableAnalytics
      } : null
    };
  }
}
