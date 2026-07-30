const db = require('../../../config/db');
const RazorpayService = require('./razorpayService');
const NotificationService = require('../notificationsAndAnnouncements/notificationService');

const PRORATE_MIN_AMOUNT = 10; // Skip prorate charge if below ₹10 — not worth the checkout friction

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const getTherapistRow = async (therapist_id) => {
  const [[row]] = await db.query(
    `SELECT t.id, u.email, u.first_name FROM therapists t JOIN users u ON t.user_id = u.user_id WHERE t.id = ?`,
    [therapist_id]
  );
  return row || null;
};

const getActivePaidSub = async (therapist_id) => {
  const [[sub]] = await db.query(
    `SELECT ps.*, pp.plan_type, pp.name AS plan_name, pp.price_inr
     FROM prodesk_subscriptions ps JOIN prodesk_plans pp ON ps.plan_id = pp.id
     WHERE ps.therapist_id = ? AND ps.status IN ('active','authenticated','halted')
       AND pp.plan_type != 'starter'
     ORDER BY ps.created_at DESC LIMIT 1`,
    [therapist_id]
  );
  return sub || null;
};

const getRazorpayPlanId = async (prodesk_plan_id) => {
  const [[row]] = await db.query(
    `SELECT razorpay_plan_id, price_inr AS amount FROM prodesk_plans
     WHERE id = ? AND is_active = 1`,
    [prodesk_plan_id]
  );
  return row || null;
};

// Days between two date strings (or Date objects)
const daysBetween = (from, to) => {
  const a = new Date(from);
  const b = new Date(to);
  a.setHours(0, 0, 0, 0);
  b.setHours(0, 0, 0, 0);
  return Math.max(0, Math.round((b - a) / 86400000));
};

// ─── ADMIN NOTIFY: new subscription (Free or Pro) ─────────────────────────────
// Fire-and-forget — must never fail/block the subscription flow that calls it.
const notifyAdminNewSubscription = async ({ therapist_name, therapist_email, plan_name, plan_type, billing_cycle }) => {
  try {
    await NotificationService.sendEmail({
      toEmail: 'support@neure.co.in', toName: 'Neure Support',
      template: 'prodesk_admin_new_subscription',
      data: { therapist_name, therapist_email, plan_name, plan_type, billing_cycle }
    });
  } catch (_) {}
};

// ─── GET PLANS ───────────────────────────────────────────────────────────────

const getPlansService = async () => {
  try {
    const [rows] = await db.query(
      `SELECT id, name, plan_type, access_type, billing_cycle,
              price_inr, per_unit_price, client_limit, razorpay_plan_id
       FROM prodesk_plans
       WHERE is_active = 1
       ORDER BY access_type, plan_type, billing_cycle`
    );
    const early = rows.filter(r => r.access_type === 'early_access');
    const full  = rows.filter(r => r.access_type === 'full_version');
    return { status: true, code: 200, message: 'Plans fetched', data: { early_access: early, full_version: full } };
  } catch (error) {
    console.log('Error in getPlansService::>>', error);
    return null;
  }
};

// ─── GET SUBSCRIPTION ────────────────────────────────────────────────────────

