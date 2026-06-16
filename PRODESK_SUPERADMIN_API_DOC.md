# ProDesk — Superadmin API Integration Document

All endpoints are under `/api/prodesk-admin/`.
**All methods: POST.**
**Auth:** Bearer token with superadmin role (role_id = 1 or 2).

---

## PAGE 1 — Business Overview

### 1.1 Get Overview Stats
**Endpoint:** `POST /api/prodesk-admin/get-overview`

**Payload:**
```json
{}
```

**Response:**
```json
{
  "status": true,
  "code": 200,
  "message": "Overview fetched",
  "data": {
    "active_users": 142,
    "discontinued_users": 18,
    "total_paid_users": 98,
    "total_free_users": 44,
    "revenue": {
      "weekly": 15960,
      "monthly": 63840,
      "quarterly": 191520,
      "annual": 766080
    },
    "total_sessions": 3840,
    "total_clients": 1260,
    "total_invoice_amount": 4820000
  }
}
```

---

### 1.2 Get Revenue by Custom Date Range
**Endpoint:** `POST /api/prodesk-admin/get-revenue`

**Payload:**
```json
{
  "start_date": "2026-01-01",
  "end_date": "2026-06-30"
}
```

**Response:**
```json
{
  "status": true,
  "code": 200,
  "message": "Revenue fetched",
  "data": {
    "total_revenue": 382040,
    "breakdown": [
      { "month": "2026-01", "revenue": 63840 },
      { "month": "2026-02", "revenue": 57120 }
    ]
  }
}
```

---

### 1.3 Get Active Users List
**Endpoint:** `POST /api/prodesk-admin/get-active-users`

**Payload:**
```json
{
  "page": 1,
  "limit": 20,
  "search": "",
  "plan_type": ""
}
```
> `plan_type` filter: `"starter"` | `"professional"` | `"clinic"` | `""` (all)

**Response:**
```json
{
  "status": true,
  "code": 200,
  "message": "Active users fetched",
  "data": [
    {
      "therapist_id": 12,
      "user_id": 45,
      "name": "Dr. Priya Sharma",
      "email": "priya@example.com",
      "phone": "9876543210",
      "plan_name": "Professional",
      "plan_type": "professional",
      "access_type": "early_access",
      "billing_cycle": "monthly",
      "activation_date": "2026-05-10",
      "period_end": "2026-07-10",
      "status": "active"
    }
  ],
  "meta": { "total": 142, "page": 1, "limit": 20 }
}
```

---

### 1.4 Get Discontinued Users List
**Endpoint:** `POST /api/prodesk-admin/get-discontinued-users`

**Payload:**
```json
{
  "page": 1,
  "limit": 20,
  "search": ""
}
```

**Response:**
```json
{
  "status": true,
  "code": 200,
  "message": "Discontinued users fetched",
  "data": [
    {
      "therapist_id": 7,
      "name": "Dr. Anil Mehta",
      "email": "anil@example.com",
      "phone": "9123456789",
      "plan_name": "Professional",
      "plan_type": "professional",
      "activation_date": "2026-03-01",
      "cancelled_on": "2026-06-01",
      "status": "cancelled"
    }
  ],
  "meta": { "total": 18, "page": 1, "limit": 20 }
}
```

---

## PAGE 2 — Therapist Details

### 2.1 Get All ProDesk Therapists
**Endpoint:** `POST /api/prodesk-admin/get-therapists`

> Clones existing `/api/user/getProdeskTherapists` but adds plan info and plan_type filter.

**Payload:**
```json
{
  "page": 1,
  "limit": 20,
  "search": "",
  "plan_type": "",
  "subscription_status": ""
}
```
> `plan_type`: `"starter"` | `"professional"` | `"clinic"` | `""` (all)
> `subscription_status`: `"active"` | `"expired"` | `"cancelled"` | `"pending_payment"` | `""` (all)

