# Umusare Deployment Checklist

## Before Deployment

- Run public frontend build: `cd frontend && npm install && npm run build`.
- Run admin portal build: `cd admin && npm install && npm run build`.
- Run backend install/build: `cd server && npm install && npm run build`.
- Review `npm audit --omit=dev` after dependencies are installed.
- Check production environment variables.
- Confirm `NODE_ENV=production` and `APP_ENV=production`.
- Confirm `ENABLE_TEST_MODE=false`.
- Confirm `ENABLE_DEMO_DATA=false`.
- Confirm `ENABLE_DUMMY_PAYMENTS=false`.
- Confirm `ENABLE_REAL_PAYMENTS=false`.
- Confirm `DATABASE_URL` points to the production database.
- Confirm `JWT_SECRET` is strong and private.
- Confirm CORS allows only production public/admin origins.
- Confirm database connection works.
- Confirm database backups are enabled.
- Confirm admin login works.
- Confirm no public admin registration exists.
- Confirm private uploads are not public.
- Confirm local upload storage is not used for public launch.
- Confirm `/api/health` works.
- Confirm `/api/ready` works.
- Confirm public frontend talks to the API.
- Confirm admin portal talks to the API.

## After Deployment

- Open `https://umusare.com`.
- Open `https://admin.umusare.com`.
- Login as admin.
- Call `https://api.umusare.com/api/health`.
- Call `https://api.umusare.com/api/ready`.
- Verify no test mode banner in production.
- Verify no demo access controls in production.
- Verify no dummy payment UI in production.
- Verify no production demo data is visible.
- Verify no public driver documents are exposed.
- Verify public Find a Driver loads from API.
- Verify admin dashboard loads from protected API.
- Create test client only in staging.
- Create test driver only in staging.
- Submit driver application only in staging.
- Verify staging test mode banner appears when staging flags are enabled.

## Launch Blockers

- Real Mobile Money is not connected yet.
- Secure private cloud file storage is not connected yet.
- Company/legal setup must be complete.
- Final legal/security review must be complete.
