const fs = require('fs');
const file = 'src/backend/services/storefront/category.service.ts';
let code = fs.readFileSync(file, 'utf8');

const newMethod = `
  async getCategoryBySlug(slug: string) {
    const category = await prisma.category.findFirst({
      where: {
        slug,
        isActive: true,
        deletedAt: null,
      }
    });

    if (!category) return null;

    let currentCategory = category;
    const breadcrumbs = [{ name: category.name, slug: category.slug }];
    
    while (currentCategory.parentId) {
      const parent = await prisma.category.findFirst({
        where: {
          id: currentCategory.parentId,
          isActive: true,
          deletedAt: null,
        }
      });
      if (parent) {
        breadcrumbs.unshift({ name: parent.name, slug: parent.slug });
        currentCategory = parent;
      } else {
        break;
      }
    }

    return {
      ...mapCategoryToStorefrontDTO(category),
      breadcrumbs
    };
  }
}
`;

code = code.replace(/}\s*export const storefrontCategoryService/, newMethod + 'export const storefrontCategoryService');
fs.writeFileSync(file, code);
