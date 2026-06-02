# Neure API Documentation

## Base URL
```
http://<server>:3000/api
```
All protected routes require:
```
Authorization: Bearer <accessToken>
```
Standard response envelope:
```json
{ "status": true|false, "code": 200, "message": "...", "data": {...} }
```

---

## User Types & Role Hierarchy

### Roles Table

| role_id | Role Name | Dashboard | Description |
|---------|-----------|-----------|-------------|
| 1 | Superadmin | `neure_superadmin_dashboard` | Neure internal team. Full platform access. No company affiliation. |
| 2 | Company Admin | `Neure_dashboard` | HR/company representative. Manages their own company, employees, and resources. |
| 3 | Employee | `Neure-Employee-Dashboard` | Individual employee. Can view content, complete assessments, manage own profile. |

> **Therapists** are a special profile stored in the `therapists` table. They have a `users` record with `role_id = 2` and `user_type = 'neure'`. They are managed by Superadmin.

### How Roles Are Linked

```
roles (id, role_name)
  └── users (role_id FK → roles.id)
        ├── role_id = 1  →  Superadmin (no company link)
        ├── role_id = 2  →  Company Admin
        │     └── companies (contact_person_id FK → users.user_id)
        │           └── company_employees (company_id, user_id)
        └── role_id = 3  →  Employee
              └── company_employees (user_id FK → users.user_id)
                    └── companies (id FK)
```

- A **Company Admin** creates a company; the `companies.contact_person_id` points to their `user_id`.
- **Employees** are linked to a company via `company_employees` (composite PK: `company_id + user_id`).
- `company_employees.is_active = 0` locks out both Admins and Employees from login.
- **Superadmin** is standalone — no `company_employees` record needed.

### JWT Token Payload
```json
{ "user_id": 42, "email": "user@example.com", "role_id": 2 }
```
Access token TTL: **5 hours**. Refresh token TTL: **7 days**.

---

## Database Tables

| Table | Purpose |
|-------|---------|
| `roles` | Role definitions (superadmin / company admin / employee) |
| `users` | All platform users (all roles). Central identity table. |
| `companies` | Company profiles. `contact_person_id` → company admin user. |
| `company_employees` | Many-to-many: users ↔ companies. Tracks employee metrics per company. |
| `company_subscriptions` | Per-company subscription plan and notification settings. |
| `departments` | Global department list. |
| `company_departments` | Departments assigned to companies. |
| `user_departments` | Which department a user belongs to. |
| `workshops` | Workshop master records (title, description, agenda, files). |
| `workshop_schedules` | Scheduled instances of workshops per company. |
| `workshop_tickets` | Attendance tickets linking users to workshop schedules. |
| `worksheets` | Worksheet content associated with workshops. |
| `articles` | Platform articles/blog posts. |
| `soundscapes` | Audio tracks (title, artist, URL, cover image). |
| `soundscape_likes` | User ↔ soundscape like relationship. |
| `gallery` | Media library (images, videos, documents). |
| `company_gallery_assignments` | Which gallery items are assigned to which company. |
| `assessments` | Assessment templates (title, description, frequency). |
| `questions` | Questions belonging to assessments. |
| `options` | Answer options for questions. |
| `user_assessments` | Tracks which users have been assigned/completed assessments. |
| `user_assessment_responses` | Individual question responses per submission. |
| `assessment_interpretation_ranges` | Score ranges and their wellness interpretations. |
| `rewards` | Reward items available to assign (title, icon, description). |
| `employee_rewards` | Rewards assigned to employees (with claimed status). |
| `company_rewards` | Rewards available per company. |
| `notifications` | In-app notifications (per user or per company). |
| `announcements` | Company-wide announcements. |
| `announcement_company` | Which companies an announcement targets. |
| `announcement_reads` | Tracks which users have read announcements. |
| `qna` | FAQ/Q&A items. |
| `feedback` | Feedback submitted by company admins or employees. |
| `activity_logs` | Audit trail of all significant actions. |
| `user_resource_tracking` | Tracks content views (articles, soundscapes, gallery). |
| `user_subscriptions` | Per-user notification preferences. |
| `therapists` | Therapist profile extension (bio, specialization, experience). |
| `therapist_slots` | Available appointment slots for therapists. |
| `chat_sessions` | Chat/consultation session records. |
| `invoices` | Billing invoices per company. |
| `company_deactivation_requests` | Deactivation requests submitted by company admins. |
| `company_metrics_history` | Historical snapshots of company wellness metrics. |
| `company_daily_stress_history` | Daily stress level history per company. |
| `company_retention_history` | Historical retention rate data. |
| `employee_daily_history` | Daily employee-level metrics history. |
| `roi_metrics` | ROI calculation metrics. |
| `blacklisted_tokens` | JWT tokens invalidated on logout. |
| `refresh_tokens` | Active refresh tokens. |
| `password_reset_tokens` | Time-limited tokens for password reset. |

