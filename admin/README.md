# Umusare Admin Portal

This folder contains the private Umusare admin portal.

Entry points:

- `index.html` - admin login page
- `admin-dashboard.html` - protected admin dashboard
- `admin-api.js` - admin API/auth helper

Authentication behavior:

- Admin login calls `POST http://localhost:5000/api/auth/login`.
- The returned JWT is stored in `localStorage` as `umusareAdminToken` for this front-end-only phase.
- Protected admin pages call `GET http://localhost:5000/api/auth/me` and require `role: "admin"`.
- Client and driver accounts are rejected from admin access.
- Logout clears the stored token and returns to `index.html`.

Admin accounts cannot be created from public signup. Create an admin user manually or with a seed script in a later backend step.

Driver Applications:

- The Driver Applications section calls `GET /api/admin/driver-applications`.
- Opening an application calls `GET /api/admin/driver-applications/:applicationId`.
- Document buttons call the protected admin verification routes.
- Approving an application calls `PATCH /api/admin/driver-applications/:applicationId/status`.
- Admin document access is metadata-only for now. Private file viewing should move to signed private URLs before production.

Connected Admin Data:

- Overview cards call `GET /api/admin/analytics/overview`.
- Recent activity calls `GET /api/admin/analytics/recent-activity`.
- Statistics charts call the protected admin analytics endpoints.
- Subscriptions call `GET /api/admin/subscriptions` and status update routes.
- Dummy payments call `GET /api/admin/payments` and mark success/failed routes.
- Bookings, drivers, reviews, and incident reports use protected admin API routes.

Support Tickets:

- The visible support ticket table no longer uses sample data.
- A support ticket management backend route is still needed before this table can load real support tickets.
