# ProDesk — Implementation Plan (Clean)

## Overview

ProDesk is a practice-management dashboard for **therapists** (role_id = 4).
It is the 4th dashboard in the Neure ecosystem.

---

## Roles — Final State

| role_id | Role | Dashboard | Created By |
|---------|------|-----------|------------|
| 1 | superadmin | neure_superadmin_dashboard | Manual |
| 2 | admin | Neure_dashboard | Superadmin |
| 3 | employee | Neure-Employee-Dashboard | Company Admin |
| 4 | therapist | **neure-prodesk** | Superadmin ✅ already in DB |
| 5 | client | neure-prodesk (booking) | Auto on booking |
| 6 | therapist_staff | neure-prodesk (team) | Therapist |

**role_id 4 (`therapist`) already exists in DB** — added 2025-01-24. No migration needed.

Add role_id 5 and 6:
```sql
INSERT INTO roles (role_name, description) VALUES
  ('client', 'ProDesk client/patient — books sessions with therapist'),
  ('therapist_staff', 'ProDesk staff member — managed under a therapist clinic');
```

---

## Auth Design

- Therapists are **created by Superadmin only** (same as current `createTherapist` flow).
- Login: `POST /api/prodesk/login` — server matches `role_id = 4`.
- Clients (role_id=5) use `POST /api/prodesk/clientLogin` when needed.
- **Fully reuses** existing JWT infra: `tokenValidator.js`, `blacklisted_tokens`, `refresh_tokens`, `password_reset_tokens`, `UserServices.requestPasswordReset`, `UserServices.resetPassword`.
- Access token TTL: **15 min** (shorter for clinical data). Refresh token: **30 days**.

---

## API Design Rules

1. **All endpoints are POST only.**
2. **Single route file**: `api/server/routes/prodesk.js` — all routes in one file.
3. Pattern: route → controller → service (same as existing system).
4. Format: `POST /api/prodesk/<action>` (e.g. `/api/prodesk/getClients`).
5. Protected routes use existing `authorization` middleware.
6. Public routes (client booking page) are marked `// public` — no auth.

---

## What To Reuse (No New Code)

| Asset | Used For |
|---|---|
| `users` table | Identity for all roles (therapist, client, staff) |
| `therapists` table | Therapist profile — extend with new columns |
| `tokenValidator.js` | Auth middleware — works for any role_id as-is |
| JWT + blacklist + refresh tokens | Full auth flow |
| `password_reset_tokens` | Forgot/reset password |
| `UserServices.requestPasswordReset` | Forgot password |
| `UserServices.resetPassword` | Reset password |
| `UploadController.js` + S3 | All file uploads |
| `emailService.js` | Booking confirmations, invoice emails |
| `notificationService.createNotification()` | Same service, same `notifications` table |
| `gallery` table | Pre-loaded Neure resource catalogue |
| `soundscapes` table | Audio resources in catalogue |
| `activityLogService.js` | Audit logging |

---

## Database Tables

---

### 1. `therapists` — Extend Existing Table

**Current columns:** `id, user_id, bio, specialization, years_of_experience, is_active, designation, qualification`

All personal info (`name, email, phone, gender, dob, age, city, profile_url`) stays in `users` — linked by `user_id`. Add only what is NOT in `users`:

```sql
ALTER TABLE therapists
  ADD COLUMN booking_slug        VARCHAR(150) UNIQUE  COMMENT 'Unique URL for public booking page e.g. /book/dr-sarah',
  ADD COLUMN about_me            TEXT                 COMMENT 'Bio shown on booking page',
  ADD COLUMN experience_years    INT,
  ADD COLUMN registration_number VARCHAR(100)         COMMENT 'Professional license number',
  ADD COLUMN rating              DECIMAL(3,2) DEFAULT 0.00;
```

> **What is `booking_slug`?** The unique identifier for the therapist's public appointment booking page. Example: `neure.health/book/dr-sarah-miller`. Clients use this to book sessions without logging in. Auto-generated from `first_name + last_name` on creation. Collisions resolved by appending `-2`, `-3`, etc.

