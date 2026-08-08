const fs = require('fs');
const file = 'src/backend/middlewares/storefront/validation.middleware.ts';
let code = fs.readFileSync(file, 'utf8');

const newMethod = `
export const validateSlugParam = (req: Request, res: Response, next: NextFunction) => {
  const { slug } = req.params;
  const slugRegex = /^[a-z0-9-]+$/;
  
  if (!slug || typeof slug !== 'string' || !slugRegex.test(slug)) {
    return res.status(400).json({
      success: false,
      message: "Invalid slug"
    });
  }
  
  next();
};
`;

code += '\n' + newMethod;
fs.writeFileSync(file, code);
