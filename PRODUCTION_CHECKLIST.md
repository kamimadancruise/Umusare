# Umusare Production Checklist

Use this checklist before any public launch.

## Environment Variables

- `NODE_ENV=production`
- `APP_ENV=production`
- `ENABLE_TEST_MODE=false`
- `ENABLE_DEMO_DATA=false`
- `ENABLE_DUMMY_PAYMENTS=false`
- `ENABLE_REAL_PAYMENTS=false`
- `DATABASE_URL` points to the production database.
- `JWT_SECRET` is unique, private, and at least 32 characters.
- `FRONTEND_URL` is the real public website origin.
- `ADMIN_URL` is the real admin portal origin.
- `API_URL` is the real backend API origin.
- No real secrets are committed to the repository.

## Database

- Production database backups are configured.
- Production database access is restricted.
- Unique email/phone indexes are confirmed.
- Demo seed scripts refuse production.
- Demo cleanup scripts refuse production.
- No demo records are present in production.

## Auth And Security

- Public signup cannot create admin users.
- Admin routes require admin authentication.
- Client routes return only the logged-in client's data.
- Driver routes return only the logged-in driver's data.
- Suspended and disabled accounts cannot use protected features.
- Invalid and expired JWTs return `401`.
- Passwords are hashed with bcrypt.
- `passwordHash` is never returned by API responses.
- Rate limits are enabled for API, auth, password reset, and upload routes.

## Admin Access

- Admin portal is not linked from public navigation.
- Admin accounts are created manually or through protected seed/admin operations.
- Admin audit logs are written for approval, document, booking, report, review, subscription, and payment actions.
- Admin test tools are hidden in production.

## File Storage

- Real private cloud storage is configured before launch.
- Driver documents use private storage, not public URLs.
- Incident evidence uses private storage, not public URLs.
- Admin document/evidence access uses signed URLs or equivalent protected access.
- File size limits are enforced.
- Allowed upload types are restricted to PDF, JPG, JPEG, and PNG.
- Executable files are rejected.

## Privacy

- Public driver profiles do not expose phone, email, private documents, admin notes, or payment data.
- Client phone/email is never public.
- Driver phone is visible to clients only after booking acceptance or later.
- Client phone is visible to assigned drivers only after authorized booking status.
- Admin notes are not visible to clients or drivers.
- Audit log metadata is not public.

## Testing

- Full flow in `TESTING.md` passes in development/staging.
- `/api/health` returns app status without secrets.
- `/api/ready` returns database readiness without secrets.
- Client, driver, and admin role checks have been tested.
- Upload routes reject oversized or unsupported files.
- Production mode hides test banner, dummy payment UI, demo data, and admin test tools.

## Deployment

- HTTPS is configured for public website, admin portal, and API.
- CORS allows only the real frontend/admin origins in production.
- Security headers are enabled with Helmet.
- `npm install` has generated a lockfile and `npm audit --omit=dev` has been reviewed.
- Server logs do not expose secrets.
- Error responses do not expose stack traces in production.
- Monitoring and alerting are configured.

## Payment Note

Real Mobile Money is not connected yet.

## Final Launch Warning

Do not launch publicly until real payment, secure file storage, and legal/company setup are complete.