---

## API Reference

---

### `/api/user` — User Management

---

#### POST `/api/user/register`
Create a new user account.

**Payload:**
```json
{ "username": "john", "email": "john@co.com", "password": "Abc@1234", "role_id": 2 }
```
**Response 201:**
```json
{
  "status": true, "code": 201, "message": "Registration successful",
  "data": { "token": "<jwt>", "user": { "id": 1, "username": "john", "email": "...", "role_id": 2 } }
}
```

---

#### POST `/api/user/login`
Authenticate a user. `role_id` is mandatory and routes the user to the correct dashboard.

**Payload:**
```json
{ "email": "admin@company.com", "password": "Abc@1234", "role_id": 2 }
```
**role_id values:** `1` = Superadmin, `2` = Company Admin, `3` = Employee

**Response 200:**
```json
{
  "status": true, "code": 200, "message": "Login successful",
  "data": {
    "accessToken": "<jwt>",
    "refreshToken": "<jwt>",
    "loginAt": "2025-01-01T00:00:00.000Z",
    "expiresAt": "2025-01-01T05:00:00.000Z",
    "user": { "user_id": 10, "email": "...", "role_id": 2, "first_name": "...", "last_name": "...", ... },
    "companyId": 5,
    "companyOnboarded": 1
  }
}
```
> For `role_id 3` response also includes `stress_level` and `stress_message` in the user object.
> For `role_id 1` (superadmin), `companyId` is `null`.

**Errors:**
- 401 if invalid credentials or account inactive

---

#### POST `/api/user/logout` 🔒
Blacklist the current access token.

**Header:** `Authorization: Bearer <accessToken>`  
**Response 200:** `{ "status": true, "code": 200, "message": "Logged out successfully" }`

---

#### POST `/api/user/refresh-token`
Exchange refresh token for a new access token.

**Header:** `Authorization: Bearer <refreshToken>`  
**Response 200:**
```json
{ "status": true, "code": 200, "message": "Token refreshed successfully",
  "data": { "accessToken": "<new_jwt>", "expiresAt": "..." } }
```

---

#### POST `/api/user/forgotPassword`
Trigger password reset email. **No auth required.**

**Payload:** `{ "email": "user@company.com" }`

Generates a 32-byte hex token, stores it in `password_reset_tokens` (expires in **1 hour**), and sends a reset link via email. Any existing token for the user is deleted first.

**Response 200:** `{ "status": true, "code": 200, "message": "Password reset instructions sent to your email" }`  
**Response 404:** No account found with this email.

---

#### POST `/api/user/resetPassword`
Reset password using the token from the email link. **No auth required.**

**Payload:** `{ "token": "<reset_token>", "new_password": "NewPass@123" }`

Validates token exists, is unused (`used = 0`), and not expired. Marks token `used = 1` after successful reset. Sends an in-app `ACCOUNT_UPDATE` notification.

Password rules: min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char `(@$!%*?&#)`.

**Response 200:** `{ "status": true, "code": 200, "message": "Password has been reset successfully" }`  
**Response 400:** Invalid/expired token or password doesn't meet complexity rules.

---

#### POST `/api/user/changePassword` 🔒
Change password (requires knowing current password).

**Payload:**
```json
{ "email": "user@co.com", "old_password": "OldPass@1", "new_password": "NewPass@1" }
```
Password must: min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char `(@$!%*?&#)`.

---

#### GET `/api/user/getUserDetails` 🔒
Get user profile. Optionally filter by company.

**Query:** `?user_id=10` or `?user_id=10&company_id=5`

**Response 200 data:**
```json
{
  "user_id": 10, "email": "...", "first_name": "...", "last_name": "...",
  "gender": "male", "date_of_birth": "1990-01-01", "age": 34,
  "phone": "...", "city": "...", "profile_url": "...", "job_title": "...",
  "role_id": 3, "accepted_terms": 1, "has_seen_dashboard_tour": 1,
  "department": { "id": 2, "name": "Engineering", "assigned_date": "..." },
  "company": { "id": 5, "name": "Acme Corp", "employee_code": "EMP001", "joined_date": "..." }
}
```

---

#### PUT `/api/user/updateUserDetails` 🔒
Update user profile fields. Supports optional profile photo upload.

**Content-Type:** `multipart/form-data`  
**Fields:** `user_id` (required), any of: `first_name`, `last_name`, `email`, `phone`, `gender`, `date_of_birth`, `city`, `accepted_terms`, `department_id`, `file` (profile image)

---

#### PUT `/api/user/updateDashboardTourStatus` 🔒
Mark the onboarding tour as completed.

**Payload:** `{ "user_id": 10 }`

---

#### PUT `/api/user/updateTermsAcceptance` 🔒
Accept terms and conditions. `user_id` is taken from JWT (no body needed for user_id).

