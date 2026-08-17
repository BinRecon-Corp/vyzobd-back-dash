const fs = require('fs');
const file = 'src/backend/controllers/storefront/checkout.controller.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(/import \{ StorefrontCheckoutService \} from "\.\.\/\.\.\/services\/storefront\/checkout\.service";/, 'import { StorefrontCheckoutService } from "../../services/storefront/checkout.service";\nimport crypto from "crypto";\nimport { CartIdentifier } from "../../services/storefront/cart.service";');

code = code.replace(/export const getCheckoutSession/g, `
const resolveCartIdentifier = (req: CustomerAuthRequest, res: Response): CartIdentifier => {
  const customerId = req.customer?.id;
  let sessionId = (
    req.headers["x-cart-session-id"] ||
    req.headers["x-session-id"] ||
    req.query.sessionId ||
    req.body?.sessionId
  ) as string | undefined;

  if (!customerId && !sessionId) {
    sessionId = crypto.randomUUID();
    res.setHeader("X-Cart-Session-Id", sessionId);
  } else if (sessionId) {
    res.setHeader("X-Cart-Session-Id", sessionId);
  }

  return { customerId, sessionId };
};

export const getCheckoutSession`);

// Apply resolveCartIdentifier replacing custom logic

const replaceBlock = (funcName, varDeclarations) => {
    code = code.replace(new RegExp(`const customerId = req\\.customer\\?\\.id;\\s*const guestSessionId = \\([\\s\\S]*?\\) as string \\| undefined;\\s*if \\(!customerId && !guestSessionId\\) \\{\\s*return res\\.status\\(400\\)\\.json\\(\\{ status: "error", message: "Missing session identifier" \\}\\);\\s*\\}\\s*const identifier = customerId \\? \\{ customerId \\} : \\{ sessionId: guestSessionId! \\};`), 'const identifier = resolveCartIdentifier(req, res);');
};

replaceBlock();
replaceBlock();
replaceBlock();
replaceBlock();
replaceBlock();

fs.writeFileSync(file, code);
