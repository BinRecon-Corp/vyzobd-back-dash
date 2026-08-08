const fs = require('fs');
const file = 'src/backend/controllers/storefront/brand.controller.ts';
let code = fs.readFileSync(file, 'utf8');

const newMethod = `
export const getBrandBySlug = asyncHandler(async (req: Request, res: Response) => {
  const { slug } = req.params;
  const data = await storefrontBrandService.getBrandBySlug(slug);

  if (!data) {
    return res.status(404).json({ success: false, error: "Brand not found" });
  }

  res.json({
    success: true,
    data,
    meta: {}
  });
});
`;

code += '\n' + newMethod;
fs.writeFileSync(file, code);
