# ProDesk — Therapist API Integration Document

All endpoints are under `/api/prodesk/`.
**All methods: POST.**
**Auth:** Bearer token with therapist role (role_id = 4), except auth endpoints listed below.

---

## FEATURE: Auth / Signup (3-Step Flow)

### Step 1 — Register (Basic Details)
**Endpoint:** `POST /api/prodesk/register`
**Auth:** None

**Payload:**
```json
{
  "first_name": "Priya",
  "last_name": "Sharma",
  "email": "priya@example.com",
  "phone": "9876543210",
  "password": "SecurePass123",
  "referral_code": "DR-JANE-X7K2"
}
```
> `referral_code` is optional. Must be entered at signup — cannot be added later.

**Response:**
```json
{
  "status": true,
  "code": 201,
  "message": "Account created. Please verify your email with the OTP sent.",
  "data": { "email": "priya@example.com" }
}
```

---

### Step 1b — Verify Email OTP
**Endpoint:** `POST /api/prodesk/verifyEmail`
**Auth:** None

**Payload:**
```json
{
  "email": "priya@example.com",
  "otp": "483921"
}
```

**Response:**
```json
{
  "status": true,
  "code": 200,
  "message": "Email verified",
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ...",
    "therapist_id": 12
  }
}
```

---

### Step 1c — Resend OTP
**Endpoint:** `POST /api/prodesk/resendOtp`
**Auth:** None

**Payload:**
```json
{ "email": "priya@example.com" }
```

**Response:**
```json
{ "status": true, "code": 200, "message": "OTP resent", "data": null }
```

---

### Step 2a — Validate Offer Code
**Endpoint:** `POST /api/prodesk/subscription/validate-offer`
**Auth:** Bearer (therapist)

**Payload:**
```json
{ "code": "EARLY30" }
```

**Response (valid — email-restricted early access):**
```json
{
  "status": true,
  "code": 200,
  "message": "Offer applied",
  "data": {
    "offer_id": 1,
    "offer_code": "EARLY30",
    "offer_name": "Early Bird Access",
    "tag_name": "early_access",
    "is_percent": 0,
    "percent_discount": null,
    "pricing_type": "early_access"
  }
}
```

**Response (valid — promotional % discount):**
```json
{
  "status": true,
  "code": 200,
  "message": "Offer applied",
  "data": {
    "offer_id": 2,
    "offer_code": "PSY10",
    "offer_name": "World Psychologists Day",
    "tag_name": "promotional",
    "is_percent": 1,
    "percent_discount": 10.00,
    "pricing_type": "full_version"
  }
}
```

**Response (not in whitelist):**
```json
{ "status": false, "code": 400, "message": "Not valid for your email ID", "data": null }
```

**Response (already used):**
```json
{ "status": false, "code": 400, "message": "This code has already been used for your email", "data": null }
```

---

### Step 2b — Activate Free (Starter) Plan
**Endpoint:** `POST /api/prodesk/subscription/activate-free`
**Auth:** Bearer (therapist)

**Payload:**
```json
{
  "offer_id": null
}
```
> `offer_id`: pass if a valid offer was entered (even for free plan the offer logs it)

**Response:**
```json
{
  "status": true,
  "code": 200,
  "message": "Starter plan activated",
  "data": {
    "subscription_id": 45,
    "plan_name": "Starter",
    "status": "active",
    "next_step": "profile_setup"
  }
}
```

---

### Step 2c — Create Razorpay Order (Paid Plans)
**Endpoint:** `POST /api/prodesk/subscription/create-order`
**Auth:** Bearer (therapist)

**Payload:**
```json
{
  "plan_id": 2,
  "billing_cycle": "monthly",
  "offer_id": 1
}
```
> `offer_id` optional. `plan_id` refers to `prodesk_plans.id`

**Response:**
```json
{
  "status": true,
  "code": 200,
  "message": "Order created",
  "data": {
    "subscription_id": 45,
    "razorpay_order_id": "order_NMzXABC123",
    "razorpay_key_id": "rzp_live_XXXXXX",
    "amount": 79900,
    "currency": "INR",
    "amount_display": "₹799"
  }
}
```
> `amount` is in paise. Frontend uses this to open Razorpay checkout.

---

### Step 2d — Confirm Payment
**Endpoint:** `POST /api/prodesk/subscription/confirm-payment`
**Auth:** Bearer (therapist)

**Payload:**
```json
{
  "subscription_id": 45,
  "razorpay_order_id": "order_NMzXABC123",
  "razorpay_payment_id": "pay_NMzXDEF456",
  "razorpay_signature": "abc123def456..."
}
```

