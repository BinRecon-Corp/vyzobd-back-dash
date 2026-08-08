const fs = require('fs');
const path = require('path');

const filesToPatch = [
  {
    file: 'src/backend/routes/page.routes.ts',
    imports: `import { validateBody, validateParamsUUID, createPageSchema, updatePageSchema } from '../middlewares/validation';\n`,
    patches: [
      { from: `Controller.create);`, to: `validateBody(createPageSchema), Controller.create);` },
      { from: `Controller.update);`, to: `validateParamsUUID(["id"]), validateBody(updatePageSchema), Controller.update);` },
      { from: `Controller.getById);`, to: `validateParamsUUID(["id"]), Controller.getById);` },
      { from: `Controller.remove);`, to: `validateParamsUUID(["id"]), Controller.remove);` },
    ]
  },
  {
    file: 'src/backend/routes/blog.routes.ts',
    imports: `import { validateBody, validateParamsUUID, createBlogPostSchema, updateBlogPostSchema } from '../middlewares/validation';\n`,
    patches: [
      { from: `Controller.create);`, to: `validateBody(createBlogPostSchema), Controller.create);` },
      { from: `Controller.update);`, to: `validateParamsUUID(["id"]), validateBody(updateBlogPostSchema), Controller.update);` },
      { from: `Controller.getById);`, to: `validateParamsUUID(["id"]), Controller.getById);` },
      { from: `Controller.remove);`, to: `validateParamsUUID(["id"]), Controller.remove);` },
    ]
  },
  {
    file: 'src/backend/routes/faq.routes.ts',
    imports: `import { validateBody, validateParamsUUID, createFAQSchema, updateFAQSchema } from '../middlewares/validation';\n`,
    patches: [
      { from: `Controller.create);`, to: `validateBody(createFAQSchema), Controller.create);` },
      { from: `Controller.update);`, to: `validateParamsUUID(["id"]), validateBody(updateFAQSchema), Controller.update);` },
      { from: `Controller.getById);`, to: `validateParamsUUID(["id"]), Controller.getById);` },
      { from: `Controller.remove);`, to: `validateParamsUUID(["id"]), Controller.remove);` },
    ]
  },
  {
    file: 'src/backend/routes/landing-page.routes.ts',
    imports: `import { validateBody, validateParamsUUID, createLandingPageSchema, updateLandingPageSchema } from '../middlewares/validation';\n`,
    patches: [
      { from: `Controller.create);`, to: `validateBody(createLandingPageSchema), Controller.create);` },
      { from: `Controller.update);`, to: `validateParamsUUID(["id"]), validateBody(updateLandingPageSchema), Controller.update);` },
      { from: `Controller.getById);`, to: `validateParamsUUID(["id"]), Controller.getById);` },
      { from: `Controller.remove);`, to: `validateParamsUUID(["id"]), Controller.remove);` },
    ]
  },
  {
    file: 'src/backend/routes/media.routes.ts',
    imports: `import { validateBody, validateParamsUUID, createMediaAssetSchema, updateMediaAssetSchema } from '../middlewares/validation';\n`,
    patches: [
      { from: `Controller.create);`, to: `validateBody(createMediaAssetSchema), Controller.create);` },
      { from: `Controller.update);`, to: `validateParamsUUID(["id"]), validateBody(updateMediaAssetSchema), Controller.update);` },
      { from: `Controller.getById);`, to: `validateParamsUUID(["id"]), Controller.getById);` },
      { from: `Controller.remove);`, to: `validateParamsUUID(["id"]), Controller.remove);` },
    ]
  },
  {
    file: 'src/backend/routes/seo.routes.ts',
    imports: `import { validateBody, updateGlobalSeoSchema } from '../middlewares/validation';\n`,
    patches: [
      { from: `Controller.updateGlobalSeo);`, to: `validateBody(updateGlobalSeoSchema), Controller.updateGlobalSeo);` }
    ]
  }
];

filesToPatch.forEach(({ file, imports, patches }) => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    if (!content.includes('import { validateBody')) {
      content = imports + content;
    }
    
    patches.forEach(patch => {
      content = content.replace(patch.from, patch.to);
    });
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Patched', file);
  } else {
    console.log('File not found', file);
  }
});