**Response:**
```json
{
  "status": true,
  "code": 200,
  "message": "Therapists fetched",
  "data": [
    {
      "therapist_id": 12,
      "user_id": 45,
      "name": "Dr. Priya Sharma",
      "email": "priya@example.com",
      "phone": "9876543210",
      "profile_url": "https://...",
      "booking_slug": "dr-priya-sharma-45",
      "is_active": 1,
      "created_at": "2026-05-10T00:00:00.000Z",
      "subscription": {
        "plan_name": "Professional",
        "plan_type": "professional",
        "access_type": "early_access",
        "billing_cycle": "monthly",
        "status": "active",
        "period_end": "2026-07-10"
      }
    }
  ],
  "meta": { "total": 142, "page": 1, "limit": 20 }
}
```

---

### 2.2 Get Therapist By ID
**Endpoint:** `POST /api/prodesk-admin/get-therapist-by-id`

**Payload:**
```json
{ "therapist_id": 12 }
```

**Response:**
```json
{
  "status": true,
  "code": 200,
  "message": "Therapist fetched",
  "data": {
    "therapist_id": 12,
    "user_id": 45,
    "name": "Dr. Priya Sharma",
    "email": "priya@example.com",
    "phone": "9876543210",
    "profile_url": "https://...",
    "is_active": 1,
    "created_at": "2026-05-10T00:00:00.000Z",
    "booking_slug": "dr-priya-sharma-45",
    "about_me": "Clinical psychologist with 8 years experience",
    "experience_years": 8,
    "qualification": "M.Phil Clinical Psychology",
    "registration_number": "RCI/123456",
    "referral_code": "DR-PRIY-X7K2",
    "subscription": {
      "subscription_id": 45,
      "plan_name": "Professional",
      "plan_type": "professional",
      "access_type": "early_access",
      "billing_cycle": "monthly",
      "status": "active",
      "amount_paid": 799.00,
      "period_start": "2026-06-10",
      "period_end": "2026-07-10",
      "offer_code": "EARLY30"
    },
    "branding": {
      "brand_name": "Mind Matters",
      "theme": "dark",
      "accent": "sage",
      "logo_url": "https://..."
    },
    "availability": {
      "days": ["Mon","Tue","Wed","Thu","Fri"],
      "from_time": "09:00",
      "to_time": "17:00",
      "slot_minutes": 60
    },
    "stats": {
      "total_clients": 18,
      "total_sessions": 94,
      "total_invoices": 12,
      "total_invoice_amount": 142000.00
    },
    "wallet": {
      "balance": 0,
      "pending_balance": 79.90,
      "total_earned": 319.60,
      "total_paid": 239.70
    }
  }
}
```

---

## PAGE 3 — Resources
> Already implemented. No new APIs required.

---

## PAGE 4 — Feedback

### 4.1 Get All ProDesk Feedback
**Endpoint:** `POST /api/prodesk-admin/get-feedback`

**Payload:**
```json
{
  "page": 1,
  "limit": 20,
  "search": "",
  "status": "",
  "start_date": "",
  "end_date": ""
}
```
> `status`: `"new"` | `"reviewed"` | `"resolved"` | `""` (all)

**Response:**
```json
{
  "status": true,
  "code": 200,
  "message": "Feedback fetched",
  "data": [
    {
      "id": 3,
      "therapist_id": 12,
      "therapist_name": "Dr. Priya Sharma",
      "therapist_email": "priya@example.com",
      "subject": "Feature request: recurring sessions",
      "message": "It would be great if we could set up recurring sessions...",
      "rating": 4,
      "status": "new",
      "admin_notes": null,
      "created_at": "2026-06-10T08:30:00.000Z"
    }
  ],
  "meta": { "total": 27, "page": 1, "limit": 20 }
}
```

---

### 4.2 Update Feedback Status
**Endpoint:** `POST /api/prodesk-admin/update-feedback-status`

**Payload:**
```json
{
  "feedback_id": 3,
  "status": "reviewed",
  "admin_notes": "Logged as feature request for next sprint"
}
```

**Response:**
```json
{
  "status": true,
  "code": 200,
  "message": "Feedback status updated",
  "data": null
}
```

---

## PAGE 5 — FAQ
> Uses existing `/api/qna/*` routes (create, update, delete, list). No new endpoints needed for ProDesk FAQ — same table, same APIs.

