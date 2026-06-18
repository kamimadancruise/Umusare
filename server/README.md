# Umusare Backend API

This folder contains the initial Node.js and Express backend API foundation for Umusare.

The backend is not connected to production services yet. Authentication, database models, bookings, payments, document uploads, and admin workflows will be implemented in later backend steps.

## Stack

- Node.js
- Express
- MongoDB connection prepared with Mongoose
- dotenv
- cors
- helmet
- morgan
- nodemon for development
- bcryptjs for password hashing
- jsonwebtoken for JWT auth
- google-auth-library for Google ID token verification when configured

## Install

From the `server/` folder:

```bash
npm install
```

## Environment

Create a local `.env` file from `.env.example`:

```bash
cp .env.example .env
```

Do not commit real secrets. The `.env.example` file contains placeholders only.

Test and staging mode flags:

```bash
NODE_ENV=development
APP_ENV=development
ENABLE_TEST_MODE=true
ENABLE_DEMO_DATA=true
ENABLE_DUMMY_PAYMENTS=true
ENABLE_REAL_PAYMENTS=false
```

Production disables test mode, demo data, and dummy payments by default. Real Mobile Money is not connected yet.

Production startup refuses unsafe configuration:

- Missing `DATABASE_URL`
- Missing or weak `JWT_SECRET`
- Localhost/file frontend or admin origins
- Enabled test mode
- Enabled demo data
- Enabled dummy payments
- Enabled real payments before Mobile Money is implemented

## Run Locally

Development:

```bash
npm run dev
```

Build/syntax check:

```bash
npm run build
```

Production-style start:

```bash
npm start
```

Default local health check:

```text
http://localhost:5000/api/health
```

Readiness check:

```text
http://localhost:5000/api/ready
```

Expected response:

```json
{
  "success": true,
  "status": "ok",
  "appName": "Umusare",
  "message": "Umusare backend is running",
  "environment": "development",
  "nodeEnvironment": "development",
  "testMode": true,
  "dummyPayments": true,
  "timestamp": "..."
}
```

## Local Test Seeds

Seed scripts live in `src/seed/` and refuse to run in production:

```bash
npm run seed:admin
npm run seed:demo
npm run seed:clear-demo
```

`seed:admin` creates a test admin from these `.env` values:

```bash
TEST_ADMIN_EMAIL=
TEST_ADMIN_PHONE=
TEST_ADMIN_PASSWORD=
TEST_ADMIN_NAME=
```

`seed:demo` requires `ENABLE_DEMO_DATA=true` and creates marked test records for local workflows. `seed:clear-demo` removes only documents where `isDemoData` is `true`.

Never run demo seed or clear scripts against production.

## Security Checks

Before production, verify:

- `NODE_ENV=production` and `APP_ENV=production`.
- `ENABLE_TEST_MODE=false`.
- `ENABLE_DEMO_DATA=false`.
- `ENABLE_DUMMY_PAYMENTS=false`.
- `ENABLE_REAL_PAYMENTS=false` until Mobile Money is implemented.
- `JWT_SECRET` is unique, private, and at least 32 characters.
- `DATABASE_URL` is set.
- `FRONTEND_URL` and `ADMIN_URL` are real HTTPS origins.
- `npm audit --omit=dev` has been reviewed.
- `/api/health` and `/api/ready` do not expose secrets.

Private uploads are stored locally only for development. Before launch, move driver documents and incident evidence to secure private cloud storage with signed URLs.

Dummy payments must not be enabled in production.

## Deployment Notes

Recommended production API domain:

```text
https://api.umusare.com
```

Recommended staging API domain:

```text
https://api-staging.umusare.com
```

Production CORS should be configured with:

```bash
CORS_ORIGINS=https://umusare.com,https://www.umusare.com,https://admin.umusare.com
```

Staging CORS should be configured with:

```bash
CORS_ORIGINS=https://staging.umusare.com,https://admin-staging.umusare.com
```

Local development still supports `http://localhost:3000`, `http://localhost:3001`, `http://localhost:5173`, and `http://localhost:5174`.

Private local uploads are for development only. Production must use secure private cloud storage with signed URLs.

## Project Areas

Public website:

- Local folder: `../frontend`
- Later production idea: `umusare.com`
- Later API base URL: `http://localhost:5000/api`

Admin portal:

- Local folder: `../admin`
- Later production idea: `admin.umusare.com` or `umusare.com/admin`
- Later admin API base URL: `http://localhost:5000/api/admin`
- Admin routes must be protected by admin authentication before launch.

Backend API:

- Local folder: `server`
- Later production idea: `api.umusare.com`
- API routes are mounted under `/api`

## Current Routes

Fully implemented for this foundation step:

