# Development Guide & Setup

## 1. Prerequisites
Ensure your workstation meets the following minimum requirements:
- **Node.js**: v20.18.0 or v22.x LTS
- **NPM**: v10.x
- **PostgreSQL**: v15 or v16
- **Git**: v2.40+

## 2. Step-by-Step Local Environment Setup

### Step 1: Clone Repository & Install Dependencies
```bash
git clone https://github.com/your-org/ecommerce-platform.git
cd ecommerce-platform
npm install
```

### Step 2: PostgreSQL Database Creation
Log in to PostgreSQL CLI or pgAdmin and create a dedicated database:
```sql
CREATE DATABASE ecommerce_db;
CREATE USER ecommerce_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE ecommerce_db TO ecommerce_user;
```

### Step 3: Configure Environment File
Create a `.env` file in the project root:
```env
DATABASE_URL="postgresql://ecommerce_user:secure_password@localhost:5432/ecommerce_db?schema=public"
JWT_SECRET="super-secret-jwt-key-at-least-32-characters-long"
JWT_EXPIRES_IN="1h"
JWT_REFRESH_EXPIRES_IN="7d"
COOKIE_SECRET="super-secure-cookie-secret-key-for-session"
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="AdminPassword123!"
ALLOWED_ORIGINS="http://localhost:3000,http://localhost:5173"
```

### Step 4: Run Migrations and Seed Database
```bash
npx prisma migrate dev --name init
npx prisma db seed
```

### Step 5: Run Development Server
```bash
npm run dev
```
The dev server boots on `http://localhost:3000`.

## 3. Standard Development Patterns

### Adding a New API Endpoint
1. Define request validation schema in `src/backend/validators/<feature>.validator.ts`.
2. Add business logic method in `src/backend/services/<feature>.service.ts`.
3. Add request handler in `src/backend/controllers/<feature>.controller.ts`.
4. Define route with auth/permission middlewares in `src/backend/routes/<feature>.routes.ts`.
5. Mount route in `server.ts`.
6. Add frontend API call method in `src/services/<feature>.service.ts`.
7. Implement frontend UI view in `src/pages/`.