---

## PAGE 6 — Accounts Deactivated

### 6.1 Get Deactivated / Discontinued Accounts
**Endpoint:** `POST /api/prodesk-admin/get-deactivated-accounts`

**Payload:**
```json
{
  "page": 1,
  "limit": 20,
  "search": ""
}
```

**Response:**
```json
{
  "status": true,
  "code": 200,
  "message": "Deactivated accounts fetched",
  "data": [
    {
      "therapist_id": 7,
      "name": "Dr. Anil Mehta",
      "email": "anil@example.com",
      "phone": "9123456789",
      "plan_name": "Professional",
      "billing_cycle": "monthly",
      "amount_paid": 799.00,
      "activation_date": "2026-03-01",
      "deactivated_on": "2026-06-01",
      "status": "cancelled"
    }
  ],
  "meta": { "total": 18, "page": 1, "limit": 20 }
}
```

---

## PAGE 7 — Codes & Promotions

### 7.1 Get Offer Tags
**Endpoint:** `POST /api/prodesk-admin/get-offer-tags`

**Payload:**
```json
{}
```

**Response:**
```json
{
  "status": true,
  "code": 200,
  "message": "Tags fetched",
  "data": [
    { "id": 1, "name": "early_access", "description": "Email-whitelisted early access pricing unlock" },
    { "id": 2, "name": "promotional",  "description": "Open promotional discount" },
    { "id": 3, "name": "event",        "description": "Time-limited event-based promo" }
  ]
}
```

---

### 7.2 Create Offer Tag
**Endpoint:** `POST /api/prodesk-admin/create-offer-tag`

**Payload:**
```json
{
  "name": "loyalty",
  "description": "Loyalty reward for returning users"
}
```

**Response:**
```json
{
  "status": true,
  "code": 201,
  "message": "Tag created",
  "data": { "tag_id": 4 }
}
```

---

### 7.3 Create Offer
**Endpoint:** `POST /api/prodesk-admin/create-offer`

**Payload:**
```json
{
  "code": "EARLY30",
  "name": "Early Bird Access",
  "description": "Special early access pricing for invited users",
  "tag_id": 1,
  "is_percent": 0,
  "percent_discount": null,
  "is_email_restricted": 1,
  "valid_from": "2026-06-01 00:00:00",
  "valid_till": "2026-12-31 23:59:59",
  "max_uses_per_email": 1,
  "total_max_uses": null
}
```
> For promotional % offer: `"is_percent": 1, "percent_discount": 10, "is_email_restricted": 0`
> `total_max_uses: null` = unlimited within whitelist

**Response:**
```json
{
  "status": true,
  "code": 201,
  "message": "Offer created",
  "data": { "offer_id": 1 }
}
```

---

### 7.4 Upload Offer Emails via CSV
**Endpoint:** `POST /api/prodesk-admin/upload-offer-emails`

**Payload:** `multipart/form-data`
```
offer_id: 1
file: <CSV file>
```

**CSV Format** (see `assets/sample_offer_emails.csv`):
```
email
varun@gmail.com
yash@gmail.com
abc@gmail.com
```

**Response:**
```json
{
  "status": true,
  "code": 200,
  "message": "Emails uploaded",
  "data": {
    "inserted": 3,
    "skipped_duplicates": 0,
    "invalid_emails": []
  }
}
```

---

### 7.5 Download Sample CSV Template
**Endpoint:** `POST /api/prodesk-admin/get-sample-csv`

**Payload:**
```json
{}
```

**Response:** Returns CSV file download with headers:
```
Content-Type: text/csv
Content-Disposition: attachment; filename="offer_emails_sample.csv"
```

---

### 7.6 Get All Offers
**Endpoint:** `POST /api/prodesk-admin/get-offers`

**Payload:**
```json
{
  "page": 1,
  "limit": 20,
  "search": "",
  "tag_id": null,
  "is_active": null
}
```

