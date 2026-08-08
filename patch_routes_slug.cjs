const fs = require('fs');

const updateRoute = (file, validatorImport, validateMethod) => {
  let code = fs.readFileSync(file, 'utf8');
  
  if (!code.includes('validateSlugParam')) {
    code = code.replace(
      validatorImport,
      validatorImport.replace('}', ', validateSlugParam }')
    );
  }
  
  code = code.replace(
    'router.get("/:slug",',
    'router.get("/:slug", validateSlugParam,'
  );

  fs.writeFileSync(file, code);
};

updateRoute(
  'src/backend/routes/storefront/product.routes.ts',
  'import { validateProductListQuery } from "../../middlewares/storefront/validation.middleware";',
  'validateProductListQuery'
);

updateRoute(
  'src/backend/routes/storefront/category.routes.ts',
  'import { validateCategoryListQuery } from "../../middlewares/storefront/validation.middleware";',
  'validateCategoryListQuery'
);

updateRoute(
  'src/backend/routes/storefront/brand.routes.ts',
  'import { validateBrandListQuery } from "../../middlewares/storefront/validation.middleware";',
  'validateBrandListQuery'
);
