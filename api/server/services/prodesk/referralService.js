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
      `SELECT t.id, t.referral_code, pp.plan_type
       FROM therapists t
       LEFT JOIN prodesk_subscriptions ps ON t.id = ps.therapist_id AND ps.status = 'active'
       LEFT JOIN prodesk_plans pp ON ps.plan_id = pp.id
       WHERE t.id = ?`, [therapist_id]
    );
    if (!therapist) return { status: false, code: 404, message: 'Therapist not found', data: null };

    // Auto-generate referral_code if missing (for therapists registered before migration)
    if (!therapist.referral_code) {
      const [[userRow]] = await db.query(
        `SELECT u.first_name FROM users u JOIN therapists t ON u.user_id = t.user_id WHERE t.id = ?`, [therapist_id]
      );
      const name = (userRow?.first_name || 'DR').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4).padEnd(4, 'X');
      const rand = Math.random().toString(36).toUpperCase().slice(2, 6);
      const code = `DR-${name}-${rand}`;
      await db.query(`UPDATE therapists SET referral_code = ? WHERE id = ?`, [code, therapist_id]);
      therapist.referral_code = code;
    }

    // Auto-create wallet if missing (for therapists registered before migration)
    let [[wallet]] = await db.query(
      `SELECT balance, pending_balance, total_earned, total_paid FROM prodesk_referral_wallet WHERE therapist_id = ?`,
      [therapist_id]
    );
    if (!wallet) {
      await db.query(`INSERT IGNORE INTO prodesk_referral_wallet (therapist_id) VALUES (?)`, [therapist_id]);
      wallet = { balance: 0, pending_balance: 0, total_earned: 0, total_paid: 0 };
    }

    const [[{ referred_count }]] = await db.query(
      `SELECT COUNT(*) AS referred_count FROM prodesk_referrals WHERE referrer_therapist_id = ?`, [therapist_id]
    );

    const is_eligible = therapist.plan_type && therapist.plan_type !== 'starter';

    return {
      status: true, code: 200, message: 'Referral data fetched',
      data: {
        referral_code: therapist.referral_code,
        is_eligible,
        wallet: {
          balance: parseFloat(wallet.balance),
          pending_balance: parseFloat(wallet.pending_balance),
          total_earned: parseFloat(wallet.total_earned),
          total_paid: parseFloat(wallet.total_paid)
        },
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