**Response:**
```json
{
  "status": true,
  "code": 200,
  "message": "Offers fetched",
  "data": [
    {
      "id": 1,
      "code": "EARLY30",
      "name": "Early Bird Access",
      "tag_name": "early_access",
      "is_percent": 0,
      "percent_discount": null,
      "is_email_restricted": 1,
      "valid_from": "2026-06-01T00:00:00.000Z",
      "valid_till": "2026-12-31T23:59:59.000Z",
      "total_used": 12,
      "total_emails_whitelisted": 50,
      "is_active": 1,
      "created_at": "2026-06-01T00:00:00.000Z"
    }
  ],
  "meta": { "total": 5, "page": 1, "limit": 20 }
}
```

---

### 7.7 Get Offer Detail
**Endpoint:** `POST /api/prodesk-admin/get-offer-detail`

**Payload:**
```json
{ "offer_id": 1 }
```

**Response:**
```json
{
  "status": true,
  "code": 200,
  "message": "Offer detail fetched",
  "data": {
    "id": 1,
    "code": "EARLY30",
    "name": "Early Bird Access",
    "tag_name": "early_access",
    "is_percent": 0,
    "percent_discount": null,
    "is_email_restricted": 1,
    "valid_from": "2026-06-01T00:00:00.000Z",
    "valid_till": "2026-12-31T23:59:59.000Z",
    "total_used": 12,
    "is_active": 1,
    "emails": [
      { "email": "varun@gmail.com", "is_used": 1, "used_at": "2026-06-10T09:00:00.000Z", "used_by_therapist_id": 12 },
      { "email": "yash@gmail.com",  "is_used": 0, "used_at": null, "used_by_therapist_id": null }
    ]
  }
}
```

---

### 7.8 Update Offer
**Endpoint:** `POST /api/prodesk-admin/update-offer`

**Payload:**
```json
{
  "offer_id": 1,
  "name": "Early Bird Access — Extended",
  "valid_till": "2027-03-31 23:59:59",
  "is_active": 1
}
```

**Response:**
```json
{
  "status": true,
  "code": 200,
  "message": "Offer updated",
  "data": null
}
```

---

## PAGE 8 — Referral Program

### 8.1 Get All Referrals Overview
**Endpoint:** `POST /api/prodesk-admin/get-referrals`

**Payload:**
```json
{
  "page": 1,
  "limit": 20,
  "search": ""
}
```

**Response:**
```json
{
  "status": true,
  "code": 200,
  "message": "Referrals fetched",
  "data": [
    {
      "therapist_id": 12,
      "name": "Dr. Priya Sharma",
      "email": "priya@example.com",
      "referral_code": "DR-PRIY-X7K2",
      "referred_count": 4,
      "total_earned": 319.60,
      "pending_balance": 79.90,
      "total_paid": 239.70,
      "last_disbursement_date": "2026-06-05",
      "last_disbursement_status": "paid"
    }
  ],
  "meta": { "total": 34, "page": 1, "limit": 20 }
}
```

---

### 8.2 Get Referral Detail for a Therapist
**Endpoint:** `POST /api/prodesk-admin/get-referral-detail`

**Payload:**
```json
{ "therapist_id": 12 }
```

**Response:**
```json
{
  "status": true,
  "code": 200,
  "message": "Referral detail fetched",
  "data": {
    "therapist_id": 12,
    "name": "Dr. Priya Sharma",
    "referral_code": "DR-PRIY-X7K2",
    "wallet": {
      "balance": 0,
      "pending_balance": 79.90,
      "total_earned": 319.60,
      "total_paid": 239.70
    },
    "referrals": [
      {
        "referred_name": "Dr. Anil Mehta",
        "referred_email": "anil@example.com",
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
        "paid_on": "2026-05-05",
        "bank_transfer_ref": "UTR123456"
      }
    ],
    "ledger": [
      {
        "type": "credit",
        "amount": 79.90,
        "description": "Referral reward — Dr. Anil Mehta signup",
        "balance_after": 79.90,
        "created_at": "2026-05-15T10:00:00.000Z"
      },
      {
        "type": "debit",
        "amount": 79.90,
        "description": "Payout — May 2026",
        "balance_after": 0,
        "created_at": "2026-05-05T00:00:00.000Z"
      }
    ]
  }
}
```

