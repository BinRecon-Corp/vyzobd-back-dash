import { prisma } from "../config/db";
import { AppError } from "../utils/AppError";
import { EventService } from "./event.service";
import { ActivityType } from "@prisma/client";
import { StorefrontSettingService } from "./storefront/setting.service";

export class SettingService {
  static async getStore() {
    let setting = await prisma.storeSetting.findFirst();
    if (!setting) setting = await prisma.storeSetting.create({ data: {} });
    return setting;
  }

  static async updateStore(data: any, userId: string) {
    const payload = {
      whatsappOrderNumber: data.whatsappOrderNumber?.trim() || null,
      callOrderNumber: data.callOrderNumber?.trim() || null,
    };
    let setting = await prisma.storeSetting.findFirst();
    if (setting) {
      setting = await prisma.storeSetting.update({ where: { id: setting.id }, data: payload });
    } else {
      setting = await prisma.storeSetting.create({ data: payload });
    }
    StorefrontSettingService.clearCache();
    await prisma.activityLog.create({
      data: {
        userId,
        action: "UPDATE_STORE",
        entityType: "Settings",
        entityId: setting.id,
        details: JSON.stringify(payload)
      }
    });
    return setting;
  }
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
    StorefrontSettingService.clearCache();
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
    StorefrontSettingService.clearCache();
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
    const result = { ...setting };
    if (result.password) {
      result.password = "********";
    }
    return result;
  }

  static async updateSMTP(data: any, userId: string) {
    if (data.password === "********") {
      delete data.password;
    }
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
    StorefrontSettingService.clearCache();
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
    if (!setting) {
      setting = await prisma.shippingSetting.create({
        data: {
          insideDhakaCharge: 60,
          outsideDhakaCharge: 120,
          defaultShippingCost: 60,
          freeShippingThreshold: 2000,
          freeShippingEnabled: true,
          enableFreeShipping: true,
        },
      });
    }
    return {
      ...setting,
      insideDhakaCharge: setting.insideDhakaCharge ?? 60,
      outsideDhakaCharge: setting.outsideDhakaCharge ?? 120,
      freeShippingThreshold: setting.freeShippingThreshold !== null ? setting.freeShippingThreshold : 2000,
      freeShippingEnabled: setting.freeShippingEnabled ?? setting.enableFreeShipping ?? true,
      enableFreeShipping: setting.freeShippingEnabled ?? setting.enableFreeShipping ?? true,
    };
  }

  static async updateShipping(data: any, userId: string) {
    let setting = await prisma.shippingSetting.findFirst();

    // Synchronize boolean and cost alias fields
    if (data.freeShippingEnabled !== undefined && data.enableFreeShipping === undefined) {
      data.enableFreeShipping = data.freeShippingEnabled;
    } else if (data.enableFreeShipping !== undefined && data.freeShippingEnabled === undefined) {
      data.freeShippingEnabled = data.enableFreeShipping;
    }
    if (data.insideDhakaCharge !== undefined && data.defaultShippingCost === undefined) {
      data.defaultShippingCost = data.insideDhakaCharge;
    }

    if (setting) {
      setting = await prisma.shippingSetting.update({ where: { id: setting.id }, data });
    } else {
      setting = await prisma.shippingSetting.create({ data });
    }
    StorefrontSettingService.clearCache();
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
    if (data.taxEnabled !== undefined && data.enableTax === undefined) {
      data.enableTax = data.taxEnabled;
    } else if (data.enableTax !== undefined && data.taxEnabled === undefined) {
      data.taxEnabled = data.enableTax;
    }

    let setting = await prisma.taxSetting.findFirst();
    if (setting) {
      setting = await prisma.taxSetting.update({ where: { id: setting.id }, data });
    } else {
      setting = await prisma.taxSetting.create({ data });
    }
    StorefrontSettingService.clearCache();
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
    StorefrontSettingService.clearCache();
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
