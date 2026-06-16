const {
  getPlansService, getSubscriptionService, activateFreeService,
  createOrderService, confirmPaymentService, renewOrderService, confirmRenewalService
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
      const { offer_id } = req.body;
      return respond(res, await activateFreeService({ therapist_id: req.user.therapist_id, offer_id: offer_id || null }));
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }

  static async createOrder(req, res) {
    try {
      const { plan_id, billing_cycle, offer_id } = req.body;
      return respond(res, await createOrderService({ therapist_id: req.user.therapist_id, plan_id, billing_cycle, offer_id: offer_id || null }));
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }

  static async confirmPayment(req, res) {
    try {
      const { subscription_id, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
      return respond(res, await confirmPaymentService({ therapist_id: req.user.therapist_id, subscription_id, razorpay_order_id, razorpay_payment_id, razorpay_signature }));
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }

  static async renewOrder(req, res) {
    try {
      return respond(res, await renewOrderService({ therapist_id: req.user.therapist_id }));
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }

  static async confirmRenewal(req, res) {
    try {
      const { subscription_id, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
      return respond(res, await confirmRenewalService({ therapist_id: req.user.therapist_id, subscription_id, razorpay_order_id, razorpay_payment_id, razorpay_signature }));
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }
}

module.exports = SubscriptionController;