---

### 2. `therapist_availability`

Therapist's weekly recurring schedule — drives the public booking slot grid.

```sql
CREATE TABLE therapist_availability (
  id             INT NOT NULL AUTO_INCREMENT,
  therapist_id   INT NOT NULL,
  days           JSON NOT NULL       COMMENT '["Mon","Tue","Wed","Thu","Fri"]',
  from_time      TIME NOT NULL       COMMENT '09:00',
  to_time        TIME NOT NULL       COMMENT '17:00',
  slot_minutes   INT DEFAULT 60,
  buffer_minutes INT DEFAULT 0,
  updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_therapist (therapist_id),
  FOREIGN KEY (therapist_id) REFERENCES therapists(id) ON DELETE CASCADE
);
```

> Separate from old `therapist_slots` (individual booked instances). This stores the *recurring pattern*.

---

### 3. `therapist_branding`

Per-therapist branding for the ProDesk UI and public booking page.

```sql
CREATE TABLE therapist_branding (
  id                    INT NOT NULL AUTO_INCREMENT,
  therapist_id          INT NOT NULL,
  brand_name            VARCHAR(100) DEFAULT 'ProDesk',
  theme                 ENUM('dark','light') DEFAULT 'dark',
  accent                ENUM('sage','slate','plum','bronze','clay') DEFAULT 'sage',
  background_preset     VARCHAR(50) DEFAULT 'aurora',
  logo_url              VARCHAR(500),
  custom_background_url VARCHAR(500),
  updated_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_therapist (therapist_id),
  FOREIGN KEY (therapist_id) REFERENCES therapists(id) ON DELETE CASCADE
);
```

> More fields to be added later as branding requirements grow.

---

### 4. `therapist_documents`

Professional documents shown to clients during booking.

```sql
CREATE TABLE therapist_documents (
  id           INT NOT NULL AUTO_INCREMENT,
  therapist_id INT NOT NULL,
  type         ENUM('agreement','consent','certification') NOT NULL
               COMMENT 'agreement=service agreement, consent=consent form, certification=license/cert',
  file_url     VARCHAR(500) NOT NULL,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (therapist_id) REFERENCES therapists(id) ON DELETE CASCADE
);
```

> One `agreement` and one `consent` per therapist — uploading replaces existing. Multiple `certification` allowed.

---

### 5. `prodesk_clients`

Therapist's patients. Login identity in `users` (role_id=5), clinical data here.

```sql
CREATE TABLE prodesk_clients (
  id                  INT NOT NULL AUTO_INCREMENT,
  user_id             INT NOT NULL    COMMENT 'FK to users table (role_id=5)',
  therapist_id        INT NOT NULL    COMMENT 'Owning therapist',
  age                 INT,
  gender              ENUM('F','M','NB','U'),
  city                VARCHAR(100),
  emergency_contact   VARCHAR(100),
  start_date          DATE            COMMENT 'Date client started therapy',
  presenting_concerns TEXT,
  issues              JSON            COMMENT '["Anxiety","Work stress"]',
  default_fee         DECIMAL(10,2) DEFAULT 0.00,
  status              ENUM('active','archived') DEFAULT 'active',
  avatar_color        VARCHAR(20),
  created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (therapist_id) REFERENCES therapists(id) ON DELETE CASCADE
);
```

> `name`, `email`, `phone` live in `users`. Creating a client = INSERT into `users` (role_id=5) + INSERT into `prodesk_clients`.

---

### 6. `prodesk_sessions`

Individual therapy appointment. Single source of truth — no separate bookings table.