**Response:**
```json
{
  "status": true,
  "code": 200,
  "message": "Payment confirmed. Subscription activated.",
  "data": {
    "subscription_id": 45,
    "plan_name": "Professional",
    "billing_cycle": "monthly",
    "status": "active",
    "period_start": "2026-06-16",
    "period_end": "2026-07-16",
    "next_step": "profile_setup"
  }
}
```

---

### Step 3 — Login (existing)
**Endpoint:** `POST /api/prodesk/login`
**Auth:** None

**Payload:**
```json
{
  "email": "priya@example.com",
  "password": "SecurePass123"
}
```

**Response:**
```json
{
  "status": true,
  "code": 200,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ...",
    "therapist_id": 12,
    "email": "priya@example.com",
    "booking_slug": "dr-priya-sharma-12"
  }
}
```

---

### Forgot Password Flow (existing)
**Endpoint:** `POST /api/prodesk/forgotPassword`
**Endpoint:** `POST /api/prodesk/verifyForgotOtp`
**Endpoint:** `POST /api/prodesk/resetPassword`

> These already exist. No changes needed.

---

## FEATURE: Subscription Management

### Get Current Subscription
**Endpoint:** `POST /api/prodesk/subscription/get`
**Auth:** Bearer (therapist)

**Payload:**
```json
{}
```

**Response:**
```json
{
  "status": true,
  "code": 200,
  "message": "Subscription fetched",
  "data": {
    "subscription_id": 45,
    "plan_name": "Professional",
    "plan_type": "professional",
    "access_type": "early_access",
    "billing_cycle": "monthly",
    "status": "active",
    "price_inr": 799.00,
    "client_limit": null,
    "period_start": "2026-06-16",
    "period_end": "2026-07-16",
    "days_remaining": 30,
    "offer_code": "EARLY30"
  }
}
```

---

### Renew Subscription
**Endpoint:** `POST /api/prodesk/subscription/renew`
**Auth:** Bearer (therapist)

**Payload:**
```json
{}
```

**Response:**
```json
{
  "status": true,
  "code": 200,
  "message": "Renewal order created",
  "data": {
    "subscription_id": 45,
    "razorpay_order_id": "order_RenewXYZ",
    "razorpay_key_id": "rzp_live_XXXXXX",
    "amount": 79900,
    "currency": "INR"
  }
}
```

---

### Confirm Renewal Payment
**Endpoint:** `POST /api/prodesk/subscription/confirm-renewal`
**Auth:** Bearer (therapist)

**Payload:**
```json
{
  "subscription_id": 45,
  "razorpay_order_id": "order_RenewXYZ",
  "razorpay_payment_id": "pay_RenewABC",
  "razorpay_signature": "xyz789..."
}
```

**Response:**
```json
{
  "status": true,
  "code": 200,
  "message": "Subscription renewed",
  "data": {
    "subscription_id": 45,
    "status": "active",
    "period_end": "2026-08-16"
  }
}
```

---

## FEATURE: Referral Program

### Get Referral Dashboard
**Endpoint:** `POST /api/prodesk/referral/get`
**Auth:** Bearer (therapist)

**Payload:**
```json
{}
```

**Response:**
```json
{
  "status": true,
  "code": 200,
  "message": "Referral data fetched",
  "data": {
    "referral_code": "DR-PRIY-X7K2",
    "is_eligible": true,
    "wallet": {
      "balance": 0,
      "pending_balance": 79.90,
      "total_earned": 319.60,
      "total_paid": 239.70
    },
    "referred_count": 4,
    "rules": [
      "Every ProDesk user gets a unique referral code inside their dashboard.",
      "Share your referral code with fellow psychologists, therapists, clinics, or professionals.",
      "When someone joins ProDesk using your referral code and subscribes successfully, you earn 10% of their subscription amount.",
      "Referral rewards are counted only on the first subscription payment made by the referred user.",
      "Monthly renewals of referred users are not eligible for additional referral rewards.",
      "Referral payouts are transferred to your registered bank account on the 5th of every month.",
      "You can track your referrals, earnings, and payout history directly inside your dashboard.",
      "The referral code must be entered during signup. It cannot be added or changed after the account is created.",
      "Only genuine referrals are eligible. Self-referrals or fake accounts will lead to account restriction.",
      "Referral Program is only active for Professional or Clinic plan subscribers."
    ]
  }
}
```
> `is_eligible: false` if therapist is on Starter (free) plan.

---

### Get Referral History
**Endpoint:** `POST /api/prodesk/referral/get-history`
**Auth:** Bearer (therapist)

**Payload:**
```json
{ "page": 1, "limit": 20 }
```

