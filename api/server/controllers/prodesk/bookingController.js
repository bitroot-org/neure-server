const {
  getPublicProfileService,
  getAvailableSlotsService,
  holdSlotService,
  confirmBookingService,
  verifyBookingPaymentService
} = require('../../services/prodesk/bookingService');
const { convertDatesToIST } = require('../../utils/dateHelper');

const respond = (res, result) => {
  if (!result) return res.status(500).json({ status: false, code: 500, message: 'Internal server error', data: null });
  return res.status(result.code).json({ ...result, data: convertDatesToIST(result.data) });
};

class ProdeskBookingController {
  static async getPublicProfile(req, res) {
    try {
      const { slug } = req.body;
      if (!slug) return res.status(400).json({ status: false, code: 400, message: 'slug required', data: null });
      const result = await getPublicProfileService({ slug });
      return respond(res, result);
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }

  static async getAvailableSlots(req, res) {
    try {
      const { slug, from, to } = req.body;
      if (!slug) return res.status(400).json({ status: false, code: 400, message: 'slug required', data: null });
      const result = await getAvailableSlotsService({ slug, from, to });
      return respond(res, result);
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }

  static async holdSlot(req, res) {
    try {
      const { slug, date, time, modality } = req.body;
      if (!slug || !date || !time || !modality) {
        return res.status(400).json({ status: false, code: 400, message: 'slug, date, time and modality are required', data: null });
      }
      const result = await holdSlotService({ slug, date, time, modality });
      return respond(res, result);
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }

  static async confirmBooking(req, res) {
    try {
      const { hold_token } = req.body;
      if (!hold_token) return res.status(400).json({ status: false, code: 400, message: 'hold_token required', data: null });
      const result = await confirmBookingService(req.body);
      return respond(res, result);
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }

  static async verifyBookingPayment(req, res) {
    try {
      const { hold_token, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
      if (!hold_token || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({ status: false, code: 400, message: 'hold_token, razorpay_order_id, razorpay_payment_id, razorpay_signature are required', data: null });
      }
      const result = await verifyBookingPaymentService(req.body);
      return respond(res, result);
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }
}

module.exports = ProdeskBookingController;
