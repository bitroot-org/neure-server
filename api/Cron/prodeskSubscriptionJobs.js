const cron = require('node-cron');
const db   = require('../config/db');
const NotificationService = require('../server/services/notificationsAndAnnouncements/notificationService');
const { executePendingDowngradeService } = require('../server/services/prodesk/subscriptionService');

const BATCH_SIZE = 500;

// ─── JOB 1: Expire halted subscriptions past grace period ────────────────────
// Runs daily at 2:00 AM

const expireHaltedSubscriptions = async () => {
  let lastId = 0;
  let totalExpired = 0;

  try {
    while (true) {
      const [rows] = await db.query(
        `SELECT ps.id, ps.therapist_id, pp.name AS plan_name
         FROM prodesk_subscriptions ps
           JOIN prodesk_plans pp ON ps.plan_id = pp.id
         WHERE ps.status = 'halted'
           AND ps.grace_period_end < CURDATE()
           AND ps.id > ?
         ORDER BY ps.id ASC
         LIMIT ?`,
        [lastId, BATCH_SIZE]
      );

      if (!rows.length) break;

      const ids = rows.map(r => r.id);
      await db.query(
        `UPDATE prodesk_subscriptions SET status = 'expired' WHERE id IN (?)`,
        [ids]
      );

      for (const row of rows) {
        try {
          const [[therapistRow]] = await db.query(
            `SELECT u.email, u.first_name FROM therapists t JOIN users u ON t.user_id = u.user_id WHERE t.id = ?`,
            [row.therapist_id]
          );
          if (therapistRow) {
            await NotificationService.sendEmail({
              toEmail: therapistRow.email, toName: therapistRow.first_name,
              template: 'prodesk_subscription_expired',
              data: { therapist_name: therapistRow.first_name, plan_name: row.plan_name }
            });
          }
        } catch (_) {}
      }

      totalExpired += ids.length;
      lastId = rows[rows.length - 1].id;
      if (rows.length < BATCH_SIZE) break;
    }

    if (totalExpired) console.log(`[Cron] expireHaltedSubscriptions: expired ${totalExpired} subscription(s)`);
  } catch (error) {
    console.log('[Cron] expireHaltedSubscriptions error::>>', error.message);
  }
};

// ─── JOB 2: Safety-net cancel — period_end passed, cancel_at_period_end=1 ────
// Runs daily at 2:05 AM

const safetyNetCancelExpiredSubscriptions = async () => {
  let lastId = 0;
  let totalCancelled = 0;

  try {
    while (true) {
      const [rows] = await db.query(
        `SELECT id FROM prodesk_subscriptions
         WHERE cancel_at_period_end = 1
           AND status IN ('active', 'authenticated')
           AND current_period_end < CURDATE()
           AND id > ?
         ORDER BY id ASC
         LIMIT ?`,
        [lastId, BATCH_SIZE]
      );

      if (!rows.length) break;

      const ids = rows.map(r => r.id);
      await db.query(
        `UPDATE prodesk_subscriptions SET status = 'cancelled' WHERE id IN (?)`,
        [ids]
      );

      totalCancelled += ids.length;
      lastId = rows[rows.length - 1].id;
      if (rows.length < BATCH_SIZE) break;
    }

    if (totalCancelled) console.log(`[Cron] safetyNetCancel: cancelled ${totalCancelled} subscription(s)`);
  } catch (error) {
    console.log('[Cron] safetyNetCancelExpiredSubscriptions error::>>', error.message);
  }
};

// ─── JOB 3: Execute pending downgrades whose period has ended ─────────────────
// Runs daily at 2:10 AM

const executePendingDowngrades = async () => {
  let lastId = 0;
  let totalProcessed = 0;

  try {
    while (true) {
      const [rows] = await db.query(
        `SELECT id FROM prodesk_subscriptions
         WHERE pending_plan_id IS NOT NULL
           AND status IN ('active', 'authenticated')
           AND current_period_end < CURDATE()
           AND id > ?
         ORDER BY id ASC
         LIMIT ?`,
        [lastId, BATCH_SIZE]
      );

      if (!rows.length) break;

      for (const row of rows) {
        try {
          await executePendingDowngradeService({ subscription_id: row.id });
        } catch (_) {}
      }

      totalProcessed += rows.length;
      lastId = rows[rows.length - 1].id;
      if (rows.length < BATCH_SIZE) break;
    }

    if (totalProcessed) console.log(`[Cron] executePendingDowngrades: processed ${totalProcessed} downgrade(s)`);
  } catch (error) {
    console.log('[Cron] executePendingDowngrades error::>>', error.message);
  }
};

// ─── JOB 4: Renewal reminder emails — T-7, T-3, T-1 before period_end ────────
// Runs daily at 9:00 AM IST

