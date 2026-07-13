const express = require('express');
const multer = require('multer');
const router = express.Router();
const { authorization } = require('../../auth/tokenValidator');

// Controllers
const AuthCtrl      = require('../controllers/prodesk/authController');
const ProfileCtrl   = require('../controllers/prodesk/profileController');
const ClientCtrl    = require('../controllers/prodesk/clientController');
const SessionCtrl   = require('../controllers/prodesk/sessionController');
const NoteCtrl      = require('../controllers/prodesk/noteController');
const BillingCtrl   = require('../controllers/prodesk/billingController');
const ResourceCtrl  = require('../controllers/prodesk/resourceController');
const BookingCtrl   = require('../controllers/prodesk/bookingController');
const DashboardCtrl = require('../controllers/prodesk/dashboardController');
const TeamCtrl      = require('../controllers/prodesk/teamController');
const BankAccountCtrl    = require('../controllers/prodesk/bankAccountController');
const GoogleCtrl         = require('../controllers/prodesk/googleController');
const SubscriptionCtrl   = require('../controllers/prodesk/subscriptionController');
const OfferCtrl          = require('../controllers/prodesk/offerController');
const ReferralCtrl       = require('../controllers/prodesk/referralController');
const FeedbackCtrl       = require('../controllers/prodesk/feedbackController');

// Multer — image uploads (profile, logo, documents)
const imageUpload = multer({
  dest: 'temp/',
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    cb(null, allowed.includes(file.mimetype));
  }
});

// Multer — gallery/resource uploads (PDF, audio, video, images)
const resourceUpload = multer({
  dest: 'temp/',
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf',
      'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/mp4',
      'video/mp4', 'video/webm',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    cb(null, allowed.includes(file.mimetype));
  }
});

// ──────────────────────────────────────────────────────────────
// AUTH (no bearer)
// ──────────────────────────────────────────────────────────────
router.post('/register',         AuthCtrl.register);
router.post('/verifyEmail',      AuthCtrl.verifyEmail);
router.post('/resendOtp',        AuthCtrl.resendOtp);
router.post('/login',            AuthCtrl.login);
router.post('/refreshToken',     AuthCtrl.refreshToken);
router.post('/forgotPassword',   AuthCtrl.forgotPassword);
router.post('/verifyForgotOtp',  AuthCtrl.verifyForgotOtp);
router.post('/resetPassword',    AuthCtrl.resetPassword);
// Public status check for pre-login pages (register/login) — exposes only
// is-maintenance-on + message + end time, nothing user-specific.
router.post('/publicMaintenanceStatus', DashboardCtrl.getMaintenanceStatus);

// ──────────────────────────────────────────────────────────────
// AUTH (bearer required)
// ──────────────────────────────────────────────────────────────
router.post('/logout',          authorization, AuthCtrl.logout);
router.post('/logoutAll',       authorization, AuthCtrl.logoutAll);
router.post('/changePassword',  authorization, AuthCtrl.changePassword);
router.post('/getDeviceSessions', authorization, AuthCtrl.getSessions);
router.post('/revokeSession',   authorization, AuthCtrl.revokeSession);

// ──────────────────────────────────────────────────────────────
// PROFILE & SETTINGS
// ──────────────────────────────────────────────────────────────
router.post('/getProfile',          authorization, ProfileCtrl.getProfile);
router.post('/updateProfile',       authorization, imageUpload.single('file'), ProfileCtrl.updateProfile);
router.post('/getAvailability',     authorization, ProfileCtrl.getAvailability);
router.post('/updateAvailability',  authorization, ProfileCtrl.updateAvailability);
router.post('/getBranding',         authorization, ProfileCtrl.getBranding);
router.post('/updateBranding',      authorization, ProfileCtrl.updateBranding);
router.post('/uploadBrandingLogo',  authorization, imageUpload.single('file'),     ProfileCtrl.uploadBrandingLogo);
router.post('/uploadBrandLogo',     authorization, imageUpload.single('logo'),     ProfileCtrl.uploadBrandingLogo);
router.post('/uploadWallpaper',     authorization, imageUpload.single('wallpaper'), ProfileCtrl.uploadWallpaper);
router.post('/getDocuments',        authorization, ProfileCtrl.getDocuments);
router.post('/uploadDocument',      authorization, imageUpload.single('file'), ProfileCtrl.uploadDocument);
router.post('/deleteDocument',      authorization, ProfileCtrl.deleteDocument);
router.post('/getBookingLink',        authorization, ProfileCtrl.getBookingLink);
router.post('/completeOnboarding',    authorization, ProfileCtrl.completeOnboarding);
router.post('/updateOnboardingStep',  authorization, ProfileCtrl.updateOnboardingStep);

