# Umusare Deployment Guide

This guide prepares Umusare for deployment. It does not launch the platform and does not connect real Mobile Money.

## Project Structure

- `frontend/` - public Umusare website for clients and drivers.
- `admin/` - private Umusare admin portal.
- `server/` - backend API.

Recommended production domains:

- Public website: `https://umusare.com`
- Admin portal: `https://admin.umusare.com` or `https://umusare.com/admin`
- Backend API: `https://api.umusare.com`

Recommended staging domains:

- Public website: `https://staging.umusare.com`
- Admin portal: `https://admin-staging.umusare.com`
- Backend API: `https://api-staging.umusare.com`

## Public Frontend Deployment

Location: `frontend/`

Install and build:

```bash
cd frontend
npm install
npm run build
npm run preview
```

Production env:

```bash
VITE_APP_ENV=production
VITE_API_BASE_URL=https://api.umusare.com/api
VITE_ENABLE_TEST_MODE=false
VITE_ENABLE_DEMO_DATA=false
VITE_ENABLE_DUMMY_PAYMENTS=false
```

Deploy the generated `frontend/dist/` folder to the public website host.

The static frontend also has safe hostname defaults:

- `umusare.com` uses `https://api.umusare.com/api`
- `staging.umusare.com` uses `https://api-staging.umusare.com/api`
- localhost/file development uses `http://localhost:5000/api`

If a host needs a custom API URL, set `window.VITE_API_BASE_URL` before `api.js` loads or use the documented environment build flow.

Production rules:

- No demo data.
- No test banner.
- No dummy payment controls for public users.
- No admin links in public navigation.
- No fake drivers, bookings, or reviews.

## Admin Portal Deployment

Location: `admin/`

Install and build:

```bash
cd admin
npm install
npm run build
npm run preview
```

Production env:

```bash
VITE_APP_ENV=production
VITE_API_BASE_URL=https://api.umusare.com/api
VITE_ENABLE_TEST_MODE=false
VITE_ENABLE_DEMO_DATA=false
VITE_ENABLE_DUMMY_PAYMENTS=false
```

Deploy the generated `admin/dist/` folder to `admin.umusare.com` or mount it under `umusare.com/admin`.

The static admin portal defaults to:

- `admin.umusare.com` uses `https://api.umusare.com/api`
- `admin-staging.umusare.com` uses `https://api-staging.umusare.com/api`
- localhost/file development uses `http://localhost:5000/api`

Production rules:

- Admin login is required.
- Public admin registration is not available.
- No visible test admin credentials.
- No demo login.
- No test tools unless explicitly enabled in staging.
- The public frontend must not link to the admin portal.

## Backend API Deployment

Location: `server/`

Install and start:

```bash
cd server
npm install
npm run build
npm start
```

Production env:

```bash
NODE_ENV=production
APP_ENV=production
PORT=5000
DATABASE_URL=
JWT_SECRET=
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://umusare.com
ADMIN_URL=https://admin.umusare.com
API_URL=https://api.umusare.com
CORS_ORIGINS=https://umusare.com,https://www.umusare.com,https://admin.umusare.com
ENABLE_TEST_MODE=false
ENABLE_DEMO_DATA=false
ENABLE_DUMMY_PAYMENTS=false
ENABLE_REAL_PAYMENTS=false
PAYMENT_PROVIDER=
PAYMENT_ENV=sandbox
MOMO_API_BASE_URL=
MOMO_API_KEY=
MOMO_API_SECRET=
MOMO_MERCHANT_ID=
MOMO_CALLBACK_URL=
MOMO_CURRENCY=RWF
SUPPORT_PHONE=
SUPPORT_WHATSAPP=
SUPPORT_EMAIL=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
APPLE_CLIENT_ID=
APPLE_TEAM_ID=
APPLE_KEY_ID=
APPLE_PRIVATE_KEY=
```

Backend startup refuses unsafe production config, including missing `DATABASE_URL`, weak/missing `JWT_SECRET`, localhost production origins, wildcard CORS, enabled demo/test flags, dummy payments, or incomplete real Mobile Money provider configuration when `ENABLE_REAL_PAYMENTS=true`.

## CORS And Domains

Production CORS should allow:

- `https://umusare.com`
- `https://www.umusare.com`
- `https://admin.umusare.com`

Staging CORS should allow:

- `https://staging.umusare.com`
- `https://admin-staging.umusare.com`

Local development supports:

- `http://localhost:3000`
- `http://localhost:3001`
- `http://localhost:5173`
- `http://localhost:5174`

Never use wildcard CORS in production.

## Database Setup

The backend is prepared for MongoDB with Mongoose.

Use a hosted MongoDB provider such as MongoDB Atlas or a managed MongoDB service.

Production notes:

- Use a separate production database from development/staging.
- Enable backups before launch.
- Restrict network access.
- Do not hardcode database credentials.
- Store the connection string only in `DATABASE_URL`.

Example placeholder:

```bash
DATABASE_URL=mongodb+srv://USERNAME:PASSWORD@HOST/umusare-production
```

## Private Upload Storage

Private uploads include:

- National ID / Passport
- Driver's Licence
- Proof of secondary education
- Police Clearance / Criminal Record Certificate
- Incident evidence files

Local upload storage is not suitable for production. Before public launch, move private uploads to secure cloud storage with access control and signed URLs.

Prepared env placeholders:

```bash
UPLOAD_STORAGE=local
PRIVATE_UPLOADS_DIR=
CLOUD_STORAGE_BUCKET=
CLOUD_STORAGE_REGION=
CLOUD_STORAGE_ACCESS_KEY=
CLOUD_STORAGE_SECRET_KEY=
```

Do not expose local uploads publicly in production.

## Health And Readiness

Health:

```text
GET https://api.umusare.com/api/health
```

Readiness:

```text
GET https://api.umusare.com/api/ready
```

These endpoints must not expose secrets, database URLs, JWT settings, or private config values.

## Logging

Development may use detailed request logs.

Production logging should avoid:

- Passwords
- Tokens
- Private document paths
- OAuth secrets
- Payment details
- Private evidence data

TODO: connect a production logging/monitoring provider before launch.

## Staging Deployment

Staging can enable test features:

```bash
APP_ENV=staging
ENABLE_TEST_MODE=true
ENABLE_DEMO_DATA=true
ENABLE_DUMMY_PAYMENTS=true
ENABLE_REAL_PAYMENTS=false
```

Staging must clearly show the test mode banner. Staging data must stay separate from production data.

## Rollback Notes

- Keep the previous frontend/admin build artifacts available.
- Keep backend deployment revisions versioned.
- Confirm database backups exist before backend changes.
- Roll back API and UI together if routes or response shapes changed.

## Safety Warning

Do not publicly launch Umusare until real Mobile Money/payment handling, secure private file storage, company/legal setup, and final security review are complete.

Real Mobile Money provider credentials must never be committed. Use provider sandbox credentials first, verify webhooks over HTTPS, and treat backend/provider confirmation as the source of truth.
