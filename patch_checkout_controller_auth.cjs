const fs = require('fs');
const file = 'src/backend/controllers/storefront/checkout.controller.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(/const guestSessionId = req\.headers\["x-cart-session-id"\] as string \| undefined;/g, 
`const guestSessionId = (
      req.headers["x-cart-session-id"] || 
      req.headers["x-session-id"] || 
      req.query.sessionId || 
      req.body?.sessionId
    ) as string | undefined;`);

fs.writeFileSync(file, code);