**Payload:** `{ "accepted_terms": 1 }`

---

#### POST `/api/user/updateStressLevel` 🔒
Employee submits their current stress level.

**Payload:**
```json
{
  "user_id": 10, "company_id": 5,
  "stress_level": 65,
  "stress_message": "Feeling a bit overwhelmed",
  "last_stress_modal_seen_at": "2025-01-01T10:00:00Z"
}
```
`stress_level` must be 0–100. Updates `company_employees.stress_level` and triggers company-level stress recalculation.

---

#### POST `/api/user/submitPSI` 🔒
Employee submits Psychological Safety Index score.

**Payload:** `{ "user_id": 10, "company_id": 5, "psi_score": 4 }`  
`psi_score` must be 1–5.

---

#### GET `/api/user/getUserWorkshops` 🔒
Get workshops assigned to a user.

**Query:** `?user_id=10`  
**Response data:** array of `{ id, workshop_id, title, description, assigned_at, status, completed_at }`

---

#### GET `/api/user/getEmployeeRewards` 🔒
Get rewards assigned to an employee.

**Query:** `?user_id=10&page=1&limit=10`

---

#### POST `/api/user/claimReward` 🔒
Employee claims a reward that was assigned to them.

**Payload:** `{ "user_id": 10, "reward_id": 3 }`  
Triggers notification to assigning admin + email.

---

#### GET `/api/user/getUserSubscription` 🔒
Get user notification preferences.

**Query:** `?user_id=10`

---

#### PUT `/api/user/updateUserSubscription` 🔒
Update user notification preferences.

**Payload:**
```json
{
  "user_id": 10,
  "email_notification": 1,
  "sms_notification": 0,
  "workshop_event_reminder": 1,
  "system_updates_announcement": 1
}
```

---

#### GET `/api/user/getTherapists` 🔒
List all therapists. Superadmin only.

**Query:** `?page=1&limit=10&search=<term>`  
**Response data:** `{ therapists: [...], pagination: { total, current_page, total_pages, per_page } }`

---

#### POST `/api/user/createTherapist` 🔒
Create a therapist account (Superadmin only).

**Payload:**
```json
{
  "first_name": "Dr", "last_name": "Smith", "email": "dr@neure.com",
  "username": "drsmith", "phone": "+91...", "gender": "male",
  "date_of_birth": "1985-06-15",
  "years_of_experience": 10, "specialization": "Anxiety",
  "bio": "..."
}
```
Auto-generates a random temp password, creates user + therapist record + default subscription.  
**Response 201 data:** `{ user_id, email, temp_password, age }`

---

#### PUT `/api/user/updateTherapist/:therapistId` 🔒
Update therapist profile and user fields.

**Payload:** any subset of therapist or user fields.

---

#### DELETE `/api/user/deleteTherapist/:therapistId` 🔒
Soft-delete a therapist (sets `is_active = 0` on both `therapists` and `users`).

---

#### GET `/api/user/getSuperadmins` 🔒
List all superadmin users. Only callable by role_id = 1.

---

#### POST `/api/user/createSuperadmin` 🔒
Create a new superadmin account. Only callable by role_id = 1.

**Payload:**
```json
{ "first_name": "Jane", "last_name": "Doe", "email": "jane@neure.com", "phone": "+91...", "gender": "female" }
```
Auto-generates temp password as `first4charsOfFirstName + 1234` (e.g. `Jane1234`). Sends a welcome email with credentials. Creates default `user_subscriptions` record. Logs action to `activity_logs`.

**Response 201 data:** `{ "user_id": 42, "email": "jane@neure.com", "temp_password": "Jane1234" }`  
**Response 409:** Email already exists.

---

#### DELETE `/api/user/deleteSuperadmin/:superadminId` 🔒
Permanently delete a superadmin. Only callable by role_id = 1. Cannot delete own account.

Hard deletes: `user_subscriptions`, `refresh_tokens`, and `users` records. Logs action to `activity_logs`.

**Response 200:** `{ "status": true, "message": "Superadmin deleted successfully" }`  
**Response 400:** Attempting to self-delete.  
**Response 404:** Superadmin not found.

---

#### PUT `/api/user/updateFirstAssessmentCompleted` 🔒
Mark the user's first assessment as completed. `user_id` is taken from the JWT — no body needed.

Sets `users.first_assessment_completed = 1`.

**Response 200 data:** `{ "user_id": 15, "first_assessment_completed": true }`

---

---

### `/api/company` — Company Management

---

#### POST `/api/company/registerCompany` 🔒
Register a new company (Superadmin initiates).

---

#### GET `/api/company/getAllCompanies` 🔒
List all companies with pagination.

**Query:** `?page=1&limit=10&search=<term>`

---

#### GET `/api/company/getCompanyList` 🔒
Lightweight list for dropdowns.

---