const sendRenewalReminders = async () => {
  const targetDays = [7, 3, 1];

  try {
    for (const daysAhead of targetDays) {
      let lastId = 0;
      let totalSent = 0;

      while (true) {
        const [rows] = await db.query(
          `SELECT ps.id, ps.therapist_id, ps.billing_cycle, ps.current_period_end,
                  pp.name AS plan_name, pp.price_inr
           FROM prodesk_subscriptions ps
             JOIN prodesk_plans pp ON ps.plan_id = pp.id
           WHERE ps.status = 'active'
             AND ps.cancel_at_period_end = 0
             AND pp.plan_type != 'starter'
             AND DATEDIFF(ps.current_period_end, CURDATE()) = ?
             AND ps.id > ?
           ORDER BY ps.id ASC
           LIMIT ?`,
          [daysAhead, lastId, BATCH_SIZE]
        );

        if (!rows.length) break;

        for (const row of rows) {
          try {
            const [[therapistRow]] = await db.query(
              `SELECT u.email, u.first_name FROM therapists t JOIN users u ON t.user_id = u.user_id WHERE t.id = ?`,
              [row.therapist_id]
            );
            if (therapistRow) {
              const periodEndStr = row.current_period_end instanceof Date
                ? row.current_period_end.toISOString().slice(0, 10)
                : String(row.current_period_end).slice(0, 10);

              await NotificationService.sendEmail({
                toEmail: therapistRow.email, toName: therapistRow.first_name,
                template: 'prodesk_renewal_reminder',
                data: {
                  therapist_name: therapistRow.first_name,
                  plan_name:      row.plan_name,
                  renewal_date:   periodEndStr,
                  amount:         `₹${parseFloat(row.price_inr).toLocaleString('en-IN')}`,
                  days_remaining: daysAhead
                }
              });
            }
          } catch (_) {}
        }

        totalSent += rows.length;
        lastId = rows[rows.length - 1].id;
        if (rows.length < BATCH_SIZE) break;
      }

      if (totalSent) console.log(`[Cron] renewalReminders: sent T-${daysAhead} reminders to ${totalSent} therapist(s)`);
    }
  } catch (error) {
    console.log('[Cron] sendRenewalReminders error::>>', error.message);
  }
};

// ─── JOB 5: Grace period reminders — D+2, D+4 after halted ──────────────────
// Runs daily at 10:00 AM IST

const sendGracePeriodReminders = async () => {
  const reminderDays = [2, 4];

  try {
    for (const daysSinceHalt of reminderDays) {
      let lastId = 0;

      while (true) {
        const [rows] = await db.query(
          `SELECT ps.id, ps.therapist_id, ps.grace_period_end, pp.name AS plan_name
           FROM prodesk_subscriptions ps
             JOIN prodesk_plans pp ON ps.plan_id = pp.id
           WHERE ps.status = 'halted'
             AND DATEDIFF(CURDATE(), ps.halted_at) = ?
             AND ps.id > ?
           ORDER BY ps.id ASC
           LIMIT ?`,
          [daysSinceHalt, lastId, BATCH_SIZE]
        );

        if (!rows.length) break;

        for (const row of rows) {
          try {
            const [[therapistRow]] = await db.query(
              `SELECT u.email, u.first_name FROM therapists t JOIN users u ON t.user_id = u.user_id WHERE t.id = ?`,
              [row.therapist_id]
            );
            if (therapistRow) {
              const graceEndStr = row.grace_period_end instanceof Date
                ? row.grace_period_end.toISOString().slice(0, 10)
                : String(row.grace_period_end).slice(0, 10);

              await NotificationService.sendEmail({
                toEmail: therapistRow.email, toName: therapistRow.first_name,
                template: 'prodesk_grace_period_reminder',
                data: {
                  therapist_name:   therapistRow.first_name,
                  plan_name:        row.plan_name,
                  grace_period_end: graceEndStr
                }
              });
            }
          } catch (_) {}
        }

        lastId = rows[rows.length - 1].id;
        if (rows.length < BATCH_SIZE) break;
      }
    }
  } catch (error) {
    console.log('[Cron] sendGracePeriodReminders error::>>', error.message);
  }
};

// ─── INIT ─────────────────────────────────────────────────────────────────────

const initProdeskSubscriptionJobs = () => {
  cron.schedule('0 2 * * *',  expireHaltedSubscriptions);           // 2:00 AM daily
  cron.schedule('5 2 * * *',  safetyNetCancelExpiredSubscriptions); // 2:05 AM daily
  cron.schedule('10 2 * * *', executePendingDowngrades);            // 2:10 AM daily
  cron.schedule('30 3 * * *', sendRenewalReminders);                // 9:00 AM IST (3:30 UTC)
  cron.schedule('30 4 * * *', sendGracePeriodReminders);            // 10:00 AM IST (4:30 UTC)
};

module.exports = initProdeskSubscriptionJobs;
