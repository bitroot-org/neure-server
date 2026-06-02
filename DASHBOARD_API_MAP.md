# Neure Dashboard → API Usage Map

## Ecosystem Overview

The Neure platform has **3 dashboards** all consuming a single shared REST API server.

| Dashboard | Repo | Login Role | Users |
|-----------|------|------------|-------|
| Company Admin Dashboard | `Neure_dashboard` | `role_id: 2` | HR/Company admins |
| Superadmin Dashboard | `neure_superadmin_dashboard` | `role_id: 1` | Neure internal team |
| Employee Dashboard | `Neure-Employee-Dashboard` | `role_id: 3` | Company employees |

Base URL pattern: `VITE_API_BASE_URL/api/<resource>`  
All routes except `/user/login`, `/user/register`, `/user/refresh-token`, `/user/forgotPassword`, `/user/resetPassword` require `Authorization: Bearer <accessToken>` header.

---

## Dashboard 1 — Company Admin Dashboard (`Neure_dashboard`)

**Role:** Company admin manages their own company, employees, rewards, workshops, and views analytics.

### Auth & Session
| API | Method | Purpose |
|-----|--------|---------|
| `/api/user/login` | POST | Login with `role_id: 2` |
| `/api/user/logout` | POST | Invalidate access token |
| `/api/user/refresh-token` | POST | Silently refresh expired access token |
| `/api/user/changePassword` | POST | Change own password (requires current password) |
| `/api/user/forgotPassword` | POST | Send reset link to email (no auth, token valid 1h) |
| `/api/user/resetPassword` | POST | Set new password via token from email (no auth) |
| `/api/user/updateTermsAcceptance` | PUT | Accept T&C on first login |
| `/api/user/updateDashboardTourStatus` | PUT | Mark onboarding tour as seen |

### Company Management
| API | Method | Purpose |
|-----|--------|---------|
| `/api/company/getCompanyInfo` | GET | Load company profile (name, logo, industry, metrics) |
| `/api/company/updateCompanyInfo` | PUT | Update company info + logo upload (multipart) |
| `/api/company/getCompanyMetrics` | GET | Fetch stress, retention, PSI, engagement scores |
| `/api/company/getCompanySubscription` | GET | View subscription plan details |
| `/api/company/updateCompanySubscription` | PUT | Update notification preferences |
| `/api/company/requestDeactivation` | POST | Submit account deactivation request |
| `/api/company/getCompanyInvoices` | GET | List billing invoices (paginated) |
| `/api/company/stress-trends/:company_id` | GET | Stress level trend chart data |
| `/api/company/wellbeing-trends/:company_id` | GET | Wellbeing score trend chart data (last 30 days default) |

### Employee Management
| API | Method | Purpose |
|-----|--------|---------|
| `/api/company/getCompanyEmployees` | GET | List all employees (paginated) |
| `/api/company/createEmployee` | POST | Add single employee |
| `/api/company/bulkCreateEmployees` | POST | Bulk import employees via CSV |
| `/api/company/removeEmployee` | DELETE | Deactivate an employee |
| `/api/company/searchEmployees` | GET | Search employees by name/email |
| `/api/company/getTopPerformingEmployee` | GET | Top employees by engagement score |
| `/api/company/getDepartments` | GET | List departments |
| `/api/company/addDepartment` | POST | Create a new department |

### Rewards
| API | Method | Purpose |
|-----|--------|---------|
| `/api/rewards/getAllRewards` | GET | List all available rewards |
| `/api/company/assignReward` | POST | Assign a reward to an employee |
| `/api/company/getEmployeeRewardHistory` | GET | View reward history for an employee |

### Workshops
| API | Method | Purpose |
|-----|--------|---------|
| `/api/workshop/getWorkshopsByCompanyIdOrUserId` | GET | List workshops scheduled for this company |
| `/api/workshop/getWorkshopDatesByCompanyIdOrUserId` | GET | Get workshop calendar dates |
| `/api/workshop/getWorkshopDetails` | GET | Full detail of a single workshop |
| `/api/workshop/attendance/:workshopId` | GET | View attendance list for a workshop |
| `/api/workshop/mark-attendance` | POST | Mark an employee as attended |

### Articles & Content
| API | Method | Purpose |
|-----|--------|---------|
| `/api/article/getArticles` | GET | List articles (paginated, limit 6) |
| `/api/getGalleryItems` | GET | List gallery media (images/videos/docs) |
| `/api/getMediaCounts` | GET | Count media by type |
| `/api/soundscapes/getSoundscapeByUserId` | GET | List soundscapes (company-filtered) |
| `/api/soundscapes/getLikedSoundscapes` | GET | Soundscapes liked by current user |
| `/api/soundscapes/like/:soundscapeId` | POST | Like a soundscape |
| `/api/soundscapes/unlike/:soundscapeId` | DELETE | Unlike a soundscape |

