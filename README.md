# Umusare Project Structure

Umusare is organized into three clear areas so the public website, staff portal, and future backend API can grow separately.

## Public Website

Location: `frontend/`

Used by clients and drivers. This area contains the public-facing static pages:

- Homepage
- Quick Book
- Plan Ahead
- Find a Driver
- Driver Profile
- Become a Driver
- Client Dashboard
- Driver Dashboard
- Login / signup placeholders
- Support
- Legal and safety pages
- Shared assets, CSS, JavaScript, and development-only sample data fixtures

Later, this can be hosted at a public domain such as `umusare.com`.

## Admin Portal

Location: `admin/`

Entry point: `admin/index.html`

Used by Umusare staff and administrators. This area contains:

- Admin Dashboard
- Driver applications
- Document verification
- Booking management
- Incident reports
- Support tickets
- Subscriptions
- Statistics & Analytics
- Future user management

Admin routes use the protected backend admin API. Public website pages do not link to this portal. Later, this area can be hosted at `admin.umusare.com` or `umusare.com/admin`.

The admin portal now has its own login page at `admin/index.html`. Admin accounts cannot be created from public signup. Create an admin user manually or with a seed script in a later backend step.

## Backend API

Location: `server/`

This is the backend API. It includes Express, authentication, driver applications, admin approval, driver profiles, bookings, matching, contact actions, reviews, incident reports, subscriptions, dummy payments, and admin analytics.

The server handles:

- Authentication
- Google login
- Apple login
- Driver applications
- Document uploads
- Admin approval
- Bookings
- Reviews
- Reports
- Subscriptions
- Dummy payments
- Admin statistics and analytics

The API can later be hosted at something like `api.umusare.com`, while the frontend and admin portal call it behind the scenes.

Local health check after installing server dependencies:

- `http://localhost:5000/api/health`

## API Configuration

Public frontend API helper:

- File: `frontend/api.js`
- Default base URL: `http://localhost:5000/api`
- Override in plain HTML by setting `window.UMUSARE_API_BASE_URL` before `api.js`, or setting `localStorage.UMUSARE_API_BASE_URL`.

Admin portal API helper:

- File: `admin/admin-api.js`
- Default base URL: `http://localhost:5000/api`

JWT tokens are stored in localStorage during this development phase. The backend still enforces role protection; frontend role checks are only for user experience.

## Real API Data Status

These pages now use backend API data instead of active hardcoded sample data:

- Public Find a Driver: `GET /api/drivers`
- Public Driver Profile: `GET /api/drivers/:publicDriverId`
- Quick Book: `POST /api/bookings/quick-book`
- Plan Ahead: `POST /api/bookings/plan-ahead`
- Become a Driver: `POST /api/driver-applications` plus document uploads
- Client Dashboard: bookings, reports, reviews, contact actions
- Driver Dashboard: profile, availability, bookings, reports, reviews, subscriptions, dummy payments
- Admin Dashboard: applications, drivers, bookings, reviews, reports, subscriptions, dummy payments, analytics

`frontend/devSampleData/sample-data.js` remains only as a development fixture reference. It is not imported by the API-backed dashboard and booking pages.

## Environment Modes

Umusare now separates `development`, `staging`, and `production` behavior.

Backend flags in `server/.env`:

```bash
NODE_ENV=development
APP_ENV=development
ENABLE_TEST_MODE=true
ENABLE_DEMO_DATA=true
ENABLE_DUMMY_PAYMENTS=true
ENABLE_REAL_PAYMENTS=false
```

Frontend/admin runtime flags:

```bash
VITE_APP_ENV=development
VITE_API_BASE_URL=http://localhost:5000/api
VITE_ENABLE_TEST_MODE=true
VITE_ENABLE_DEMO_DATA=true
VITE_ENABLE_DUMMY_PAYMENTS=true
```

Plain HTML pages can also read the same values from `window.*` globals or `localStorage`. Production disables test mode, demo data, and dummy payments by default.

Production requirements:

```bash
NODE_ENV=production
APP_ENV=production
ENABLE_TEST_MODE=false
ENABLE_DEMO_DATA=false
ENABLE_DUMMY_PAYMENTS=false
ENABLE_REAL_PAYMENTS=false
```

The backend refuses unsafe production configuration, including missing `DATABASE_URL`, weak/missing `JWT_SECRET`, local frontend/admin origins, enabled demo/test flags, enabled dummy payments, or enabled real payments before Mobile Money is implemented.

