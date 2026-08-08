const fs = require('fs');
const file = 'src/backend/services/storefront/brand.service.ts';
let code = fs.readFileSync(file, 'utf8');

const newMethod = `
  async getBrandBySlug(slug: string) {
    const brand = await prisma.brand.findFirst({
      where: {
        slug,
        isActive: true,
        deletedAt: null,
      },
    });

    if (!brand) return null;

    return mapBrandToStorefrontDTO(brand);
  }
}
`;

code = code.replace(/}\s*export const storefrontBrandService/, newMethod + '\nexport const storefrontBrandService');
fs.writeFileSync(file, code);
