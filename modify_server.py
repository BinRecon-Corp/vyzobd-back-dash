import re

with open('server.ts', 'r') as f:
    content = f.read()

# Add import
if 'import storefrontAccountRouter from "./src/backend/routes/storefront/account.routes";' not in content:
    content = content.replace(
        'import storefrontAuthRouter from "./src/backend/routes/storefront/auth.routes";',
        'import storefrontAuthRouter from "./src/backend/routes/storefront/auth.routes";\nimport storefrontAccountRouter from "./src/backend/routes/storefront/account.routes";'
    )

# Add route mount
if 'storefrontRouter.use("/account", storefrontAccountRouter);' not in content:
    content = content.replace(
        '  storefrontRouter.use("/auth", storefrontAuthRouter);',
        '  storefrontRouter.use("/auth", storefrontAuthRouter);\n  storefrontRouter.use("/account", storefrontAccountRouter);'
    )

with open('server.ts', 'w') as f:
    f.write(content)
