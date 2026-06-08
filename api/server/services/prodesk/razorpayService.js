const crypto = require('crypto');
const db = require('../../../config/db');

const getRazorpayCredentials = async () => {
  const [rows] = await db.query(
    "SELECT key_id, secret FROM client_integration WHERE type = 'payment' AND is_active = 1 LIMIT 1"
  );
  if (!rows || !rows.length) {
    throw new Error('Razorpay credentials not configured in client_integration table');
  }
  return { keyId: rows[0].key_id, keySecret: rows[0].secret };
};

const razorpayRequest = async (payload) => {
  try {
    console.log('Payload in razorpayRequest::>>', payload);
    const { method, path, body } = payload;

    const { keyId, keySecret } = await getRazorpayCredentials();
    const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');

    const opts = {
      method,
      headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/json' }
    };
    if (body) opts.body = JSON.stringify(body);

    const fetch = (await import('node-fetch')).default;
    const res = await fetch(`https://api.razorpay.com${path}`, opts);
    const data = await res.json();

    if (!res.ok) throw new Error(data.error?.description || `Razorpay error: ${res.status}`);
    return data;
  } catch (error) {
    console.log('Error in razorpayRequest::>>', error);
    throw error;
  }
};

const createOrderService = async (payload) => {
  try {
    console.log('Payload in createOrderService::>>', payload);
    const { amount, currency = 'INR', notes = {} } = payload;

    const amountPaise = Math.round(amount * 100);
    const data = await razorpayRequest({ method: 'POST', path: '/v1/orders', body: { amount: amountPaise, currency, notes } });
    return data;
  } catch (error) {
    console.log('Error in createOrderService::>>', error);
    return null;
  }
};

const createInvoiceRazorpayService = async (payload) => {
  try {
    console.log('Payload in createInvoiceRazorpayService::>>', payload);
    const { customer, lineItems, taxAmount, totalAmount, dueBy, receipt, notes = {} } = payload;

    const mappedItems = lineItems.map(item => ({
      name: item.description,
      amount: Math.round(item.rate * 100),
      currency: 'INR',
      quantity: item.qty
    }));

    // Razorpay does not accept a top-level tax_amount field.
    // Add GST as a separate line item so the total matches and it shows on the invoice.
    if (taxAmount && taxAmount > 0) {
      mappedItems.push({
        name: 'GST (18%)',
        amount: Math.round(taxAmount * 100),
        currency: 'INR',
        quantity: 1
      });
    }

    const body = {
      type: 'invoice',
      receipt,
      customer,
      line_items: mappedItems,
      sms_notify: 1,
      email_notify: 1,
      partial_payment: 0,
      reminder_enable: 1,
      notes
    };

    if (dueBy) {
      body.expire_by = Math.floor(new Date(dueBy).getTime() / 1000);
    }

    const data = await razorpayRequest({ method: 'POST', path: '/v1/invoices', body });
    return data;
  } catch (error) {
    console.log('Error in createInvoiceRazorpayService::>>', error);
    throw error;
  }
};

// Resend email or SMS notification for an existing Razorpay invoice
const notifyInvoiceService = async (payload) => {
  try {
    console.log('Payload in notifyInvoiceService::>>', payload);
    const { razorpayInvoiceId, channel = 'email' } = payload;

    const data = await razorpayRequest({
      method: 'POST',
      path: `/v1/invoices/${razorpayInvoiceId}/notify/${channel}`
    });
    return data;
  } catch (error) {
    console.log('Error in notifyInvoiceService::>>', error);
    throw error;
  }
};

const cancelInvoiceRazorpayService = async (payload) => {
  try {
    console.log('Payload in cancelInvoiceRazorpayService::>>', payload);
    const { razorpay_invoice_id } = payload;

    const data = await razorpayRequest({ method: 'POST', path: `/v1/invoices/${razorpay_invoice_id}/cancel` });
    return data;
  } catch (error) {
    console.log('Error in cancelInvoiceRazorpayService::>>', error);
    throw error;
  }
};

// Initiate a refund against a captured Razorpay payment
const createRefundService = async (payload) => {
  try {
    console.log('Payload in createRefundService::>>', payload);
    const { razorpayPaymentId, amount, notes = {} } = payload;

    const body = { notes };
    if (amount) body.amount = Math.round(amount * 100); // partial refund; omit for full refund

    const data = await razorpayRequest({
      method: 'POST',
      path: `/v1/payments/${razorpayPaymentId}/refund`,
      body
    });
    return data;
  } catch (error) {
    console.log('Error in createRefundService::>>', error);
    throw error;
  }
};

const verifyPaymentSignatureService = async (payload) => {
  try {
    console.log('Payload in verifyPaymentSignatureService::>>', payload);
    const { orderId, paymentId, signature } = payload;

    const { keySecret } = await getRazorpayCredentials();
    const expected = crypto.createHmac('sha256', keySecret).update(`${orderId}|${paymentId}`).digest('hex');
    return expected === signature;
  } catch (error) {
    console.log('Error in verifyPaymentSignatureService::>>', error);
    return false;
  }
};

const verifyWebhookSignatureService = async (payload) => {
  try {
    console.log('Payload in verifyWebhookSignatureService::>>', payload);
    const { rawBody, signature } = payload;

    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) throw new Error('RAZORPAY_WEBHOOK_SECRET not set in environment');

    const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    return expected === signature;
  } catch (error) {
    console.log('Error in verifyWebhookSignatureService::>>', error);
    return false;
  }
};

const getKeyIdService = async () => {
  try {
    const { keyId } = await getRazorpayCredentials();
    return keyId;
  } catch (error) {
    console.log('Error in getKeyIdService::>>', error);
    return null;
  }
};

const RazorpayService = {
  createOrder:              (p) => createOrderService(p),
  createInvoice:            (p) => createInvoiceRazorpayService(p),
  notifyInvoice:            (p) => notifyInvoiceService(p),
  cancelInvoice:            (razorpayInvoiceId) => cancelInvoiceRazorpayService({ razorpay_invoice_id: razorpayInvoiceId }),
  createRefund:             (p) => createRefundService(p),
  verifyPaymentSignature:   (p) => verifyPaymentSignatureService(p),
  verifyWebhookSignature:   (rawBody, signature) => verifyWebhookSignatureService({ rawBody, signature }),
  getKeyId:                 () => getKeyIdService()
};

module.exports = RazorpayService;

module.exports.createOrderService              = createOrderService;
module.exports.createInvoiceRazorpayService    = createInvoiceRazorpayService;
module.exports.notifyInvoiceService            = notifyInvoiceService;
module.exports.cancelInvoiceRazorpayService    = cancelInvoiceRazorpayService;
module.exports.createRefundService             = createRefundService;
module.exports.verifyPaymentSignatureService   = verifyPaymentSignatureService;
module.exports.verifyWebhookSignatureService   = verifyWebhookSignatureService;
module.exports.getKeyIdService                 = getKeyIdService;