const getSubscriptionService = async ({ therapist_id }) => {
  try {
    const [[sub]] = await db.query(
      `SELECT
         ps.id AS subscription_id,
         pp.name AS plan_name, pp.plan_type, pp.access_type, pp.price_inr, pp.client_limit,
         ps.billing_cycle, ps.status,
         ps.razorpay_subscription_id,
         ps.cancel_at_period_end,
         ps.cancelled_at,
         ps.halted_at,
         ps.grace_period_end,
         ps.pending_plan_id,
         ps.pending_billing_cycle,
         ps.downgrade_requested_at,
         ps.cycle_count,
         DATE_ADD(DATE_ADD(ps.current_period_start, INTERVAL 5 HOUR), INTERVAL 30 MINUTE) AS period_start,
         DATE_ADD(DATE_ADD(ps.current_period_end,   INTERVAL 5 HOUR), INTERVAL 30 MINUTE) AS period_end,
         DATEDIFF(ps.current_period_end, CURDATE()) AS days_remaining,
         po.code AS offer_code,
         pp2.name AS pending_plan_name
       FROM prodesk_subscriptions ps
       JOIN prodesk_plans pp ON ps.plan_id = pp.id
       LEFT JOIN prodesk_offers po ON ps.offer_id = po.id
       LEFT JOIN prodesk_plans pp2 ON ps.pending_plan_id = pp2.id
       WHERE ps.therapist_id = ? AND ps.status IN ('active','pending','authenticated','halted','expired','cancelled')
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

// ─── ACTIVATE FREE (Starter) ─────────────────────────────────────────────────

const activateFreeService = async ({ therapist_id }) => {
  try {
    const [[existing]] = await db.query(
      `SELECT id FROM prodesk_subscriptions WHERE therapist_id = ? AND status IN ('active','authenticated')`,
      [therapist_id]
    );
    if (existing) return { status: false, code: 409, message: 'Active subscription already exists', data: null };

    const [[therapistRow]] = await db.query(
      `SELECT t.id, u.email, u.first_name FROM therapists t JOIN users u ON t.user_id = u.user_id WHERE t.id = ?`,
      [therapist_id]
    );

    let planId = 1; // Starter

    // Starter is free — offer codes give a discount, which doesn't apply here,
    // so no offer_id is ever stored/redeemed against a free-plan activation.
    const today = new Date().toISOString().slice(0, 10);
    const [result] = await db.query(
      `INSERT INTO prodesk_subscriptions (therapist_id, plan_id, status, billing_cycle, current_period_start)
       VALUES (?, ?, 'active', 'monthly', ?)`,
      [therapist_id, planId, today]
    );
    const subscription_id = result.insertId;

    try {
      await NotificationService.sendEmail({
        toEmail: therapistRow.email, toName: therapistRow.first_name,
        template: 'prodesk_starter_activated',
        data: { therapist_name: therapistRow.first_name, plan_name: 'Starter', dashboard_url: process.env.PRODESK_DASHBOARD_URL }
      });
    } catch (_) {}

    notifyAdminNewSubscription({ therapist_name: therapistRow.first_name, therapist_email: therapistRow.email, plan_name: 'Starter', plan_type: 'starter', billing_cycle: 'monthly' });

    return {
      status: true, code: 200, message: 'Starter plan activated',
      data: { subscription_id, plan_name: 'Starter', status: 'active', next_step: 'profile_setup' }
    };
  } catch (error) {
    console.log('Error in activateFreeService::>>', error);
    return null;
  }
};

// ─── CREATE SUBSCRIPTION ─────────────────────────────────────────────────────
// plan_id is always the plan the user selected, at full price — no plan-switching.
// If offer_id is passed, its razorpay_offer_id is handed straight to Razorpay;
// Razorpay applies the discount itself (per the offer's configured redemption
// type/cycles) and reverts to full plan price on renewal automatically.

const createSubscriptionService = async ({ therapist_id, plan_id, billing_cycle, offer_id }) => {
  try {
    if (!plan_id || !billing_cycle) {
      return { status: false, code: 400, message: 'plan_id and billing_cycle are required', data: null };
    }

    const [[plan]] = await db.query(`SELECT * FROM prodesk_plans WHERE id = ? AND is_active = 1`, [plan_id]);
    if (!plan) return { status: false, code: 404, message: 'Plan not found', data: null };
    if (plan.plan_type === 'starter') return { status: false, code: 400, message: 'Use activate-free for Starter plan', data: null };

    const activePaid = await getActivePaidSub(therapist_id);
    if (activePaid) {
      return { status: false, code: 409, message: 'Active subscription exists. Use upgrade or downgrade instead.', data: null };
    }

    // Find existing active Starter sub — kept active until payment is confirmed by webhook
    const [[currentStarterSub]] = await db.query(
      `SELECT ps.id FROM prodesk_subscriptions ps
         JOIN prodesk_plans pp ON ps.plan_id = pp.id
       WHERE ps.therapist_id = ? AND ps.status = 'active' AND pp.plan_type = 'starter'`,
      [therapist_id]
    );

    let razorpayOfferId = null;

    if (offer_id) {
      const [[offer]] = await db.query(
        `SELECT id, razorpay_offer_id FROM prodesk_offers
         WHERE id = ? AND is_active = 1 AND valid_from <= NOW() AND valid_till >= NOW()`,
        [offer_id]
      );
      if (!offer) return { status: false, code: 400, message: 'Offer is invalid or expired', data: null };
      razorpayOfferId = offer.razorpay_offer_id;
    }

    const rzpPlanRow = await getRazorpayPlanId(plan_id);
    if (!rzpPlanRow) {
      return { status: false, code: 500, message: 'Razorpay plan not configured for this plan. Contact support.', data: null };
    }

    const amount = parseFloat(rzpPlanRow.amount);
    const keyId  = await RazorpayService.getKeyId();

    const rzpSub = await RazorpayService.createSubscription({
      razorpayPlanId: rzpPlanRow.razorpay_plan_id,
      billingCycle: billing_cycle,
      offerId: razorpayOfferId,
      notes: { therapist_id: String(therapist_id), plan_id: String(plan_id), billing_cycle, offer_id: offer_id ? String(offer_id) : '' }
    });
    if (!rzpSub) return { status: false, code: 500, message: 'Failed to create Razorpay subscription', data: null };

    const [subResult] = await db.query(
      `INSERT INTO prodesk_subscriptions
         (therapist_id, plan_id, status, billing_cycle, razorpay_subscription_id, razorpay_plan_id, offer_id, linked_old_subscription_id)
       VALUES (?, ?, 'pending', ?, ?, ?, ?, ?)`,
      [therapist_id, plan_id, billing_cycle, rzpSub.id, rzpPlanRow.razorpay_plan_id, offer_id || null, currentStarterSub?.id || null]
    );

    return {
      status: true, code: 200, message: 'Subscription created',
      data: {
        subscription_id:          subResult.insertId,
        razorpay_subscription_id: rzpSub.id,
        razorpay_key_id:          keyId,
        amount:                   Math.round(amount * 100),
        amount_display:           `₹${amount.toLocaleString('en-IN')}`,
        currency:                 'INR'
      }
    };
  } catch (error) {
    console.log('Error in createSubscriptionService::>>', error);
    return null;
  }
};

// ─── CONFIRM SUBSCRIPTION (after frontend checkout callback) ─────────────────
// Verifies signature from Razorpay checkout, updates status to authenticated.
// Webhook subscription.charged handles the actual activation.

const confirmSubscriptionService = async ({ therapist_id, subscription_id, razorpay_subscription_id, razorpay_payment_id, razorpay_signature }) => {
  try {
    if (!subscription_id || !razorpay_subscription_id || !razorpay_payment_id || !razorpay_signature) {
      return { status: false, code: 400, message: 'subscription_id, razorpay_subscription_id, razorpay_payment_id, razorpay_signature are required', data: null };
    }

    const valid = await RazorpayService.verifySubscriptionSignature({
      subscriptionId: razorpay_subscription_id,
      paymentId:      razorpay_payment_id,
      signature:      razorpay_signature
    });
    if (!valid) return { status: false, code: 400, message: 'Signature verification failed', data: null };

    const [[sub]] = await db.query(
      `SELECT ps.*, pp.name AS plan_name FROM prodesk_subscriptions ps
         JOIN prodesk_plans pp ON ps.plan_id = pp.id
       WHERE ps.id = ? AND ps.therapist_id = ?`,
      [subscription_id, therapist_id]
    );
    if (!sub) return { status: false, code: 404, message: 'Subscription not found', data: null };
    if (sub.status === 'active') return { status: true, code: 200, message: 'Already active', data: { subscription_id, status: 'active' } };

    // Mark authenticated — webhook will promote to active on first charge
    await db.query(
      `UPDATE prodesk_subscriptions SET status = 'authenticated' WHERE id = ? AND status = 'pending'`,
      [subscription_id]
    );

    return {
      status: true, code: 200, message: 'Subscription mandate authorized. First charge will activate your plan.',
      data: { subscription_id, plan_name: sub.plan_name, status: 'authenticated' }
    };
  } catch (error) {
    console.log('Error in confirmSubscriptionService::>>', error);
    return null;
  }
};

// ─── UPGRADE SUBSCRIPTION ────────────────────────────────────────────────────
// Paid → Higher plan:
//   If prorate >= ₹10: return prorate order for frontend to pay (2-step)
//   If prorate < ₹10 or upgrading from Starter: skip prorate, immediate new sub

const upgradeSubscriptionService = async ({ therapist_id, new_plan_id, new_billing_cycle }) => {
  try {
    if (!new_plan_id || !new_billing_cycle) {
      return { status: false, code: 400, message: 'new_plan_id and new_billing_cycle are required', data: null };
    }

    const [[newPlan]] = await db.query(`SELECT * FROM prodesk_plans WHERE id = ? AND is_active = 1`, [new_plan_id]);
    if (!newPlan) return { status: false, code: 404, message: 'Target plan not found', data: null };
    if (newPlan.plan_type === 'starter') return { status: false, code: 400, message: 'Cannot upgrade to Starter', data: null };

    const [[currentSub]] = await db.query(
      `SELECT ps.*, pp.plan_type, pp.price_inr AS current_price, pp.name AS current_plan_name
       FROM prodesk_subscriptions ps JOIN prodesk_plans pp ON ps.plan_id = pp.id
       WHERE ps.therapist_id = ? AND ps.status IN ('active','authenticated','halted')
       ORDER BY ps.created_at DESC LIMIT 1`,
      [therapist_id]
    );

    // Block rapid re-upgrade (within 7 days of last upgrade)
    if (currentSub && currentSub.last_upgrade_at) {
      const daysSinceUpgrade = daysBetween(currentSub.last_upgrade_at, new Date());
      if (daysSinceUpgrade < 7) {
        return {
          status: false, code: 429,
          message: `You recently upgraded. Next upgrade available in ${7 - daysSinceUpgrade} day(s).`,
          data: null
        };
      }
    }

    // Same plan check
    if (currentSub && currentSub.plan_id === parseInt(new_plan_id) && currentSub.billing_cycle === new_billing_cycle) {
      return { status: false, code: 409, message: 'You are already on this plan', data: null };
    }

    const rzpPlanRow = await getRazorpayPlanId(new_plan_id);
    if (!rzpPlanRow) {
      return { status: false, code: 500, message: 'Razorpay plan not configured for target plan. Contact support.', data: null };
    }

    // ── Case A: No current paid sub (upgrading from Starter or fresh) ─────────
    if (!currentSub || currentSub.plan_type === 'starter') {
      const rzpSub = await RazorpayService.createSubscription({
        razorpayPlanId: rzpPlanRow.razorpay_plan_id,
        billingCycle: new_billing_cycle,
        notes: { therapist_id: String(therapist_id), plan_id: String(new_plan_id), billing_cycle: new_billing_cycle, type: 'upgrade' }
      });
      if (!rzpSub) return { status: false, code: 500, message: 'Failed to create Razorpay subscription', data: null };

      // Old (Starter) sub stays active until webhook confirms payment on the new one
      const [newSubResult] = await db.query(
        `INSERT INTO prodesk_subscriptions
           (therapist_id, plan_id, status, billing_cycle, razorpay_subscription_id, razorpay_plan_id, last_upgrade_at,
            linked_old_subscription_id)
         VALUES (?, ?, 'pending', ?, ?, ?, NOW(), ?)`,
        [therapist_id, new_plan_id, new_billing_cycle, rzpSub.id, rzpPlanRow.razorpay_plan_id, currentSub?.id || null]
      );

      const keyId = await RazorpayService.getKeyId();
      return {
        status: true, code: 200, message: 'Upgrade ready',
        data: {
          requires_prorate_payment:  false,
          subscription_id:           newSubResult.insertId,
          razorpay_subscription_id:  rzpSub.id,
          razorpay_key_id:           keyId,
          amount:                    Math.round(rzpPlanRow.amount * 100),
          amount_display:            `₹${parseFloat(rzpPlanRow.amount).toLocaleString('en-IN')}`,
          currency:                  'INR',
          new_plan_name:             newPlan.name
        }
      };
    }

    // ── Case B: Active paid → higher paid, calculate prorate ──────────────────
    const today           = new Date();
    const periodStart     = new Date(currentSub.current_period_start);
    const periodEnd       = new Date(currentSub.current_period_end);
    const daysInCycle     = Math.max(1, daysBetween(periodStart, periodEnd));
    const daysRemaining   = daysBetween(today, periodEnd);
    const oldPrice        = parseFloat(currentSub.current_price);
    const newPrice        = parseFloat(newPlan.price_inr);

    if (newPrice <= oldPrice) {
      return { status: false, code: 400, message: 'Use downgrade for switching to a lower plan', data: null };
    }

    const prorateAmount = parseFloat(((daysRemaining / daysInCycle) * (newPrice - oldPrice)).toFixed(2));

    // ── Case B1: prorate too small or last day — skip, immediate new sub ──────
    if (daysRemaining === 0 || prorateAmount < PRORATE_MIN_AMOUNT) {
      const rzpSub = await RazorpayService.createSubscription({
        razorpayPlanId: rzpPlanRow.razorpay_plan_id,
        billingCycle: new_billing_cycle,
        notes: { therapist_id: String(therapist_id), plan_id: String(new_plan_id), billing_cycle: new_billing_cycle, type: 'upgrade_immediate' }
      });
      if (!rzpSub) return { status: false, code: 500, message: 'Failed to create Razorpay subscription', data: null };

      // Old sub (and its Razorpay mandate) stays active until webhook confirms payment on the new one
      const [newSubResult] = await db.query(
        `INSERT INTO prodesk_subscriptions
           (therapist_id, plan_id, status, billing_cycle, razorpay_subscription_id, razorpay_plan_id,
            last_upgrade_at, linked_old_subscription_id)
         VALUES (?, ?, 'pending', ?, ?, ?, NOW(), ?)`,
        [therapist_id, new_plan_id, new_billing_cycle, rzpSub.id, rzpPlanRow.razorpay_plan_id, currentSub.id]
      );

      const keyId = await RazorpayService.getKeyId();
      return {
        status: true, code: 200, message: 'Upgrade ready',
        data: {
          requires_prorate_payment:  false,
          subscription_id:           newSubResult.insertId,
          razorpay_subscription_id:  rzpSub.id,
          razorpay_key_id:           keyId,
          amount:                    Math.round(rzpPlanRow.amount * 100),
          amount_display:            `₹${parseFloat(rzpPlanRow.amount).toLocaleString('en-IN')}`,
          currency:                  'INR',
          new_plan_name:             newPlan.name
        }
      };
    }

    // ── Case B2: prorate charge required ──────────────────────────────────────
    const rzpOrder = await RazorpayService.createOrder({
      amount: prorateAmount,
      notes: {
        therapist_id: String(therapist_id),
        type:         'prorate_upgrade',
        old_plan_id:  String(currentSub.plan_id),
        new_plan_id:  String(new_plan_id)
      }
    });
    if (!rzpOrder) return { status: false, code: 500, message: 'Failed to create prorate order', data: null };

    const newPeriodStart = today.toISOString().slice(0, 10);
    const newPeriodEnd   = currentSub.current_period_end instanceof Date
      ? currentSub.current_period_end.toISOString().slice(0, 10)
      : String(currentSub.current_period_end).slice(0, 10);

    await db.query(
      `INSERT INTO prodesk_pending_upgrades
         (therapist_id, old_subscription_id, new_plan_id, new_billing_cycle, prorate_amount,
          razorpay_order_id, new_period_start, new_period_end, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [therapist_id, currentSub.id, new_plan_id, new_billing_cycle, prorateAmount, rzpOrder.id, newPeriodStart, newPeriodEnd]
    );

    const keyId = await RazorpayService.getKeyId();
    return {
      status: true, code: 200, message: 'Prorate charge required to complete upgrade',
      data: {
        requires_prorate_payment:  true,
        prorate_amount:            Math.round(prorateAmount * 100),
        prorate_amount_display:    `₹${prorateAmount.toLocaleString('en-IN')}`,
        days_remaining:            daysRemaining,
        days_in_cycle:             daysInCycle,
        current_plan_name:         currentSub.current_plan_name,
        new_plan_name:             newPlan.name,
        new_period_end:            newPeriodEnd,
        next_cycle_amount:         Math.round(newPrice * 100),
        next_cycle_amount_display: `₹${newPrice.toLocaleString('en-IN')}`,
        razorpay_order_id:         rzpOrder.id,
        razorpay_key_id:           keyId,
        currency:                  'INR'
      }
    };
  } catch (error) {
    console.log('Error in upgradeSubscriptionService::>>', error);
    return null;
  }
};

// ─── CONFIRM PRORATE AND SUBSCRIBE ───────────────────────────────────────────
// Called after user pays the prorate order.
// Cancels old Razorpay sub, creates new sub with start_at = new_period_end.

const confirmProrateAndSubscribeService = async ({ therapist_id, razorpay_order_id, razorpay_payment_id, razorpay_signature }) => {
  try {
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return { status: false, code: 400, message: 'razorpay_order_id, razorpay_payment_id, razorpay_signature are required', data: null };
    }

    const valid = await RazorpayService.verifyPaymentSignature({ orderId: razorpay_order_id, paymentId: razorpay_payment_id, signature: razorpay_signature });
    if (!valid) return { status: false, code: 400, message: 'Signature verification failed', data: null };

    const [[upgrade]] = await db.query(
      `SELECT * FROM prodesk_pending_upgrades WHERE razorpay_order_id = ? AND therapist_id = ? AND status = 'pending'`,
      [razorpay_order_id, therapist_id]
    );
    if (!upgrade) return { status: false, code: 404, message: 'No pending upgrade found for this order', data: null };

    const rzpPlanRow = await getRazorpayPlanId(upgrade.new_plan_id);
    if (!rzpPlanRow) return { status: false, code: 500, message: 'Razorpay plan not configured', data: null };

    // new sub starts at new_period_end (current old period end)
    const startAtUnix = Math.floor(new Date(upgrade.new_period_end).getTime() / 1000);

    const rzpSub = await RazorpayService.createSubscription({
      razorpayPlanId: rzpPlanRow.razorpay_plan_id,
      billingCycle:   upgrade.new_billing_cycle,
      startAt:        startAtUnix,
      notes: { therapist_id: String(therapist_id), plan_id: String(upgrade.new_plan_id), type: 'prorate_upgrade' }
    });
    if (!rzpSub) return { status: false, code: 500, message: 'Failed to create new Razorpay subscription', data: null };

    const [[oldSub]] = await db.query(
      `SELECT * FROM prodesk_subscriptions WHERE id = ?`, [upgrade.old_subscription_id]
    );
    const [[newPlan]] = await db.query(`SELECT name FROM prodesk_plans WHERE id = ?`, [upgrade.new_plan_id]);

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      // Cancel old Razorpay subscription immediately
      if (oldSub?.razorpay_subscription_id) {
        await RazorpayService.cancelSubscription({ razorpaySubscriptionId: oldSub.razorpay_subscription_id, cancelAtCycleEnd: 0 });
      }
      await conn.query(
        `UPDATE prodesk_subscriptions SET status = 'cancelled', cancelled_at = NOW() WHERE id = ?`,
        [upgrade.old_subscription_id]
      );

      // Create new subscription row — period covers remainder of old cycle
      const [newSubResult] = await conn.query(
        `INSERT INTO prodesk_subscriptions
           (therapist_id, plan_id, status, billing_cycle, razorpay_subscription_id, razorpay_plan_id,
            current_period_start, current_period_end, last_upgrade_at, linked_old_subscription_id)
         VALUES (?, ?, 'authenticated', ?, ?, ?, ?, ?, NOW(), ?)`,
        [
          therapist_id, upgrade.new_plan_id, upgrade.new_billing_cycle,
          rzpSub.id, rzpPlanRow.razorpay_plan_id,
          upgrade.new_period_start, upgrade.new_period_end,
          upgrade.old_subscription_id
        ]
      );

      // Record prorate payment
      await conn.query(
        `INSERT INTO prodesk_subscription_payments
           (subscription_id, therapist_id, amount, razorpay_order_id, razorpay_payment_id,
            status, payment_for, cycle_number, billing_period_start, billing_period_end, paid_at)
         VALUES (?, ?, ?, ?, ?, 'captured', 'prorate_upgrade', 1, ?, ?, NOW())`,
        [
          newSubResult.insertId, therapist_id, upgrade.prorate_amount,
          razorpay_order_id, razorpay_payment_id,
          upgrade.new_period_start, upgrade.new_period_end
        ]
      );

      await conn.query(
        `UPDATE prodesk_pending_upgrades SET status = 'completed', razorpay_payment_id = ? WHERE id = ?`,
        [razorpay_payment_id, upgrade.id]
      );

      await conn.commit();

      const therapistRow = await getTherapistRow(therapist_id);
      try {
        await NotificationService.sendEmail({
          toEmail: therapistRow.email, toName: therapistRow.first_name,
          template: 'prodesk_subscription_upgraded',
          data: {
            therapist_name:   therapistRow.first_name,
            new_plan_name:    newPlan.name,
            prorate_amount:   `₹${upgrade.prorate_amount}`,
            next_cycle_start: upgrade.new_period_end,
            next_cycle_price: `₹${rzpPlanRow.amount}`
          }
        });
      } catch (_) {}

      return {
        status: true, code: 200, message: 'Upgrade successful',
        data: {
          subscription_id:          newSubResult.insertId,
          razorpay_subscription_id: rzpSub.id,
          plan_name:                newPlan.name,
          status:                   'authenticated',
          current_period_end:       upgrade.new_period_end,
          next_full_cycle_start:    upgrade.new_period_end
        }
      };
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  } catch (error) {
    console.log('Error in confirmProrateAndSubscribeService::>>', error);
    return null;
  }
};