#### POST `/api/company/createCompany` 🔒
Create company and optionally provision an admin user.

**Payload:**
```json
{
  "company_name": "Acme Corp", "industry": "Tech", "company_size": 200,
  "contact_person_id": 10, "services_interested": ["workshops", "assessments"]
}
```

---

#### GET `/api/company/getCompanyInfo` 🔒
Get company profile.

**Query:** `?company_id=5`  
**Response data:** full `companies` row including metrics (`stress_level`, `retention_rate`, `psychological_safety_index`, `wellbeing_score`, `engagement_score`).

---

#### PUT `/api/company/updateCompanyInfo` 🔒
Update company info and optional logo.

**Content-Type:** `multipart/form-data`  
**Fields:** `company_id`, any of: `company_name`, `industry`, `company_size`, `additional_info`, `file` (logo)

---

#### GET `/api/company/getCompanyMetrics` 🔒
Get current wellness metrics for a company.

**Query:** `?company_id=5`

---

#### GET `/api/company/analytics` 🔒
Company-level analytics overview.

---

#### GET `/api/company/retention-history/:company_id` 🔒
Historical retention rate data for charts.

---

#### GET `/api/company/stress-trends/:company_id` 🔒
Historical stress level data.

**Query:** `?start_date=2025-01-01&end_date=2025-06-01`

---

#### GET `/api/company/wellbeing-trends/:company_id` 🔒
Historical wellbeing score trend data for charts.

**Query:** `?start_date=2025-01-01&end_date=2025-06-01` (both optional — defaults to last **30 days**)

Reads from `company_metrics_history` table. Returns daily wellbeing score points with change delta vs previous day.

**Response 200 data:**
```json
{
  "company_id": 5,
  "trends": [
    { "period": "2025-05-01", "wellbeing_score": 72.5, "wellbeing_score_change": 0 },
    { "period": "2025-05-02", "wellbeing_score": 74.0, "wellbeing_score_change": 1.5 }
  ]
}
```

---

#### GET `/api/company/getCompanyEmployees` 🔒
List employees of a company.

**Query:** `?company_id=5&page=1&limit=20`

---

#### POST `/api/company/createEmployee` 🔒
Add a single employee to a company.

**Payload:**
```json
{
  "email": "emp@company.com", "first_name": "Jane", "last_name": "Doe",
  "company_id": 5, "department_id": 2, "employee_code": "EMP002",
  "gender": "female", "date_of_birth": "1995-03-10"
}
```

---

#### POST `/api/company/bulkCreateEmployees` 🔒
Bulk import employees from CSV file.

**Content-Type:** `multipart/form-data`  
**Fields:** `file` (CSV), `company_id`

---

#### DELETE `/api/company/removeEmployee` 🔒
Deactivate an employee.

**Body:** `{ "user_id": 15, "company_id": 5 }`

---

#### GET `/api/company/searchEmployees` 🔒
Search employees by name/email.

**Query:** `?company_id=5&search_term=jane&page=1&limit=10`

---

#### GET `/api/company/getTopPerformingEmployee` 🔒
List employees sorted by engagement score.

**Query:** `?company_id=5&page=1&limit=10&search=<term>`

---

#### GET `/api/company/getDepartments` 🔒
List all available departments.

---

#### POST `/api/company/addDepartment` 🔒
Create a new department.

**Payload:** `{ "department_name": "Engineering" }`

---

#### POST `/api/company/assignReward` 🔒
Assign a reward to an employee.

**Payload:** `{ "user_id": 15, "reward_id": 3, "company_id": 5 }`

---

#### GET `/api/company/getEmployeeRewardHistory` 🔒
View reward assignment history.

**Query:** `?company_id=5&reward_id=3`

---

#### POST `/api/company/createFeedback` 🔒
Submit feedback to Neure.

**Payload:** `{ "company_id": 5, "user_id": 10, "message": "...", "rating": 4 }`

---

#### GET `/api/company/getFeedback` 🔒
Get all feedback submissions (Superadmin).

---

#### GET `/api/company/getCompanySubscription` 🔒
Get company subscription plan details.

**Query:** `?company_id=5`

---

#### PUT `/api/company/updateCompanySubscription` 🔒
Update subscription notification settings.

**Payload:** `{ "company_id": 5, "email_notification": 1, "sms_notification": 0, "workshop_event_reminder": 1, "system_updates_announcement": 1 }`

---

#### GET `/api/company/getCompanyInvoices` 🔒
List billing invoices for a company.

**Query:** `?company_id=5&page=1&limit=10`

---

#### GET `/api/company/getInvoiceById` 🔒
Get a single invoice.

**Query:** `?invoice_id=12`

---

#### POST `/api/company/requestDeactivation` 🔒
Company admin requests account deactivation.

**Payload:** `{ "company_id": 5, "reason": "..." }`

---

