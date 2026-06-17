const db = require('../../../config/db');
const RazorpayService = require('./razorpayService');
const NotificationService = require('../notificationsAndAnnouncements/notificationService');

const getPlansService = async () => {
  try {
    const [rows] = await db.query(
      `SELECT id, name, plan_type, access_type, billing_cycle, price_inr, per_unit_price, client_limit
       FROM prodesk_plans WHERE is_active = 1 ORDER BY access_type, plan_type, billing_cycle`
    );
    const early = rows.filter(r => r.access_type === 'early_access');
    const full = rows.filter(r => r.access_type === 'full_version');
    return { status: true, code: 200, message: 'Plans fetched', data: { early_access: early, full_version: full } };
  } catch (error) {
    console.log('Error in getPlansService::>>', error);
    return null;
  }
};

const getSubscriptionService = async ({ therapist_id }) => {
  try {
    const [[sub]] = await db.query(
      `SELECT ps.id AS subscription_id, pp.name AS plan_name, pp.plan_type, pp.access_type,
              pp.price_inr, pp.client_limit, ps.billing_cycle, ps.status,
              ps.current_period_start AS period_start, ps.current_period_end AS period_end,
              DATEDIFF(ps.current_period_end, CURDATE()) AS days_remaining,
              po.code AS offer_code, ps.psychologist_count
       FROM prodesk_subscriptions ps
       JOIN prodesk_plans pp ON ps.plan_id = pp.id
       LEFT JOIN prodesk_offers po ON ps.offer_id = po.id
       WHERE ps.therapist_id = ? AND ps.status IN ('active','pending_payment','expired')
       ORDER BY ps.created_at DESC LIMIT 1`,
      [therapist_id]
    );
    if (!sub) return { status: false, code: 404, message: 'No subscription found', data: null };
    return { status: true, code: 200, message: 'Subscription fetched', data: sub };
  } catch (error) {
    console.log('Error in getSubscriptionService::>>', error);
    return null;
  }
};

const activateFreeService = async ({ therapist_id, offer_id }) => {
  try {
    const [[existing]] = await db.query(
      `SELECT id FROM prodesk_subscriptions WHERE therapist_id = ? AND status = 'active'`, [therapist_id]
    );
    if (existing) return { status: false, code: 409, message: 'Active subscription already exists', data: null };

    const [[therapistRow]] = await db.query(
      `SELECT t.id, u.email, u.first_name FROM therapists t JOIN users u ON t.user_id = u.user_id WHERE t.id = ?`,
      [therapist_id]
    );

    let planId = 5; // full_version starter by default
    if (offer_id) {
      const [[offer]] = await db.query(
        `SELECT po.id, pt.name AS tag_name FROM prodesk_offers po
         JOIN prodesk_offer_tags pt ON po.tag_id = pt.id WHERE po.id = ? AND po.is_active = 1`,
        [offer_id]
      );
      if (offer && offer.tag_name === 'early_access') planId = 1; // early_access starter
    }

    const today = new Date().toISOString().slice(0, 10);
    const [result] = await db.query(
      `INSERT INTO prodesk_subscriptions (therapist_id, plan_id, status, billing_cycle, current_period_start, offer_id)
       VALUES (?,?,'active','monthly',?,?)`,
      [therapist_id, planId, today, offer_id || null]
    );
    const subscription_id = result.insertId;

    if (offer_id) {
      await db.query(
        `INSERT INTO prodesk_user_offers (offer_id, therapist_id, subscription_id, activated_at, redeemed_at, is_redeemed)
         VALUES (?,?,?,NOW(),NOW(),1)`, [offer_id, therapist_id, subscription_id]
      );
      await db.query(
        `UPDATE prodesk_offer_emails SET is_used=1, used_at=NOW(), used_by_therapist_id=?
         WHERE offer_id=? AND email=?`,
        [therapist_id, offer_id, therapistRow.email]
      );
      await db.query(`UPDATE prodesk_offers SET total_used = total_used + 1 WHERE id = ?`, [offer_id]);
    }

    try {
      await NotificationService.sendEmail({
        toEmail: therapistRow.email, toName: therapistRow.first_name,
        template: 'prodesk_starter_activated',
        data: { therapist_name: therapistRow.first_name, plan_name: 'Starter', dashboard_url: process.env.PRODESK_DASHBOARD_URL }
      });
    } catch (_) {}

    return { status: true, code: 200, message: 'Starter plan activated', data: { subscription_id, plan_name: 'Starter', status: 'active', next_step: 'profile_setup' } };
  } catch (error) {
    console.log('Error in activateFreeService::>>', error);
    return null;
  }
};

