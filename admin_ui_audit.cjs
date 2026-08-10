const fs = require('fs');
const path = require('path');

const modules = [
  "Users", "Roles", "Permissions", "Customers", "Categories", "Brands", 
  "Products", "Variants", "Inventory", "Coupons", "Orders", "Payments", 
  "Refunds", "Returns", "Shipments", "CMS", "Settings", "Notifications", "Analytics"
];

const pages = [
  "src/pages/admin/Users.tsx",
  "src/pages/admin/Roles.tsx",
  "src/pages/admin/RolePermissions.tsx",
  "src/pages/admin/customers/CustomersList.tsx",
  "src/pages/admin/customers/CustomerDetail.tsx",
  "src/pages/categories/CategoryList.tsx",
  "src/pages/categories/CategoryCreate.tsx",
  "src/pages/categories/CategoryEdit.tsx",
  "src/pages/brands/BrandList.tsx",
  "src/pages/brands/BrandCreate.tsx",
  "src/pages/brands/BrandEdit.tsx",
  "src/pages/Products.tsx",
  "src/pages/products/ProductCreate.tsx",
  "src/pages/products/ProductEdit.tsx",
  "src/pages/products/ProductView.tsx",
  "src/pages/products/ProductVariants.tsx",
  "src/pages/Inventory.tsx",
  "src/pages/admin/coupons/CouponsList.tsx",
  "src/pages/admin/orders/OrdersList.tsx",
  "src/pages/admin/orders/OrderDetail.tsx",
  "src/pages/admin/cms/CmsPagesList.tsx",
  "src/pages/admin/cms/CmsPageCreate.tsx",
  "src/pages/admin/cms/CmsPageEdit.tsx",
  "src/pages/Analytics.tsx",
];

console.log("Checking API integration...");
for (const p of pages) {
  if (fs.existsSync(p)) {
    const content = fs.readFileSync(p, 'utf-8');
    const hasFetchOrAxios = content.includes('fetch') || content.includes('axios') || content.includes('useQuery') || content.includes('useMutation') || content.includes('api.');
    console.log(`${p}: API=${hasFetchOrAxios}`);
  } else {
    console.log(`${p}: MISSING`);
  }
}
