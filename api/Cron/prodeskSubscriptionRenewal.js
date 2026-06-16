const cron = require('node-cron');
const db = require('../config/db');

// NOTE: This cron is CREATED but NOT ACTIVATED.
// To activate, uncomment the initProdeskSubscriptionRenewal() call in api/index.js
// and ensure PRODESK_DASHBOARD_URL is set in .env

const initProdeskSubscriptionRenewal = () => {
  // Runs daily at 9:00 AM IST
  cron.schedule('0 3 * * *', async () => {
    console.log('[CRON] prodeskSubscriptionRenewal: running...');
    try {
      const today = new Date().toISOString().slice(0, 10);
      const in5Days = new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10);
      const in1Day = new Date(Date.now() + 1 * 86400000).toISOString().slice(0, 10);

      // 5-day reminder
      const [subs5] = await db.query(
        `SELECT ps.id, ps.therapist_id, pp.name AS plan_name, ps.current_period_end,
                u.email, u.first_name
         FROM prodesk_subscriptions ps
         JOIN prodesk_plans pp ON ps.plan_id = pp.id
         JOIN therapists t ON ps.therapist_id = t.id
         JOIN users u ON t.user_id = u.user_id
         WHERE ps.status = 'active' AND DATE(ps.current_period_end) = ? AND pp.plan_type != 'starter'`,
        [in5Days]
      );
      for (const sub of subs5) {
        console.log(`[CRON] 5-day reminder for therapist_id=${sub.therapist_id} email=${sub.email}`);
        // TODO: call NotificationService.sendEmail with template prodesk_renewal_reminder_5d
      }

      // 1-day reminder
      const [subs1] = await db.query(
        `SELECT ps.id, ps.therapist_id, pp.name AS plan_name, ps.current_period_end,
                u.email, u.first_name
         FROM prodesk_subscriptions ps
         JOIN prodesk_plans pp ON ps.plan_id = pp.id
         JOIN therapists t ON ps.therapist_id = t.id
         JOIN users u ON t.user_id = u.user_id
         WHERE ps.status = 'active' AND DATE(ps.current_period_end) = ? AND pp.plan_type != 'starter'`,
        [in1Day]
      );
      for (const sub of subs1) {
        console.log(`[CRON] 1-day reminder for therapist_id=${sub.therapist_id} email=${sub.email}`);
        // TODO: call NotificationService.sendEmail with template prodesk_renewal_reminder_1d
      }

      // Mark expired subscriptions
      const [expired] = await db.query(
        `SELECT ps.id, ps.therapist_id, pp.name AS plan_name, u.email, u.first_name
         FROM prodesk_subscriptions ps
         JOIN prodesk_plans pp ON ps.plan_id = pp.id
         JOIN therapists t ON ps.therapist_id = t.id
         JOIN users u ON t.user_id = u.user_id
         WHERE ps.status = 'active' AND DATE(ps.current_period_end) < ? AND pp.plan_type != 'starter'`,
        [today]
      );
      if (expired.length) {
        const ids = expired.map(s => s.id);
        await db.query(`UPDATE prodesk_subscriptions SET status = 'expired' WHERE id IN (?)`, [ids]);
        for (const sub of expired) {
          console.log(`[CRON] Marked expired: therapist_id=${sub.therapist_id}`);
          // TODO: call NotificationService.sendEmail with template prodesk_subscription_expired
        }
      }

      console.log(`[CRON] prodeskSubscriptionRenewal: done. 5d=${subs5.length}, 1d=${subs1.length}, expired=${expired.length}`);
    } catch (error) {
      console.log('[CRON] prodeskSubscriptionRenewal error::>>', error);
    }
  }, { timezone: 'Asia/Kolkata' });

  console.log('[CRON] prodeskSubscriptionRenewal: scheduled (daily 9AM IST) — INACTIVE');
};

module.exports = initProdeskSubscriptionRenewal;
