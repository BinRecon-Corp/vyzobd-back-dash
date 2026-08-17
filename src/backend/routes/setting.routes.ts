import express from "express";
import { 
  getGeneral, updateGeneral,
  getBranding, updateBranding,
  getSEO, updateSEO,
  getSMTP, updateSMTP,
  getAnalytics, updateAnalytics,
  getSecurity, updateSecurity,
  getShipping, updateShipping,
  getTax, updateTax
} from "../controllers/setting.controller";
import { requireAuth, requirePermission } from "../middlewares/auth";
import { validateBody } from "../middlewares/validation";
import { 
  updateBrandingSettingsSchema,
  updateSEOSettingsSchema,
  updateSMTPSettingsSchema,
  updateAnalyticsSettingsSchema,
  updateSecuritySettingsSchema,
  updateShippingSettingsSchema,
  updateTaxSettingsSchema
} from "../validators/setting.validator";

const router = express.Router();

router.use(requireAuth);

router.get("/general", requirePermission("Settings", "read"), getGeneral);
router.put("/general", requirePermission("Settings", "write"), updateGeneral);

router.get("/branding", requirePermission("Settings", "read"), getBranding);
router.put("/branding", requirePermission("Settings", "write"), validateBody(updateBrandingSettingsSchema), updateBranding);

router.get("/seo", requirePermission("Settings", "read"), getSEO);
router.put("/seo", requirePermission("Settings", "write"), validateBody(updateSEOSettingsSchema), updateSEO);

router.get("/smtp", requirePermission("Settings", "read"), getSMTP);
router.put("/smtp", requirePermission("Settings", "write"), validateBody(updateSMTPSettingsSchema), updateSMTP);

router.get("/analytics", requirePermission("Settings", "read"), getAnalytics);
router.put("/analytics", requirePermission("Settings", "write"), validateBody(updateAnalyticsSettingsSchema), updateAnalytics);

router.get("/security", requirePermission("Settings", "read"), getSecurity);
router.put("/security", requirePermission("Settings", "write"), validateBody(updateSecuritySettingsSchema), updateSecurity);

router.get("/shipping", requirePermission("Settings", "read"), getShipping);
router.put("/shipping", requirePermission("Settings", "write"), validateBody(updateShippingSettingsSchema), updateShipping);

router.get("/tax", requirePermission("Settings", "read"), getTax);
router.put("/tax", requirePermission("Settings", "write"), validateBody(updateTaxSettingsSchema), updateTax);

export default router;
