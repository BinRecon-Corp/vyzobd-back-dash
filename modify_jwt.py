with open('src/backend/utils/customerJwt.ts', 'r') as f:
    content = f.read()

content = content.replace('expiresIn: env.JWT_EXPIRES_IN,', 'expiresIn: env.JWT_EXPIRES_IN as any,')
content = content.replace('expiresIn: env.JWT_REFRESH_EXPIRES_IN,', 'expiresIn: env.JWT_REFRESH_EXPIRES_IN as any,')

with open('src/backend/utils/customerJwt.ts', 'w') as f:
    f.write(content)
