# ProDesk — API Test Guide (End-to-End)

## Server
```
Base URL : http://localhost:3002/api/prodesk
All APIs : POST only
Auth     : Authorization: Bearer <accessToken>
```

---

## Test Therapist Credentials
```
Email    : priya.therapist@neure.com
Password : Test@1234
Role     : therapist (role_id = 4)
Slug     : dr-priya-sharma
Therapist ID : 15
```

---

## Flow 1 — Therapist Auth

### Step 1.1 — Login
```
POST /api/prodesk/login
```
```json
{
  "email": "priya.therapist@neure.com",
  "password": "Test@1234"
}
```
**Returns:** `accessToken` (15 min), `refreshToken` (30 days), `therapist_id`, `booking_slug`.

Save the `accessToken` — pass as `Authorization: Bearer <token>` in all subsequent calls.

---

### Step 1.2 — Refresh Token (when access token expires)
```
POST /api/prodesk/refreshToken
```
```json
{ "refresh_token": "<your_refresh_token>" }
```

---

### Step 1.3 — Change Password
```
POST /api/prodesk/changePassword   🔒
```
```json
{
  "current_password": "Test@1234",
  "new_password": "NewPass@456"
}
```

---

### Step 1.4 — Forgot Password
```
POST /api/prodesk/forgotPassword
```
```json
{ "email": "priya.therapist@neure.com" }
```
Sends a reset link by email. Token valid for 1 hour.

---

### Step 1.5 — Reset Password
```
POST /api/prodesk/resetPassword
```
```json
{
  "token": "<token_from_email>",
  "new_password": "NewPass@456"
}
```

---

### Step 1.6 — Logout
```
POST /api/prodesk/logout   🔒
```
No body. Invalidates the current `accessToken`.

---

## Flow 2 — Profile Setup

### Step 2.1 — Get Profile
```
POST /api/prodesk/getProfile   🔒
```
No body. Returns full therapist profile.

---

### Step 2.2 — Update Profile
```
POST /api/prodesk/updateProfile   🔒
```
```json
{
  "first_name": "Dr. Priya",
  "last_name": "Sharma",
  "phone": "+91 9876543210",
  "city": "Mumbai",
  "bio": "CBT & ACT specialist with 8 years experience.",
  "specialization": "Cognitive Behavioural Therapy",
  "about_me": "I help clients overcome anxiety and burnout.",
  "experience_years": 8,
  "registration_number": "MCI/2016/PSY/001"
}
```

---

### Step 2.3 — Set Availability
```
POST /api/prodesk/updateAvailability   🔒
```
```json
{
  "days": ["Mon", "Tue", "Wed", "Thu", "Fri"],
  "from_time": "09:00",
  "to_time": "17:00",
  "slot_minutes": 60,
  "buffer_minutes": 15
}
```

---

### Step 2.4 — Get Booking Link
```
POST /api/prodesk/getBookingLink   🔒
```
Returns: `{ "slug": "dr-priya-sharma", "url": "https://prodesk.neure.health/book/dr-priya-sharma", "is_live": true }`

---

### Step 2.5 — Update Branding
```
POST /api/prodesk/updateBranding   🔒
```
```json
{
  "brand_name": "Priya Sharma Therapy",
  "theme": "dark",
  "accent": "sage",
  "background_preset": "aurora"
}
```

---

## Flow 3 — Client Management

### Step 3.1 — Create Client
```
POST /api/prodesk/createClient   🔒
```
```json
{
  "name": "Arun Mehta",
  "email": "arun.mehta@gmail.com",
  "phone": "+91 9876500001",
  "age": 32,
  "gender": "M",
  "city": "Mumbai",
  "presenting_concerns": "Work anxiety and sleep issues",
  "issues": ["Anxiety", "Insomnia"],
  "default_fee": 4500
}
```
Creates a `users` row (role_id=5) + `prodesk_clients` row. Returns `client_id`.

---

### Step 3.2 — List Clients
```
POST /api/prodesk/getClients   🔒
```
```json
{
  "page": 1,
  "limit": 20,
  "search": "",
  "status": "active"
}
```

---

### Step 3.3 — Get Client by ID
```
POST /api/prodesk/getClientById   🔒
```
```json
{ "client_id": 1 }
```