// ─── REQUEST DOWNGRADE ────────────────────────────────────────────────────────
// Keeps current plan active. Creates new Razorpay sub with start_at = period_end.
// User authorizes mandate for new plan now — auto-charges after period_end.

const requestDowngradeService = async ({ therapist_id, new_plan_id, new_billing_cycle }) => {
  try {
    if (!new_plan_id || !new_billing_cycle) {
      return { status: false, code: 400, message: 'new_plan_id and new_billing_cycle are required', data: null };
    }

    const [[currentSub]] = await db.query(
      `SELECT ps.*, pp.price_inr AS current_price, pp.name AS current_plan_name
       FROM prodesk_subscriptions ps JOIN prodesk_plans pp ON ps.plan_id = pp.id
       WHERE ps.therapist_id = ? AND ps.status IN ('active','authenticated')
       ORDER BY ps.created_at DESC LIMIT 1`,
      [therapist_id]
    );
    if (!currentSub) return { status: false, code: 404, message: 'No active subscription found', data: null };
    if (currentSub.pending_plan_id) return { status: false, code: 409, message: 'A downgrade is already scheduled. Cancel it first.', data: null };

    const [[newPlan]] = await db.query(`SELECT * FROM prodesk_plans WHERE id = ? AND is_active = 1`, [new_plan_id]);
    if (!newPlan) return { status: false, code: 404, message: 'Target plan not found', data: null };

    if (parseFloat(newPlan.price_inr) >= parseFloat(currentSub.current_price)) {
      return { status: false, code: 400, message: 'Use upgrade for switching to a higher plan', data: null };
    }

    const rzpPlanRow = await getRazorpayPlanId(new_plan_id);
    if (!rzpPlanRow) return { status: false, code: 500, message: 'Razorpay plan not configured for target plan', data: null };

    const periodEnd      = new Date(currentSub.current_period_end);
    const startAtUnix    = Math.floor(periodEnd.getTime() / 1000);
    const periodEndStr   = periodEnd.toISOString().slice(0, 10);

    // Create new Razorpay subscription starting at period_end
    const rzpSub = await RazorpayService.createSubscription({
      razorpayPlanId: rzpPlanRow.razorpay_plan_id,
      billingCycle:   new_billing_cycle,
      startAt:        startAtUnix,
      notes: { therapist_id: String(therapist_id), plan_id: String(new_plan_id), billing_cycle: new_billing_cycle, type: 'downgrade' }
    });
    if (!rzpSub) return { status: false, code: 500, message: 'Failed to create Razorpay subscription for downgrade', data: null };

    // Insert future subscription row
    const [newSubResult] = await db.query(
      `INSERT INTO prodesk_subscriptions
         (therapist_id, plan_id, status, billing_cycle, razorpay_subscription_id, razorpay_plan_id,
          linked_old_subscription_id)
       VALUES (?, ?, 'pending', ?, ?, ?, ?)`,
      [therapist_id, new_plan_id, new_billing_cycle, rzpSub.id, rzpPlanRow.razorpay_plan_id, currentSub.id]
    );

    // Mark downgrade on current sub
    await db.query(
      `UPDATE prodesk_subscriptions
         SET pending_plan_id = ?, pending_billing_cycle = ?,
             downgrade_requested_at = NOW(), pending_new_subscription_id = ?
       WHERE id = ?`,
      [new_plan_id, new_billing_cycle, newSubResult.insertId, currentSub.id]
    );

    const keyId = await RazorpayService.getKeyId();
    const therapistRow = await getTherapistRow(therapist_id);
    try {
      await NotificationService.sendEmail({
        toEmail: therapistRow.email, toName: therapistRow.first_name,
        template: 'prodesk_downgrade_scheduled',
        data: {
          therapist_name:   therapistRow.first_name,
          current_plan:     currentSub.current_plan_name,
          new_plan:         newPlan.name,
          effective_date:   periodEndStr
        }
      });
    } catch (_) {}

    return {
      status: true, code: 200, message: 'Downgrade scheduled. Please authorize mandate for new plan.',
      data: {
        new_subscription_id:      newSubResult.insertId,
        razorpay_subscription_id: rzpSub.id,
        razorpay_key_id:          keyId,
        new_plan_name:            newPlan.name,
        effective_date:           periodEndStr,
        current_plan_active_till: periodEndStr,
        amount:                   Math.round(rzpPlanRow.amount * 100),
        amount_display:           `₹${parseFloat(rzpPlanRow.amount).toLocaleString('en-IN')}`,
        currency:                 'INR'
      }
    };
  } catch (error) {
    console.log('Error in requestDowngradeService::>>', error);
    return null;
  }
};

