# Ecommerce Admin Dashboard Architecture

## 1. Environment Note
*Due to sandbox restrictions, the frontend architecture is adapted to a React 19 + Vite SPA rather than Next.js 15 App Router. The backend remains Express + PostgreSQL. Both frontend and backend serve out of the same unified container using port 3000.*

## 2. Folder Structure

```text
/
├── prisma/
│   └── schema.prisma         # Database Schema (Models, Relations, Enums)
├── src/
│   ├── backend/              # Express.js API (Backend Application)
│   │   ├── config/           # Environment variables, Redis config, DB setup
│   │   ├── controllers/      # Route logic & payload parsing
│   │   ├── middlewares/      # Auth (JWT), RBAC, Error Handler, Validation
│   │   ├── routes/           # Express Routers
│   │   ├── services/         # Core business logic (Prisma queries)
│   │   ├── utils/            # JWT helpers, hashing, standardized API responses
│   │   └── types/            # Backend-specific interfaces
│   ├── frontend/             # React/Vite (Frontend Application)
│   │   ├── api/              # Axios instance & TanStack Query hooks
│   │   ├── components/       # Shadcn UI, common components
│   │   ├── hooks/            # Custom reusable hooks
│   │   ├── layouts/          # Dashboard Layout, Sidebar, Header
│   │   ├── pages/            # Page Views (Products, Orders, Settings)
│   │   ├── store/            # Zustand global state (Auth, UI preferences)
│   │   ├── types/            # Shared DTOs and frontend models
│   │   └── utils/            # Formatters, constants
│   ├── server.ts             # Express Entry Point (Boots API & serves Vite)
│   ├── main.tsx              # React Entry Point
│   └── App.tsx               # Main React Router setup
├── docs/                     # Architecture & Swagger Specs
└── package.json
```

## 3. API Standard Formats

### Pagination, Filtering, and Sorting
The API uses standardized query parameters:
- **Pagination**: `?page=1&limit=10`
- **Sorting**: `?sort=createdAt&order=desc`
- **Filtering**: `?filter[categoryId]=123&search=laptop`

### Success Response Example (`200 OK`)
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-123",
      "name": "Gaming Laptop",
      "price": 1299.99
    }
  ],
  "meta": {
    "total": 50,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}
```

### Error Response Example (`400 Bad Request` or `403 Forbidden`)
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request payload",
    "details": [
      {
        "field": "price",
        "message": "Price must be a positive number"
      }
    ]
  }
}
```

## 4. Authentication & RBAC Flow

1. **Login**: User submits `email` & `password` to `/api/v1/auth/login`.
2. **Token Generation**: Backend verifies hash via `bcrypt` and generates a short-lived **JWT Access Token** and a long-lived **Refresh Token** (stored in HttpOnly cookies/Redis).
3. **Authorization**: Requests include the `Authorization: Bearer <token>` header.
4. **RBAC Middleware**:
   - Every protected route uses `requireAuth`.
   - Admin routes use `requirePermission('products:write')`.
   - The backend checks the user's `Role` and associated `Permissions` via Prisma before fulfilling the request.

## 5. Next Steps / Development Roadmap

- [x] Phase 1: Architecture & Database Schema Design
- [ ] Phase 2: Express Server Setup, Authentication, & Error Handling Middlewares
- [ ] Phase 3: Core API Endpoints (Products, Categories, Orders)
- [ ] Phase 4: Frontend Scaffolding (Vite, Tailwind, Shadcn, React Router)
- [ ] Phase 5: Dashboard UI & Data Integration (TanStack Query)
- [ ] Phase 6: Analytics & Optimization (GA4, Activity Logs)