#### GET `/api/company/deactivationRequests` 🔒
List pending deactivation requests (Superadmin).

---

#### GET `/api/company/deactivatedCompanies` 🔒
List deactivated companies (Superadmin).

---

#### POST `/api/company/processDeactivationRequest` 🔒
Approve or reject deactivation request (Superadmin).

**Payload:** `{ "request_id": 7, "action": "approve" | "reject", "reason": "..." }`

---

#### GET `/api/company/reports/wellbeing/:company_id` 🔒
Generate wellbeing report as JSON.

**Query:** `?start_date=2025-01-01&end_date=2025-06-01`

---

#### GET `/api/company/reports/wellbeing/email/:company_id` 🔒
Generate wellbeing report and email it to company admin.

---

#### DELETE `/api/company/delete/:company_id` 🔒
Permanently delete company and all related data (Superadmin only).

---

---

### `/api/workshop` — Workshops

---

#### GET `/api/workshop/getAllWorkshops` 🔒
List all workshop templates.

**Query:** `?page=1&limit=10&search_term=<term>&start_date=<date>&end_date=<date>`

---

#### POST `/api/workshop/createWorkshop` 🔒
Create a new workshop template.

**Payload:**
```json
{
  "title": "Stress Management", "description": "...", "agenda": "...",
  "location": "Online", "poster_image": "<url>", "pdf_url": "<url>"
}
```

---

#### PUT `/api/workshop/updateWorkshop` 🔒
Update workshop template.

**Payload:** `{ "id": 5, ...fields to update }`

---

#### DELETE `/api/workshop/deleteWorkshop/:id` 🔒
Delete a workshop template.

---

#### GET `/api/workshop/getAllWorkshopSchedules` 🔒
List all scheduled workshop instances.

**Query:** `?page=1&limit=10&search_term=<term>`

---

#### GET `/api/workshop/getWorkshopsByCompanyIdOrUserId` 🔒
List workshops for a specific company.

**Query:** `?company_id=5&page=1&pageSize=10&start_time=<date>`

---

#### GET `/api/workshop/getWorkshopDatesByCompanyIdOrUserId` 🔒
Get available workshop dates for calendar.

**Query:** `?company_id=5`

---

#### GET `/api/workshop/getWorkshopDetails` 🔒
Full detail of a single workshop + schedule.

**Query:** `?workshop_id=3&company_id=5&schedule_id=12`

---

#### POST `/api/workshop/scheduleWorkshop` 🔒
Schedule a workshop for a company.

**Payload:**
```json
{ "workshop_id": 3, "company_id": 5, "start_time": "2025-07-15T10:00:00Z", "end_time": "2025-07-15T12:00:00Z" }
```

---

#### PUT `/api/workshop/cancelWorkshopSchedule` 🔒
Cancel a scheduled session.

**Payload:** `{ "schedule_id": 12 }`

---

#### PUT `/api/workshop/rescheduleWorkshop` 🔒
Change schedule date/time.

**Payload:** `{ "schedule_id": 12, "new_start_time": "...", "new_end_time": "..." }`

---

#### PUT `/api/workshop/updateWorkshopScheduleStatus` 🔒
Update the status of a schedule (e.g., completed, cancelled).

**Payload:** `{ "schedule_id": 12, "status": "completed" }`

---

#### GET `/api/workshop/attendance/:workshopId` 🔒
View attendance for a workshop.

**Query:** `?company_id=5&schedule_id=12&page=1&limit=20&status=<attended|absent>&all=true`

---

#### POST `/api/workshop/mark-attendance` 🔒
Mark an employee as attended.

**Payload:** `{ "user_id": 15, "workshop_id": 3, "schedule_id": 12, "company_id": 5 }`

---

#### GET `/api/workshop/tickets/:userId` 🔒
Get workshop tickets/passes for a user.

---

#### GET `/api/workshop/stats/:workshopId` 🔒
Get attendance statistics for a workshop.

---

---

### `/api/article` — Articles

---

#### GET `/api/article/getArticles` 🔒
List articles with pagination.

**Query:** `?page=1&limit=10&search_term=<term>`

**Response data:**
```json
{ "articles": [{ "id": 1, "title": "...", "content": "...", "reading_time": 5, "category": "...", "tags": [...], "image_url": "..." }], "pagination": {...} }
```

---

#### GET `/api/article/articles/:articleId` 🔒
Get single article by ID.

---

#### POST `/api/article/createArticle` 🔒
Create new article with optional thumbnail.

**Content-Type:** `multipart/form-data`  
**Fields:** `title`, `content`, `reading_time`, `category`, `tags` (JSON string), `file` (image)

---

#### PUT `/api/article/updateArticle` 🔒
Update article. Optional new thumbnail.

**Content-Type:** `multipart/form-data`  
**Fields:** `id` + any updatable fields + optional `file`

---

#### DELETE `/api/article/deleteArticle/:articleId` 🔒
Delete an article.