// ─── CANCEL PENDING DOWNGRADE ────────────────────────────────────────────────

const cancelPendingDowngradeService = async ({ therapist_id }) => {
  try {
    const [[currentSub]] = await db.query(
      `SELECT * FROM prodesk_subscriptions
       WHERE therapist_id = ? AND status IN ('active','authenticated') AND pending_plan_id IS NOT NULL
       ORDER BY created_at DESC LIMIT 1`,
      [therapist_id]
    );
    if (!currentSub) return { status: false, code: 404, message: 'No pending downgrade found', data: null };

    // Cancel the future Razorpay subscription (user can re-authorize when they want)
    if (currentSub.pending_new_subscription_id) {
      const [[futureSub]] = await db.query(
        `SELECT razorpay_subscription_id FROM prodesk_subscriptions WHERE id = ?`,
        [currentSub.pending_new_subscription_id]
      );
      if (futureSub?.razorpay_subscription_id) {
        await RazorpayService.cancelSubscription({ razorpaySubscriptionId: futureSub.razorpay_subscription_id, cancelAtCycleEnd: 0 });
      }
      await db.query(
        `UPDATE prodesk_subscriptions SET status = 'cancelled', cancelled_at = NOW() WHERE id = ?`,
        [currentSub.pending_new_subscription_id]
      );
    }

    await db.query(
      `UPDATE prodesk_subscriptions
         SET pending_plan_id = NULL, pending_billing_cycle = NULL,
             downgrade_requested_at = NULL, pending_new_subscription_id = NULL
       WHERE id = ?`,
      [currentSub.id]
    );

    return { status: true, code: 200, message: 'Pending downgrade cancelled. Your current plan continues.', data: null };
  } catch (error) {
    console.log('Error in cancelPendingDowngradeService::>>', error);
    return null;
  }
};

