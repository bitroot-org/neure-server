const { formatISTWallClock } = require('../../utils/dateHelper');
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

// Tappable https link (works from an email) that sends the phone to the UPI app with everything prefilled.
// Origin is the API's own (taken from the partner redirect URI, which is always this server's public address).
const upiLinkUrl = async (invoiceId) => {
  const cfg = await PartnerService.getPartnerConfig();
  if (!cfg.redirectUri) throw new Error('redirect_uri missing in payment_partner config');
  return `${new URL(cfg.redirectUri).origin}/api/prodesk/upi/${makeToken(invoiceId)}`;
};

// upi://pay?...  with the therapist's UPI ID, the invoice amount and the invoice number as the payment note
const getUpiDeepLinkService = async ({ token }) => {
  try {
    const invoiceId = parseToken(token);
    if (!invoiceId) return { status: false, code: 404, message: 'This payment link is not valid.', data: null };
    const inv = await loadInvoice(invoiceId);
    if (!inv) return { status: false, code: 404, message: 'This payment link is not valid.', data: null };
    if (!PAYABLE.includes(inv.status)) return { status: false, code: 409, message: inv.status === 'paid' ? 'This invoice is already paid.' : 'This invoice can no longer be paid.', data: null };
    if ((await methodForInvoice(inv.id)) === 'razorpay') return { status: false, code: 409, message: 'This invoice is paid online, not by UPI transfer.', data: null };
    const [rows] = await db.query('SELECT upi_id FROM therapist_bank_accounts WHERE therapist_id = ? AND direct_pay_enabled = 1', [inv.therapist_id]);
    const upi = rows && rows[0] && rows[0].upi_id;
    if (!upi) return { status: false, code: 404, message: 'No UPI ID is set up for this invoice.', data: null };
    const q = new URLSearchParams({ pa: upi, pn: inv.clinic_name || '', am: Number(inv.total).toFixed(2), cu: 'INR', tn: `Invoice ${inv.invoice_number}` });
    return { status: true, code: 200, message: 'UPI link', data: { url: `upi://pay?${q.toString()}` } };
  } catch (error) {
    console.log('Error in getUpiDeepLinkService::>>', error);
    return null;
  }
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const PAYABLE = ['sent', 'overdue', 'payment_initiated'];

// An invoice for a booked service is paid ONE way, the one set on the service: 'direct' | 'razorpay'.
// Any other invoice returns null and keeps offering whatever the therapist has set up.
const methodForInvoice = async (invoiceId) => {
  const [rows] = await db.query(
    `SELECT s.payment_method FROM prodesk_service_purchases p JOIN prodesk_services s ON s.id = p.service_id WHERE p.invoice_id = ? LIMIT 1`, [invoiceId]);
  return rows && rows[0] ? rows[0].payment_method : null;
};

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

const getPayInfoService = async ({ token, peek = false }) => {
  try {
    const invoiceId = parseToken(token);
    if (!invoiceId) return { status: false, code: 404, message: 'This payment link is not valid.', data: null };
    const inv = await loadInvoice(invoiceId);
    if (!inv) return { status: false, code: 404, message: 'This payment link is not valid.', data: null };

    // The client opened the pay page: on the invoice's payment trail (at most once per 10 minutes)
    if (PAYABLE.includes(inv.status) && !peek) {
      try {
        const [recent] = await db.query("SELECT id FROM prodesk_payment_log WHERE invoice_id = ? AND event_type = 'pay_page.opened' AND created_at > DATE_SUB(UTC_TIMESTAMP(), INTERVAL 10 MINUTE) LIMIT 1", [invoiceId]);
        if (!recent || !recent.length) {
          const [pay] = await db.query('SELECT id FROM prodesk_payment WHERE invoice_id = ? ORDER BY id DESC LIMIT 1', [invoiceId]);
          if (pay && pay.length) await db.query("INSERT INTO prodesk_payment_log (payment_id, invoice_id, status, event_type, source, meta) VALUES (?, ?, 'viewed', 'pay_page.opened', 'client', ?)", [pay[0].id, invoiceId, JSON.stringify({})]);
        }
      } catch (e) { console.log('pay page view log (non-fatal)::>>', e.message); }
    }

    const summary = {
      invoice_number: inv.invoice_number, total: inv.total, status: inv.status,
      issue_date: inv.issue_date, due_date: inv.due_date, client_name: inv.client_name, clinic_name: inv.clinic_name,
    };
    if (inv.status === 'paid') {
      // If this invoice is for a booking request, tell the pay page where the client's request page is, so it can send them back there
      let booking = null;
      try {
        const [[b]] = await db.query(
          `SELECT t.booking_slug, ps.starts_at, ps.duration_min, ps.modality, sv.name AS service_name
           FROM prodesk_service_purchases p
           JOIN prodesk_sessions ps ON ps.purchase_id = p.id
           JOIN therapists t ON t.id = p.therapist_id
           JOIN prodesk_services sv ON sv.id = p.service_id
           WHERE p.invoice_id = ? AND t.booking_slug IS NOT NULL ORDER BY ps.id LIMIT 1`, [invoiceId]);
        if (b) booking = { slug: b.booking_slug, service: b.service_name, when: formatISTWallClock(b.starts_at), duration_min: b.duration_min, modality: b.modality };
      } catch (e) { console.log('pay page booking lookup (non-fatal)::>>', e.message); }
      return { status: true, code: 200, message: 'Paid', data: { invoice: summary, razorpay: null, direct: null, booking } };
    }
    if (!PAYABLE.includes(inv.status)) {
      return { status: false, code: 409, message: 'This invoice can no longer be paid online.', data: null };
    }

    const method = await methodForInvoice(inv.id);
    let razorpay = null;
    const tok = method === 'direct' ? null : await PartnerService.getAccessToken(inv.therapist_id).catch(() => null);   // a direct-payment service never opens Checkout
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
    const direct = method !== 'razorpay' && b && (b.upi_id || b.qr_url || b.account_number) ? b : null;

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

module.exports = { logAttemptService, methodForInvoice, upiLinkUrl, getUpiDeepLinkService, payUrl, makeToken, parseToken, getPayInfoService, verifyPaymentService };