---

---

### `/api/assessments` — Assessments

---

#### GET `/api/assessments/getAllAssessments` 🔒
List all assessments with pagination.

**Query:** `?page=1&limit=10`

---

#### GET `/api/assessments/list` 🔒
Lightweight assessment list (for dropdowns).

---

#### GET `/api/assessments/:id` 🔒
Get single assessment with all questions and options.

---

#### POST `/api/assessments/createAssessment` 🔒
Create assessment with questions.

**Payload:**
```json
{
  "title": "Monthly Wellness Check", "description": "...", "frequency_days": 30,
  "is_psi_assessment": 0,
  "questions": [
    {
      "question_text": "How are you feeling?",
      "options": [
        { "option_text": "Great", "score": 5 },
        { "option_text": "Okay", "score": 3 }
      ]
    }
  ]
}
```

---

#### PUT `/api/assessments/updateAssessment` 🔒
Update assessment and its questions/options.

**Payload:** `{ "id": 3, ...fields to update }`

---

#### DELETE `/api/assessments/deleteAssessment/:id` 🔒
Delete an assessment.

---

#### POST `/api/assessments/submit` 🔒
Employee submits assessment answers.

**Payload:**
```json
{
  "assessment_id": 3, "user_id": 15, "company_id": 5,
  "responses": [
    { "question_id": 10, "option_id": 22 }
  ]
}
```

---

#### GET `/api/assessments/user-submissions` 🔒
Get all assessments submitted by a user.

**Query:** `?user_id=15`

---

#### GET `/api/assessments/responses/:assessment_id` 🔒
Get user's responses for a specific assessment.

**Query:** `?user_id=15`

---

#### GET `/api/assessments/completionLists` 🔒
View assessment completion status per company.

**Query:** `?company_id=5`

---

#### GET `/api/assessments/generateAssessmentPdf/:assessment_id` 🔒
Generate and return PDF report for an assessment submission.

**Query:** `?submission_id=88`  
**Response:** PDF blob (`application/pdf`)

---

---

### `/api/soundscapes` — Soundscapes

---

#### GET `/api/soundscapes/getSoundscapes` 🔒
List all soundscapes.

**Query:** `?page=1&limit=10`

---

#### GET `/api/soundscapes/getSoundscapeByUserId` 🔒
List soundscapes (may be filtered by user context).

**Query:** `?page=1&limit=10`

---

#### POST `/api/soundscapes/createSoundscape` 🔒
Upload new soundscape.

**Content-Type:** `multipart/form-data`  
**Fields:** `title`, `artist_name`, `categories`, `tags` (JSON), `audio` (MP3/WAV/M4A), `coverImage` (image)

---

#### DELETE `/api/soundscapes/deleteSoundscape` 🔒
Delete a soundscape.

**Query:** `?soundscapeId=7`

---

#### POST `/api/soundscapes/like/:soundscapeId` 🔒
Like a soundscape.

---

#### DELETE `/api/soundscapes/unlike/:soundscapeId` 🔒
Unlike a soundscape.

---

#### GET `/api/soundscapes/islike/:soundscapeId` 🔒
Check if user has liked a soundscape.

---

#### GET `/api/soundscapes/getLikedSoundscapes` 🔒
Get all soundscapes liked by current user.

---

---

### `/api/` — Gallery (mounted at `/api` root)

---

#### GET `/api/getGalleryItems` 🔒
List gallery media items.

**Query:** `?type=image|video|document&page=1&limit=10&companyId=5&showUnassigned=true&search_term=<term>`

---

#### GET `/api/getGalleryItems/:itemId` 🔒
Get single gallery item.

---

#### GET `/api/getMediaCounts` 🔒
Count of media items by type.

**Query:** `?companyId=5`

---

#### POST `/api/uploadGalleryItem` 🔒
Upload a new gallery file.

**Content-Type:** `multipart/form-data`  
**Fields:** `title`, `description`, `tags` (JSON), `file` (image/video/document)

---

#### PUT `/api/updateGalleryItem` 🔒
Update gallery item metadata.

**Content-Type:** `multipart/form-data`  
**Fields:** `id` + any of `title`, `description`, `tags`, optional `file`

---

#### DELETE `/api/deleteGalleryItem/:itemId` 🔒
Delete gallery item.

---

#### POST `/api/assignToCompany` 🔒
Assign gallery items to a company.

**Payload:** `{ "company_id": 5, "gallery_ids": [1, 2, 3] }`

---

---

### `/api/rewards` — Rewards

---

#### GET `/api/rewards/getAllRewards` 🔒
List all rewards.

**Query:** `?company_id=5` (optional filter)

---

#### POST `/api/rewards/createReward` 🔒
Create a new reward.

**Content-Type:** `multipart/form-data`  
**Fields:** `title`, `description`, `points_required` (optional), `icon` (image file)