const createOrderService = async ({ therapist_id, plan_id, billing_cycle, offer_id }) => {
  try {
    if (!plan_id || !billing_cycle) return { status: false, code: 400, message: 'plan_id and billing_cycle are required', data: null };

    // Check existing active subscription
    const [[existing]] = await db.query(
      `SELECT ps.id, pp.plan_type FROM prodesk_subscriptions ps
       JOIN prodesk_plans pp ON ps.plan_id = pp.id
       WHERE ps.therapist_id = ? AND ps.status = 'active'`, [therapist_id]
    );

    if (existing) {
      // Block only if already on a paid plan — starter can upgrade
      if (existing.plan_type !== 'starter') {
        return { status: false, code: 409, message: 'Active paid subscription already exists. Use renew to extend.', data: null };
      }
    }

    const [[plan]] = await db.query(`SELECT * FROM prodesk_plans WHERE id = ? AND is_active = 1`, [plan_id]);
    if (!plan) return { status: false, code: 404, message: 'Plan not found', data: null };
    if (plan.plan_type === 'starter') return { status: false, code: 400, message: 'Use activate-free for Starter plan', data: null };

    let amount = parseFloat(plan.price_inr);

    if (offer_id) {
      const [[offer]] = await db.query(
        `SELECT po.*, pt.name AS tag_name FROM prodesk_offers po
         JOIN prodesk_offer_tags pt ON po.tag_id = pt.id
         WHERE po.id = ? AND po.is_active = 1 AND po.valid_from <= NOW() AND po.valid_till >= NOW()`,
        [offer_id]
      );
      if (offer && offer.is_percent && offer.percent_discount) {
        amount = amount - (amount * offer.percent_discount / 100);
        amount = Math.max(0, parseFloat(amount.toFixed(2)));
      }
    }

    const [[therapistRow]] = await db.query(
      `SELECT t.id, u.email, u.first_name FROM therapists t JOIN users u ON t.user_id = u.user_id WHERE t.id = ?`,
      [therapist_id]
    );

    const rzpOrder = await RazorpayService.createOrder({
      amount,
      notes: { therapist_id, plan_id, billing_cycle, offer_id: offer_id || '' }
    });
    if (!rzpOrder) return { status: false, code: 500, message: 'Failed to create Razorpay order', data: null };

    const [subResult] = await db.query(
      `INSERT INTO prodesk_subscriptions (therapist_id, plan_id, status, billing_cycle, offer_id)
       VALUES (?,?,'pending_payment',?,?)`,
      [therapist_id, plan_id, billing_cycle, offer_id || null]
    );
    const subscription_id = subResult.insertId;

    const [pmtResult] = await db.query(
      `INSERT INTO prodesk_subscription_payments (subscription_id, therapist_id, amount, razorpay_order_id, status, payment_for)
       VALUES (?,?,?,?,'created','new')`,
      [subscription_id, therapist_id, amount, rzpOrder.id]
    );
    await db.query(`UPDATE prodesk_subscriptions SET latest_payment_id = ? WHERE id = ?`, [pmtResult.insertId, subscription_id]);

    if (offer_id) {
      await db.query(
        `INSERT INTO prodesk_user_offers (offer_id, therapist_id, subscription_id, activated_at, is_redeemed)
         VALUES (?,?,?,NOW(),0)`, [offer_id, therapist_id, subscription_id]
      );
    }

    const keyId = await RazorpayService.getKeyId();
    return {
      status: true, code: 200, message: 'Order created',
      data: {
        subscription_id, razorpay_order_id: rzpOrder.id, razorpay_key_id: keyId,
        amount: Math.round(amount * 100), currency: 'INR',
        amount_display: `₹${amount.toLocaleString('en-IN')}`
      }
    };
  } catch (error) {
    console.log('Error in createOrderService (subscription)::>>', error);
    return null;
  }
};