### Notifications & Announcements
| API | Method | Purpose |
|-----|--------|---------|
| `/api/notifications/list` | GET | List notifications for user |
| `/api/notifications/unread-count` | GET | Unread notification badge count |
| `/api/notifications/mark-all-read` | POST | Mark notifications as read |
| `/api/announcements/list` | GET | List company announcements |
| `/api/announcements/mark-all-read` | POST | Mark announcements as read |

### Analytics & Reports
| API | Method | Purpose |
|-----|--------|---------|
| `/api/company/analytics` | GET | Company-level analytics overview |
| `/api/company/reports/wellbeing/:company_id` | GET | Generate wellbeing report (JSON) |
| `/api/company/reports/wellbeing/email/:company_id` | GET | Email wellbeing report to admin |
| `/api/qna/list` | GET | View FAQ/Q&A items |
| `/api/company/createFeedback` | POST | Submit feedback to Neure |

### Tracking
| API | Method | Purpose |
|-----|--------|---------|
| `/api/tracking/trackResourceView` | POST | Log when user views content |

---

## Dashboard 2 — Superadmin Dashboard (`neure_superadmin_dashboard`)

**Role:** Neure internal team manages all companies, content, workshops, therapists, assessments, and platform-level config.

### Auth & Session
| API | Method | Purpose |
|-----|--------|---------|
| `/api/user/login` | POST | Login with `role_id: 1` |
| `/api/user/logout` | POST | Invalidate token |
| `/api/user/refresh-token` | POST | Refresh expired token |
| `/api/user/changePassword` | POST | Change own password (requires current password) |
| `/api/user/forgotPassword` | POST | Send reset link to email (no auth, token valid 1h) |
| `/api/user/resetPassword` | POST | Set new password via email token (no auth) |
| `/api/user/getSuperadmins` | GET | List all superadmin accounts |
| `/api/user/createSuperadmin` | POST | Create new superadmin — auto temp password, sends welcome email |
| `/api/user/deleteSuperadmin/:superadminId` | DELETE | Permanently delete superadmin (cannot self-delete) |

### Company Management
| API | Method | Purpose |
|-----|--------|---------|
| `/api/company/getAllCompanies` | GET | List all companies (paginated + search) |
| `/api/company/getCompanyList` | GET | Lightweight company list for dropdowns |
| `/api/company/createCompany` | POST | Create a new company (with admin user) |
| `/api/company/delete/:company_id` | DELETE | Permanently delete company and all data |
| `/api/company/getCompanyInfo` | GET | View a specific company's profile |
| `/api/company/getCompanyEmployees` | GET | List employees of any company |
| `/api/company/createEmployee` | POST | Add employee to a company |
| `/api/company/bulkCreateEmployees` | POST | Bulk import via CSV |
| `/api/company/removeEmployee` | DELETE | Remove employee from company |
| `/api/company/getDepartments` | GET | List all departments |
| `/api/company/getCompanyMetrics` | GET | View company wellness metrics |
| `/api/company/analytics` | GET | Company analytics view |
| `/api/company/retention-history/:company_id` | GET | Historical retention data |
| `/api/company/stress-trends/:company_id` | GET | Stress trend chart |
| `/api/company/wellbeing-trends/:company_id` | GET | Wellbeing score trend chart (last 30 days default) |
| `/api/company/deactivationRequests` | GET | List pending deactivation requests |
| `/api/company/deactivatedCompanies` | GET | List deactivated companies |
| `/api/company/processDeactivationRequest` | POST | Approve or reject deactivation |
| `/api/company/getFeedback` | GET | View all company feedback submissions |
| `/api/company/reports/wellbeing/:company_id` | GET | View wellbeing report |
| `/api/company/reports/wellbeing/email/:company_id` | GET | Email wellbeing report |

### Rewards Management
| API | Method | Purpose |
|-----|--------|---------|
| `/api/rewards/getAllRewards` | GET | List all rewards |
| `/api/rewards/createReward` | POST | Create new reward (with icon upload) |
| `/api/rewards/:id` | PUT | Update reward |
| `/api/rewards/:id` | DELETE | Delete reward |

