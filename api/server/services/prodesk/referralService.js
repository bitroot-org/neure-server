const db = require('../../../config/db');

const REFERRAL_RULES = [
  'Every ProDesk user gets a unique referral code inside their dashboard.',
  'Share your referral code with fellow psychologists, therapists, clinics, or professionals.',
  'When someone joins ProDesk using your referral code and subscribes successfully, you earn 10% of their subscription amount.',
  'Referral rewards are counted only on the first subscription payment made by the referred user.',
  'Monthly renewals of referred users are not eligible for additional referral rewards.',
  'Referral payouts are transferred to your registered bank account on the 5th of every month.',
  'You can track your referrals, earnings, and payout history directly inside your dashboard.',
  'The referral code must be entered during signup. It cannot be added or changed after the account is created.',
  'Only genuine referrals are eligible. Self-referrals or fake accounts will lead to account restriction.',
  'Referral Program is only active for Professional or Clinic plan subscribers.'
];

const getReferralService = async ({ therapist_id }) => {
  try {
    const [[therapist]] = await db.query(
      `SELECT t.referral_code, pp.plan_type
       FROM therapists t
       LEFT JOIN prodesk_subscriptions ps ON t.id = ps.therapist_id AND ps.status = 'active'
       LEFT JOIN prodesk_plans pp ON ps.plan_id = pp.id
       WHERE t.id = ?`, [therapist_id]
    );
    if (!therapist) return { status: false, code: 404, message: 'Therapist not found', data: null };

    const is_eligible = therapist.plan_type && therapist.plan_type !== 'starter';

    const [[wallet]] = await db.query(
      `SELECT balance, pending_balance, total_earned, total_paid FROM prodesk_referral_wallet WHERE therapist_id = ?`,
      [therapist_id]
    );
    const [[{ referred_count }]] = await db.query(
      `SELECT COUNT(*) AS referred_count FROM prodesk_referrals WHERE referrer_therapist_id = ?`, [therapist_id]
    );

    return {
      status: true, code: 200, message: 'Referral data fetched',
      data: {
        referral_code: therapist.referral_code,
        is_eligible,
        wallet: wallet || { balance: 0, pending_balance: 0, total_earned: 0, total_paid: 0 },
        referred_count,
        rules: REFERRAL_RULES
      }
    };
  } catch (error) {
    console.log('Error in getReferralService::>>', error);
    return null;
  }
};

const getReferralHistoryService = async ({ therapist_id, page = 1, limit = 20 }) => {
  try {
    const offset = (page - 1) * limit;
    const [referrals] = await db.query(
      `SELECT CONCAT(u.first_name,' ',u.last_name) AS referred_name, u.email AS referred_email,
              pr.status, pr.reward_amount, pr.converted_at
       FROM prodesk_referrals pr
       JOIN therapists t ON pr.referred_therapist_id = t.id
       JOIN users u ON t.user_id = u.user_id
       WHERE pr.referrer_therapist_id = ? ORDER BY pr.created_at DESC LIMIT ? OFFSET ?`,
      [therapist_id, parseInt(limit), offset]
    );
    const [payouts] = await db.query(
      `SELECT amount, status, payout_month, paid_on, bank_transfer_ref
       FROM prodesk_referral_payouts WHERE therapist_id = ? ORDER BY created_at DESC`, [therapist_id]
    );
    const [ledger] = await db.query(
      `SELECT type, amount, description, balance_after, created_at
       FROM prodesk_referral_wallet_ledger WHERE therapist_id = ? ORDER BY created_at DESC LIMIT 50`,
      [therapist_id]
    );
    const [[{ total_referrals }]] = await db.query(
      `SELECT COUNT(*) AS total_referrals FROM prodesk_referrals WHERE referrer_therapist_id = ?`, [therapist_id]
    );
    return {
      status: true, code: 200, message: 'Referral history fetched',
      data: { referrals, payouts, ledger },
      meta: { total_referrals, page: parseInt(page), limit: parseInt(limit) }
    };
  } catch (error) {
    console.log('Error in getReferralHistoryService::>>', error);
    return null;
  }
};

module.exports = { getReferralService, getReferralHistoryService };