const confirmPaymentService = async ({ therapist_id, subscription_id, razorpay_order_id, razorpay_payment_id, razorpay_signature }) => {
  try {
    if (!subscription_id || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return { status: false, code: 400, message: 'subscription_id, razorpay_order_id, razorpay_payment_id, razorpay_signature are required', data: null };
    }
    const valid = await RazorpayService.verifyPaymentSignature({ orderId: razorpay_order_id, paymentId: razorpay_payment_id, signature: razorpay_signature });
    if (!valid) return { status: false, code: 400, message: 'Payment signature verification failed', data: null };

    const [[sub]] = await db.query(
      `SELECT ps.*, pp.name AS plan_name, pp.billing_cycle AS plan_billing
       FROM prodesk_subscriptions ps JOIN prodesk_plans pp ON ps.plan_id = pp.id
       WHERE ps.id = ? AND ps.therapist_id = ?`, [subscription_id, therapist_id]
    );
    if (!sub) return { status: false, code: 404, message: 'Subscription not found', data: null };
    if (sub.status === 'active') return { status: false, code: 409, message: 'Subscription already active', data: null };

    const today = new Date();
    const periodStart = today.toISOString().slice(0, 10);
    const periodEnd = new Date(
      sub.billing_cycle === 'annual'
        ? new Date(today.setFullYear(today.getFullYear() + 1))
        : new Date(today.setMonth(today.getMonth() + 1))
    ).toISOString().slice(0, 10);

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      await conn.query(
        `UPDATE prodesk_subscription_payments SET razorpay_payment_id=?, status='captured', paid_at=NOW(),
         meta=? WHERE subscription_id=? AND razorpay_order_id=?`,
        [razorpay_payment_id, JSON.stringify({ razorpay_order_id, razorpay_payment_id }), subscription_id, razorpay_order_id]
      );
      await conn.query(
        `UPDATE prodesk_subscriptions SET status='active', current_period_start=?, current_period_end=? WHERE id=?`,
        [periodStart, periodEnd, subscription_id]
      );

      // Cancel old Starter subscription if upgrading
      await conn.query(
        `UPDATE prodesk_subscriptions ps
         JOIN prodesk_plans pp ON ps.plan_id = pp.id
         SET ps.status = 'cancelled'
         WHERE ps.therapist_id = ? AND ps.id != ? AND ps.status = 'active' AND pp.plan_type = 'starter'`,
        [therapist_id, subscription_id]
      );
      if (sub.offer_id) {
        const [[therapistRow]] = await conn.query(
          `SELECT u.email FROM therapists t JOIN users u ON t.user_id = u.user_id WHERE t.id = ?`, [therapist_id]
        );
        await conn.query(
          `UPDATE prodesk_user_offers SET is_redeemed=1, redeemed_at=NOW(), subscription_id=?
           WHERE offer_id=? AND therapist_id=?`, [subscription_id, sub.offer_id, therapist_id]
        );
        await conn.query(
          `UPDATE prodesk_offer_emails SET is_used=1, used_at=NOW(), used_by_therapist_id=?
           WHERE offer_id=? AND email=?`, [therapist_id, sub.offer_id, therapistRow.email]
        );
        await conn.query(`UPDATE prodesk_offers SET total_used = total_used + 1 WHERE id = ?`, [sub.offer_id]);
      }
      // Handle referral reward
      const [[referral]] = await conn.query(
        `SELECT * FROM prodesk_referrals WHERE referred_therapist_id = ? AND status = 'pending'`, [therapist_id]
      );
      if (referral) {
        const [[payment]] = await conn.query(
          `SELECT amount FROM prodesk_subscription_payments WHERE subscription_id = ? AND status = 'captured'`, [subscription_id]
        );
        if (payment) {
          const reward = parseFloat((payment.amount * 0.10).toFixed(2));
          await conn.query(
            `UPDATE prodesk_referrals SET status='rewarded', first_subscription_id=?, reward_amount=?, converted_at=NOW()
             WHERE id=?`, [subscription_id, reward, referral.id]
          );
          await conn.query(
            `UPDATE prodesk_referral_wallet SET pending_balance = pending_balance + ?, total_earned = total_earned + ?
             WHERE therapist_id = ?`, [reward, reward, referral.referrer_therapist_id]
          );
          const [[wallet]] = await conn.query(
            `SELECT pending_balance FROM prodesk_referral_wallet WHERE therapist_id = ?`, [referral.referrer_therapist_id]
          );
          await conn.query(
            `INSERT INTO prodesk_referral_wallet_ledger (therapist_id, type, amount, description, reference_id, reference_type, balance_after)
             VALUES (?,'credit',?,?,?,'referral',?)`,
            [referral.referrer_therapist_id, reward, `Referral reward — therapist_id ${therapist_id} signup`, referral.id, wallet.pending_balance]
          );
        }
      }
      await conn.commit();
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }

    const [[therapistRow]] = await db.query(
      `SELECT u.email, u.first_name FROM therapists t JOIN users u ON t.user_id = u.user_id WHERE t.id = ?`, [therapist_id]
    );
    try {
      await NotificationService.sendEmail({
        toEmail: therapistRow.email, toName: therapistRow.first_name,
        template: 'prodesk_subscription_activated',
        data: { therapist_name: therapistRow.first_name, plan_name: sub.plan_name, billing_cycle: sub.billing_cycle, period_end: periodEnd }
      });
    } catch (_) {}

    return {
      status: true, code: 200, message: 'Payment confirmed. Subscription activated.',
      data: { subscription_id, plan_name: sub.plan_name, billing_cycle: sub.billing_cycle, status: 'active', period_start: periodStart, period_end: periodEnd, next_step: 'profile_setup' }
    };
  } catch (error) {
    console.log('Error in confirmPaymentService::>>', error);
    return null;
  }
};