---

### Step 3.4 — Update Client
```
POST /api/prodesk/updateClient   🔒
```
```json
{
  "client_id": 1,
  "presenting_concerns": "Work anxiety, sleep issues, relationship stress",
  "issues": ["Anxiety", "Insomnia", "Relationships"],
  "default_fee": 5000
}
```

---

## Flow 4 — Sessions

### Step 4.1 — Create Session
```
POST /api/prodesk/createSession   🔒
```
```json
{
  "client_id": 1,
  "starts_at": "2026-07-10 10:00:00",
  "duration_min": 60,
  "modality": "video",
  "fee": 4500,
  "title": "Initial Assessment"
}
```
`modality`: `video` | `in_person` | `phone`

---

### Step 4.2 — Get Sessions (list / filter)
```
POST /api/prodesk/getSessions   🔒
```
```json
{
  "client_id": 1,
  "status": "scheduled",
  "from": "2026-07-01",
  "to": "2026-07-31",
  "page": 1,
  "limit": 20
}
```

---

### Step 4.3 — Get Calendar View
```
POST /api/prodesk/getCalendarSessions   🔒
```
```json
{
  "from": "2026-07-07",
  "to": "2026-07-13"
}
```

---

### Step 4.4 — Today's Sessions (Dashboard widget)
```
POST /api/prodesk/getTodaySessions   🔒
```
No body.

---

### Step 4.5 — Reschedule Session
```
POST /api/prodesk/rescheduleSession   🔒
```
```json
{
  "session_id": 1,
  "starts_at": "2026-07-11 11:00:00",
  "duration_min": 60
}
```

---

### Step 4.6 — Complete Session
```
POST /api/prodesk/completeSession   🔒
```
```json
{
  "session_id": 1,
  "no_show": false
}
```

---

### Step 4.7 — Cancel Session
```
POST /api/prodesk/cancelSession   🔒
```
```json
{
  "session_id": 1,
  "reason": "Client requested rescheduling"
}
```

---

## Flow 5 — Session Notes

### Step 5.1 — Create Note (first save)
```
POST /api/prodesk/createNote   🔒
```
```json
{
  "session_id": 1,
  "title": "Initial Assessment - Arun",
  "body": "Client presented with work anxiety. GAD-7: 14. Key themes: perfectionism, fear of failure. Plan: CBT thought records.",
  "format": "markdown",
  "is_draft": false
}
```

---

### Step 5.2 — Update / Autosave Note
```
POST /api/prodesk/updateNote   🔒
```
```json
{
  "session_id": 1,
  "body": "Updated note content...",
  "is_draft": false
}
```
Call this every 2s for autosave during a live call.

---

### Step 5.3 — Get Note
```
POST /api/prodesk/getNote   🔒
```
```json
{ "session_id": 1 }
```

---

### Step 5.4 — Get All Notes for a Client
```
POST /api/prodesk/getClientNotes   🔒
```
```json
{ "client_id": 1, "page": 1, "limit": 20 }
```

---

## Flow 6 — Billing & Invoices

### Step 6.1 — Create Invoice (draft)
```
POST /api/prodesk/createInvoice   🔒
```
```json
{
  "client_id": 1,
  "session_id": 1,
  "due_date": "2026-07-20",
  "line_items": [
    { "description": "Therapy session 60 min", "qty": 1, "rate": 4500 },
    { "description": "Assessment report", "qty": 1, "rate": 500 }
  ],
  "tax_percent": 18,
  "notes": "Thank you for choosing ProDesk.",
  "action": "draft"
}
```
`action`: `draft` (default) | `send` (creates Razorpay invoice and emails client)

---

### Step 6.2 — Send Invoice
```
POST /api/prodesk/sendInvoice   🔒
```
```json
{ "invoice_id": 1 }
```
Creates Razorpay invoice, sets `status: sent`, returns `razorpay_short_url`.

---

### Step 6.3 — Mark Invoice Paid (offline/cash)
```
POST /api/prodesk/markInvoicePaid   🔒
```
```json
{
  "invoice_id": 1,
  "method": "UPI",
  "paid_at": "2026-07-15"
}
```

---