- `GET /api/health`
- `GET /api/ready`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/google`
- `POST /api/auth/apple`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `GET /api/auth/protected`
- `GET /api/auth/admin-only`
- `POST /api/driver-applications`
- `GET /api/driver-applications/me`
- `PATCH /api/driver-applications/me`
- `DELETE /api/driver-applications/me`
- `POST /api/driver-applications/:applicationId/documents`
- `GET /api/driver-applications/:applicationId/documents`
- `GET /api/admin/driver-applications`
- `GET /api/admin/driver-applications/:applicationId`
- `PATCH /api/admin/driver-applications/:applicationId/status`
- `PATCH /api/admin/driver-applications/:applicationId/documents/:documentId/verify`
- `PATCH /api/admin/driver-applications/:applicationId/documents/:documentId/reject`
- `PATCH /api/admin/driver-applications/:applicationId/documents/:documentId/needs-review`
- `GET /api/admin/driver-applications/:applicationId/documents/:documentId/view`
- `GET /api/drivers`
- `GET /api/drivers/:publicDriverId`
- `GET /api/drivers/me`
- `PATCH /api/drivers/me`
- `PATCH /api/drivers/me/availability`
- `GET /api/admin/drivers`
- `PATCH /api/admin/drivers/:driverId/visibility`
- `PATCH /api/admin/drivers/:driverId/suspend`
- `PATCH /api/admin/drivers/:driverId/unsuspend`
- `POST /api/bookings/quick-book`
- `POST /api/bookings/plan-ahead`
- `POST /api/bookings/match-drivers`
- `GET /api/bookings/me`
- `GET /api/bookings/:bookingId`
- `PATCH /api/bookings/:bookingId/cancel`
- `PATCH /api/bookings/:bookingId/accept`
- `PATCH /api/bookings/:bookingId/reject`
- `PATCH /api/bookings/:bookingId/on-the-way`
- `PATCH /api/bookings/:bookingId/start-trip`
- `PATCH /api/bookings/:bookingId/complete`
- `GET /api/admin/bookings`
- `GET /api/admin/bookings/:bookingId`
- `PATCH /api/admin/bookings/:bookingId/assign-driver`
- `PATCH /api/admin/bookings/:bookingId/status`
- `POST /api/reviews`
- `GET /api/reviews/me`
- `GET /api/reviews/driver/:publicDriverId`
- `GET /api/drivers/me/reviews`
- `GET /api/admin/reviews`
- `GET /api/admin/reviews/:reviewId`
- `PATCH /api/admin/reviews/:reviewId/mark-reviewed`
- `PATCH /api/admin/reviews/:reviewId/flag`
- `PATCH /api/admin/reviews/:reviewId/unflag`
- `POST /api/reports`
- `GET /api/reports/me`
- `GET /api/reports/:reportId`
- `PATCH /api/reports/:reportId/add-message`
- `POST /api/reports/:reportId/evidence`
- `GET /api/admin/reports`
- `GET /api/admin/reports/:reportId`
- `PATCH /api/admin/reports/:reportId/status`
- `PATCH /api/admin/reports/:reportId/assign`
- `PATCH /api/admin/reports/:reportId/add-note`
- `GET /api/subscriptions/me`
- `POST /api/subscriptions/select-plan`
- `POST /api/payments/dummy-subscription-payment`
- `GET /api/payments/me`
- `GET /api/admin/subscriptions`
- `GET /api/admin/subscriptions/:subscriptionId`
- `PATCH /api/admin/subscriptions/:subscriptionId/activate`
- `PATCH /api/admin/subscriptions/:subscriptionId/expire`
- `PATCH /api/admin/subscriptions/:subscriptionId/cancel`
- `PATCH /api/admin/subscriptions/:subscriptionId/change-plan`
- `GET /api/admin/payments`
- `GET /api/admin/payments/:paymentId`
- `PATCH /api/admin/payments/:paymentId/mark-success`
- `PATCH /api/admin/payments/:paymentId/mark-failed`
- `GET /api/admin/analytics/overview`
- `GET /api/admin/analytics/bookings`
- `GET /api/admin/analytics/drivers`
- `GET /api/admin/analytics/applications`
- `GET /api/admin/analytics/revenue`
- `GET /api/admin/analytics/reports`
- `GET /api/admin/analytics/recent-activity`
- `GET /api/support/contact`

Auth notes:

- Public registration only accepts `client` and `driver` roles.
- Public users cannot register as `admin`.
- Admin users should be created with `npm run seed:admin` or manually by the platform owner before launch.
- Google login verifies ID tokens when `GOOGLE_CLIENT_ID` is configured.
- Apple login is prepared as a placeholder and returns a clear not-implemented response until Apple token verification is added.
- Forgot password returns a safe generic message and does not send real email/SMS yet.

Example local registration:

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"fullName\":\"Test Client\",\"email\":\"client@example.com\",\"password\":\"password123\",\"role\":\"client\"}"
```

Example local login:

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"identifier\":\"client@example.com\",\"password\":\"password123\"}"
```

Example protected route:

```bash
curl http://localhost:5000/api/auth/protected \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

Admin portal login:

- Local file: `../admin/index.html`
- Login endpoint: `POST /api/auth/login`
- Protected session check: `GET /api/auth/me`
- Admin dashboard requires a JWT whose user role is `admin`.
- Public signup will reject `admin` role registration.

Placeholder non-auth routes:

- `/api/users`
- `/api/clients`
- `/api/subscriptions`
- `/api/payments`
- `/api/support`
- `/api/analytics`

## Admin Statistics & Analytics

Admin analytics routes are mounted under `/api/admin/analytics` and require an admin JWT.

Available analytics endpoints:

- `GET /api/admin/analytics/overview`
- `GET /api/admin/analytics/bookings?period=today|week|month|year|all`
- `GET /api/admin/analytics/drivers`
- `GET /api/admin/analytics/applications`
- `GET /api/admin/analytics/revenue?period=today|week|month|year|all`
- `GET /api/admin/analytics/reports`
- `GET /api/admin/analytics/recent-activity`

The overview returns aggregate counts for users, clients, drivers, driver applications, bookings, reviews, incident reports, subscriptions, and dummy revenue.

Date-filtered analytics support `period`, `dateFrom`, and `dateTo`. Booking and revenue charts default to the current month when no period is supplied.

Revenue values are dummy/test subscription payment figures only. Real Mobile Money and payment provider analytics are not connected yet.

Testing flow:

1. Start MongoDB and the backend.
2. Log in as an admin through `../admin/index.html`.
3. Create sample users, applications, bookings, reviews, reports, subscriptions, and dummy payments.
4. Open `../admin/admin-dashboard.html`.
5. Confirm the overview cards and Statistics & Analytics section load from `/api/admin/analytics/*`.
6. Confirm client and driver tokens receive `403` if they call admin analytics routes.

## Current Models

Mongoose schemas are defined in `src/models/` and exported from `src/models/index.js`.

Created models:

- `User`
- `ClientProfile`
- `DriverProfile`
- `DriverApplication`
- `DriverDocument`
- `Booking`
- `Review`
- `IncidentReport`
- `SupportTicket`
- `Subscription`
- `DummyPayment`
- `Notification`
- `AdminAuditLog`

The schemas include role/status enums, verification states, booking lifecycle states, report states, subscription/payment states, and indexes for common admin/public queries. No controllers or production workflows use these models yet.

## Driver Applications

Driver application endpoints require:

- JWT auth
- User role: `driver`

Create application:

```bash
curl -X POST http://localhost:5000/api/driver-applications \
  -H "Authorization: Bearer YOUR_DRIVER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"fullName\":\"Amina Mutesi\",\"phone\":\"+250788000111\",\"email\":\"amina@example.com\",\"age\":28,\"gender\":\"Female\",\"city\":\"Kigali\",\"location\":\"Kacyiru\",\"experienceYears\":6,\"languages\":[\"Kinyarwanda\",\"English\"],\"vehicleTypes\":[\"Automatic\",\"SUV\"],\"driverLicenceNumber\":\"RW-12345\",\"shortBio\":\"Calm professional driver.\",\"selectedSubscriptionPlan\":\"Basic\"}"
```

Get current driver application:

```bash
curl http://localhost:5000/api/driver-applications/me \
  -H "Authorization: Bearer YOUR_DRIVER_TOKEN"
```

Upload a document with Postman or Thunder Client:

- Method: `POST`
- URL: `http://localhost:5000/api/driver-applications/APPLICATION_ID/documents`
- Authorization: `Bearer YOUR_DRIVER_TOKEN`
- Body type: `form-data`
- File field name: `document`
- Text field: `documentType`

Accepted `documentType` values:

- `national_id_or_passport`
- `drivers_licence`
- `secondary_education_proof`
- `profile_photo`
- `police_clearance_certificate`

Required driver documents:

- National ID or Passport
- Driver's Licence
- Proof of secondary education
- Profile photo
- Police Clearance / Criminal Record Certificate

Local development uploads are stored in:

```text
server/uploads/driver-documents/
```

Before production, document storage must move to secure private cloud storage with signed URLs for admin-only access. Private documents should not be exposed publicly.

Driver application validation currently checks:

- Driver age must be at least 21
- Phone or email must be present
- Experience years must be numeric
- Languages must be an array or comma-separated list
- Vehicle types must be valid
- Driver licence number is required
- Selected subscription plan must be `Basic` or `Pro`

Uploading all documents does not automatically approve the driver.

## Admin Driver Approval

Admin driver application endpoints require:

- JWT auth
- User role: `admin`

List applications:

```bash
curl http://localhost:5000/api/admin/driver-applications \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

Supported list filters:

- `status`
- `city`
- `selectedSubscriptionPlan`
- `search`
- `page`
- `limit`

Get full application detail:

```bash
curl http://localhost:5000/api/admin/driver-applications/APPLICATION_ID \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

Document review routes:

```bash
curl -X PATCH http://localhost:5000/api/admin/driver-applications/APPLICATION_ID/documents/DOCUMENT_ID/verify \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

curl -X PATCH http://localhost:5000/api/admin/driver-applications/APPLICATION_ID/documents/DOCUMENT_ID/reject \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"rejectionReason\":\"Document is not readable.\"}"

curl -X PATCH http://localhost:5000/api/admin/driver-applications/APPLICATION_ID/documents/DOCUMENT_ID/needs-review \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

Application status update:

```bash
curl -X PATCH http://localhost:5000/api/admin/driver-applications/APPLICATION_ID/status \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"status\":\"Approved\"}"
```

Approval rules:

- All required documents must be marked `Verified` before approval.
- Approved applications create or update a `DriverProfile`.
- New approved drivers are set to `Offline` by default.
- Basic applications become `Verified Driver`; Pro applications become `Pro Driver`.
- If no subscription exists, a `Pending` subscription is created.
- Driver profile visibility stays `Hidden` until the subscription is `Active`.
- Important admin actions are written to `AdminAuditLog`.

Protected document view:

- `GET /api/admin/driver-applications/:applicationId/documents/:documentId/view`
- This returns protected metadata and a local development path placeholder.
- Production should use private storage and signed admin-only URLs.

Public driver visibility:

- `GET /api/drivers`
- `GET /api/drivers/:publicDriverId`

Public driver endpoints only return safe public fields for drivers who are:

- approved
- not suspended
- verification status `Verified`
- profile visibility `Visible`
- linked to an `Active` subscription

Public endpoints never return private document files, admin notes, rejection reasons, or private contact details.

## Driver Profile and Availability

Driver profile routes require:

- JWT auth
- User role: `driver`
- An approved `DriverProfile`

Private driver routes:

```bash
curl http://localhost:5000/api/drivers/me \
  -H "Authorization: Bearer YOUR_DRIVER_TOKEN"

curl -X PATCH http://localhost:5000/api/drivers/me \
  -H "Authorization: Bearer YOUR_DRIVER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"city\":\"Kigali\",\"location\":\"Kacyiru\",\"languages\":[\"Kinyarwanda\",\"English\"],\"vehicleTypes\":[\"Automatic\",\"SUV\"],\"shortBio\":\"Calm professional driver.\"}"

curl -X PATCH http://localhost:5000/api/drivers/me/availability \
  -H "Authorization: Bearer YOUR_DRIVER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"availability\":\"Available Now\"}"
```

Availability values:

- `Available Now`
- `Available Later`
- `Offline`

`Available Later` requires:

- `availableLater.date`
- `availableLater.startTime`
- `availableLater.endTime`

Drivers cannot edit rating totals, completed trips, approval state, verification state, suspension state, driver badge, approved metadata, or profile visibility.

Admin driver visibility routes:

```bash
curl http://localhost:5000/api/admin/drivers \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

curl -X PATCH http://localhost:5000/api/admin/drivers/DRIVER_PROFILE_ID/visibility \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"profileVisibility\":\"Hidden\"}"

curl -X PATCH http://localhost:5000/api/admin/drivers/DRIVER_PROFILE_ID/suspend \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"suspensionReason\":\"Safety review pending.\"}"

curl -X PATCH http://localhost:5000/api/admin/drivers/DRIVER_PROFILE_ID/unsuspend \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

Visibility rules:

- Driver must be approved.
- Driver must not be suspended.
- Verification status must be `Verified`.
- Profile visibility must be `Visible`.
- Subscription must be `Active`.

The helper `canDriverBeVisible(driverProfile, subscription)` centralizes this rule for public routes, admin visibility updates, and future subscription updates.

Driver profile and availability local test:

1. Approve a driver through the admin approval flow.
2. Activate a subscription later, or manually mark it `Active` in local development.
3. Login as the driver through the public login page.
4. Open `frontend/driver-dashboard.html`.
5. Update profile fields.
6. Set availability to `Available Now`.
7. Open `GET /api/drivers` and confirm only approved, visible, active-subscription drivers appear.
8. Open `frontend/find-driver.html` and confirm the public list uses API results.
9. Open `frontend/driver-profile.html?driver=PUBLIC_DRIVER_ID`.
10. Confirm private documents, private contact details, admin notes, and rejection reasons are not exposed.

## Bookings

Booking creation supports logged-in clients and the current guest-style Quick Book / Plan Ahead forms.

Simple driver matching is implemented before assignment. It is not real-time dispatch and does not use maps/GPS yet.

Quick Book:

```bash
curl -X POST http://localhost:5000/api/bookings/quick-book \
  -H "Content-Type: application/json" \
  -d "{\"firstName\":\"Mika\",\"phone\":\"+250788000333\",\"pickupLocation\":\"Kigali Heights\",\"destination\":\"Kacyiru\",\"neededTime\":\"ASAP\",\"carType\":\"Automatic\"}"
```

Plan Ahead:

```bash
curl -X POST http://localhost:5000/api/bookings/plan-ahead \
  -H "Content-Type: application/json" \
  -d "{\"clientName\":\"Mika Uwase\",\"phone\":\"+250788000333\",\"pickupLocation\":\"Kigali Heights\",\"destination\":\"Kacyiru\",\"dateTime\":\"2026-06-20T19:00:00\",\"carType\":\"SUV\",\"preferredDriverGender\":\"Any\",\"preferredMinExperience\":\"2+ years\",\"preferredRating\":\"4+ stars\"}"
```

Match drivers without creating a booking:

```bash
curl -X POST http://localhost:5000/api/bookings/match-drivers \
  -H "Content-Type: application/json" \
  -d "{\"bookingType\":\"Quick Book\",\"pickupLocation\":\"Kigali Heights\",\"city\":\"Kigali\",\"carType\":\"Automatic\",\"neededTime\":\"ASAP\"}"
```

Matching rules:

- Approved driver only.
- Not suspended.
- Verification status must be `Verified`.
- Profile visibility must be `Visible`.
- Subscription status must be `Active`.
- Quick Book prioritizes `Available Now`.
- Plan Ahead allows `Available Now` and `Available Later`.
- Matching can consider city/pickup area, vehicle type, language, gender, rating, experience, and driver badge.

Match scoring:

- Available Now for Quick Book: `+30`
- Available Later for Plan Ahead: `+20`
- Same city/location: `+20`
- Vehicle type match: `+20`
- Language match: `+10`
- Rating 4.5 or higher: `+10`
- Experience 5+ years: `+10`
- Pro or Top Driver badge: `+5`

Matched drivers are sorted by:

1. match score
2. rating average
3. completed trips

Candidate driver behavior:

- Quick Book stores the top 3 suggested drivers in `candidateDrivers`.
- Plan Ahead stores the top 5 suggested drivers in `candidateDrivers`.
- Bookings remain `Pending` unless a selected driver was provided.
- Candidate drivers can see matching pending requests in the Driver Dashboard.
- When one candidate driver accepts, the booking becomes assigned and `Accepted`.
- Admin booking detail shows suggested drivers with match score, availability, vehicle types, and badge.

Logged-in client/driver bookings:

```bash
curl http://localhost:5000/api/bookings/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Driver booking actions:

```bash
curl -X PATCH http://localhost:5000/api/bookings/BOOKING_ID/accept \
  -H "Authorization: Bearer YOUR_DRIVER_TOKEN"

curl -X PATCH http://localhost:5000/api/bookings/BOOKING_ID/on-the-way \
  -H "Authorization: Bearer YOUR_DRIVER_TOKEN"

curl -X PATCH http://localhost:5000/api/bookings/BOOKING_ID/start-trip \
  -H "Authorization: Bearer YOUR_DRIVER_TOKEN"

curl -X PATCH http://localhost:5000/api/bookings/BOOKING_ID/complete \
  -H "Authorization: Bearer YOUR_DRIVER_TOKEN"
```

Client/driver cancel:

```bash
curl -X PATCH http://localhost:5000/api/bookings/BOOKING_ID/cancel \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"cancellationReason\":\"Plans changed.\"}"
```

Admin booking routes:

```bash
curl http://localhost:5000/api/admin/bookings \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

curl -X PATCH http://localhost:5000/api/admin/bookings/BOOKING_ID/assign-driver \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"driverId\":\"DRIVER_PROFILE_ID_OR_PUBLIC_ID\"}"

