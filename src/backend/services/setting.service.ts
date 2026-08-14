import { prisma } from "../config/db";
import { AppError } from "../utils/AppError";
import { EventService } from "./event.service";
import { ActivityType } from "@prisma/client";

export class SettingService {
  static async getBranding() {
    let setting = await prisma.brandingSetting.findFirst();
    if (!setting) setting = await prisma.brandingSetting.create({ data: {} });
    return setting;
  }

  static async updateBranding(data: any, userId: string) {
    let setting = await prisma.brandingSetting.findFirst();
    if (setting) {
      setting = await prisma.brandingSetting.update({ where: { id: setting.id }, data });
    } else {
      setting = await prisma.brandingSetting.create({ data });
    }
    await prisma.activityLog.create({
      data: {
        userId,
        action: "UPDATE_BRANDING",
        entityType: "Settings",
        entityId: setting.id,
        details: JSON.stringify(data)
      }
    });
    return setting;
  }

  static async getSEO() {
    let setting = await prisma.sEOSetting.findFirst();
    if (!setting) setting = await prisma.sEOSetting.create({ data: {} });
    return setting;
  }

  static async updateSEO(data: any, userId: string) {
    let setting = await prisma.sEOSetting.findFirst();
    if (setting) {
      setting = await prisma.sEOSetting.update({ where: { id: setting.id }, data });
    } else {
      setting = await prisma.sEOSetting.create({ data });
    }
    await prisma.activityLog.create({
      data: {
        userId,
        action: "UPDATE_SEO",
        entityType: "Settings",
        entityId: setting.id,
        details: JSON.stringify(data)
      }
    });
    return setting;
  }

  static async getSMTP() {
    let setting = await prisma.sMTPSetting.findFirst();
    if (!setting) setting = await prisma.sMTPSetting.create({ data: {} });
    return setting;
  }

  static async updateSMTP(data: any, userId: string) {
    let setting = await prisma.sMTPSetting.findFirst();
    if (setting) {
      setting = await prisma.sMTPSetting.update({ where: { id: setting.id }, data });
    } else {
      setting = await prisma.sMTPSetting.create({ data });
    }
    await prisma.activityLog.create({
      data: {
        userId,
        action: "UPDATE_SMTP",
        entityType: "Settings",
        entityId: setting.id,
        details: JSON.stringify(data)
      }
    });
    return setting;
  }

  static async getAnalytics() {
    let setting = await prisma.analyticsSetting.findFirst();
    if (!setting) setting = await prisma.analyticsSetting.create({ data: {} });
    return setting;
  }

  static async updateAnalytics(data: any, userId: string) {
    const payload: any = { ...data };
    if (payload.ga4MeasurementId) {
      payload.googleAnalyticsId = payload.ga4MeasurementId;
    }
    if (payload.gtmContainerId) {
      payload.googleTagManagerId = payload.gtmContainerId;
    }
    if (payload.metaPixelId) {
      payload.facebookPixelId = payload.metaPixelId;
    }

    const sanitizedData: any = {};
    const allowedKeys = [
      "googleAnalyticsId",
      "googleTagManagerId",
      "facebookPixelId",
      "tiktokPixelId",
      "googleAdsId",
      "ga4ApiSecret",
      "hotjarId",
      "enableAnalytics",
    ];

    allowedKeys.forEach((key) => {
      if (typeof payload[key] !== "undefined") {
        sanitizedData[key] = key === "enableAnalytics" ? Boolean(payload[key]) : payload[key];
      }
    });

    let setting = await prisma.analyticsSetting.findFirst();
    if (setting) {
      setting = await prisma.analyticsSetting.update({ where: { id: setting.id }, data: sanitizedData });
    } else {
      setting = await prisma.analyticsSetting.create({ data: sanitizedData });
    }
    await prisma.activityLog.create({
      data: {
        userId,
        action: "UPDATE_ANALYTICS",
        entityType: "Settings",
        entityId: setting.id,
        details: JSON.stringify(data)
      }
    });
    return setting;
  }

  static async getSecurity() {
    let setting = await prisma.securitySetting.findFirst();
    if (!setting) setting = await prisma.securitySetting.create({ data: {} });
    return setting;
  }

  static async updateSecurity(data: any, userId: string) {
    let setting = await prisma.securitySetting.findFirst();
    if (setting) {
      setting = await prisma.securitySetting.update({ where: { id: setting.id }, data });
    } else {
      setting = await prisma.securitySetting.create({ data });
    }
    await prisma.activityLog.create({
      data: {
        userId,
        action: "UPDATE_SECURITY",
        entityType: "Settings",
        entityId: setting.id,
        details: JSON.stringify(data)
      }
    });
    return setting;
  }

  static async getShipping() {
    let setting = await prisma.shippingSetting.findFirst();
    if (!setting) setting = await prisma.shippingSetting.create({ data: {} });
    return setting;
  }

  static async updateShipping(data: any, userId: string) {
    let setting = await prisma.shippingSetting.findFirst();
    if (setting) {
      setting = await prisma.shippingSetting.update({ where: { id: setting.id }, data });
    } else {
      setting = await prisma.shippingSetting.create({ data });
    }
    await prisma.activityLog.create({
      data: {
        userId,
        action: "UPDATE_SHIPPING",
        entityType: "Settings",
        entityId: setting.id,
        details: JSON.stringify(data)
      }
    });
    return setting;
  }

  static async getTax() {
    let setting = await prisma.taxSetting.findFirst();
    if (!setting) setting = await prisma.taxSetting.create({ data: {} });
    return setting;
  }

  static async updateTax(data: any, userId: string) {
    let setting = await prisma.taxSetting.findFirst();
    if (setting) {
      setting = await prisma.taxSetting.update({ where: { id: setting.id }, data });
    } else {
      setting = await prisma.taxSetting.create({ data });
    }
    await prisma.activityLog.create({
      data: {
        userId,
        action: "UPDATE_TAX",
        entityType: "Settings",
        entityId: setting.id,
        details: JSON.stringify(data)
      }
    });
    return setting;
  }

  static async getGeneral() {
    return prisma.setting.findMany();
  }

  static async updateGeneral(data: any[], userId: string) {
    // Assuming data is an array of { key, value }
    const txs = data.map(item => prisma.setting.upsert({
      where: { key: item.key },
      create: { group: 'general', key: item.key, value: item.value, type: 'string' },
      update: { value: item.value }
    }));
    await prisma.$transaction(txs);
    await prisma.activityLog.create({
      data: {
        userId,
        action: "UPDATE_GENERAL",
        entityType: "Settings",
        entityId: "general",
        details: JSON.stringify(data)
      }
    });
    return this.getGeneral();
  }
}
