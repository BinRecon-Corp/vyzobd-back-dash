import { prisma } from "../../config/db";

export class StorefrontAnalyticsService {
  static async getAnalyticsConfig() {
    let analytics = await prisma.analyticsSetting.findFirst();

    if (!analytics) {
      analytics = await prisma.analyticsSetting.create({
        data: {
          enableAnalytics: true,
          googleAnalyticsId: process.env.GA_MEASUREMENT_ID || null,
        }
      });
    }

    return {
      ga4MeasurementId: analytics.googleAnalyticsId,
      gtmContainerId: analytics.googleTagManagerId,
      metaPixelId: analytics.facebookPixelId,
      googleAdsId: analytics.googleAdsId,
      enableAnalytics: analytics.enableAnalytics,
    };
  }
}