```sql
CREATE TABLE prodesk_sessions (
  id             INT NOT NULL AUTO_INCREMENT,
  therapist_id   INT NOT NULL,
  client_id      INT NOT NULL    COMMENT 'FK to prodesk_clients.id',
  session_number INT NOT NULL    COMMENT 'Sequential per client (1, 2, 3...)',
  title          VARCHAR(255),
  starts_at      TIMESTAMP NOT NULL,
  duration_min   INT DEFAULT 60,
  modality       ENUM('in_person','video','phone') NOT NULL,
  status         ENUM('scheduled','completed','cancelled','no_show') DEFAULT 'scheduled',
  fee            DECIMAL(10,2) DEFAULT 0.00,
  location       VARCHAR(255)    COMMENT 'For in_person sessions',
  meet_url       VARCHAR(500)    COMMENT 'Video call URL from external meet service',
  note_id        INT             COMMENT 'Linked session note — NULL until note created',
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (therapist_id) REFERENCES therapists(id) ON DELETE CASCADE,
  FOREIGN KEY (client_id) REFERENCES prodesk_clients(id) ON DELETE CASCADE
);
```

> `meet_url` is populated by external video service when `modality = 'video'`. Single `status` — no separate video status.

---

### 7. `prodesk_session_notes`

Clinical notes — one note per session.

```sql
CREATE TABLE prodesk_session_notes (
  id           INT NOT NULL AUTO_INCREMENT,
  session_id   INT NOT NULL UNIQUE  COMMENT 'One note per session',
  client_id    INT NOT NULL,
  therapist_id INT NOT NULL,
  title        VARCHAR(255),
  body         LONGTEXT,
  preview      VARCHAR(200)         COMMENT 'Auto-generated from first ~120 chars of body',
  format       ENUM('markdown','plain') DEFAULT 'markdown',
  is_draft     TINYINT(1) DEFAULT 1,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (session_id) REFERENCES prodesk_sessions(id) ON DELETE RESTRICT,
  FOREIGN KEY (client_id) REFERENCES prodesk_clients(id),
  FOREIGN KEY (therapist_id) REFERENCES therapists(id)
);
```

---

### 8. `prodesk_note_attachments`

Files attached to a session note.

```sql
CREATE TABLE prodesk_note_attachments (
  id          INT NOT NULL AUTO_INCREMENT,
  note_id     INT NOT NULL,
  file_name   VARCHAR(255) NOT NULL,
  file_url    VARCHAR(500) NOT NULL,
  size_bytes  INT,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (note_id) REFERENCES prodesk_session_notes(id) ON DELETE CASCADE
);
```

---

### 9. `prodesk_invoices`

Billing invoices — backed by Razorpay Invoice Service.

```sql
CREATE TABLE prodesk_invoices (
  id                  INT NOT NULL AUTO_INCREMENT,
  therapist_id        INT NOT NULL,
  client_id           INT NOT NULL,
  session_id          INT,
  invoice_number      VARCHAR(30)      COMMENT 'e.g. INV-2026-001, server-generated from id',
  issue_date          DATE NOT NULL,
  due_date            DATE,
  line_items          JSON NOT NULL    COMMENT '[{description, qty, rate, amount}]',
  subtotal            DECIMAL(10,2) NOT NULL,
  tax_percent         DECIMAL(5,2) DEFAULT 18.00,
  tax                 DECIMAL(10,2) NOT NULL,
  total               DECIMAL(10,2) NOT NULL,
  currency            CHAR(3) DEFAULT 'INR',
  notes               TEXT,
  status              ENUM('draft','sent','paid','overdue','cancelled') DEFAULT 'draft',
  razorpay_invoice_id VARCHAR(100)     COMMENT 'Razorpay invoice ID once issued',
  razorpay_short_url  VARCHAR(500)     COMMENT 'Razorpay hosted invoice URL',
  paid_at             TIMESTAMP NULL,
  created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (therapist_id) REFERENCES therapists(id),
  FOREIGN KEY (client_id) REFERENCES prodesk_clients(id)
);
```

> Invoice number generated server-side: `INV-{YYYY}-{id zero-padded to 3 digits}`. No separate sequence table needed.

---

### 10. `prodesk_payment`

Payment records for all financial transactions.

