const express = require('express');
const multer = require('multer');
const router = express.Router();
const { authorization } = require('../../auth/tokenValidator');
const Ctrl            = require('../controllers/admin/prodeskAdminController');
const BankAccountCtrl = require('../controllers/prodesk/bankAccountController');

const csvUpload = multer({
  dest: 'temp/',
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) return cb(null, true);
    cb(new Error('Only CSV files are allowed'));
  }
});

// ── BUSINESS OVERVIEW ─────────────────────────────────────────
router.post('/get-overview',            authorization, Ctrl.getOverview);
router.post('/get-revenue',             authorization, Ctrl.getRevenue);
router.post('/get-active-users',        authorization, Ctrl.getActiveUsers);
router.post('/get-discontinued-users',  authorization, Ctrl.getDiscontinuedUsers);

// ── THERAPIST DETAILS ─────────────────────────────────────────
router.post('/get-therapists',          authorization, Ctrl.getTherapists);

// ── FEEDBACK ──────────────────────────────────────────────────
router.post('/get-feedback',            authorization, Ctrl.getFeedback);
router.post('/update-feedback-status',  authorization, Ctrl.updateFeedbackStatus);

// ── ACCOUNTS DEACTIVATED ──────────────────────────────────────
router.post('/get-deactivated-accounts', authorization, Ctrl.getDeactivatedAccounts);

// ── CODES & PROMOTIONS ────────────────────────────────────────
router.post('/get-offer-tags',          authorization, Ctrl.getOfferTags);
router.post('/create-offer-tag',        authorization, Ctrl.createOfferTag);
router.post('/create-offer',            authorization, Ctrl.createOffer);
router.post('/get-offers',              authorization, Ctrl.getOffers);
router.post('/get-offer-detail',        authorization, Ctrl.getOfferDetail);
router.post('/update-offer',            authorization, Ctrl.updateOffer);
router.post('/upload-offer-emails',     authorization, csvUpload.single('file'), Ctrl.uploadOfferEmails);
router.post('/get-sample-csv',          authorization, Ctrl.getSampleCsv);
router.post('/get-offer-emails',        authorization, Ctrl.getOfferEmails);
router.post('/edit-offer-email',        authorization, Ctrl.editOfferEmail);
router.post('/add-offer-emails',        authorization, Ctrl.addOfferEmails);

// ── REFERRAL PROGRAM ──────────────────────────────────────────
router.post('/get-referrals',           authorization, Ctrl.getReferrals);
router.post('/get-referral-detail',     authorization, Ctrl.getReferralDetail);
router.post('/get-pending-payouts',     authorization, Ctrl.getPendingPayouts);
router.post('/process-payout',          authorization, Ctrl.processPayout);

// ── SESSION DETAILS ───────────────────────────────────────────
router.post('/get-sessions',            authorization, Ctrl.getSessions);

// ── SUBSCRIPTIONS ─────────────────────────────────────────────
router.post('/get-subscriptions',       authorization, Ctrl.getSubscriptions);
router.post('/get-subscription-detail', authorization, Ctrl.getSubscriptionDetail);

// ── PAYMENTS ──────────────────────────────────────────────────
router.post('/get-payments',            authorization, Ctrl.getPayments);
router.post('/get-payment-detail',      authorization, Ctrl.getPaymentDetail);

// ── THERAPIST BY ID ───────────────────────────────────────────
router.post('/get-therapist-by-id',     authorization, Ctrl.getTherapistById);

// ── BANK ACCOUNT DETAILS ──────────────────────────────────────
router.post('/getBankAccountList',      authorization, BankAccountCtrl.adminGetAllBankAccounts);
router.post('/getBankAccountById',      authorization, BankAccountCtrl.adminGetBankAccountById);
router.post('/getBankAccountLogs',      authorization, BankAccountCtrl.adminGetBankAccountLogs);

module.exports = router;
