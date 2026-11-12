const {
  createInvoiceService,
  getInvoicesService,
  getInvoiceByIdService,
  sendInvoiceService,
  resendInvoiceService,
  getInvoicePaymentLinkService,
  cancelInvoiceService,
  markInvoicePaidService,
  initiateRefundService,
  getPaymentLogsService,
  getBillingSummaryService,
  getPaymentsService,
  handleRazorpayWebhookService,
  updateInvoiceService
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

  static async resendInvoice(req, res) {
    try {
      const { invoice_id, channel } = req.body;
      if (!invoice_id) return res.status(400).json({ status: false, code: 400, message: 'invoice_id required', data: null });
      const result = await resendInvoiceService({ therapist_id: req.user.therapist_id, invoice_id, channel });
      return respond(res, result);
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }

  static async getInvoicePaymentLink(req, res) {
    try {
      const { invoice_id } = req.body;
      if (!invoice_id) return res.status(400).json({ status: false, code: 400, message: 'invoice_id required', data: null });
      const result = await getInvoicePaymentLinkService({ therapist_id: req.user.therapist_id, invoice_id });
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

  static async initiateRefund(req, res) {
    try {
      const { invoice_id, amount } = req.body;
      if (!invoice_id) return res.status(400).json({ status: false, code: 400, message: 'invoice_id required', data: null });
      const result = await initiateRefundService({ therapist_id: req.user.therapist_id, invoice_id, amount });
      return respond(res, result);
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }

  static async getPaymentLogs(req, res) {
    try {
      const { invoice_id, payment_id, page, limit } = req.body;
      if (!invoice_id && !payment_id) {
        return res.status(400).json({ status: false, code: 400, message: 'invoice_id or payment_id required', data: null });
      }
      const result = await getPaymentLogsService({ therapist_id: req.user.therapist_id, invoice_id, payment_id, page, limit });
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

  static async invoicePDFRedirect(req, res) {
    try {
      const { invoice_number } = req.params;
      const db = require('../../../config/db');
      const [rows] = await db.query(
        'SELECT invoice_pdf_url FROM prodesk_invoices WHERE invoice_number = ? LIMIT 1',
        [invoice_number]
      );
      if (!rows || !rows.length || !rows[0].invoice_pdf_url) {
        return res.status(404).send('Invoice not found');
      }
      return res.redirect(302, rows[0].invoice_pdf_url);
    } catch (e) {
      return res.status(500).send('Error');
    }
  }

  static async updateInvoice(req, res) {
    try {
      const { invoice_id } = req.body;
      if (!invoice_id) return res.status(400).json({ status: false, code: 400, message: 'invoice_id required', data: null });
      const result = await updateInvoiceService({ therapist_id: req.user.therapist_id, ...req.body });
      return respond(res, result);
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }

  // Public pay page (no login): the signed token in the link is the credential
  // Public, from the invoice email: sends the phone to the UPI app with amount + invoice number prefilled
  static async payUpiRedirect(req, res) {
    try {
      const { getUpiDeepLinkService } = require('../../services/prodesk/invoicePayService');
      const result = await getUpiDeepLinkService({ token: req.params.token });
      if (!result) return res.status(500).send('Something went wrong. Please try again.');
      if (!result.status) return res.status(result.code).send(result.message);
      return res.redirect(302, result.data.url);
    } catch (e) { return res.status(500).send('Something went wrong. Please try again.'); }
  }

  static async getInvoicePayInfo(req, res) {
    try {
      const { getPayInfoService } = require('../../services/prodesk/invoicePayService');
      const result = await getPayInfoService({ token: req.body?.token, peek: req.body?.peek === true });
      if (!result) return res.status(500).json({ status: false, code: 500, message: 'Internal server error', data: null });
      return res.status(result.code).json(result);
    } catch (e) { return res.status(500).json({ status: false, code: 500, message: e.message, data: null }); }
  }

  static async logInvoicePayAttempt(req, res) {
    try {
      const { logAttemptService } = require('../../services/prodesk/invoicePayService');
      const { token, event, razorpay_payment_id, error } = req.body || {};
      const result = await logAttemptService({ token, event, payment_id: razorpay_payment_id, error });
      if (!result) return res.status(500).json({ status: false, code: 500, message: 'Internal server error', data: null });
      return res.status(result.code).json(result);
    } catch (e) { return res.status(500).json({ status: false, code: 500, message: e.message, data: null }); }
  }

  static async verifyInvoicePayment(req, res) {
    try {
      const { verifyPaymentService } = require('../../services/prodesk/invoicePayService');
      const result = await verifyPaymentService({ token: req.body?.token, razorpay_payment_id: req.body?.razorpay_payment_id });
      if (!result) return res.status(500).json({ status: false, code: 500, message: 'Internal server error', data: null });
      return res.status(result.code).json(result);
    } catch (e) { return res.status(500).json({ status: false, code: 500, message: e.message, data: null }); }
  }

  static async razorpayWebhook(req, res) {
    try {
      const signature = req.headers['x-razorpay-signature'];
      // req.body is a raw Buffer here (express.raw middleware applied in index.js for this route)
      const rawBody = req.body;
      const event = JSON.parse(rawBody.toString());
      const result = await handleRazorpayWebhookService({ rawBody, signature, event });
      return res.status(200).json(result);
    } catch (e) {
      console.log('Webhook handler error::>>', e.message);
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }
}

module.exports = ProdeskBillingController;
