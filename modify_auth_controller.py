import re

with open('src/backend/controllers/storefront/auth.controller.ts', 'r') as f:
    content = f.read()

content = content.replace(
    'await StorefrontAuthService.createCustomerRefreshToken(customer.id, refreshToken, expiresAt);',
    'const ip = (req.headers["x-forwarded-for"] as string) || req.ip || req.socket.remoteAddress || "Unknown";\n    const userAgent = req.headers["user-agent"] || "Unknown";\n    await StorefrontAuthService.createCustomerRefreshToken(customer.id, refreshToken, expiresAt, ip, userAgent);'
)

content = content.replace(
    'await StorefrontAuthService.createCustomerRefreshToken(customer.id, newRefreshToken, expiresAt);',
    'const ip = (req.headers["x-forwarded-for"] as string) || req.ip || req.socket.remoteAddress || "Unknown";\n    const userAgent = req.headers["user-agent"] || "Unknown";\n    await StorefrontAuthService.createCustomerRefreshToken(customer.id, newRefreshToken, expiresAt, ip, userAgent);'
)

with open('src/backend/controllers/storefront/auth.controller.ts', 'w') as f:
    f.write(content)
