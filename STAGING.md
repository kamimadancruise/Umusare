# Umusare Staging And Test Mode

This file describes how to run Umusare safely in development and staging without confusing test data, dummy payments, or demo users with production behavior.

## Modes

Use `APP_ENV` as the main application environment switch:

- `development`: local testing, test mode allowed.
- `staging`: remote testing, test mode allowed and clearly labeled.
- `production`: public production behavior, test/demo/dummy features disabled.

Real Mobile Money is not active yet. Do not add provider credentials to this repository.

## Backend Development

Use `server/.env` for local values. Do not commit real secrets.

```bash
NODE_ENV=development
APP_ENV=development
PORT=5000
DATABASE_URL=mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/umusare?appName=Cluster0
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
ADMIN_URL=http://localhost:5174
API_URL=http://localhost:5000
ENABLE_TEST_MODE=true
ENABLE_DEMO_DATA=true
ENABLE_DUMMY_PAYMENTS=true
ENABLE_REAL_PAYMENTS=false
```

Run locally:

```bash
cd server
npm install
npm run seed:admin
npm run dev
```

## Frontend And Admin Development

Public frontend and admin portal should point to the local API:

```bash
VITE_APP_ENV=development
VITE_API_BASE_URL=http://localhost:5000/api
VITE_ENABLE_TEST_MODE=true
VITE_ENABLE_DEMO_DATA=true
VITE_ENABLE_DUMMY_PAYMENTS=true
VITE_ENABLE_REAL_PAYMENTS=false
```

Run each app with its own `npm run dev` command from the app folder.

## Staging

Staging may use test mode and dummy payments, but it must show the test mode banner:

`Test Mode — Umusare is running with test data and dummy payments.`

Recommended staging backend values:

```bash
NODE_ENV=production
APP_ENV=staging
FRONTEND_URL=https://staging.umusare.com
ADMIN_URL=https://admin-staging.umusare.com
API_URL=https://api-staging.umusare.com
CORS_ORIGINS=https://staging.umusare.com,https://admin-staging.umusare.com
ENABLE_TEST_MODE=true
ENABLE_DEMO_DATA=true
ENABLE_DUMMY_PAYMENTS=true
ENABLE_REAL_PAYMENTS=false
```

Recommended staging frontend/admin values:

```bash
VITE_APP_ENV=staging
VITE_API_BASE_URL=https://api-staging.umusare.com/api
VITE_ENABLE_TEST_MODE=true
VITE_ENABLE_DEMO_DATA=true
VITE_ENABLE_DUMMY_PAYMENTS=true
VITE_ENABLE_REAL_PAYMENTS=false
```

## Production Safety

Production must use:

```bash
NODE_ENV=production
APP_ENV=production
ENABLE_TEST_MODE=false
ENABLE_DEMO_DATA=false
ENABLE_DUMMY_PAYMENTS=false
ENABLE_REAL_PAYMENTS=false
```

The backend startup checks refuse unsafe production configuration, including missing database/JWT configuration, weak JWT secrets, localhost production origins, wildcard CORS, enabled demo/test mode, and enabled dummy payments.

## Dummy And Real Payments

Dummy payments are only for development and staging tests. When dummy payments are disabled, the backend dummy payment route returns:

`Dummy payments are disabled in this environment.`

Real Mobile Money route placeholders remain disabled unless `ENABLE_REAL_PAYMENTS=true` and official provider configuration is present. Frontend payment success must never be treated as the source of truth.

## Demo Data

Demo data is only allowed when `ENABLE_DEMO_DATA=true` or `VITE_ENABLE_DEMO_DATA=true`.

Current public sample data is isolated under `frontend/devSampleData/` and should not load silently in production. Demo seed and clear scripts refuse production and operate only on records marked as demo data.

```bash
cd server
npm run seed:demo
npm run seed:clear-demo
```

Never run demo seed or clear scripts against production.

## Test Flow

Use `TESTING.md` for the full checklist:

1. Start backend.
2. Start public frontend.
3. Start admin portal.
4. Seed/login admin.
5. Register client and driver.
6. Submit and approve driver application.
7. Activate dummy subscription.
8. Create bookings.
9. Complete trip, review, report incident.
10. Confirm admin analytics update.

## Launch Warning

Do not publicly launch Umusare until real Mobile Money/payment handling, secure private file storage, company/legal setup, and final security review are complete.
