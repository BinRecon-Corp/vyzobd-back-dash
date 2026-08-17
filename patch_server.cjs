const fs = require('fs');
let serverTs = fs.readFileSync('server.ts', 'utf8');

const importLines = `
import storefrontBannerRouter from "./src/backend/routes/storefront/banner.routes";
import storefrontPopupRouter from "./src/backend/routes/storefront/popup.routes";
import storefrontPromotionRouter from "./src/backend/routes/storefront/promotion.routes";
import storefrontCouponRouter from "./src/backend/routes/storefront/coupon.routes";
import storefrontCampaignRouter from "./src/backend/routes/storefront/campaign.routes";
import storefrontAnnouncementRouter from "./src/backend/routes/storefront/announcement.routes";
import storefrontHomeRouter from "./src/backend/routes/storefront/home.routes";
`;

serverTs = serverTs.replace(
  'import { storefrontRequestLogger }',
  importLines.trim() + '\nimport { storefrontRequestLogger }'
);

const mountLines = `
  storefrontRouter.use("/banners", storefrontBannerRouter);
  storefrontRouter.use("/popups", storefrontPopupRouter);
  storefrontRouter.use("/promotions", storefrontPromotionRouter);
  storefrontRouter.use("/coupons", storefrontCouponRouter);
  storefrontRouter.use("/campaigns", storefrontCampaignRouter);
  storefrontRouter.use("/announcements", storefrontAnnouncementRouter);
  storefrontRouter.use("/home", storefrontHomeRouter);
`;

serverTs = serverTs.replace(
  '  storefrontRouter.use("/products", storefrontProductRouter);',
  mountLines.trim() + '\n  storefrontRouter.use("/products", storefrontProductRouter);'
);

fs.writeFileSync('server.ts', serverTs);
console.log('Patched server.ts successfully');