curl -X PATCH http://localhost:5000/api/admin/bookings/BOOKING_ID/status \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"status\":\"Accepted\",\"note\":\"Support team confirmed status.\"}"
```

Booking status flow:

- `Pending` can move to `Accepted`, `Cancelled`, or `Reported`.
- `Accepted` can move to `Driver on the way`, `Trip started`, `Cancelled`, or `Reported`.
- `Driver on the way` can move to `Trip started`, `Cancelled`, or `Reported`.
- `Trip started` can move to `Completed` or `Reported`.
- `Completed` can move to `Reviewed` or `Reported`.
- `Cancelled` and `Reviewed` are final for normal user actions.

The helper `canTransitionBookingStatus(currentStatus, nextStatus)` lives in `src/utils/bookingStatus.js`.

Frontend connections:

- Quick Book posts to `POST /api/bookings/quick-book`.
- Plan Ahead posts to `POST /api/bookings/plan-ahead`.
- Client Dashboard loads `GET /api/bookings/me`.
- Driver Dashboard loads `GET /api/bookings/me` and calls driver action endpoints.
- Admin Dashboard loads `GET /api/admin/bookings`, opens details, assigns drivers, and updates status.

Booking contact actions:

- Booking responses include a `contactActions` object.
- Pending client bookings expose support contact actions only.
- Clients see driver call/WhatsApp links only after status is `Accepted` or later.
- Drivers see client call/WhatsApp links only after they are assigned and the booking is `Accepted` or later.
- Admin booking responses include client, driver, and support contact actions when those contacts exist.
- Public driver profiles and Find a Driver cards do not expose private driver phone numbers.

WhatsApp links are generated by `src/utils/contactLinks.js` using `wa.me` URLs with encoded booking-specific messages:

- Client to driver: includes pickup and destination.
- Driver to client: includes pickup and destination.
- Support messages include the booking ID.

Support contact configuration:

```text
SUPPORT_PHONE=+250788000222
SUPPORT_WHATSAPP=+250788000222
SUPPORT_EMAIL=support@umusare.rw
```

Public support contact:

```bash
curl http://localhost:5000/api/support/contact
```

Contact link local test:

1. Create a Quick Book request.
2. Confirm the Pending booking response includes only support contact actions.
3. Login as a candidate or assigned driver and accept the booking.
4. Open `GET /api/bookings/me` as the client and confirm `callDriver` / `whatsappDriver` appear.
5. Open `GET /api/bookings/me` as the driver and confirm `callClient` / `whatsappClient` appear.
6. Open `GET /api/admin/bookings/:bookingId` as admin and confirm both client and driver contact actions appear.
7. Confirm WhatsApp URLs use encoded messages and include pickup, destination, or booking ID.

## Reviews and Ratings

Clients can review drivers after completed bookings.

Submit a review:

```bash
curl -X POST http://localhost:5000/api/reviews \
  -H "Authorization: Bearer YOUR_CLIENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"bookingId\":\"UMA-BKG-000001\",\"rating\":5,\"reviewText\":\"Professional and careful driver.\"}"
```

Review rules:

- Only the client who owns the booking can review it.
- Booking status must be `Completed`.
- A booking can only be reviewed once by that client.
- Rating must be from `1` to `5`.
- Ratings `2` or below are automatically flagged.
- `safetyConcern: true` also flags the review with reason `Safety concern`.
- Successful review submission updates the booking status to `Reviewed` and adds a status history entry: `Review submitted`.
- Driver `ratingAverage` and `reviewCount` are recalculated after every new review.

Public driver reviews:

```bash
curl http://localhost:5000/api/reviews/driver/PUBLIC_DRIVER_ID
```

Public review data only includes client first name, rating, review text, and date. It does not expose client phone, email, private booking details, or admin notes.

Client review history:

```bash
curl http://localhost:5000/api/reviews/me \
  -H "Authorization: Bearer YOUR_CLIENT_TOKEN"
```

Driver review dashboard:

```bash
curl http://localhost:5000/api/drivers/me/reviews \
  -H "Authorization: Bearer YOUR_DRIVER_TOKEN"
```

Admin review moderation:

```bash
curl http://localhost:5000/api/admin/reviews \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

curl -X PATCH http://localhost:5000/api/admin/reviews/UMA-REV-000001/mark-reviewed \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

curl -X PATCH http://localhost:5000/api/admin/reviews/UMA-REV-000001/flag \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"flagReason\":\"Safety follow-up needed.\"}"

curl -X PATCH http://localhost:5000/api/admin/reviews/UMA-REV-000001/unflag \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

Admin review filters:

- `rating`
- `flagged`
- `driverId`
- `clientId`
- `dateFrom`
- `dateTo`
- `search`
- `page`
- `limit`

If a driver's average rating falls below `3.5`, admin review responses include a low-rating warning for follow-up.

Review local test:

1. Create and complete a booking.
2. Login as the booking client.
3. Submit `POST /api/reviews`.
4. Confirm the booking status becomes `Reviewed`.
5. Confirm the driver's `ratingAverage` and `reviewCount` update.
6. Open the public Driver Profile and confirm the review appears with client first name only.
7. Login as admin and open Reviews & Complaints.
8. Confirm ratings `2` or below show as flagged.

## Incident Reports

Clients and drivers can report booking-related or general safety issues.

Create report:

```bash
curl -X POST http://localhost:5000/api/reports \
  -H "Authorization: Bearer YOUR_CLIENT_OR_DRIVER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"bookingId\":\"UMA-BKG-000001\",\"reportType\":\"Safety concern\",\"urgency\":\"High\",\"description\":\"Describe what happened.\"}"
```

Supported report types:

- `Safety concern`
- `Accident`
- `Misconduct`
- `Theft or missing property`
- `Wrong driver arrived`
- `Vehicle issue`
- `Payment dispute`
- `Client misconduct`
- `Driver misconduct`
- `Other`

Urgency levels:

- `Low`
- `Medium`
- `High`
- `Emergency`

Report status flow:

- `New` -> `Under Review`, `Escalated`
- `Under Review` -> `Awaiting Response`, `Resolved`, `Escalated`
- `Awaiting Response` -> `Under Review`, `Resolved`
- `Escalated` -> `Under Review`, `Resolved`
- `Resolved` is final for now.

User report routes:

```bash
curl http://localhost:5000/api/reports/me \
  -H "Authorization: Bearer YOUR_TOKEN"

curl http://localhost:5000/api/reports/UMA-REP-000001 \
  -H "Authorization: Bearer YOUR_TOKEN"

curl -X PATCH http://localhost:5000/api/reports/UMA-REP-000001/add-message \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"message\":\"Additional follow-up details.\"}"
```

Evidence upload:

```bash
curl -X POST http://localhost:5000/api/reports/UMA-REP-000001/evidence \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "evidence=@/path/to/photo.jpg"
```

Accepted evidence files:

- PDF
- JPG / JPEG
- PNG
- Maximum 5MB

Local development evidence is stored in:

```text
server/uploads/incident-evidence/
```

Before production, incident evidence must move to secure private cloud storage with signed URLs. Evidence files are not public.

Admin report management:

```bash
curl http://localhost:5000/api/admin/reports \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

curl http://localhost:5000/api/admin/reports/UMA-REP-000001 \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

curl -X PATCH http://localhost:5000/api/admin/reports/UMA-REP-000001/status \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"status\":\"Under Review\",\"note\":\"Safety team started review.\"}"

curl -X PATCH http://localhost:5000/api/admin/reports/UMA-REP-000001/assign \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"assignedAdminId\":\"ADMIN_USER_ID\"}"

curl -X PATCH http://localhost:5000/api/admin/reports/UMA-REP-000001/add-note \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"note\":\"Private admin follow-up note.\"}"
```

Admin report filters:

- `status`
- `urgency`
- `reportType`
- `clientId`
- `driverId`
- `bookingId`
- `assignedAdminId`
- `dateFrom`
- `dateTo`
- `search`
- `page`
- `limit`

Booking integration:

- High and Emergency booking-linked reports mark active bookings as `Reported`.
- Booking status history receives `Incident report created`.
- Admin booking detail includes linked incident reports.

Privacy rules:

- Users can only see reports they submitted or reports linked to their own bookings.
- Admins can see all reports.
- Private admin notes are hidden from clients and drivers.
- Evidence metadata is shown only to authorized users, and evidence files are not public.
- Admin-only client/driver contact details remain inside protected admin endpoints.

Incident report local test:

1. Create and accept a booking.
2. Login as the client.
3. Submit `POST /api/reports` with the booking ID.
4. Confirm the report appears in Client Dashboard.
5. If urgency is High or Emergency, confirm booking shows `Reported`.
6. Login as the assigned driver and confirm linked report visibility.
7. Login as admin.
8. Open Admin Portal Incident Reports.
9. Assign the report to an admin user.
10. Change status to `Under Review`.
11. Add a private admin note.
12. Resolve the report.
13. Confirm audit logs are created for admin actions.

## Dummy Subscriptions and Payments

This is a development-only payment layer for testing driver visibility before real Mobile Money integration.

Plans:

- `Basic`: `2,500 RWF/month`, profile listing, verified badge, up to 10 bookings/month.
- `Pro`: `5,000 RWF/month`, unlimited bookings, priority/Pro Driver features.

Driver subscription routes:

```bash
curl http://localhost:5000/api/subscriptions/me \
  -H "Authorization: Bearer YOUR_DRIVER_TOKEN"

curl -X POST http://localhost:5000/api/subscriptions/select-plan \
  -H "Authorization: Bearer YOUR_DRIVER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"plan\":\"Basic\"}"
```

Dummy subscription payment:

```bash
curl -X POST http://localhost:5000/api/payments/dummy-subscription-payment \
  -H "Authorization: Bearer YOUR_DRIVER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"subscriptionId\":\"UMA-SUB-000001\",\"phoneNumber\":\"+250788000111\",\"simulateStatus\":\"Success\"}"

curl http://localhost:5000/api/payments/me \
  -H "Authorization: Bearer YOUR_DRIVER_TOKEN"
```

Allowed `simulateStatus` values:

- `Success`
- `Failed`
- `Pending`

Successful dummy payments:

- create a `DummyPayment`
- set subscription `status` to `Active`
- set subscription `paymentStatus` to `Dummy Paid`
- set renewal date one month ahead
- make approved, verified, unsuspended drivers `Visible`

Failed or pending dummy payments keep the subscription `Pending` and the driver profile `Hidden`.

If `ENABLE_DUMMY_PAYMENTS=false` or the app is running in production, `POST /api/payments/dummy-subscription-payment` returns:

```json
{
  "success": false,
  "message": "Dummy payments are disabled in this environment.",
  "errors": []
}
```

Admin subscription routes:

```bash
curl http://localhost:5000/api/admin/subscriptions \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

curl -X PATCH http://localhost:5000/api/admin/subscriptions/UMA-SUB-000001/activate \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

curl -X PATCH http://localhost:5000/api/admin/subscriptions/UMA-SUB-000001/expire \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

curl -X PATCH http://localhost:5000/api/admin/subscriptions/UMA-SUB-000001/cancel \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"reason\":\"Driver requested cancellation.\"}"

curl -X PATCH http://localhost:5000/api/admin/subscriptions/UMA-SUB-000001/change-plan \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"plan\":\"Pro\"}"
```