### Step 6.4 — Get Billing Summary
```
POST /api/prodesk/getBillingSummary   🔒
```
No body. Returns `outstanding`, `paid_this_month`, `overdue_count`.

---

## Flow 7 — Public Booking (Client-facing, No Auth)

### Step 7.1 — Get Public Profile
```
POST /api/prodesk/getPublicProfile
```
```json
{ "slug": "dr-priya-sharma" }
```

---

### Step 7.2 — Get Available Slots
```
POST /api/prodesk/getAvailableSlots
```
```json
{
  "slug": "dr-priya-sharma",
  "from": "2026-07-07",
  "to": "2026-07-13"
}
```
Returns available time slots per day minus already booked ones.

---

### Step 7.3 — Hold a Slot (8 minutes)
```
POST /api/prodesk/holdSlot
```
```json
{
  "slug": "dr-priya-sharma",
  "date": "2026-07-10",
  "time": "10:00",
  "modality": "video"
}
```
Returns `hold_token` and `expires_at`.

---

### Step 7.4 — Confirm Booking (initiate payment)
```
POST /api/prodesk/confirmBooking
```
```json
{
  "hold_token": "<hold_token_from_step_7.3>",
  "name": "Varun Shah",
  "email": "varun@example.com",
  "phone": "+91 9900000001",
  "concern": "Feeling burned out at work.",
  "consent_accepted": true
}
```
Returns `razorpay_order_id` and `razorpay_key_id` for the payment checkout.

---

### Step 7.5 — Verify Payment
```
POST /api/prodesk/verifyBookingPayment
```
```json
{
  "hold_token": "<hold_token>",
  "payment_id": 1,
  "razorpay_order_id": "order_xxx",
  "razorpay_payment_id": "pay_xxx",
  "razorpay_signature": "<hmac_signature>"
}
```
On success: creates `prodesk_sessions` + `prodesk_payment`, sends notification to therapist.

---

## Flow 8 — Resources

### Step 8.1 — Get Resources (own + catalogue)
```
POST /api/prodesk/getResources   🔒
```
```json
{
  "scope": "all",
  "type": "PDF",
  "category": "CBT",
  "q": "",
  "page": 1,
  "limit": 20
}
```
`scope`: `all` | `mine` | `catalogue`

---

### Step 8.2 — Save Catalogue Item to My Library
```
POST /api/prodesk/saveResourceToLibrary   🔒
```
```json
{ "resource_id": 5 }
```

---

## Flow 9 — Dashboard

### Step 9.1 — Full Dashboard
```
POST /api/prodesk/getDashboard   🔒
```
No body. Returns `metrics`, `today_sessions`, `recent_notifications`.

---

### Step 9.2 — Metrics (custom period)
```
POST /api/prodesk/getMetrics   🔒
```
```json
{
  "from": "2026-06-01",
  "to": "2026-06-30"
}
```
Returns `therapy_hours`, `lives_impacted`, `revenue`, `sessions`, `month_over_month_percent`.

---

## Flow 10 — Notifications

### Step 10.1 — Get Notifications
```
POST /api/prodesk/getNotifications   🔒
```
```json
{ "unread": true, "page": 1, "limit": 20 }
```

### Step 10.2 — Mark Read / Close
```
POST /api/prodesk/markNotificationRead   🔒
{ "notification_id": 1 }

POST /api/prodesk/markAllNotificationsRead   🔒
(no body)

POST /api/prodesk/closeNotification   🔒
{ "notification_id": 1 }
```

---

## Standard Response Format

```json
{
  "status": true | false,
  "code": 200 | 201 | 400 | 401 | 404 | 409 | 500,
  "message": "Human readable message",
  "data": { ... } | [ ... ] | null,
  "pagination": { "total": 50, "current_page": 1, "per_page": 20, "total_pages": 3 }
}
```

All `created_at`, `updated_at`, `starts_at`, and other date fields are returned in **IST (UTC+5:30)**.

---

## Curl Quick Reference

```bash
BASE="http://localhost:3002/api/prodesk"

# Login
TOKEN=$(curl -s -X POST "$BASE/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"priya.therapist@neure.com","password":"Test@1234"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['accessToken'])")

# Any protected API
curl -s -X POST "$BASE/getProfile" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```