```sql
CREATE TABLE prodesk_payment (
  id                INT NOT NULL AUTO_INCREMENT,
  user_id           INT NOT NULL       COMMENT 'Client user_id who paid',
  therapist_id      INT NOT NULL,
  invoice_id        INT,
  session_id        INT,
  payment_type      VARCHAR(255)       COMMENT 'session_fee | invoice | booking',
  provider          VARCHAR(255) DEFAULT 'razorpay',
  amount            DECIMAL(10,2),
  currency          CHAR(3) DEFAULT 'INR',
  reference_id      VARCHAR(255)       COMMENT 'Internal reference',
  razorpay_ref_id   VARCHAR(255)       COMMENT 'Razorpay payment ID (pay_xxx)',
  razorpay_order_id VARCHAR(255)       COMMENT 'Razorpay order ID (order_xxx)',
  status            VARCHAR(100)       COMMENT 'created | captured | failed | refunded',
  meta              JSON               COMMENT 'Full Razorpay response payload',
  invoice_url       VARCHAR(500),
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  FOREIGN KEY (therapist_id) REFERENCES therapists(id)
);
```

---

### 11. `prodesk_payment_log`

Audit trail for every payment status change event.

```sql
CREATE TABLE prodesk_payment_log (
  id           INT NOT NULL AUTO_INCREMENT,
  payment_id   INT NOT NULL,
  reference_id VARCHAR(255),
  status       VARCHAR(255),
  refund_id    VARCHAR(255)  COMMENT 'Razorpay refund ID if applicable',
  meta         JSON          COMMENT 'Razorpay webhook event payload',
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (payment_id) REFERENCES prodesk_payment(id)
);
```

---

### 12. `payment_method`

Reference table for payment methods.

```sql
CREATE TABLE payment_method (
  id             INT NOT NULL AUTO_INCREMENT,
  payment_method VARCHAR(100) NOT NULL,
  is_active      TINYINT(1) DEFAULT 1,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

INSERT INTO payment_method (payment_method) VALUES
  ('Debit/Credit Card'), ('Net Banking'), ('Wallet'), ('UPI'), ('COD');
```

---

### 13. `client_integration`

Stores third-party API credentials — Razorpay, future integrations.

```sql
CREATE TABLE client_integration (
  id         INT NOT NULL AUTO_INCREMENT,
  name       VARCHAR(255),
  key_id     VARCHAR(255)   COMMENT 'API key / client ID',
  secret     VARCHAR(255)   COMMENT 'API secret (encrypt at rest)',
  domain     VARCHAR(255),
  type       VARCHAR(45) NOT NULL COMMENT 'payment | calendar | sms | email',
  is_active  INT DEFAULT 1,
  meta       JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);
```

Seed with Razorpay credentials:
```sql
INSERT INTO client_integration (name, key_id, secret, type) VALUES
  ('Razor-Pay', 'rzp_test_RQA***', 'Yr***', 'payment');
```

> All Razorpay API calls read credentials from this table. Never hardcode keys.

---

### 14. `prodesk_resources`

Therapist's personal resource library + Neure pre-loaded catalogue.

```sql
CREATE TABLE prodesk_resources (
  id           INT NOT NULL AUTO_INCREMENT,
  therapist_id INT              COMMENT 'NULL for Neure catalogue items',
  title        VARCHAR(255) NOT NULL,
  type         ENUM('PDF','Worksheet','Audio') NOT NULL,
  category     VARCHAR(100),
  scope        ENUM('mine','catalogue') NOT NULL DEFAULT 'mine',
  owner        ENUM('therapist','neure') NOT NULL DEFAULT 'therapist',
  file_url     VARCHAR(500) NOT NULL,
  size_bytes   INT,
  is_deleted   TINYINT(1) DEFAULT 0,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (therapist_id) REFERENCES therapists(id) ON DELETE CASCADE
);
```

> `scope='catalogue'` rows: `therapist_id = NULL`, `owner = 'neure'` — seeded by Superadmin. "Save to my library" creates a new `scope='mine'` row for the therapist.

---

### 15. `prodesk_slot_holds`

Temporary 8-minute holds during the public booking flow.

