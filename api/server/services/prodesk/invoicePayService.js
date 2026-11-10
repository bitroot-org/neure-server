const crypto = require('crypto');
const db = require('../../../config/db');
const PartnerService = require('./razorpayPartnerService');

// ─── Signed pay-page token (stateless: no column needed) ─────────────────────

const secret = () => {
  if (!process.env.TOKEN_ENC_KEY) throw new Error('TOKEN_ENC_KEY is not set in .env');
  return process.env.TOKEN_ENC_KEY;
};
const sign = (invoiceId) =>
  crypto.createHmac('sha256', secret()).update(`pay:${invoiceId}`).digest('base64url').slice(0, 24);

const makeToken = (invoiceId) => `${invoiceId}.${sign(invoiceId)}`;

const parseToken = (token) => {
  const [id, sig] = String(token || '').split('.');
  const invoiceId = parseInt(id, 10);
  if (!invoiceId || !sig) return null;
  const a = Buffer.from(sig);
  const b = Buffer.from(sign(invoiceId));
  return a.length === b.length && crypto.timingSafeEqual(a, b) ? invoiceId : null;
};

// Public URL the client opens. Frontend origin comes from the partner config (staging / prod each have their own).
const payUrl = async (invoiceId) => {
  const cfg = await PartnerService.getPartnerConfig();
  if (!cfg.frontendReturnUrl) throw new Error('frontend_return_url missing in payment_partner config');
  const origin = new URL(cfg.frontendReturnUrl).origin;
  return `${origin}/pay/${makeToken(invoiceId)}`;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const PAYABLE = ['sent', 'overdue', 'payment_initiated'];

const loadInvoice = async (invoiceId) => {
  const [rows] = await db.query(
    `SELECT pi.id, pi.therapist_id, pi.client_id, pi.invoice_number, pi.total, pi.status, pi.issue_date, pi.due_date,
            CONCAT_WS(' ', cu.first_name, cu.last_name) AS client_name, cu.user_id AS client_user_id,
            COALESCE(tb.brand_name, CONCAT_WS(' ', tu.first_name, tu.last_name)) AS clinic_name
     FROM prodesk_invoices pi
     JOIN prodesk_clients pc ON pc.id = pi.client_id
     JOIN users cu ON cu.user_id = pc.user_id
     JOIN therapists t ON t.id = pi.therapist_id
     JOIN users tu ON tu.user_id = t.user_id
     LEFT JOIN therapist_branding tb ON tb.therapist_id = t.id
     WHERE pi.id = ?`, [invoiceId]
  );
  return rows && rows[0];
};

// One Razorpay order per invoice, kept on the invoice's payment row so reloads / webhooks reuse it.
const ensureOrder = async (inv) => {
  const [rows] = await db.query(
    'SELECT id, razorpay_order_id, status FROM prodesk_payment WHERE invoice_id = ? ORDER BY created_at DESC LIMIT 1', [inv.id]
  );
  let row = rows && rows[0];
  const amount = Math.round(Number(inv.total) * 100);

  if (row?.razorpay_order_id) {
    try {
      const { data: order } = await PartnerService.partnerRequest(inv.therapist_id, { method: 'GET', path: `/v1/orders/${row.razorpay_order_id}` });
      if (order.amount === amount && order.status !== 'paid') return { orderId: order.id, amount };
    } catch (e) { console.log('Existing order unusable, creating a new one::>>', e.message); }
  }

  const { data: order, accountId } = await PartnerService.partnerRequest(inv.therapist_id, {
    method: 'POST', path: '/v1/orders',
    body: { amount, currency: 'INR', receipt: inv.invoice_number, notes: { prodesk_invoice_id: String(inv.id), therapist_id: String(inv.therapist_id) } },
  });

  if (row) {
    await db.query('UPDATE prodesk_payment SET razorpay_order_id = ?, merchant_account_id = ?, payment_mode = ? WHERE id = ?',
      [order.id, accountId, 'razorpay', row.id]);
  } else {
    await db.query(
      `INSERT INTO prodesk_payment (user_id, therapist_id, invoice_id, payment_type, provider, amount, currency, status, method, razorpay_order_id, merchant_account_id, payment_mode)
       VALUES (?, ?, ?, 'invoice', 'razorpay', ?, 'INR', 'created', 'razorpay', ?, ?, 'razorpay')`,
      [inv.client_user_id, inv.therapist_id, inv.id, inv.total, order.id, accountId]
    );
  }
  return { orderId: order.id, amount };
};

// ─── Public: data for the pay page ───────────────────────────────────────────

const getPayInfoService = async ({ token }) => {
  try {
    const invoiceId = parseToken(token);
    if (!invoiceId) return { status: false, code: 404, message: 'This payment link is not valid.', data: null };
    const inv = await loadInvoice(invoiceId);
    if (!inv) return { status: false, code: 404, message: 'This payment link is not valid.', data: null };

    const summary = {
      invoice_number: inv.invoice_number, total: inv.total, status: inv.status,
      issue_date: inv.issue_date, due_date: inv.due_date, client_name: inv.client_name, clinic_name: inv.clinic_name,
    };
    if (inv.status === 'paid') return { status: true, code: 200, message: 'Paid', data: { invoice: summary, razorpay: null, direct: null } };
    if (!PAYABLE.includes(inv.status)) {
      return { status: false, code: 409, message: 'This invoice can no longer be paid online.', data: null };
    }

    let razorpay = null;
    const tok = await PartnerService.getAccessToken(inv.therapist_id).catch(() => null);
    if (tok) {
      try {
        const { orderId, amount } = await ensureOrder(inv);
        razorpay = { key: tok.publicToken, order_id: orderId, amount, currency: 'INR' };
      } catch (e) { console.log('Order creation failed::>>', e.message); }
    }

    const [bank] = await db.query(
      'SELECT upi_id, qr_url, account_holder, account_number, ifsc_code, bank_name FROM therapist_bank_accounts WHERE therapist_id = ? AND direct_pay_enabled = 1',
      [inv.therapist_id]
    );
    const b = bank && bank[0];
    const direct = b && (b.upi_id || b.qr_url || b.account_number) ? b : null;

    return { status: true, code: 200, message: 'Payment info', data: { invoice: summary, razorpay, direct } };
  } catch (error) {
    console.log('Error in getPayInfoService::>>', error);
    return null;
  }
};

// ─── Public: confirm a Checkout payment ──────────────────────────────────────
// Trust comes from asking Razorpay directly (server to server, with the therapist's token),
// not from what the browser says.

const verifyPaymentService = async ({ token, razorpay_payment_id }) => {
  try {
    const invoiceId = parseToken(token);
    if (!invoiceId || !razorpay_payment_id) return { status: false, code: 400, message: 'Invalid request', data: null };
    const inv = await loadInvoice(invoiceId);
    if (!inv) return { status: false, code: 404, message: 'Invoice not found', data: null };
    if (inv.status === 'paid') return { status: true, code: 200, message: 'Already paid', data: { paid: true } };

    const [rows] = await db.query(
      'SELECT razorpay_order_id FROM prodesk_payment WHERE invoice_id = ? ORDER BY created_at DESC LIMIT 1', [invoiceId]
    );
    const orderId = rows && rows[0] && rows[0].razorpay_order_id;
    if (!orderId) return { status: false, code: 409, message: 'No payment in progress for this invoice', data: null };

    let { data: pay, accountId } = await PartnerService.partnerRequest(inv.therapist_id, { method: 'GET', path: `/v1/payments/${razorpay_payment_id}` });
    if (pay.order_id !== orderId || pay.amount !== Math.round(Number(inv.total) * 100)) {
      return { status: false, code: 400, message: 'Payment does not match this invoice', data: null };
    }
    if (pay.status === 'authorized') {
      ({ data: pay } = await PartnerService.partnerRequest(inv.therapist_id, {
        method: 'POST', path: `/v1/payments/${pay.id}/capture`, body: { amount: pay.amount, currency: 'INR' },
      }));
    }
    if (pay.status !== 'captured') {
      return { status: false, code: 402, message: 'Payment has not been completed yet.', data: { payment_status: pay.status } };
    }

    const { markInvoicePaidByRazorpay } = require('./billingService');   // lazy: billingService requires this file
    await markInvoicePaidByRazorpay({ invoiceId, paymentId: pay.id, accountId });
    return { status: true, code: 200, message: 'Payment confirmed', data: { paid: true } };
  } catch (error) {
    console.log('Error in verifyPaymentService::>>', error);
    return null;
  }
};

// ─── Public: record what happened on the pay page (opened / failed / cancelled) ─
// Success is logged by verifyPaymentService; this covers everything that does not end in a payment.

const ATTEMPT_EVENTS = { 'checkout.opened': 'opened', 'checkout.dismissed': 'cancelled', 'payment.failed': 'failed' };
const MAX_CLIENT_LOGS = 100;                                   // stops a link from being used to flood the log
const clip = (v, n = 300) => (v == null ? null : String(v).slice(0, n));

const logAttemptService = async ({ token, event, payment_id, error }) => {
  try {
    const invoiceId = parseToken(token);
    const status = ATTEMPT_EVENTS[event];
    if (!invoiceId || !status) return { status: false, code: 400, message: 'Invalid request', data: null };

    const [rows] = await db.query(
      'SELECT id FROM prodesk_payment WHERE invoice_id = ? ORDER BY created_at DESC LIMIT 1', [invoiceId]
    );
    if (!rows || !rows.length) return { status: true, code: 200, message: 'Ignored', data: null };
    const paymentId = rows[0].id;

    const [[{ n }]] = await db.query(
      "SELECT COUNT(*) AS n FROM prodesk_payment_log WHERE payment_id = ? AND source = 'client'", [paymentId]
    );
    if (n >= MAX_CLIENT_LOGS) return { status: true, code: 200, message: 'Ignored', data: null };

    const meta = {
      payment_id: clip(payment_id, 60),
      ...(error ? { code: clip(error.code, 80), description: clip(error.description), reason: clip(error.reason, 80), step: clip(error.step, 80), source: clip(error.source, 80) } : {}),
    };
    await db.query(
      `INSERT INTO prodesk_payment_log (payment_id, invoice_id, reference_id, status, event_type, source, meta)
       VALUES (?, ?, ?, ?, ?, 'client', ?)`,
      [paymentId, invoiceId, clip(payment_id, 255), status, event, JSON.stringify(meta)]
    );
    return { status: true, code: 200, message: 'Logged', data: null };
  } catch (error) {
    console.log('Error in logAttemptService::>>', error);
    return null;
  }
};

module.exports = { logAttemptService, payUrl, makeToken, parseToken, getPayInfoService, verifyPaymentService };