Example frontend/admin env files:

- `frontend/.env.example`
- `admin/.env.example`

## Test Mode

When test mode is enabled, public pages, dashboards, and the admin portal show:

`Test Mode — Umusare is running with test data and dummy payments.`

The banner is hidden in production. The admin portal also shows a development-only Test Tools section with the app environment, API URL, dummy payment status, and demo data status.

## Demo Data And Seeds

Development fixtures live under `frontend/devSampleData/`. Production pages should show real empty/error states instead of fake drivers, fake bookings, fake reviews, fake reports, fake payments, or fake analytics.

Seed scripts live in `server/src/seed/` and refuse to run when `APP_ENV=production` or `NODE_ENV=production`:

```bash
cd server
npm run seed:admin
npm run seed:demo
npm run seed:clear-demo
```

`seed:admin` creates a test admin using `.env` values:

```bash
TEST_ADMIN_EMAIL=
TEST_ADMIN_PHONE=
TEST_ADMIN_PASSWORD=
TEST_ADMIN_NAME=
```

`seed:demo` only runs when `ENABLE_DEMO_DATA=true`. `seed:clear-demo` removes only records marked with `isDemoData: true`.

Never run demo seed or clear scripts against production.

## Run Together Locally

1. Install backend dependencies from `server/`:

```bash
npm install
npm run dev
```

2. Create `server/.env` from `server/.env.example` and enable test mode for local testing.
3. Seed a test admin if needed with `npm run seed:admin`.
4. Optionally seed demo data with `npm run seed:demo`.
5. Open public pages from `frontend/`.
6. Open admin login at `admin/index.html`.
7. Use `http://localhost:5000/api` as the local API base URL.

Workspace scripts:

```bash
npm run dev:web
npm run dev:admin
npm run dev:api
npm run build
```

Individual app scripts:

- Public frontend: `cd frontend && npm run dev && npm run build && npm run preview`
- Admin portal: `cd admin && npm run dev && npm run build && npm run preview`
- Backend API: `cd server && npm run dev && npm run build && npm start`

## Full Test Flow

1. Register a client.
2. Register/login as a driver.
3. Submit a driver application.
4. Upload required documents.
5. Login as admin.
6. Verify documents and approve the driver.
7. Activate a dummy subscription.
8. Confirm the driver appears on Find a Driver.
9. Create a Quick Book request.
10. Driver accepts and progresses the booking.
11. Client dashboard shows updated status and contact actions.
12. Complete the trip.
13. Leave a review.
14. Create an incident report.
15. Confirm admin analytics update from real database counts.

## Compatibility Redirects

Root-level public HTML files are lightweight redirects to preserve old local links after the reorganization. The actual public website files live in `frontend/`. Admin access is separated inside `admin/`, starting at `admin/index.html`.

## Security And Production Readiness

The backend now includes:

- Helmet security headers.
- Strict production environment validation.
- CORS restricted to configured frontend/admin origins.
- General API rate limiting.
- Stricter auth and password reset rate limiting.
- Upload route rate limiting.
- File upload extension and MIME checks.
- `/api/health` for safe status.
- `/api/ready` for database readiness.

Before launch:

- Read `PRODUCTION_CHECKLIST.md`.
- Run the full flow in `TESTING.md`.
- Move private uploads to secure cloud storage with signed URLs.
- Keep dummy payments disabled in production.
- Keep `ENABLE_REAL_PAYMENTS=false` until real Mobile Money is implemented.
- Real Mobile Money preparation exists in `server/src/payments/`, but it requires official provider credentials, sandbox testing, webhook signature verification, and legal/company approval before it can go live.
- Complete legal/company setup before public launch.

## Deployment

Deployment preparation files:

- `DEPLOYMENT.md`
- `DEPLOYMENT_CHECKLIST.md`
- `PRODUCTION_CHECKLIST.md`

Target deployment structure:

- Public website: `https://umusare.com`
- Admin portal: `https://admin.umusare.com`
- Backend API: `https://api.umusare.com`

Staging structure:

- Public website: `https://staging.umusare.com`
- Admin portal: `https://admin-staging.umusare.com`
- Backend API: `https://api-staging.umusare.com`

For staging/test-mode setup, see `STAGING.md`. Do not enable demo data, dummy payments, or test tools in production.