```sql
CREATE TABLE prodesk_slot_holds (
  id           INT NOT NULL AUTO_INCREMENT,
  therapist_id INT NOT NULL,
  date         DATE NOT NULL,
  time_slot    TIME NOT NULL,
  modality     ENUM('in_person','video','phone') NOT NULL,
  hold_token   VARCHAR(64) NOT NULL UNIQUE,
  expires_at   TIMESTAMP NOT NULL,
  claimed      TINYINT(1) DEFAULT 0,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_active_slot (therapist_id, date, time_slot, claimed),
  FOREIGN KEY (therapist_id) REFERENCES therapists(id) ON DELETE CASCADE
);
```

---

### 16. `notifications` — Alter Existing Table (Do Not Recreate)

The existing `notifications` table is used across all dashboards. ProDesk uses the same table via the same `notificationService`. Add two missing columns:

```sql
ALTER TABLE notifications
  ADD COLUMN is_close TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Dismissed/closed by user',
  ADD COLUMN meta     JSON                           COMMENT 'Extra context for deep links';
```

> `user_id` already exists on the table — therapists (role_id=4) and clients (role_id=5) are both in `users`, so no structural change needed beyond these two columns.

---

### 17. `notification_log`

Delivery audit trail for all notification send attempts.

```sql
CREATE TABLE notification_log (
  id             INT NOT NULL AUTO_INCREMENT,
  user_id        INT,
  user_type      VARCHAR(20)   COMMENT 'therapist | client | employee | admin',
  platform       VARCHAR(100)  COMMENT 'IN_APP | EMAIL | SMS | PUSH',
  status_code    INT,
  status         VARCHAR(100),
  type           VARCHAR(100),
  message        VARCHAR(255),
  error          TEXT,
  message_body   TEXT,
  template_name  VARCHAR(100),
  meta           JSON,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);
```

Add `logNotification()` method to existing `notificationService.js` — called after every send attempt.

---

### 18. `prodesk_device_sessions`

Tracks active login sessions per therapist for "Logout from all devices".

```sql
CREATE TABLE prodesk_device_sessions (
  id             INT NOT NULL AUTO_INCREMENT,
  therapist_id   INT NOT NULL,
  jti            VARCHAR(64) NOT NULL UNIQUE COMMENT 'JWT ID claim',
  device_info    VARCHAR(255),
  ip_address     VARCHAR(45),
  last_active_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  revoked        TINYINT(1) DEFAULT 0,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (therapist_id) REFERENCES therapists(id) ON DELETE CASCADE
);
```

---

## Complete Table Summary

| # | Table | Action | Purpose |
|---|-------|--------|---------|
| — | `roles` | Add rows 5, 6 | client + therapist_staff |
| 1 | `therapists` | Add 5 columns | ProDesk profile fields |
| 2 | `therapist_availability` | New | Weekly schedule pattern |
| 3 | `therapist_branding` | New | UI branding + booking page |
| 4 | `therapist_documents` | New | agreement / consent / certification |
| 5 | `prodesk_clients` | New | Patients (routes from users role_id=5) |
| 6 | `prodesk_sessions` | New | Appointments — single source of truth |
| 7 | `prodesk_session_notes` | New | Clinical notes |
| 8 | `prodesk_note_attachments` | New | Note file attachments |
| 9 | `prodesk_invoices` | New | Billing invoices (Razorpay-backed) |
| 10 | `prodesk_payment` | New | Payment records |
| 11 | `prodesk_payment_log` | New | Payment event audit trail |
| 12 | `payment_method` | New | Payment method reference |
| 13 | `client_integration` | New | Third-party credentials (Razorpay) |
| 14 | `prodesk_resources` | New | Resource library |
| 15 | `prodesk_slot_holds` | New | 8-min booking slot holds |
| 16 | `notifications` | Add 2 columns | Add is_close, meta |
| 17 | `notification_log` | New | Notification delivery log |
| 18 | `prodesk_device_sessions` | New | Multi-device session tracking |

---

## Server Files To Create

```
api/server/routes/
  prodesk.js                          ← single file, all routes

api/server/controllers/prodesk/
  authController.js
  profileController.js
  clientController.js
  sessionController.js
  noteController.js
  billingController.js
  resourceController.js
  bookingController.js
  dashboardController.js
  teamController.js

api/server/services/prodesk/
  authService.js
  profileService.js
  clientService.js
  sessionService.js
  noteService.js
  billingService.js
  resourceService.js
  bookingService.js
  dashboardService.js
  teamService.js
  razorpayService.js
```