### Workshops
| API | Method | Purpose |
|-----|--------|---------|
| `/api/workshop/getAllWorkshops` | GET | List all workshops (paginated + search) |
| `/api/workshop/createWorkshop` | POST | Create new workshop |
| `/api/workshop/updateWorkshop` | PUT | Update workshop details |
| `/api/workshop/deleteWorkshop/:id` | DELETE | Delete workshop |
| `/api/workshop/getAllWorkshopSchedules` | GET | List all scheduled workshop instances |
| `/api/workshop/scheduleWorkshop` | POST | Schedule workshop for a company |
| `/api/workshop/cancelWorkshopSchedule` | PUT | Cancel a scheduled session |
| `/api/workshop/rescheduleWorkshop` | PUT | Change schedule date/time |
| `/api/workshop/updateWorkshopScheduleStatus` | PUT | Update schedule status |
| `/api/uploads/workshop/files` | POST | Upload workshop PDF + cover image |

### Articles
| API | Method | Purpose |
|-----|--------|---------|
| `/api/article/getArticles` | GET | List all articles (paginated + search) |
| `/api/article/createArticle` | POST | Create article (with thumbnail upload) |
| `/api/article/updateArticle` | PUT | Update article |
| `/api/article/deleteArticle/:id` | DELETE | Delete article |

### Gallery / Media Library
| API | Method | Purpose |
|-----|--------|---------|
| `/api/getGalleryItems` | GET | List all gallery items (with company/type filters) |
| `/api/uploadGalleryItem` | POST | Upload new media file |
| `/api/updateGalleryItem` | PUT | Update media metadata |
| `/api/deleteGalleryItem/:id` | DELETE | Delete media file |
| `/api/assignToCompany` | POST | Assign gallery items to a company |
| `/api/getMediaCounts` | GET | Count media by type |
| `/api/uploads/gallery` | POST | Raw file upload to S3 |

### Soundscapes
| API | Method | Purpose |
|-----|--------|---------|
| `/api/soundscapes/getSoundscapes` | GET | List all soundscapes |
| `/api/soundscapes/createSoundscape` | POST | Upload soundscape (audio + cover image) |
| `/api/soundscapes/deleteSoundscape` | DELETE | Remove soundscape |

### Assessments
| API | Method | Purpose |
|-----|--------|---------|
| `/api/assessments/getAllAssessments` | GET | List all assessments (paginated) |
| `/api/assessments/list` | GET | Lightweight list for dropdowns |
| `/api/assessments/createAssessment` | POST | Create assessment with questions |
| `/api/assessments/updateAssessment` | PUT | Update assessment |
| `/api/assessments/deleteAssessment/:id` | DELETE | Delete assessment |
| `/api/assessments/getAssessmentCompletionList` | GET | View completion status by company |
| `/api/assessments/responses/:assessment_id` | GET | View individual user responses |

### Therapists
| API | Method | Purpose |
|-----|--------|---------|
| `/api/user/getTherapists` | GET | List all therapists (paginated + search) |
| `/api/user/createTherapist` | POST | Create therapist account |
| `/api/user/updateTherapist/:id` | PUT | Update therapist profile |
| `/api/user/deleteTherapist/:id` | DELETE | Deactivate therapist |

### Notifications & Announcements
| API | Method | Purpose |
|-----|--------|---------|
| `/api/announcements/list` | GET | List announcements |
| `/api/announcements/create` | POST | Create new announcement |
| `/api/announcements/update` | PUT | Update announcement |
| `/api/announcements/delete/:id` | DELETE | Delete announcement |

### QnA / FAQ
| API | Method | Purpose |
|-----|--------|---------|
| `/api/qna/list` | GET | List FAQ items |
| `/api/qna/create` | POST | Create FAQ entry |
| `/api/qna/update` | PUT | Update FAQ entry |
| `/api/qna/:id` | DELETE | Delete FAQ entry |

### Activity Logs
| API | Method | Purpose |
|-----|--------|---------|
| `/api/logs/list` | GET | View all activity logs (filtered/paginated) |
| `/api/logs/summary` | GET | Activity summary by module |

### Dashboard Overview
| API | Method | Purpose |
|-----|--------|---------|
| `/api/dashboard/metrics` | GET | Platform-wide summary metrics |
| `/api/analytics/trends` | GET | Platform trend charts |

---

## Dashboard 3 — Employee Dashboard (`Neure-Employee-Dashboard`)

**Role:** Individual employees view content, complete assessments, manage their profile, and engage with company resources.

### Auth & Session
| API | Method | Purpose |
|-----|--------|---------|
| `/api/user/login` | POST | Login with `role_id: 3` |
| `/api/user/logout` | POST | Logout |
| `/api/user/refresh-token` | POST | Refresh access token |
| `/api/user/changePassword` | POST | Change password (requires current password) |
| `/api/user/forgotPassword` | POST | Send reset link to email (no auth, token valid 1h) |
| `/api/user/resetPassword` | POST | Set new password via email token (no auth) |
| `/api/user/updateTermsAcceptance` | PUT | Accept T&C |
| `/api/user/updateDashboardTourStatus` | PUT | Mark tour as seen |

