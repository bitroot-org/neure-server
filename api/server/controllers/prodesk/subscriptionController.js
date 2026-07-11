const {
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
  undoCancelSubscriptionService
} = require('../../services/prodesk/subscriptionService');

const respond = (res, result) => {
  if (!result) return res.status(500).json({ status: false, code: 500, message: 'Internal server error', data: null });
  return res.status(result.code).json(result);
};

class SubscriptionController {

  static async getPlans(req, res) {
    try {
      return respond(res, await getPlansService());
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }

  static async getSubscription(req, res) {
    try {
      return respond(res, await getSubscriptionService({ therapist_id: req.user.therapist_id }));
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }

  static async activateFree(req, res) {
    try {
      // Starter is free — no offer code applies, so offer_id (if sent) is ignored.
      return respond(res, await activateFreeService({ therapist_id: req.user.therapist_id }));
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }

  // POST /subscription/create
  // New paid subscription from scratch (or after starter)
  static async createSubscription(req, res) {
    try {
      const { plan_id, billing_cycle, offer_id } = req.body;
      return respond(res, await createSubscriptionService({
        therapist_id: req.user.therapist_id,
        plan_id,
        billing_cycle,
        offer_id: offer_id || null
      }));
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }

  // POST /subscription/confirm
  // Called by frontend after Razorpay checkout callback (mandate authorized)
  static async confirmSubscription(req, res) {
    try {
      const { subscription_id, razorpay_subscription_id, razorpay_payment_id, razorpay_signature } = req.body;
      return respond(res, await confirmSubscriptionService({
        therapist_id: req.user.therapist_id,
        subscription_id,
        razorpay_subscription_id,
        razorpay_payment_id,
        razorpay_signature
      }));
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }

  // POST /subscription/upgrade
  // Returns prorate order if charge required, or subscription directly if not
  static async upgradeSubscription(req, res) {
    try {
      const { new_plan_id, new_billing_cycle } = req.body;
      return respond(res, await upgradeSubscriptionService({
        therapist_id: req.user.therapist_id,
        new_plan_id,
        new_billing_cycle
      }));
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }

  // POST /subscription/upgrade/confirm-prorate
  // After prorate order is paid — finalises the upgrade
  static async confirmProrateAndSubscribe(req, res) {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
      return respond(res, await confirmProrateAndSubscribeService({
        therapist_id: req.user.therapist_id,
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
      }));
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }

  // POST /subscription/downgrade
  // Schedules a downgrade at period_end — returns sub for mandate authorization
  static async requestDowngrade(req, res) {
    try {
      const { new_plan_id, new_billing_cycle } = req.body;
      return respond(res, await requestDowngradeService({
        therapist_id: req.user.therapist_id,
        new_plan_id,
        new_billing_cycle
      }));
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }

  // POST /subscription/downgrade/cancel
  // Cancels a scheduled downgrade
  static async cancelPendingDowngrade(req, res) {
    try {
      return respond(res, await cancelPendingDowngradeService({ therapist_id: req.user.therapist_id }));
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }

  // POST /subscription/cancel
  // Cancels at period_end — no refund, access continues till end of cycle
  static async cancelSubscription(req, res) {
    try {
      const { reason } = req.body;
      return respond(res, await cancelSubscriptionService({
        therapist_id: req.user.therapist_id,
        reason: reason || null
      }));
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }

  // POST /subscription/cancel/undo
  // Reverses a pending cancellation — creates a replacement sub for mandate
  static async undoCancelSubscription(req, res) {
    try {
      return respond(res, await undoCancelSubscriptionService({ therapist_id: req.user.therapist_id }));
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }
}

module.exports = SubscriptionController;