Register in `api/index.js`:
```js
const prodeskRoutes = require('./server/routes/prodesk');
app.use('/api/prodesk', prodeskRoutes);
```

---

## All API Endpoints (All POST)

### Auth
| Route | Auth | Notes |
|-------|------|-------|
| `POST /api/prodesk/login` | None | role_id=4 |
| `POST /api/prodesk/logout` | Bearer | Blacklists token |
| `POST /api/prodesk/logoutAll` | Bearer | Revokes all device sessions |
| `POST /api/prodesk/refreshToken` | None | Refresh token in body |
| `POST /api/prodesk/forgotPassword` | None | Sends reset email |
| `POST /api/prodesk/resetPassword` | None | Token + new password |
| `POST /api/prodesk/changePassword` | Bearer | Needs current password |

### Profile & Settings
| Route | Auth | Notes |
|-------|------|-------|
| `POST /api/prodesk/getProfile` | Bearer | users + therapists join |
| `POST /api/prodesk/updateProfile` | Bearer | Update profile fields |
| `POST /api/prodesk/getAvailability` | Bearer | |
| `POST /api/prodesk/updateAvailability` | Bearer | |
| `POST /api/prodesk/getBranding` | Bearer | |
| `POST /api/prodesk/updateBranding` | Bearer | |
| `POST /api/prodesk/uploadBrandingLogo` | Bearer | multipart |
| `POST /api/prodesk/getDocuments` | Bearer | |
| `POST /api/prodesk/uploadDocument` | Bearer | multipart, type required |
| `POST /api/prodesk/deleteDocument` | Bearer | |

### Clients
| Route | Auth | Notes |
|-------|------|-------|
| `POST /api/prodesk/createClient` | Bearer | Creates users row (role_id=5) + prodesk_clients row |
| `POST /api/prodesk/getClients` | Bearer | Paginated, search, filter by status |
| `POST /api/prodesk/getClientById` | Bearer | With session history |
| `POST /api/prodesk/updateClient` | Bearer | |
| `POST /api/prodesk/archiveClient` | Bearer | Soft-delete |

### Sessions
| Route | Auth | Notes |
|-------|------|-------|
| `POST /api/prodesk/createSession` | Bearer | Overlap check, assigns session_number |
| `POST /api/prodesk/getSessions` | Bearer | Filter by client, status, date range |
| `POST /api/prodesk/getSessionById` | Bearer | |
| `POST /api/prodesk/updateSession` | Bearer | title, fee, duration, location |
| `POST /api/prodesk/rescheduleSession` | Bearer | New starts_at + duration |
| `POST /api/prodesk/cancelSession` | Bearer | Sets status cancelled |
| `POST /api/prodesk/completeSession` | Bearer | Sets status completed or no_show |
| `POST /api/prodesk/getCalendarSessions` | Bearer | Date range view |
| `POST /api/prodesk/getTodaySessions` | Bearer | Dashboard widget |

### Session Notes
| Route | Auth | Notes |
|-------|------|-------|
| `POST /api/prodesk/createNote` | Bearer | |
| `POST /api/prodesk/getNote` | Bearer | By session_id |
| `POST /api/prodesk/updateNote` | Bearer | Save / autosave |
| `POST /api/prodesk/getClientNotes` | Bearer | All notes for a client |
| `POST /api/prodesk/uploadNoteAttachment` | Bearer | multipart |
| `POST /api/prodesk/deleteNoteAttachment` | Bearer | |