### Profile
| API | Method | Purpose |
|-----|--------|---------|
| `/api/user/getUserDetails` | GET | Load own profile |
| `/api/user/updateUserDetails` | PUT | Update profile fields + photo (multipart) |
| `/api/user/getUserSubscription` | GET | View notification preferences |
| `/api/user/updateUserSubscription` | PUT | Update notification preferences |

### Wellbeing
| API | Method | Purpose |
|-----|--------|---------|
| `/api/user/updateStressLevel` | POST | Submit stress level (0-100) with message |
| `/api/user/submitPSI` | POST | Submit Psychological Safety Index score (1-5) |
| `/api/company/getCompanyMetrics` | GET | View company wellbeing metrics |

### Workshops
| API | Method | Purpose |
|-----|--------|---------|
| `/api/workshop/getWorkshopsByCompanyIdOrUserId` | GET | List company's workshops |
| `/api/workshop/getWorkshopDatesByCompanyIdOrUserId` | GET | Workshop calendar dates |
| `/api/workshop/getWorkshopDetails` | GET | Single workshop detail |
| `/api/user/getUserWorkshops` | GET | Own assigned workshops |

### Content & Resources
| API | Method | Purpose |
|-----|--------|---------|
| `/api/article/getArticles` | GET | List articles (paginated, limit 6) |
| `/api/getGalleryItems` | GET | List gallery media |
| `/api/soundscapes/getSoundscapeByUserId` | GET | List soundscapes |
| `/api/soundscapes/getLikedSoundscapes` | GET | Own liked soundscapes |
| `/api/soundscapes/like/:soundscapeId` | POST | Like a soundscape |
| `/api/soundscapes/unlike/:soundscapeId` | DELETE | Unlike a soundscape |
| `/api/tracking/trackResourceView` | POST | Log content view for tracking |

### Assessments
| API | Method | Purpose |
|-----|--------|---------|
| `/api/assessments/getAllAssessments` | GET | List available assessments |
| `/api/assessments/submit` | POST | Submit assessment answers |
| `/api/assessments/user-submissions` | GET | Own past submissions |
| `/api/assessments/responses/:assessment_id` | GET | View own responses for an assessment |
| `/api/assessments/generateAssessmentPdf/:assessment_id` | GET | Download assessment result as PDF |
| `/api/user/updateFirstAssessmentCompleted` | PUT | Mark first assessment as done (user_id from JWT, no body) |

### Rewards
| API | Method | Purpose |
|-----|--------|---------|
| `/api/rewards/getAllRewards` | GET | List all rewards |
| `/api/user/getEmployeeRewards` | GET | Own assigned rewards (paginated) |
| `/api/user/claimReward` | POST | Claim an assigned reward |

### Notifications & Announcements
| API | Method | Purpose |
|-----|--------|---------|
| `/api/notifications/list` | GET | Own notifications |
| `/api/notifications/unread-count` | GET | Unread count for badge |
| `/api/notifications/mark-all-read` | POST | Mark notifications as read |
| `/api/announcements/list` | GET | Company announcements (audience: employees) |
| `/api/announcements/mark-all-read` | POST | Mark announcements as read |

### FAQ & Feedback
| API | Method | Purpose |
|-----|--------|---------|
| `/api/qna/list` | GET | View FAQ items |
| `/api/company/createFeedback` | POST | Submit feedback |

---

## Key Shared Flows

### Login Flow (all dashboards)
1. POST `/api/user/login` with `{email, password, role_id}`
2. Server validates credentials + checks `is_active` in `company_employees` (for role 2 & 3)
3. Returns `accessToken` (5h TTL) + `refreshToken` (7d TTL) + `companyId` + `companyOnboarded`
4. Dashboard stores tokens in `localStorage`
5. All subsequent requests send `Authorization: Bearer <accessToken>`
6. On 401/403: auto-refresh via POST `/api/user/refresh-token`

### Token Refresh Flow
1. On 401/403 response, interceptor fires
2. POST `/api/user/refresh-token` with `Authorization: Bearer <refreshToken>`
3. Server validates refresh token in `refresh_tokens` table
4. Returns new `accessToken`
5. Retry original request with new token

### Forgot Password Flow
1. POST `/api/user/forgotPassword` with `{ email }` — no auth header needed
2. Server looks up user, generates 32-byte hex token, stores in `password_reset_tokens` (expires in 1h), deletes any previous token for that user
3. Sends reset email with dashboard-specific link (link contains token + role)
4. User clicks link → POST `/api/user/resetPassword` with `{ token, new_password }` — no auth header needed
5. Server validates token: must exist, `used = 0`, and not expired
6. Updates password, marks token `used = 1`, sends in-app `ACCOUNT_UPDATE` notification