// ──────────────────────────────────────────────────────────────
// CLIENTS
// ──────────────────────────────────────────────────────────────
router.post('/createClient',    authorization, ClientCtrl.createClient);
router.post('/getClients',      authorization, ClientCtrl.getClients);
router.post('/getClientById',   authorization, ClientCtrl.getClientById);
router.post('/updateClient',    authorization, ClientCtrl.updateClient);
router.post('/archiveClient',   authorization, ClientCtrl.archiveClient);
router.post('/requestClientRecordHistory', authorization, ClientCtrl.requestRecordHistoryUpdate);

// ──────────────────────────────────────────────────────────────
// SESSIONS
// ──────────────────────────────────────────────────────────────
router.post('/createSession',       authorization, SessionCtrl.createSession);
router.post('/getSessions',         authorization, SessionCtrl.getSessions);
router.post('/getSessionById',      authorization, SessionCtrl.getSessionById);
router.post('/updateSession',       authorization, SessionCtrl.updateSession);
router.post('/rescheduleSession',   authorization, SessionCtrl.rescheduleSession);
router.post('/cancelSession',       authorization, SessionCtrl.cancelSession);
router.post('/getSlots',            authorization, SessionCtrl.getSlots);
router.post('/deleteSession',       authorization, SessionCtrl.deleteSession);
router.post('/completeSession',     authorization, SessionCtrl.completeSession);
router.post('/getCalendarSessions', authorization, SessionCtrl.getCalendarSessions);
router.post('/getTodaySessions',    authorization, SessionCtrl.getTodaySessions);
router.post('/getMeetingRoom',      authorization, SessionCtrl.getMeetingRoom);
router.post('/sendSessionReminder', authorization, SessionCtrl.sendSessionReminder);

// ──────────────────────────────────────────────────────────────
// SESSION NOTES
// ──────────────────────────────────────────────────────────────
router.post('/createNote',              authorization, NoteCtrl.createNote);
router.post('/getNote',                 authorization, NoteCtrl.getNote);
router.post('/updateNote',              authorization, NoteCtrl.updateNote);
router.post('/getClientNotes',          authorization, NoteCtrl.getClientNotes);
router.post('/uploadNoteAttachment',    authorization, resourceUpload.single('file'), NoteCtrl.uploadNoteAttachment);
router.post('/deleteNoteAttachment',    authorization, NoteCtrl.deleteNoteAttachment);

// ──────────────────────────────────────────────────────────────
// BILLING & INVOICES
// ──────────────────────────────────────────────────────────────
router.post('/createInvoice',          authorization, BillingCtrl.createInvoice);
router.post('/updateInvoice',          authorization, BillingCtrl.updateInvoice);
router.post('/getInvoices',            authorization, BillingCtrl.getInvoices);
router.post('/getInvoiceById',         authorization, BillingCtrl.getInvoiceById);
router.post('/sendInvoice',            authorization, BillingCtrl.sendInvoice);
router.post('/resendInvoice',          authorization, BillingCtrl.resendInvoice);
router.post('/getInvoicePaymentLink',  authorization, BillingCtrl.getInvoicePaymentLink);
router.post('/cancelInvoice',          authorization, BillingCtrl.cancelInvoice);
router.post('/markInvoicePaid',        authorization, BillingCtrl.markInvoicePaid);
router.post('/initiateRefund',         authorization, BillingCtrl.initiateRefund);
router.post('/getPaymentLogs',         authorization, BillingCtrl.getPaymentLogs);
router.post('/getBillingSummary',      authorization, BillingCtrl.getBillingSummary);
router.post('/getPayments',            authorization, BillingCtrl.getPayments);
router.post('/razorpayWebhook',        BillingCtrl.razorpayWebhook); // no auth — HMAC verified
router.get('/i/:invoice_number',       BillingCtrl.invoicePDFRedirect); // no auth — short URL redirect

// ──────────────────────────────────────────────────────────────
// RESOURCES
// ──────────────────────────────────────────────────────────────
router.post('/getResources',             authorization, ResourceCtrl.getResources);
router.post('/getResourceCategories',    authorization, ResourceCtrl.getResourceCategories);
router.post('/uploadResource',           authorization, resourceUpload.single('file'), ResourceCtrl.uploadResource);
router.post('/updateResource',           authorization, ResourceCtrl.updateResource);
router.post('/deleteResource',           authorization, ResourceCtrl.deleteResource);
router.post('/saveResourceToLibrary',    authorization, ResourceCtrl.saveResourceToLibrary);

// ──────────────────────────────────────────────────────────────
// PUBLIC BOOKING (no auth)
// ──────────────────────────────────────────────────────────────
router.post('/getPublicProfile',      BookingCtrl.getPublicProfile);
router.post('/getAvailableSlots',     BookingCtrl.getAvailableSlots);
router.post('/holdSlot',              BookingCtrl.holdSlot);
router.post('/confirmBooking',        BookingCtrl.confirmBooking);
router.post('/verifyBookingPayment',  BookingCtrl.verifyBookingPayment);
router.post('/getBookingSlots',       BookingCtrl.getBookingSlots);
router.post('/lookupBookingClient',   BookingCtrl.lookupBookingClient);
router.post('/createBookingSession',  BookingCtrl.createBookingSession);