### Billing
| Route | Auth | Notes |
|-------|------|-------|
| `POST /api/prodesk/createInvoice` | Bearer | Draft or send via Razorpay |
| `POST /api/prodesk/getInvoices` | Bearer | Filter status/client/date |
| `POST /api/prodesk/getInvoiceById` | Bearer | |
| `POST /api/prodesk/sendInvoice` | Bearer | Issue draft via Razorpay |
| `POST /api/prodesk/cancelInvoice` | Bearer | |
| `POST /api/prodesk/markInvoicePaid` | Bearer | Manual offline payment |
| `POST /api/prodesk/getBillingSummary` | Bearer | Stats card |
| `POST /api/prodesk/getPayments` | Bearer | Payment ledger |
| `POST /api/prodesk/razorpayWebhook` | None (HMAC-verified) | Razorpay event handler |

### Resources
| Route | Auth | Notes |
|-------|------|-------|
| `POST /api/prodesk/getResources` | Bearer | mine + catalogue, filter scope/type/category |
| `POST /api/prodesk/getResourceCategories` | Bearer | |
| `POST /api/prodesk/uploadResource` | Bearer | multipart, adds to my library |
| `POST /api/prodesk/updateResource` | Bearer | own resources only |
| `POST /api/prodesk/deleteResource` | Bearer | own resources only |
| `POST /api/prodesk/saveResourceToLibrary` | Bearer | Copy catalogue → mine |

### Public Booking (No Auth — Client-facing)
| Route | Auth | Notes |
|-------|------|-------|
| `POST /api/prodesk/getPublicProfile` | None | By booking_slug |
| `POST /api/prodesk/getAvailableSlots` | None | Date range → available slots |
| `POST /api/prodesk/holdSlot` | None | 8-min hold, returns hold_token |
| `POST /api/prodesk/confirmBooking` | None | Client details + initiate Razorpay order |
| `POST /api/prodesk/verifyBookingPayment` | None | Verify signature → create session + payment record |

### Notifications
| Route | Auth | Notes |
|-------|------|-------|
| `POST /api/prodesk/getNotifications` | Bearer | is_close=0 by default |
| `POST /api/prodesk/markNotificationRead` | Bearer | Sets is_read=1 |
| `POST /api/prodesk/markAllNotificationsRead` | Bearer | |
| `POST /api/prodesk/closeNotification` | Bearer | Sets is_close=1 |

### Dashboard
| Route | Auth | Notes |
|-------|------|-------|
| `POST /api/prodesk/getDashboard` | Bearer | today sessions + metrics + notifications |
| `POST /api/prodesk/getMetrics` | Bearer | therapy_hours, revenue, sessions count (period filter) |

### Team / Staff
| Route | Auth | Notes |
|-------|------|-------|
| `POST /api/prodesk/getTeam` | Bearer | List staff (role_id=6) under this therapist |
| `POST /api/prodesk/inviteStaff` | Bearer | Creates role_id=6 user, sends invite email |
| `POST /api/prodesk/updateStaff` | Bearer | |
| `POST /api/prodesk/removeStaff` | Bearer | Deactivate staff |

---

## Key Business Logic

### Booking Slug
Auto-generated from `users.first_name + last_name` when therapist is created by Superadmin. Lowercase, spaces → `-`. Collision: append `-2`, `-3`. Stored in `therapists.booking_slug`.

### Session Overlap Check
```sql
SELECT 1 FROM prodesk_sessions
WHERE therapist_id = ?
  AND status NOT IN ('cancelled')
  AND starts_at < DATE_ADD(?, INTERVAL ? MINUTE)
  AND DATE_ADD(starts_at, INTERVAL duration_min MINUTE) > ?
LIMIT 1
```
Found → error `slot_unavailable`.

### Client Creation Flow
```
createClient
  → INSERT users (role_id=5, first_name, last_name, email, phone, password)
  → INSERT prodesk_clients (user_id, therapist_id, ...clinical fields)
  → Assign avatar_color deterministically from name
  → Return combined object
```

### Money — Plain Decimal
All monetary values stored as `DECIMAL(10,2)` — the actual rupee value as-is. `₹345.45 → 345.45`, `₹456 → 456.00`. No paise conversion. Server always computes totals (subtotal, tax, total). Frontend uses the value directly.

### IST Timestamp Conversion (All API Responses)
Every date/time field in every API response must be converted to IST before returning. The DB stores in UTC; IST = UTC + 5 hours 30 minutes.