// ─── CANCEL SUBSCRIPTION ─────────────────────────────────────────────────────
// Always cancels at period end (no immediate cancel, no refund).

const cancelSubscriptionService = async ({ therapist_id, reason }) => {
  try {
    const [[sub]] = await db.query(
      `SELECT ps.*, pp.name AS plan_name FROM prodesk_subscriptions ps
         JOIN prodesk_plans pp ON ps.plan_id = pp.id
       WHERE ps.therapist_id = ? AND ps.status IN ('active','authenticated','halted')
       ORDER BY ps.created_at DESC LIMIT 1`,
      [therapist_id]
    );
    if (!sub) return { status: false, code: 404, message: 'No active subscription to cancel', data: null };
    if (sub.cancel_at_period_end) return { status: false, code: 409, message: 'Subscription is already scheduled to cancel', data: null };

    if (sub.razorpay_subscription_id) {
      await RazorpayService.cancelSubscription({ razorpaySubscriptionId: sub.razorpay_subscription_id, cancelAtCycleEnd: 1 });
    }

    // Also cancel any pending new subscription (downgrade / undo-cancel sub)
    if (sub.pending_new_subscription_id) {
      const [[futureSub]] = await db.query(
        `SELECT razorpay_subscription_id FROM prodesk_subscriptions WHERE id = ?`,
        [sub.pending_new_subscription_id]
      );
      if (futureSub?.razorpay_subscription_id) {
        await RazorpayService.cancelSubscription({ razorpaySubscriptionId: futureSub.razorpay_subscription_id, cancelAtCycleEnd: 0 });
      }
      await db.query(
        `UPDATE prodesk_subscriptions SET status = 'cancelled', cancelled_at = NOW() WHERE id = ?`,
        [sub.pending_new_subscription_id]
      );
    }

    const periodEndStr = sub.current_period_end instanceof Date
      ? sub.current_period_end.toISOString().slice(0, 10)
      : String(sub.current_period_end).slice(0, 10);

    await db.query(
      `UPDATE prodesk_subscriptions
         SET cancel_at_period_end = 1, cancelled_at = NOW(), cancellation_reason = ?,
             pending_plan_id = NULL, pending_billing_cycle = NULL,
             pending_new_subscription_id = NULL, downgrade_requested_at = NULL
       WHERE id = ?`,
      [reason || null, sub.id]
    );

    const therapistRow = await getTherapistRow(therapist_id);
    try {
      await NotificationService.sendEmail({
        toEmail: therapistRow.email, toName: therapistRow.first_name,
        template: 'prodesk_subscription_cancelled',
        data: {
          therapist_name: therapistRow.first_name,
          plan_name:      sub.plan_name,
          access_till:    periodEndStr
        }
      });
    } catch (_) {}

    return {
      status: true, code: 200, message: 'Subscription cancelled. Access continues till end of current period.',
      data: { subscription_id: sub.id, access_till: periodEndStr, status: 'active' }
    };
  } catch (error) {
    console.log('Error in cancelSubscriptionService::>>', error);
    return null;
  }
};

