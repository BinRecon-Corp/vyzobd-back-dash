import { prisma } from "../../config/db";

export class StorefrontAnalyticsService {
  static async getAnalyticsConfig() {
    let analytics = await prisma.analyticsSetting.findFirst();

    if (!analytics) {
      analytics = await prisma.analyticsSetting.create({
        data: {
          enableAnalytics: false,
          googleAnalyticsId: process.env.GA_MEASUREMENT_ID || null,
        }
      });
    }

    const ga4Id = analytics.googleAnalyticsId || process.env.GA_MEASUREMENT_ID || null;

    return {
      ga4MeasurementId: ga4Id,
      googleAnalyticsId: ga4Id,
      gtmContainerId: analytics.googleTagManagerId || null,
      googleTagManagerId: analytics.googleTagManagerId || null,
      metaPixelId: analytics.facebookPixelId || null,
      facebookPixelId: analytics.facebookPixelId || null,
      googleAdsId: analytics.googleAdsId || null,
      googleAdsConversionId: analytics.googleAdsConversionId || analytics.googleAdsId || null,
      googleAdsConversionLabel: analytics.googleAdsConversionLabel || null,
      tiktokPixelId: analytics.tiktokPixelId || null,
      hotjarId: analytics.hotjarId || null,
      enableAnalytics: Boolean(analytics.enableAnalytics),
    };
  }
}
