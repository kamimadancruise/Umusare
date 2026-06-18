# Umusare Testing Checklist

Use this checklist for local development and staging validation before production launch.

## Environment Setup

1. Copy `server/.env.example` to `server/.env`.
2. Set local test flags:

```bash
NODE_ENV=development
APP_ENV=development
ENABLE_TEST_MODE=true
ENABLE_DEMO_DATA=true
ENABLE_DUMMY_PAYMENTS=true
ENABLE_REAL_PAYMENTS=false
```

3. Set frontend/admin runtime values if your local runner supports them:

```bash
VITE_APP_ENV=development
VITE_API_BASE_URL=http://localhost:5000/api
VITE_ENABLE_TEST_MODE=true
VITE_ENABLE_DEMO_DATA=true
VITE_ENABLE_DUMMY_PAYMENTS=true
```

Production must not enable demo data or dummy payments.

## Local Startup

1. Start MongoDB.
2. Install backend dependencies from `server/` with `npm install`.
3. Start backend with `npm run dev`.
4. Open the public frontend pages from `frontend/`.
5. Open the admin portal at `admin/index.html`.
6. Confirm `GET http://localhost:5000/api/health` shows Umusare, the app environment, test mode status, and dummy payment status.

## Seed Data

1. Seed a test admin:

```bash
cd server
npm run seed:admin
```

2. Optionally seed demo records:

```bash
npm run seed:demo
```

3. Clear only demo records when needed:

```bash
npm run seed:clear-demo
```

Never run demo seed or clear scripts against production.

## Full Platform Flow

1. Start backend in development mode.
2. Start/open public frontend.
3. Start/open admin portal.
4. Seed test admin.
5. Register a client.
6. Register a driver.
7. Submit driver application.
8. Upload required documents.
9. Login admin.
10. Verify documents.
11. Approve driver.
12. Driver selects subscription.
13. Simulate dummy payment success.
14. Confirm driver appears on Find a Driver.
15. Create Quick Book.
16. Match suggested drivers.
17. Driver accepts booking.
18. Client sees contact buttons.
19. Driver completes trip.
20. Client leaves review.
21. Client reports incident.
22. Admin resolves incident.
23. Admin analytics update.

## Production Safety Checks

1. `APP_ENV=production` or `NODE_ENV=production` disables test mode, demo data, and dummy payments.
2. Test mode banner is not visible.
3. Dummy payment form is hidden.
4. Dummy payment API route returns a disabled message.
5. Demo records are not loaded as frontend fallback data.
6. Public users cannot create admin accounts.
7. Admin portal requires admin authentication.
8. Private documents, evidence files, tokens, and admin notes are not exposed publicly.