Admin payment routes:

```bash
curl http://localhost:5000/api/admin/payments \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

curl -X PATCH http://localhost:5000/api/admin/payments/UMA-PAY-000001/mark-success \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

curl -X PATCH http://localhost:5000/api/admin/payments/UMA-PAY-000001/mark-failed \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

Driver visibility rules:

- Driver must be approved.
- Driver must not be suspended.
- Verification status must be `Verified`.
- Subscription status must be `Active`.
- Profile visibility must be `Visible`.
- Expired, cancelled, or pending subscriptions hide the profile.

Booking eligibility:

- `canDriverReceiveBooking(driverProfile, subscription)` requires an active visible driver.
- Basic drivers are blocked after `10` bookings used this month.
- Pro drivers are unlimited.
- Matching, manual assignment, and candidate acceptance use this helper.
- TODO: `bookingsUsedThisMonth` should later reset automatically when real billing cycles are implemented.

Dummy payment local test:

1. Approve a driver through the admin approval flow.
2. Login as that driver.
3. Select Basic or Pro with `POST /api/subscriptions/select-plan`.
4. Simulate `Failed` payment and confirm the profile remains hidden.
5. Simulate `Success` payment and confirm subscription becomes `Active`.
6. Confirm driver profile becomes `Visible`.
7. Confirm public Find a Driver can show that driver.
8. Admin expires the subscription.
9. Confirm the driver disappears publicly.

## Real Mobile Money Preparation

Real Mobile Money is prepared behind a provider abstraction, but it is not active by default and does not fake real-provider success.

Payment provider structure:

- `src/payments/paymentProvider.interface.js` documents the provider contract.
- `src/payments/paymentService.js` selects the dummy or Mobile Money provider abstraction.
- `src/payments/providers/dummyProvider.js` preserves the existing test payment flow.
- `src/payments/providers/mobileMoneyProvider.placeholder.js` contains TODOs for official provider setup.
- `src/payments/webhooks/paymentWebhookController.js` documents webhook handling requirements.

Real payment environment variables:

```env
ENABLE_REAL_PAYMENTS=false
PAYMENT_PROVIDER=
PAYMENT_ENV=sandbox
MOMO_API_BASE_URL=
MOMO_API_KEY=
MOMO_API_SECRET=
MOMO_MERCHANT_ID=
MOMO_CALLBACK_URL=
MOMO_CURRENCY=RWF
```

Prepared real-payment routes:

- `POST /api/payments/subscription/mobile-money/initiate`
- `GET /api/payments/:paymentId/status`
- `POST /api/payments/webhook/mobile-money`

When `ENABLE_REAL_PAYMENTS=false`, Mobile Money initiation returns:

```json
{
  "success": false,
  "message": "Real Mobile Money payments are not enabled. Use dummy payment in test mode."
}
```

Subscription activation is centralized in `activateSubscriptionAfterPayment(subscriptionId, paymentId)`. Dummy payment success, admin manual activation, and future Mobile Money webhook success all use this same activation path.

Before enabling real payments:

- get official provider credentials and sandbox access
- verify webhook signatures
- use HTTPS only
- make webhook processing idempotent
- never trust frontend payment success alone
- keep raw provider responses private/admin-only
- complete company/legal approval with the provider

Real Mobile Money is not active until Umusare has official provider credentials, sandbox testing, webhook verification, and legal/company approval.

Local booking test:

1. Register/login as a client.
2. Ensure at least one approved visible driver has an active subscription.
3. Set that driver to `Available Now`.
4. Create a Quick Book request without `selectedDriverId`.
5. Confirm `suggestedDrivers` are returned.
6. Confirm the booking remains `Pending` with candidate drivers.
7. Login as a candidate driver.
8. Open Driver Dashboard and accept the booking request.
9. Mark Driver on the way.
10. Mark Trip started.
11. Mark Completed.
12. Confirm status updates in Client Dashboard.
13. Login as admin.
14. Confirm booking appears in Admin Portal with suggested driver details.

Suggested local approval test:

1. Register/login as a driver.
2. Submit a driver application.
3. Upload the five required documents.
4. Login as an admin.
5. Open `../admin/admin-dashboard.html`.
6. View the application in Driver Applications.
7. Mark each document as `Verified`.
8. Approve the application.
9. Confirm a `DriverProfile` is created.
10. Confirm the driver remains hidden from `/api/drivers` until a subscription becomes `Active`.

## Later Backend Steps

Upcoming work should add real implementations for:

- Email/phone authentication
- Google login
- Apple login
- Client and driver accounts
- Secure cloud document storage
- Booking lifecycle
- Reviews and ratings
- Incident reports
- Subscriptions
- Dummy payments
- Admin statistics
- Support tickets
