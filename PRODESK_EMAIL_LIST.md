# ProDesk — Email Notifications List

All transactional emails sent by the ProDesk system.
Template files live in `api/templates/`.

---

## 1. Auth / Verification

| # | Trigger | Template Name | Recipient | Subject |
|---|---------|--------------|-----------|---------|
| 1 | Therapist completes Step 1 signup | `prodesk_verify_email_otp` | Therapist | Verify your ProDesk account |
| 2 | Therapist requests OTP resend | `prodesk_verify_email_otp` | Therapist | Your new ProDesk verification code |
| 3 | Therapist requests forgot password | `prodesk_forgot_password_otp` | Therapist | Reset your ProDesk password |

---

## 2. Subscription

| # | Trigger | Template Name | Recipient | Subject |
|---|---------|--------------|-----------|---------|
| 4 | Starter (free) plan activated | `prodesk_starter_activated` | Therapist | Welcome to ProDesk — Your free plan is active |
| 5 | Paid plan payment confirmed (new signup) | `prodesk_subscription_activated` | Therapist | Your ProDesk Professional plan is active |
| 6 | Renewal payment confirmed | `prodesk_subscription_renewed` | Therapist | Your ProDesk subscription has been renewed |
| 7 | Subscription renewal reminder — 5 days before expiry | `prodesk_renewal_reminder_5d` | Therapist | Your ProDesk plan expires in 5 days |
| 8 | Subscription renewal reminder — 1 day before expiry | `prodesk_renewal_reminder_1d` | Therapist | Your ProDesk plan expires tomorrow |
| 9 | Subscription expired (no renewal) | `prodesk_subscription_expired` | Therapist | Your ProDesk subscription has expired |

> **Note:** Emails 7, 8, 9 are triggered by cron job `prodeskSubscriptionRenewal.js` — **cron is created but NOT activated**.

---

## 3. Offer / Promo Code

| # | Trigger | Template Name | Recipient | Subject |
|---|---------|--------------|-----------|---------|
| 10 | Payment confirmed with offer code applied | `prodesk_offer_redeemed` | Therapist | Your offer code "EARLY30" has been applied |

---

## 4. Referral Program

| # | Trigger | Template Name | Recipient | Subject |
|---|---------|--------------|-----------|---------|
| 11 | Referred therapist makes first subscription payment | `prodesk_referral_reward_credited` | Referrer (therapist) | You earned ₹X — referral reward credited to your wallet |
| 12 | Monthly payout processed (5th of month) | `prodesk_referral_payout_processed` | Therapist | Your ProDesk referral payout of ₹X has been processed |

---

## 5. Feedback

| # | Trigger | Template Name | Recipient | Subject |
|---|---------|--------------|-----------|---------|
| 13 | Therapist submits feedback from ProDesk dashboard | `prodesk_feedback_received_admin` | Admin (internal) | New ProDesk feedback from [Therapist Name] |

---

## Email Variables Reference

### `prodesk_verify_email_otp`
```
{{ therapist_name }}
{{ otp }}
{{ expiry_minutes }}   — 10 minutes
```

### `prodesk_forgot_password_otp`
```
{{ therapist_name }}
{{ otp }}
{{ expiry_minutes }}
```

### `prodesk_starter_activated`
```
{{ therapist_name }}
{{ plan_name }}        — "Starter"
{{ dashboard_url }}
```

### `prodesk_subscription_activated`
```
{{ therapist_name }}
{{ plan_name }}        — "Professional"
{{ billing_cycle }}    — "Monthly" / "Annual"
{{ amount_paid }}      — e.g. ₹799
{{ period_end }}       — e.g. 16 July 2026
{{ dashboard_url }}
```

### `prodesk_subscription_renewed`
```
{{ therapist_name }}
{{ plan_name }}
{{ billing_cycle }}
{{ amount_paid }}
{{ period_end }}
{{ dashboard_url }}
```

### `prodesk_renewal_reminder_5d` / `prodesk_renewal_reminder_1d`
```
{{ therapist_name }}
{{ plan_name }}
{{ expiry_date }}
{{ renew_url }}
```

### `prodesk_subscription_expired`
```
{{ therapist_name }}
{{ plan_name }}
{{ expired_on }}
{{ renew_url }}
```

### `prodesk_offer_redeemed`
```
{{ therapist_name }}
{{ offer_code }}
{{ offer_description }}
{{ plan_name }}
{{ final_amount }}
```

### `prodesk_referral_reward_credited`
```
{{ referrer_name }}
{{ referred_name }}
{{ reward_amount }}    — e.g. ₹79.90
{{ wallet_balance }}
{{ dashboard_url }}
```

### `prodesk_referral_payout_processed`
```
{{ therapist_name }}
{{ payout_amount }}
{{ payout_month }}     — e.g. June 2026
{{ bank_ref }}
```

### `prodesk_feedback_received_admin`
```
{{ therapist_name }}
{{ therapist_email }}
{{ subject }}
{{ message }}
{{ rating }}
{{ submitted_at }}
{{ admin_dashboard_url }}
```

---

## 6. Sessions

| # | Trigger | Template Name | Recipient | Subject |
|---|---------|--------------|-----------|---------|
| 14 | Session rescheduled by therapist | `prodesk_session_rescheduled` | Client | Your session with Dr. X has been rescheduled |
| 15 | Session cancelled by therapist | `prodesk_session_cancelled` | Client | Your session has been cancelled |

---

## Total Emails: 15
- **Active (triggered by app events):** 1–6, 10–13
- **Inactive (cron-based, not activated):** 7, 8, 9