Apply this to **all** fields: `created_at`, `updated_at`, `starts_at`, `paid_at`, `uploaded_at`, `expires_at`, `last_active_at`, `due_date`, `issue_date`, `start_date`, or any field containing a date/timestamp.

**Utility function** — add to `api/server/utils/dateHelper.js`:

```js
function toIST(utcDate) {
  if (!utcDate) return null;
  const d = new Date(utcDate);
  d.setHours(d.getHours() + 5);
  d.setMinutes(d.getMinutes() + 30);
  return d.toISOString().replace('T', ' ').substring(0, 19); // "YYYY-MM-DD HH:mm:ss"
}

function convertDatesToIST(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const DATE_FIELDS = [
    'created_at','updated_at','starts_at','paid_at','uploaded_at',
    'expires_at','last_active_at','due_date','issue_date','start_date',
    'joined_date','last_login','replaced_at','connected_at'
  ];
  const result = Array.isArray(obj) ? [] : {};
  for (const key of Object.keys(obj)) {
    if (DATE_FIELDS.includes(key) && obj[key]) {
      result[key] = toIST(obj[key]);
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      result[key] = convertDatesToIST(obj[key]);
    } else {
      result[key] = obj[key];
    }
  }
  return result;
}

module.exports = { toIST, convertDatesToIST };
```

**Usage in every controller response:**
```js
const { convertDatesToIST } = require('../../utils/dateHelper');

// Before sending any response:
return res.status(200).json({
  status: true,
  code: 200,
  message: '...',
  data: convertDatesToIST(result)
});
```

Apply `convertDatesToIST` to every `data` value before it goes into the response — single objects, arrays of objects, and nested objects alike.

### Invoice Number Generation
```
INV-{YYYY}-{prodesk_invoices.id zero-padded to 3 digits}
```
Generated after INSERT using auto-increment ID. No separate sequence table.

### Razorpay Credentials
Read from `client_integration` where `type = 'payment'` and `is_active = 1`. Never hardcode keys.

### Payment Flow (Booking)
```
1. holdSlot         → create prodesk_slot_holds row (8-min expiry)
2. confirmBooking   → validate hold, create Razorpay order (razorpayService.createOrder)
                      → return order_id + key_id to frontend
3. Frontend opens Razorpay Checkout
4. verifyBookingPayment → verify HMAC signature
                        → create prodesk_sessions row
                        → create prodesk_payment row (status=captured)
                        → mark slot hold claimed=1
5. razorpayWebhook  → update prodesk_payment status
                    → INSERT prodesk_payment_log row
```

### Notifications — Two Methods
```js
// Send (writes to notifications table)
NotificationService.createNotification({ title, content, type, user_id, meta })

// Log delivery attempt (writes to notification_log)
NotificationService.logNotification({ user_id, platform, status, type, meta, error })
```

---

## Implementation Order

| Phase | What | Tables |
|-------|------|--------|
| 1 | All DB migrations | All 18 above |
| 2 | Auth — login, logout, refresh, forgot/reset password | users, therapists, token tables, prodesk_device_sessions |
| 3 | Profile — get/update, availability, branding, documents | therapists (extended), therapist_availability, therapist_branding, therapist_documents |
| 4 | Clients — CRUD | users (role_id=5), prodesk_clients |
| 5 | Sessions — schedule, calendar, today | prodesk_sessions, therapist_availability |
| 6 | Dashboard | prodesk_sessions, prodesk_invoices, prodesk_clients |
| 7 | Notes — CRUD + autosave + attachments | prodesk_session_notes, prodesk_note_attachments |
| 8 | Resources library | prodesk_resources, gallery (catalogue) |
| 9 | Billing — invoices + payments | prodesk_invoices, prodesk_payment, prodesk_payment_log, client_integration |
| 10 | Public booking — slots, hold, confirm, pay | prodesk_slot_holds, prodesk_sessions, prodesk_payment |
| 11 | Notifications | notifications (altered), notification_log |
| 12 | Team / Staff | users (role_id=6) |
