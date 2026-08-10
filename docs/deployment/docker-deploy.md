# Docker Deployment Guide

This document describes how to deploy the eCommerce platform using Docker and Docker Compose.

## 1. Dockerfile Architecture
The project utilizes a multi-stage `Dockerfile` to optimize final container image size and build speed:

```dockerfile
# Stage 1: Dependencies & Build
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

# Stage 2: Runtime Production Image
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

COPY package*.json ./
RUN npm ci --only=production
COPY prisma ./prisma/
RUN npx prisma generate
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["node", "dist/server.cjs"]
```

---

## 2. Docker Compose Configuration (`docker-compose.yml`)

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: ecommerce_postgres
    restart: always
    environment:
      POSTGRES_DB: ecommerce_prod
      POSTGRES_USER: ecommerce_user
      POSTGRES_PASSWORD: StrongPassword2026
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ecommerce_user -d ecommerce_prod"]
      interval: 5s
      timeout: 5s
      retries: 5

  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: ecommerce_app
    restart: always
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      PORT: 3000
      DATABASE_URL: postgresql://ecommerce_user:StrongPassword2026@postgres:5432/ecommerce_prod?schema=public
      JWT_SECRET: super-secret-docker-jwt-key-32-chars-minimum
      JWT_EXPIRES_IN: 1h
      JWT_REFRESH_EXPIRES_IN: 7d
      COOKIE_SECRET: super-secret-cookie-signing-key
      ADMIN_EMAIL: admin@yourdomain.com
      ADMIN_PASSWORD: AdminPassword123!
      ALLOWED_ORIGINS: "*"
    depends_on:
      postgres:
        condition: service_healthy

volumes:
  postgres_data:
```

---

## 3. Running with Docker Compose

Build and launch services in background mode:
```bash
docker compose up -d --build
```

Run database migrations inside running container:
```bash
docker compose exec app npx prisma migrate deploy
docker compose exec app npx prisma db seed
```

Check application logs:
```bash
docker compose logs -f app
```