---

#### GET `/api/rewards/:id` 🔒
Get reward by ID.

---

#### PUT `/api/rewards/:id` 🔒
Update reward.

**Content-Type:** `multipart/form-data`  
**Fields:** any reward fields + optional `icon`

---

#### DELETE `/api/rewards/:id` 🔒
Delete reward.

---

---

### `/api/notifications` — Notifications

---

#### POST `/api/notifications/create` 🔒
Create a notification.

**Payload:**
```json
{
  "title": "Alert", "content": "...", "type": "ACCOUNT_UPDATE",
  "priority": "HIGH", "user_id": 15, "company_id": 5,
  "delivery_method": "IN_APP"
}
```

---

#### GET `/api/notifications/list` 🔒
List notifications.

**Query:** `?user_id=15&company_id=5&page=1&limit=20`

---

#### PUT `/api/notifications/update` 🔒
Update notification.

**Payload:** `{ "id": 7, ...fields to update }`

---

#### DELETE `/api/notifications/delete/:id` 🔒
Delete notification.

---

#### POST `/api/notifications/mark-read` 🔒
Mark specific notification as read.

**Payload:** `{ "notification_id": 7 }`

---

#### POST `/api/notifications/mark-all-read` 🔒
Mark multiple notifications as read.

**Payload:** `{ "notification_ids": [7, 8, 9] }`

---

#### GET `/api/notifications/unread-count` 🔒
Get unread notification count.

**Query:** `?company_id=5`

---

---

### `/api/announcements` — Announcements

---

#### POST `/api/announcements/create` 🔒
Create a new announcement.

**Payload:**
```json
{
  "title": "Office Closed", "content": "...",
  "company_ids": [5, 6],
  "audience_type": "all" | "employees" | "admins",
  "expires_at": "2025-07-01T00:00:00Z"
}
```

---

#### GET `/api/announcements/list` 🔒
List announcements.

**Query:** `?company_id=5&page=1&limit=10&audience_type=employees`

---

#### PUT `/api/announcements/update` 🔒
Update announcement.

**Payload:** `{ "id": 3, ...fields to update }`

---

#### DELETE `/api/announcements/delete/:id` 🔒
Delete announcement.

---

#### POST `/api/announcements/mark-read` 🔒
Mark specific announcement as read.

**Payload:** `{ "announcement_id": 3, "company_id": 5 }`

---

#### POST `/api/announcements/mark-all-read` 🔒
Mark all announcements as read.

**Payload:** `{ "announcement_ids": [3, 4], "company_id": 5 }`

---

#### GET `/api/announcements/unread-count` 🔒
Unread announcement count.

---

---

### `/api/qna` — FAQ / Q&A

---

#### GET `/api/qna/list` 🔒
List FAQ items with pagination and search.

**Query:** `?page=1&limit=10&search=<term>`

---

#### GET `/api/qna/:id` 🔒
Get single FAQ item.

---

#### POST `/api/qna/create` 🔒
Create FAQ entry.

**Payload:** `{ "question": "What is PSI?", "answer": "..." }`

---

#### PUT `/api/qna/update` 🔒
Update FAQ entry.

**Payload:** `{ "id": 5, "question": "...", "answer": "..." }`

---

#### DELETE `/api/qna/:id` 🔒
Delete FAQ entry.

---

---

### `/api/tracking` — Resource Tracking

---

#### POST `/api/tracking/trackResourceView` 🔒
Log a content view event.

**Payload:**
```json
{ "resource_id": 10, "resource_type": "article" | "soundscape" | "gallery" }
```
Records into `user_resource_tracking`. Used to calculate `content_engagement_percentage` in `company_employees`.

---

#### GET `/api/tracking/user-history` 🔒
Get content view history for the current user.

---

---

### `/api/logs` — Activity Logs

---

#### POST `/api/logs/create` 🔒
Create an activity log entry.

**Payload:**
```json
{
  "user_id": 10, "company_id": 5,
  "action": "CREATE_EMPLOYEE",
  "module": "company",
  "description": "Created employee John Doe",
  "metadata": {}
}
```

---

#### GET `/api/logs/list` 🔒
List activity logs with filters.

**Query:** `?user_id=10&company_id=5&module=company&page=1&limit=20`

---

#### GET `/api/logs/summary` 🔒
Get activity count summary grouped by module.

**Query:** `?company_id=5`

---

---

### `/api/dashboard` — Dashboard Metrics

---

#### GET `/api/dashboard/metrics` 🔒
Platform-wide summary metrics for Superadmin dashboard.

**Response data:**
```json
{
  "total_companies": 45, "active_companies": 40,
  "total_employees": 1200, "total_workshops": 30,
  "avg_stress_level": 55, "avg_engagement_score": 72
}
```

---

---

### `/api/analytics` — Analytics

---

#### GET `/api/analytics/trends` 🔒
Platform-wide trend data for charts (Superadmin).