// ─── UNDO CANCEL ─────────────────────────────────────────────────────────────
// Razorpay doesn't have undo-cancel. We create a new sub with start_at = period_end
// so auto-charge resumes from next cycle. User authorizes mandate now.

const undoCancelSubscriptionService = async ({ therapist_id }) => {
  try {
    const [[sub]] = await db.query(
      `SELECT ps.*, pp.name AS plan_name FROM prodesk_subscriptions ps
         JOIN prodesk_plans pp ON ps.plan_id = pp.id
       WHERE ps.therapist_id = ? AND ps.cancel_at_period_end = 1 AND ps.status IN ('active','authenticated')
       ORDER BY ps.created_at DESC LIMIT 1`,
      [therapist_id]
    );
    if (!sub) return { status: false, code: 404, message: 'No cancellation pending to undo', data: null };

    const rzpPlanRow = await getRazorpayPlanId(sub.plan_id);
    if (!rzpPlanRow) return { status: false, code: 500, message: 'Plan config not found', data: null };

    const periodEnd    = new Date(sub.current_period_end);
    const startAtUnix  = Math.floor(periodEnd.getTime() / 1000);
    const periodEndStr = periodEnd.toISOString().slice(0, 10);

    const rzpSub = await RazorpayService.createSubscription({
      razorpayPlanId: rzpPlanRow.razorpay_plan_id,
      billingCycle:   sub.billing_cycle,
      startAt:        startAtUnix,
      notes: { therapist_id: String(therapist_id), plan_id: String(sub.plan_id), type: 'undo_cancel' }
    });
    if (!rzpSub) return { status: false, code: 500, message: 'Failed to create replacement subscription', data: null };

    const [newSubResult] = await db.query(
      `INSERT INTO prodesk_subscriptions
         (therapist_id, plan_id, status, billing_cycle, razorpay_subscription_id, razorpay_plan_id,
          linked_old_subscription_id)
       VALUES (?, ?, 'pending', ?, ?, ?, ?)`,
      [therapist_id, sub.plan_id, sub.billing_cycle, rzpSub.id, rzpPlanRow.razorpay_plan_id, sub.id]
    );

    // Store reference to the replacement sub on current sub
    await db.query(
      `UPDATE prodesk_subscriptions
         SET cancel_at_period_end = 0, cancelled_at = NULL, cancellation_reason = NULL,
             pending_new_subscription_id = ?
       WHERE id = ?`,
      [newSubResult.insertId, sub.id]
    );

    const keyId = await RazorpayService.getKeyId();
    return {
      status: true, code: 200, message: 'Cancellation undone. Please authorize mandate to continue your plan.',
      data: {
        new_subscription_id:      newSubResult.insertId,
        razorpay_subscription_id: rzpSub.id,
        razorpay_key_id:          keyId,
        plan_name:                sub.plan_name,
        continues_from:           periodEndStr,
        amount:                   Math.round(rzpPlanRow.amount * 100),
        amount_display:           `₹${parseFloat(rzpPlanRow.amount).toLocaleString('en-IN')}`,
        currency:                 'INR'
      }
    };
  } catch (error) {
    console.log('Error in undoCancelSubscriptionService::>>', error);
    return null;
  }
};

