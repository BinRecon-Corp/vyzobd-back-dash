# Environment Variables Specification

The platform utilizes configuration variables loaded via `dotenv` and validated through Zod in `src/backend/config/env.ts`.

## 1. Required Environment Variables

| Variable Name | Type | Example / Default | Description |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | String (URL) | `postgresql://user:pass@localhost:5432/db?schema=public` | PostgreSQL connection string |
| `JWT_SECRET` | String (Min 32) | `secret-key-at-least-32-chars-long-12345` | Secret key used to sign Access JWTs |
| `JWT_EXPIRES_IN` | String | `1h` | Access token TTL |
| `JWT_REFRESH_EXPIRES_IN` | String | `7d` | Refresh token TTL |
| `COOKIE_SECRET` | String | `cookie-secret-key-for-session` | Express session cookie signing key |
| `ADMIN_EMAIL` | String (Email) | `admin@example.com` | Super admin seed email |
| `ADMIN_PASSWORD` | String | `AdminPassword123!` | Super admin seed password |
| `ALLOWED_ORIGINS` | String | `http://localhost:3000,http://localhost:5173` | Comma-separated CORS allowed domains |

## 2. Optional Environment Variables

| Variable Name | Type | Example | Description |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | String | `production` / `development` | Node environment setting |
| `PORT` | Number | `3000` | Server binding port (Default: 3000) |
| `GEMINI_API_KEY` | String | `AIzaSy...` | Gemini AI API Key for automatic text/image generation |
| `GA_MEASUREMENT_ID` | String | `G-XXXXXXXXXX` | Google Analytics 4 Measurement ID |
| `GA_API_SECRET` | String | `secret_key` | GA4 Measurement Protocol API Secret |
| `GA_PROPERTY_ID` | String | `123456789` | GA4 Data API Property ID |
| `GOOGLE_CREDENTIALS_JSON` | String (JSON) | `{"type":"service_account",...}` | Google Cloud Service Account JSON for GA4 reports |