**Response:**
```json
{
  "status": true,
  "code": 200,
  "message": "Referral history fetched",
  "data": {
    "referrals": [
      {
        "referred_name": "Dr. Anil Mehta",
        "status": "rewarded",
        "reward_amount": 79.90,
        "converted_at": "2026-05-15T10:00:00.000Z"
      }
    ],
    "payouts": [
      {
        "amount": 79.90,
        "status": "paid",
        "payout_month": "2026-05-01",
        "paid_on": "2026-05-05"
      }
    ],
    "ledger": [
      {
        "type": "credit",
        "amount": 79.90,
        "description": "Referral reward — Dr. Anil Mehta signup",
        "balance_after": 79.90,
        "created_at": "2026-05-15T10:00:00.000Z"
      }
    ]
  },
  "meta": { "total_referrals": 4, "page": 1, "limit": 20 }
}
```

---

## FEATURE: Feedback

### Submit Feedback
**Endpoint:** `POST /api/prodesk/feedback/submit`
**Auth:** Bearer (therapist)

**Payload:**
```json
{
  "subject": "Feature request: recurring sessions",
  "message": "It would be great if we could set up recurring weekly sessions automatically.",
  "rating": 4
}
```
> `rating` is optional (1–5). `subject` and `message` are required.

**Response:**
```json
{
  "status": true,
  "code": 201,
  "message": "Feedback submitted. Thank you!",
  "data": { "feedback_id": 7 }
}
```

---

## FEATURE: Plans (for Plan Selection UI)

### Get All Plans
**Endpoint:** `POST /api/prodesk/plans/get`
**Auth:** Bearer (therapist)

**Payload:**
```json
{}
```

**Response:**
```json
{
  "status": true,
  "code": 200,
  "message": "Plans fetched",
  "data": {
    "early_access": [
      { "id": 1, "name": "Starter",      "plan_type": "starter",       "billing_cycle": "monthly", "price_inr": 0,      "client_limit": 2,    "per_unit_price": null },
      { "id": 2, "name": "Professional", "plan_type": "professional",  "billing_cycle": "monthly", "price_inr": 799,    "client_limit": null, "per_unit_price": null },
      { "id": 3, "name": "Professional", "plan_type": "professional",  "billing_cycle": "annual",  "price_inr": 7670,   "client_limit": null, "per_unit_price": null },
      { "id": 4, "name": "Clinic",       "plan_type": "clinic",        "billing_cycle": "monthly", "price_inr": 9999,   "client_limit": null, "per_unit_price": 799 }
    ],
    "full_version": [
      { "id": 5, "name": "Starter",      "plan_type": "starter",       "billing_cycle": "monthly", "price_inr": 0,      "client_limit": 2,    "per_unit_price": null },
      { "id": 6, "name": "Professional", "plan_type": "professional",  "billing_cycle": "monthly", "price_inr": 1299,   "client_limit": null, "per_unit_price": null },
      { "id": 7, "name": "Professional", "plan_type": "professional",  "billing_cycle": "annual",  "price_inr": 12470,  "client_limit": null, "per_unit_price": null },
      { "id": 8, "name": "Clinic",       "plan_type": "clinic",        "billing_cycle": "monthly", "price_inr": 9999,   "client_limit": null, "per_unit_price": 1299 }
    ]
  }
}
```

---

## EXISTING ENDPOINTS (already implemented — no changes)

| Feature | Endpoint |
|---------|----------|
| Refresh Token | `POST /api/prodesk/refreshToken` |
| Logout | `POST /api/prodesk/logout` |
| Profile — Get | `POST /api/prodesk/profile/get` |
| Profile — Update | `POST /api/prodesk/profile/update` |
| Availability — Get/Set | `POST /api/prodesk/availability/get` + `/set` |
| Clients — CRUD | `POST /api/prodesk/clients/*` |
| Sessions — CRUD | `POST /api/prodesk/sessions/*` |
| Notes — CRUD | `POST /api/prodesk/notes/*` |
| Billing (client invoices) | `POST /api/prodesk/billing/*` |
| Resources | `POST /api/prodesk/resources/*` |
| Team | `POST /api/prodesk/team/*` |
| Google Meet | `POST /api/prodesk/google/*` |
| Public Booking | `POST /api/prodesk/booking/*` |
| Dashboard Metrics | `POST /api/prodesk/dashboard/*` |
| Razorpay Webhook | `POST /api/prodesk/razorpayWebhook` |

---

## Error Responses (standard)

```json
{ "status": false, "code": 400, "message": "Field X is required", "data": null }
{ "status": false, "code": 401, "message": "Access Denied! Token not provided", "data": null }
{ "status": false, "code": 403, "message": "Invalid token!", "data": null }
{ "status": false, "code": 404, "message": "Resource not found", "data": null }
{ "status": false, "code": 409, "message": "Conflict — e.g. email already exists", "data": null }
{ "status": false, "code": 500, "message": "Internal server error", "data": null }
```
