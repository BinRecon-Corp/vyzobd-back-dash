import re

with open('prisma/schema.prisma', 'r') as f:
    content = f.read()

# Add new models
new_models = """

model CustomerAddress {
  id          String   @id @default(uuid())
  customerId  String
  customer    Customer @relation(fields: [customerId], references: [id], onDelete: Cascade)
  label       String?
  fullName    String
  phone       String?
  address1    String
  address2    String?
  city        String
  state       String
  postalCode  String
  country     String
  isDefault   Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([customerId])
}

model CustomerRefreshToken {
  id          String    @id @default(uuid())
  customerId  String
  customer    Customer  @relation(fields: [customerId], references: [id], onDelete: Cascade)
  tokenHash   String    @unique
  expiresAt   DateTime
  revokedAt   DateTime?
  createdAt   DateTime  @default(now())

  @@index([customerId])
  @@index([tokenHash])
}

model Wishlist {
  id         String         @id @default(uuid())
  customerId String         @unique
  customer   Customer       @relation(fields: [customerId], references: [id], onDelete: Cascade)
  items      WishlistItem[]
  createdAt  DateTime       @default(now())
  updatedAt  DateTime       @updatedAt

  @@index([customerId])
}

model WishlistItem {
  id         String   @id @default(uuid())
  wishlistId String
  wishlist   Wishlist @relation(fields: [wishlistId], references: [id], onDelete: Cascade)
  productId  String
  product    Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  createdAt  DateTime @default(now())

  @@unique([wishlistId, productId])
  @@index([wishlistId])
  @@index([productId])
}
"""

if "model CustomerAddress {" not in content:
    content += new_models

# Modify Customer model
customer_regex = re.compile(r'model Customer \{.*?\n\}', re.DOTALL)
customer_match = customer_regex.search(content)

if customer_match:
    original_customer = customer_match.group(0)
    
    new_customer = original_customer
    
    fields_to_add = """
  passwordHash         String?
  isVerified           Boolean          @default(false)
  verificationToken    String?
  verificationExpires  DateTime?
  resetPasswordToken   String?
  resetPasswordExpires DateTime?
  lastLoginAt          DateTime?

  addresses            CustomerAddress[]
  refreshTokens        CustomerRefreshToken[]
  wishlist             Wishlist?
"""
    # insert before createdAt
    new_customer = new_customer.replace("  createdAt       DateTime       @default(now())", fields_to_add + "  createdAt       DateTime       @default(now())")
    
    # modify indexes
    if "@@index([email])" not in new_customer:
        new_customer = new_customer.replace("@@index([isActive, deletedAt])", "@@index([isActive, deletedAt])\n  @@index([email])\n  @@index([isVerified])")
    
    content = content.replace(original_customer, new_customer)

# Add WishlistItem to Product model
product_regex = re.compile(r'model Product \{.*?\n\}', re.DOTALL)
product_match = product_regex.search(content)

if product_match:
    original_product = product_match.group(0)
    if "wishlistItems" not in original_product:
        new_product = original_product.replace("  createdAt       DateTime  @default(now())", "  wishlistItems   WishlistItem[]\n\n  createdAt       DateTime  @default(now())")
        content = content.replace(original_product, new_product)

with open('prisma/schema.prisma', 'w') as f:
    f.write(content)