**Query:** `?start_date=2025-01-01&end_date=2025-06-01`

---

---

### `/api/uploads` — File Uploads

---

#### POST `/api/uploads/icon` 🔒
Upload an icon image. Returns S3 URL.

**Content-Type:** `multipart/form-data`  
**Field:** `file` (JPG/PNG/GIF/WEBP, max 8MB)

---

#### POST `/api/uploads/article` 🔒
Upload article thumbnail image.

**Content-Type:** `multipart/form-data`  
**Field:** `file`

---

#### POST `/api/uploads/workshop` 🔒
Upload workshop cover image.

**Content-Type:** `multipart/form-data`  
**Field:** `file`

---

#### POST `/api/uploads/profile` 🔒
Upload profile picture.

**Content-Type:** `multipart/form-data`  
**Field:** `file`

---

#### POST `/api/uploads/sound` 🔒
Upload soundscape audio + cover.

**Content-Type:** `multipart/form-data`  
**Fields:** `sound` (MP3/WAV/M4A/AAC, max 50MB), `coverImage` (image)

---

#### POST `/api/uploads/gallery` 🔒
Upload a gallery media file.

**Content-Type:** `multipart/form-data`  
**Field:** `file` (image/video/doc, max 50MB)

---

#### POST `/api/uploads/workshop/files` 🔒
Upload workshop PDF + cover image together.

**Content-Type:** `multipart/form-data`  
**Fields:** `workshopId`, `pdf`, `coverImage`

---

#### POST `/api/uploads/deleteImage` 🔒
Delete an image from S3.

**Payload:** `{ "file_url": "<s3_url>" }`

---

#### POST `/api/uploads/deleteSound` 🔒
Delete a soundscape file from S3.

---

#### POST `/api/uploads/galleryDeleteFile` 🔒
Delete a gallery file from S3.

---

---

## Cron Jobs

| Job | Schedule | Purpose |
|-----|----------|---------|
| `serverActive` | Every 5 min | Pings server to keep alive |
| `calculateCompanyStressLevel` | Periodic | Recalculates avg stress per company from `company_employees` |
| `calculateRetentionRate` | Periodic | Calculates employee retention rate per company |
| `calculatePSI` | Periodic | Calculates Psychological Safety Index per company |
| `calculateEngagementScore` | Periodic | Calculates engagement score per company |
| `updateContentEngagementPercentage` | Periodic | Updates `content_engagement_percentage` from resource tracking |
| `checkAssessmentCompletion` | Daily | Marks assessments as overdue if not completed |
| `monthlyMetricsReset` | Monthly | Resets monthly metric counters |
| `workshopReminder` | Pre-workshop | Sends email reminders to attendees |
| `initNewCompanyMetrics` | Daily | Initialises baseline metrics rows in `company_metrics_history` for companies created **today** (evaluated in IST timezone). Ensures new companies have a starting metrics snapshot on day-1. |

---

## Notification Types

| Type | Trigger |
|------|---------|
| `ACCOUNT_UPDATE` | Password changed |
| `PROFILE_UPDATE` | Profile fields updated |
| `REWARD_CLAIMED` | Employee claims reward (notifies assigning admin) |
| `REWARD_REDEMPTION` | Reward redemption alert to company contact |

---

## Error Codes

| Code | Meaning |
|------|---------|
| 400 | Bad request / missing required fields |
| 401 | Unauthorized — token missing, expired, or blacklisted |
| 403 | Forbidden — valid token but insufficient permissions |
| 404 | Resource not found |
| 500 | Internal server error |

---

## Logic Notes

### Company Metrics Calculation
All five company-level metrics are auto-calculated by cron jobs and stored directly on the `companies` row:
- **stress_level**: avg of `company_employees.stress_level` for active employees
- **retention_rate**: percentage of employees who joined and are still active
- **psychological_safety_index (PSI)**: avg of `company_employees.psi` scores
- **engagement_score**: composite of workshop attendance, content views, assessment completion
- **wellbeing_score**: derived from stress + PSI + engagement

### Onboarding Status
`companies.onboarding_status` flag returned on login. If `0`, frontend shows onboarding flow. Set to `1` once company setup is complete.

### Token Blacklisting
On logout, the access token is inserted into `blacklisted_tokens` with its expiry. Every authenticated request checks this table before proceeding.

### Soft Delete
Most deletions are soft deletes — `is_active = 0`. Therapists, companies, and employees are all soft-deleted to preserve historical records. Only `company/delete/:company_id` is a hard delete (removes all related data).

### Employee Stress Bar
- Employee submits via `POST /api/user/updateStressLevel`
- `company_employees.stress_bar_updated` is set to `1` (tracks whether employee has submitted)
- Cron recalculates company average stress
- `last_stress_modal_seen_at` on `users` prevents re-showing the modal on same session