---

### 8.3 Get Pending Payouts
**Endpoint:** `POST /api/prodesk-admin/get-pending-payouts`

**Payload:**
```json
{}
```

**Response:**
```json
{
  "status": true,
  "code": 200,
  "message": "Pending payouts fetched",
  "data": [
    {
      "therapist_id": 12,
      "name": "Dr. Priya Sharma",
      "email": "priya@example.com",
      "pending_balance": 79.90,
      "bank_account": "****4321"
    }
  ],
  "meta": { "total": 7 }
}
```

---

### 8.4 Process Payout
**Endpoint:** `POST /api/prodesk-admin/process-payout`

**Payload:**
```json
{
  "therapist_ids": [12, 15, 23],
  "payout_month": "2026-06-01",
  "bank_transfer_refs": {
    "12": "UTR789012",
    "15": "UTR789013",
    "23": "UTR789014"
  }
}
```

**Response:**
```json
{
  "status": true,
  "code": 200,
  "message": "Payouts processed",
  "data": {
    "processed": 3,
    "total_disbursed": 239.70,
    "payout_month": "2026-06-01"
  }
}
```

---

## PAGE 9 — Session Details

### 9.1 Get All Sessions Across All Therapists
**Endpoint:** `POST /api/prodesk-admin/get-sessions`

**Payload:**
```json
{
  "page": 1,
  "limit": 20,
  "therapist_id": null,
  "start_date": "",
  "end_date": "",
  "status": ""
}
```
> `status`: `"scheduled"` | `"completed"` | `"cancelled"` | `"no_show"` | `""` (all)

**Response:**
```json
{
  "status": true,
  "code": 200,
  "message": "Sessions fetched",
  "data": [
    {
      "session_id": 101,
      "therapist_id": 12,
      "therapist_name": "Dr. Priya Sharma",
      "client_name": "Rahul Verma",
      "session_number": 5,
      "starts_at": "2026-06-16T10:00:00.000Z",
      "duration_min": 60,
      "modality": "video",
      "status": "completed",
      "fee": 1500.00,
      "has_note": true,
      "note_preview": "Session focused on cognitive restructuring..."
    }
  ],
  "meta": { "total": 3840, "page": 1, "limit": 20 }
}
```

---

## PAGE 10 — Subscriptions Management

### 10.1 Get All Subscriptions
**Endpoint:** `POST /api/prodesk-admin/get-subscriptions`

**Payload:**
```json
{
  "page": 1,
  "limit": 20,
  "search": "",
  "plan_type": "",
  "status": "",
  "billing_cycle": ""
}
```

**Response:**
```json
{
  "status": true,
  "code": 200,
  "message": "Subscriptions fetched",
  "data": [
    {
      "subscription_id": 45,
      "therapist_id": 12,
      "therapist_name": "Dr. Priya Sharma",
      "email": "priya@example.com",
      "plan_name": "Professional",
      "plan_type": "professional",
      "access_type": "early_access",
      "billing_cycle": "monthly",
      "status": "active",
      "amount_paid": 799.00,
      "period_start": "2026-06-10",
      "period_end": "2026-07-10",
      "offer_code": "EARLY30",
      "created_at": "2026-06-10T00:00:00.000Z"
    }
  ],
  "meta": { "total": 142, "page": 1, "limit": 20 }
}
```

---

## Auth Notes

- All endpoints require `Authorization: Bearer <superadmin_token>`
- Superadmin roles: `role_id = 1` or `role_id = 2`
- Token obtained via existing `/api/user/login` with superadmin credentials
- Therapist tokens (role_id = 4) are rejected on all `/prodesk-admin/` routes

---

## Error Responses (standard across all endpoints)

```json
{ "status": false, "code": 400, "message": "Field X is required", "data": null }
{ "status": false, "code": 401, "message": "Access Denied! Token not provided", "data": null }
{ "status": false, "code": 403, "message": "Access Denied! Superadmin role required", "data": null }
{ "status": false, "code": 404, "message": "Resource not found", "data": null }
{ "status": false, "code": 500, "message": "Internal server error", "data": null }
```
