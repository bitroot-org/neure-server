const {
  createInvoiceService,
  getInvoicesService,
  getInvoiceByIdService,
  sendInvoiceService,
  cancelInvoiceService,
  markInvoicePaidService,
  getBillingSummaryService,
  getPaymentsService,
  handleRazorpayWebhookService
} = require('../../services/prodesk/billingService');
const { convertDatesToIST } = require('../../utils/dateHelper');

const respond = (res, result) => {
  if (!result) return res.status(500).json({ status: false, code: 500, message: 'Internal server error', data: null });
  return res.status(result.code).json({ ...result, data: convertDatesToIST(result.data) });
};

class ProdeskBillingController {
  static async createInvoice(req, res) {
    try {
      const result = await createInvoiceService({ therapist_id: req.user.therapist_id, ...req.body });
      return respond(res, result);
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }

  static async getInvoices(req, res) {
    try {
      const result = await getInvoicesService({ therapist_id: req.user.therapist_id, ...req.body });
      return respond(res, result);
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }

  static async getInvoiceById(req, res) {
    try {
      const { invoice_id } = req.body;
      if (!invoice_id) return res.status(400).json({ status: false, code: 400, message: 'invoice_id required', data: null });
      const result = await getInvoiceByIdService({ therapist_id: req.user.therapist_id, invoice_id });
      return respond(res, result);
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }

  static async sendInvoice(req, res) {
    try {
      const { invoice_id } = req.body;
      if (!invoice_id) return res.status(400).json({ status: false, code: 400, message: 'invoice_id required', data: null });
      const result = await sendInvoiceService({ therapist_id: req.user.therapist_id, invoice_id });
      return respond(res, result);
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }

  static async cancelInvoice(req, res) {
    try {
      const { invoice_id } = req.body;
      if (!invoice_id) return res.status(400).json({ status: false, code: 400, message: 'invoice_id required', data: null });
      const result = await cancelInvoiceService({ therapist_id: req.user.therapist_id, invoice_id });
      return respond(res, result);
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }

  static async markInvoicePaid(req, res) {
    try {
      const { invoice_id } = req.body;
      if (!invoice_id) return res.status(400).json({ status: false, code: 400, message: 'invoice_id required', data: null });
      const result = await markInvoicePaidService({ therapist_id: req.user.therapist_id, ...req.body });
      return respond(res, result);
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }

  static async getBillingSummary(req, res) {
    try {
      const result = await getBillingSummaryService({ therapist_id: req.user.therapist_id });
      return respond(res, result);
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }

  static async getPayments(req, res) {
    try {
      const result = await getPaymentsService({ therapist_id: req.user.therapist_id, ...req.body });
      return respond(res, result);
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }

  static async razorpayWebhook(req, res) {
    try {
      const signature = req.headers['x-razorpay-signature'];
      const rawBody = JSON.stringify(req.body);
      const result = await handleRazorpayWebhookService({ rawBody, signature, event: req.body });
      return res.status(200).json(result);
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }
}

module.exports = ProdeskBillingController;