// ─── INTERNAL: Execute pending downgrade at period_end ────────────────────────
// Called by cron when current_period_end passes and pending downgrade exists.

const executePendingDowngradeService = async ({ subscription_id }) => {
  try {
    const [[sub]] = await db.query(
      `SELECT * FROM prodesk_subscriptions WHERE id = ? AND pending_plan_id IS NOT NULL`,
      [subscription_id]
    );
    if (!sub) return;

    // Cancel old Razorpay subscription
    if (sub.razorpay_subscription_id) {
      await RazorpayService.cancelSubscription({ razorpaySubscriptionId: sub.razorpay_subscription_id, cancelAtCycleEnd: 0 });
    }
    await db.query(
      `UPDATE prodesk_subscriptions SET status = 'cancelled', cancelled_at = NOW() WHERE id = ?`,
      [subscription_id]
    );

    // Activate pending new subscription
    if (sub.pending_new_subscription_id) {
      await db.query(
        `UPDATE prodesk_subscriptions
           SET pending_plan_id = NULL, pending_billing_cycle = NULL,
               downgrade_requested_at = NULL
         WHERE id = ?`,
        [subscription_id]
      );
      console.log(`[Downgrade] Executed for subscription_id=${subscription_id}, new_sub=${sub.pending_new_subscription_id}`);
    }
  } catch (error) {
    console.log('Error in executePendingDowngradeService::>>', error);
  }
};

module.exports = {
  getPlansService,
  getSubscriptionService,
  activateFreeService,
  createSubscriptionService,
  confirmSubscriptionService,
  upgradeSubscriptionService,
  confirmProrateAndSubscribeService,
  requestDowngradeService,
  cancelPendingDowngradeService,
  cancelSubscriptionService,
  undoCancelSubscriptionService,
  executePendingDowngradeService,
  notifyAdminNewSubscription
};