// ──────────────────────────────────────────────────────────────
// NOTIFICATIONS
// ──────────────────────────────────────────────────────────────
router.post('/getNotifications',           authorization, DashboardCtrl.getNotifications);
router.post('/markNotificationRead',       authorization, DashboardCtrl.markNotificationRead);
router.post('/markAllNotificationsRead',   authorization, DashboardCtrl.markAllNotificationsRead);
router.post('/closeNotification',          authorization, DashboardCtrl.closeNotification);
router.post('/getPopupNotifications',      authorization, DashboardCtrl.getPopupNotifications);
router.post('/getMaintenanceStatus',       authorization, DashboardCtrl.getMaintenanceStatus);

// ──────────────────────────────────────────────────────────────
// DASHBOARD & METRICS
// ──────────────────────────────────────────────────────────────
router.post('/getDashboard', authorization, DashboardCtrl.getDashboard);
router.post('/getMetrics',   authorization, DashboardCtrl.getMetrics);

// ──────────────────────────────────────────────────────────────
// GOOGLE MEET OAUTH
// ──────────────────────────────────────────────────────────────
router.post('/google/auth-url',    authorization, GoogleCtrl.authUrl);
router.get('/google/callback',                    GoogleCtrl.callback); // GET — Google redirects here
router.post('/google/status',      authorization, GoogleCtrl.status);
router.post('/google/disconnect',  authorization, GoogleCtrl.disconnect);

// ──────────────────────────────────────────────────────────────
// TEAM / STAFF
// ──────────────────────────────────────────────────────────────
router.post('/getTeam',      authorization, TeamCtrl.getTeam);
router.post('/inviteStaff',  authorization, TeamCtrl.inviteStaff);
router.post('/updateStaff',  authorization, TeamCtrl.updateStaff);
router.post('/removeStaff',  authorization, TeamCtrl.removeStaff);

// ──────────────────────────────────────────────────────────────
// PLANS
// ──────────────────────────────────────────────────────────────
router.post('/plans/get',                    authorization, SubscriptionCtrl.getPlans);

// ──────────────────────────────────────────────────────────────
// SUBSCRIPTION (Razorpay Subscriptions — auto-debit)
// ──────────────────────────────────────────────────────────────
router.post('/subscription/get',                     authorization, SubscriptionCtrl.getSubscription);
router.post('/subscription/activate-free',           authorization, SubscriptionCtrl.activateFree);
router.post('/subscription/create',                  authorization, SubscriptionCtrl.createSubscription);
router.post('/subscription/confirm',                 authorization, SubscriptionCtrl.confirmSubscription);
router.post('/subscription/upgrade',                 authorization, SubscriptionCtrl.upgradeSubscription);
router.post('/subscription/upgrade/confirm-prorate', authorization, SubscriptionCtrl.confirmProrateAndSubscribe);
router.post('/subscription/downgrade',               authorization, SubscriptionCtrl.requestDowngrade);
router.post('/subscription/downgrade/cancel',        authorization, SubscriptionCtrl.cancelPendingDowngrade);
router.post('/subscription/cancel',                  authorization, SubscriptionCtrl.cancelSubscription);
router.post('/subscription/cancel/undo',             authorization, SubscriptionCtrl.undoCancelSubscription);

// ──────────────────────────────────────────────────────────────
// OFFERS
// ──────────────────────────────────────────────────────────────
router.post('/offers/validate',              authorization, OfferCtrl.validateOffer);

// ──────────────────────────────────────────────────────────────
// REFERRAL PROGRAM
// ──────────────────────────────────────────────────────────────
router.post('/referral/get',                 authorization, ReferralCtrl.getReferral);
router.post('/referral/get-history',         authorization, ReferralCtrl.getReferralHistory);

// ──────────────────────────────────────────────────────────────
// FAQ
// ──────────────────────────────────────────────────────────────
router.post('/getFaq', authorization, FeedbackCtrl.getFaq);

// ──────────────────────────────────────────────────────────────
// FEEDBACK
// ──────────────────────────────────────────────────────────────
router.post('/feedback/submit',              authorization, FeedbackCtrl.submitFeedback);

// ──────────────────────────────────────────────────────────────
// BANK ACCOUNT / PAYOUT DETAILS
// ──────────────────────────────────────────────────────────────
router.post('/getBankAccount',       authorization, BankAccountCtrl.getBankAccount);
router.post('/createBankAccount',    authorization, BankAccountCtrl.createBankAccount);
router.post('/updateBankAccount',    authorization, BankAccountCtrl.updateBankAccount);
router.post('/deleteBankAccount',    authorization, BankAccountCtrl.deleteBankAccount);
router.post('/verifyIFSC',           authorization, BankAccountCtrl.verifyIFSC);

module.exports = router;
