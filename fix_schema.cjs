const fs = require('fs');
let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');

const settingsModels = `
model Setting {
  id          String   @id @default(uuid())
  group       String
  key         String   @unique
  value       String   @db.Text
  type        String
  description String?
  isPublic    Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model BrandingSetting {
  id                 String   @id @default(uuid())
  siteName           String?
  siteTitle          String?
  siteTagline        String?
  logoUrl            String?
  faviconUrl         String?
  adminPanelName     String?
  adminPanelLogo     String?
  invoiceLogo        String?
  defaultLanguage    String   @default("en")
  defaultCurrency    String   @default("USD")
  defaultTimezone    String   @default("UTC")
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt
}

model SEOSetting {
  id                 String   @id @default(uuid())
  metaTitle          String?
  metaDescription    String?
  metaKeywords       String?
  ogTitle            String?
  ogDescription      String?
  ogImage            String?
  twitterTitle       String?
  twitterDescription String?
  twitterImage       String?
  robotsTxt          String?
  customHeadCode     String?  @db.Text
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt
}

model SMTPSetting {
  id          String   @id @default(uuid())
  host        String?
  port        Int?
  username    String?
  password    String?
  fromEmail   String?
  fromName    String?
  secure      Boolean  @default(true)
  enabled     Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model AnalyticsSetting {
  id                 String   @id @default(uuid())
  googleAnalyticsId  String?
  googleTagManagerId String?
  facebookPixelId    String?
  hotjarId           String?
  enableAnalytics    Boolean  @default(false)
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt
}

model SecuritySetting {
  id                    String   @id @default(uuid())
  enable2FA             Boolean  @default(false)
  passwordMinLength     Int      @default(8)
  sessionTimeoutMinutes Int      @default(60)
  maxLoginAttempts      Int      @default(5)
  enableMaintenanceMode Boolean  @default(false)
  maintenanceMessage    String?
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
}

model ShippingSetting {
  id                    String   @id @default(uuid())
  defaultShippingCost   Float    @default(0)
  freeShippingThreshold Float?
  enableFreeShipping    Boolean  @default(false)
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
}

model TaxSetting {
  id               String   @id @default(uuid())
  defaultTaxRate   Float    @default(0)
  pricesIncludeTax Boolean  @default(false)
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
}
`;

if (!schema.includes('model BrandingSetting')) {
  schema += '\n' + settingsModels;
  fs.writeFileSync('prisma/schema.prisma', schema);
}
