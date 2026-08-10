import re

with open('src/backend/services/storefront/auth.service.ts', 'r') as f:
    content = f.read()

content = content.replace(
    'static async createCustomerRefreshToken(customerId: string, tokenString: string, expiresAt: Date) {',
    'static async createCustomerRefreshToken(customerId: string, tokenString: string, expiresAt: Date, ipAddress?: string, userAgent?: string) {'
)

content = content.replace(
    '        expiresAt,\n      },',
    '        expiresAt,\n        ipAddress,\n        userAgent,\n      },'
)

with open('src/backend/services/storefront/auth.service.ts', 'w') as f:
    f.write(content)
