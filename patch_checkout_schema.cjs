const fs = require('fs');
const file = 'src/backend/validators/checkout.validator.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(/export const completeCheckoutSchema = z\.object\(\{[\s\S]*?\}\);/g, 
`export const completeCheckoutSchema = z.object({
  paymentMethod: z.string().min(1, "Payment method is required"),
  clientId: z.string().max(255, "Client ID must not exceed 255 characters").optional(),
  sessionId: z.string().max(255, "Session ID must not exceed 255 characters").optional(),
  shippingAddress: z.any().optional(),
  billingAddress: z.any().optional(),
});`);

fs.writeFileSync(file, code);