const renewOrderService = async ({ therapist_id }) => {
  try {
    const [[sub]] = await db.query(
      `SELECT ps.*, pp.price_inr, pp.name AS plan_name, pp.plan_type
       FROM prodesk_subscriptions ps JOIN prodesk_plans pp ON ps.plan_id = pp.id
       WHERE ps.therapist_id = ? AND ps.status IN ('active','expired')
       ORDER BY ps.created_at DESC LIMIT 1`, [therapist_id]
    );
    if (!sub) return { status: false, code: 404, message: 'No subscription found to renew', data: null };
    if (sub.plan_type === 'starter') return { status: false, code: 400, message: 'Free plan does not require renewal', data: null };

    const amount = parseFloat(sub.price_inr);
    const rzpOrder = await RazorpayService.createOrder({ amount, notes: { therapist_id, plan_id: sub.plan_id, type: 'renewal' } });
    if (!rzpOrder) return { status: false, code: 500, message: 'Failed to create Razorpay order', data: null };

    const [pmtResult] = await db.query(
      `INSERT INTO prodesk_subscription_payments (subscription_id, therapist_id, amount, razorpay_order_id, status, payment_for)
       VALUES (?,?,?,?,'created','renewal')`,
      [sub.id, therapist_id, amount, rzpOrder.id]
    );
    await db.query(`UPDATE prodesk_subscriptions SET latest_payment_id=?, status='pending_payment' WHERE id=?`, [pmtResult.insertId, sub.id]);

    const keyId = await RazorpayService.getKeyId();
    return {
      status: true, code: 200, message: 'Renewal order created',
      data: { subscription_id: sub.id, razorpay_order_id: rzpOrder.id, razorpay_key_id: keyId, amount: Math.round(amount * 100), currency: 'INR' }
    };
  } catch (error) {
    console.log('Error in renewOrderService::>>', error);
    return null;
  }
};

const confirmRenewalService = async ({ therapist_id, subscription_id, razorpay_order_id, razorpay_payment_id, razorpay_signature }) => {
  try {
    if (!subscription_id || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return { status: false, code: 400, message: 'All payment fields are required', data: null };
    }
    const valid = await RazorpayService.verifyPaymentSignature({ orderId: razorpay_order_id, paymentId: razorpay_payment_id, signature: razorpay_signature });
    if (!valid) return { status: false, code: 400, message: 'Payment signature verification failed', data: null };

    const [[sub]] = await db.query(
      `SELECT ps.*, pp.name AS plan_name FROM prodesk_subscriptions ps
       JOIN prodesk_plans pp ON ps.plan_id = pp.id
       WHERE ps.id = ? AND ps.therapist_id = ?`, [subscription_id, therapist_id]
    );
    if (!sub) return { status: false, code: 404, message: 'Subscription not found', data: null };

    const base = sub.current_period_end ? new Date(sub.current_period_end) : new Date();
    const newEnd = new Date(
      sub.billing_cycle === 'annual'
        ? new Date(base.setFullYear(base.getFullYear() + 1))
        : new Date(base.setMonth(base.getMonth() + 1))
    ).toISOString().slice(0, 10);

    await db.query(
      `UPDATE prodesk_subscription_payments SET razorpay_payment_id=?, status='captured', paid_at=NOW()
       WHERE subscription_id=? AND razorpay_order_id=?`,
      [razorpay_payment_id, subscription_id, razorpay_order_id]
    );
    await db.query(
      `UPDATE prodesk_subscriptions SET status='active', current_period_end=? WHERE id=?`,
      [newEnd, subscription_id]
    );

    const [[therapistRow]] = await db.query(
      `SELECT u.email, u.first_name FROM therapists t JOIN users u ON t.user_id = u.user_id WHERE t.id = ?`, [therapist_id]
    );
    try {
      await NotificationService.sendEmail({
        toEmail: therapistRow.email, toName: therapistRow.first_name,
        template: 'prodesk_subscription_renewed',
        data: { therapist_name: therapistRow.first_name, plan_name: sub.plan_name, period_end: newEnd }
      });
    } catch (_) {}

    return { status: true, code: 200, message: 'Subscription renewed', data: { subscription_id, status: 'active', period_end: newEnd } };
  } catch (error) {
    console.log('Error in confirmRenewalService::>>', error);
    return null;
  }
};

module.exports = {
  getPlansService, getSubscriptionService, activateFreeService,
  createOrderService, confirmPaymentService, renewOrderService, confirmRenewalService
};
