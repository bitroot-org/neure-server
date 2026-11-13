const db = require('../../../config/db');
const Activity = require('./activityLogService');
const Intake = require('./intakeFormService');
const Consent = require('./consentFormService');
const Catalog = require('./serviceCatalogService');
const Billing = require('./billingService');
const planGuard = require('./planGuard');
const { createSessionService } = require('./sessionService');
const { formatISTWallClock } = require('../../utils/dateHelper');

// ─── Purchases: what a client bought (one session or a bundle) ───────────────
// The MONEY lives on the invoice (existing invoice, payment and refund functions). A purchase only says
// what was bought and for how many sessions:
//   status          pending_payment | active | cancelled   (active when its invoice is paid, see activateForInvoice)
// Derived on read, never stored, so it cannot drift:
//   sessions_used      = this purchase's sessions that are scheduled / completed / no_show
//   sessions_remaining = sessions_total - used
//   state              = pending_payment | cancelled | expired | completed | active
//   payment_status     = not_invoiced | unpaid | paid | refunded | cancelled   (from the invoice and its payment)

const PAYMENT_MODES = ['upi', 'bank_transfer', 'cash'];
const CONSUMING = "('scheduled','completed','no_show')";

const bad = (code, message, data = null) => ({ status: false, code, message, data });

// Only two ways to meet: a video call, or in person
const MODALITIES = { online: ['video'], in_person: ['in_person'], both: ['video', 'in_person'] };

// ─── Shared read (list + detail) ─────────────────────────────────────────────

const BASE_SELECT = `
  SELECT p.*,
         s.name AS service_name, s.session_mode, s.duration_min, s.payment_method,
         CONCAT_WS(' ', u.first_name, u.last_name) AS client_name, u.email AS client_email, u.phone AS client_phone,
         (SELECT COUNT(*) FROM prodesk_sessions x WHERE x.purchase_id = p.id AND x.status IN ${CONSUMING}) AS sessions_used,
         (SELECT COUNT(*) FROM prodesk_sessions x WHERE x.purchase_id = p.id AND x.status = 'completed') AS sessions_completed,
         (p.valid_until IS NOT NULL AND p.valid_until < UTC_TIMESTAMP()) AS past_validity,
         i.invoice_number, i.status AS invoice_status, i.total AS invoice_total, i.paid_at,
         pay.status AS pay_status, pay.payment_mode, pay.payer_reference
  FROM prodesk_service_purchases p
  JOIN prodesk_services s ON s.id = p.service_id
  JOIN prodesk_clients pc ON pc.id = p.client_id
  JOIN users u ON u.user_id = pc.user_id
  LEFT JOIN prodesk_invoices i ON i.id = p.invoice_id
  LEFT JOIN prodesk_payment pay ON pay.id = (SELECT MAX(id) FROM prodesk_payment WHERE invoice_id = p.invoice_id)`;

const shape = (r) => {
  const used = Number(r.sessions_used), total = Number(r.sessions_total);
  const remaining = r.status === 'cancelled' ? 0 : Math.max(total - used, 0);   // a cancelled booking has nothing left to use
  let payment_status = 'unpaid';
  // Money first: a booking that was paid and then cancelled says what happened to the money, not just "cancelled"
  if (r.pay_status === 'refunded') payment_status = 'refunded';
  else if (r.pay_status === 'refund_initiated') payment_status = 'refund_initiated';            // Razorpay is returning it
  else if (r.status === 'cancelled' && r.invoice_status === 'paid') payment_status = 'refund_due';   // paid directly: the therapist returns it themselves
  else if (r.status === 'cancelled' || r.invoice_status === 'cancelled') payment_status = 'cancelled';
  else if (!r.invoice_id && Number(r.price_paid) === 0) payment_status = 'free';   // a free service: nothing to pay
  else if (!r.invoice_id) payment_status = 'not_invoiced';                       // a pay-later request that is not approved yet
  else if (r.invoice_status === 'paid') payment_status = 'paid';

  let state = r.status;                                         // pending_payment | cancelled | active
  if (r.status === 'active') {
    if (Number(r.sessions_completed) >= total) state = 'completed';
    else if (r.past_validity && remaining > 0) state = 'expired';
  }
  const { past_validity, pay_status, ...rest } = r;
  return { ...rest, sessions_used: used, sessions_remaining: remaining, sessions_completed: Number(r.sessions_completed), state, payment_status, is_package: total > 1 };
};

const getPurchasesService = async ({ therapist_id, client_id, service_id, state, payment_status }) => {
  try {
    const where = ['p.therapist_id = ?'];
    const params = [therapist_id];
    if (client_id) { where.push('p.client_id = ?'); params.push(client_id); }
    if (service_id) { where.push('p.service_id = ?'); params.push(service_id); }
    const [rows] = await db.query(`${BASE_SELECT} WHERE ${where.join(' AND ')} ORDER BY p.id DESC LIMIT 500`, params);
    let data = rows.map(shape);

    const counts = { all: data.length, pending_payment: 0, active: 0, completed: 0, expired: 0, cancelled: 0 };
    for (const d of data) counts[d.state] = (counts[d.state] || 0) + 1;
    if (state) data = data.filter((d) => d.state === state);
    if (payment_status) data = data.filter((d) => d.payment_status === payment_status);
    return { status: true, code: 200, message: 'Purchases fetched', data: { purchases: data, counts } };
  } catch (error) {
    console.log('Error in getPurchasesService::>>', error);
    return null;
  }
};

const getPurchaseByIdService = async ({ therapist_id, purchase_id }) => {
  try {
    const [rows] = await db.query(`${BASE_SELECT} WHERE p.id = ? AND p.therapist_id = ?`, [purchase_id, therapist_id]);
    if (!rows || !rows.length) return bad(404, 'Purchase not found');
    const purchase = shape(rows[0]);

    const [sessions] = await db.query(
      'SELECT id, session_number, title, starts_at, duration_min, modality, status, fee FROM prodesk_sessions WHERE purchase_id = ? ORDER BY starts_at', [purchase_id]);
    const [payments] = purchase.invoice_id ? await db.query('SELECT * FROM prodesk_payment WHERE invoice_id = ? ORDER BY id', [purchase.invoice_id]) : [[]];
    const [logs] = purchase.invoice_id
      ? await db.query('SELECT id, payment_id, status, event_type, source, meta, created_at FROM prodesk_payment_log WHERE invoice_id = ? ORDER BY id', [purchase.invoice_id])
      : [[]];
    const intake = await Intake.getResponsesService({ therapist_id, purchase_id });
    return { status: true, code: 200, message: 'Purchase fetched', data: { purchase, sessions, payments, payment_logs: logs, intake_responses: intake ? intake.data : [] } };
  } catch (error) {
    console.log('Error in getPurchaseByIdService::>>', error);
    return null;
  }
};

// Is this client already with this therapist? (a session that is not cancelled, or a paid active purchase)
const clientIsExisting = async (therapist_id, client_id) => {
  const [r] = await db.query(
    `SELECT 1 FROM prodesk_sessions WHERE therapist_id = ? AND client_id = ? AND status <> 'cancelled'
     UNION SELECT 1 FROM prodesk_service_purchases WHERE therapist_id = ? AND client_id = ? AND status = 'active' LIMIT 1`,
    [therapist_id, client_id, therapist_id, client_id]);
  return !!(r && r.length);
};

// What must this client still do before booking this service? (client_id optional: an unknown client is a new client)
const getRequirementsService = async ({ therapist_id, service_id, client_id }) => {
  try {
    const [sv] = await db.query('SELECT * FROM prodesk_services WHERE id = ? AND therapist_id = ?', [service_id, therapist_id]);
    if (!sv || !sv.length) return bad(404, 'Service not found');
    const svc = sv[0];
    if (client_id) {
      const [c] = await db.query('SELECT id FROM prodesk_clients WHERE id = ? AND therapist_id = ?', [client_id, therapist_id]);
      if (!c || !c.length) return bad(404, 'Client not found');
    }
    const existing = client_id ? await clientIsExisting(therapist_id, client_id) : false;

    let intake = { needed: false, required: false };
    if (svc.intake_form_mode !== 'none' && svc.intake_form_id) {
      const form = await Intake.loadForm(svc.intake_form_id, therapist_id);
      if (form) {
        let skipped = null;
        if (form.new_clients_only && existing) skipped = 'existing_client';
        else if (client_id) {
          const [a] = await db.query('SELECT 1 FROM prodesk_intake_responses WHERE form_id = ? AND client_id = ? LIMIT 1', [form.id, client_id]);
          if (a && a.length) skipped = 'already_answered';
        }
        intake = {
          form_id: form.id, title: form.title, mode: svc.intake_form_mode, needed: !skipped, required: !skipped && svc.intake_form_mode === 'required',
          skipped_reason: skipped, ...(skipped ? {} : { fields: form.fields }),
        };
      }
    }

    let consent = { needed: false };
    if (svc.consent_form_id) {
      const st = await Consent.consentStatusFor(svc.consent_form_id, client_id);
      consent = st.version
        ? { consent_form_id: svc.consent_form_id, needed: st.needed, version_no: st.version.version_no, ...(st.needed ? { body: st.version.body, file_url: st.version.file_url } : {}) }
        : { needed: false };
    }
    const price = await Catalog.resolvePrice(service_id, client_id || null);
    return { status: true, code: 200, message: 'Requirements', data: { existing_client: existing, price, intake, consent } };
  } catch (error) {
    console.log('Error in getRequirementsService::>>', error);
    return null;
  }
};

// ─── Invoice for a purchase (existing invoice functions) ─────────────────────

// Creates and opens the invoice for a purchase: one line, the price this client pays, no extra tax.
// notify:false opens it for payment without emailing it (the client is on the pay page already, or it is a test).
const openInvoiceForPurchase = async ({ therapist_id, client_id, session_id = null, purchase_id, svc, price, notify = true, notes = null }) => {
  const created = await Billing.createInvoiceService({
    therapist_id, client_id, session_id,
    line_items: [{ description: svc.name, qty: 1, rate: price }],
    tax_percent: 0, notes, action: 'draft',
  });
  if (!created || !created.status) return created;
  // linked first, so the invoice (email, WhatsApp, pay page) knows which single payment method to offer
  await db.query('UPDATE prodesk_service_purchases SET invoice_id = ? WHERE id = ?', [created.data.id, purchase_id]);
  const sent = await Billing.sendInvoiceService({ therapist_id, invoice_id: created.data.id, notify });
  if (!sent || !sent.status) {
    await db.query('UPDATE prodesk_service_purchases SET invoice_id = NULL WHERE id = ?', [purchase_id]);
    await Billing.cancelInvoiceService({ therapist_id, invoice_id: created.data.id }).catch(() => {});
  }
  return sent;
};

// ─── Create (therapist sells a service to a client) ──────────────────────────

const createPurchaseService = async (payload) => {
  const { therapist_id, actor_user_id, client_id, service_id, intake_answers, consent_accepted, ip_address = null, notify = true } = payload;
  let purchaseId = null;
  try {
    if (!client_id || !service_id) return bad(400, 'client_id and service_id are required');

    const [cl] = await db.query('SELECT pc.id, pc.user_id FROM prodesk_clients pc WHERE pc.id = ? AND pc.therapist_id = ?', [client_id, therapist_id]);
    if (!cl || !cl.length) return bad(404, 'Client not found');

    // Same rules as booking a session: a blocked or view-only (Starter plan) client cannot be sold to,
    // otherwise they would pay for sessions the therapist then cannot schedule.
    const [[blk]] = await db.query('SELECT is_blocked FROM prodesk_clients WHERE id = ?', [client_id]);
    if (blk && blk.is_blocked) return bad(403, 'This client is blocked. Unblock them to sell new services.');
    const gate = await planGuard.checkUseClient(therapist_id, client_id);
    if (!gate.ok) return gate.response;

    const [sv] = await db.query('SELECT * FROM prodesk_services WHERE id = ? AND therapist_id = ?', [service_id, therapist_id]);
    if (!sv || !sv.length) return bad(404, 'Service not found');
    const svc = sv[0];
    if (svc.status !== 'active') return bad(409, 'This service is not active, so it cannot be sold');
    if (svc.expires_at && new Date(String(svc.expires_at).replace(' ', 'T') + 'Z') < new Date()) return bad(409, 'This service has expired');

    const isFree = svc.payment_timing === 'free';
    const paid = isFree ? null : await paymentMethodReady(therapist_id, svc.payment_method);
    if (paid) return paid;

    // Intake form and agreement, only what this client still needs
    const reqs = await getRequirementsService({ therapist_id, service_id, client_id });
    if (!reqs || !reqs.status) return reqs;
    const { intake, consent } = reqs.data;
    if (intake.required && !Array.isArray(intake_answers)) return bad(422, 'This service needs the intake form to be filled in');
    if (consent.needed && consent_accepted !== true) return bad(422, 'The client must accept the agreement before booking');

    let responseId = null;
    if (intake.needed && Array.isArray(intake_answers)) {
      const r = await Intake.submitResponseService({ therapist_id, form_id: intake.form_id, client_id, answers: intake_answers });
      if (!r) return null;
      if (!r.status) return r;
      responseId = r.data.id;
    }

    const { price } = await Catalog.resolvePrice(service_id, client_id);   // the client's special price, else the normal one
    const [pr] = await db.query(
      `INSERT INTO prodesk_service_purchases (therapist_id, client_id, service_id, sessions_total, price_paid, validity_days, status${isFree ? ', activated_at' : ''})
       VALUES (?, ?, ?, ?, ?, ?, ?${isFree ? ', UTC_TIMESTAMP()' : ''})`,
      [therapist_id, client_id, service_id, svc.sessions_count, price, svc.validity_days, isFree ? 'active' : 'pending_payment']
    );
    purchaseId = pr.insertId;
    if (responseId) await db.query('UPDATE prodesk_intake_responses SET purchase_id = ? WHERE id = ?', [purchaseId, responseId]);

    // A free service has no invoice and nothing to pay: it is active straight away
    let inv = { status: true, data: { id: null, invoice_number: null } };
    if (!isFree) {
      inv = await openInvoiceForPurchase({ therapist_id, client_id, purchase_id: purchaseId, svc, price, notify });
      if (!inv || !inv.status) {
        await db.query('DELETE FROM prodesk_service_purchases WHERE id = ?', [purchaseId]);   // nothing half-made is left behind
        purchaseId = null;
        return inv || bad(500, 'Could not create the invoice');
      }
    }

    if (consent.needed) await Consent.recordAcceptance({ therapist_id, actor_user_id, consent_form_id: consent.consent_form_id, client_id, purchase_id: purchaseId, ip_address });
    await Activity.record({
      actor_user_id, module_name: 'purchase', action: 'created',
      description: isFree ? `Booked the free service "${svc.name}"` : `Sold "${svc.name}"${svc.sessions_count > 1 ? ` (${svc.sessions_count} sessions)` : ' (single session)'} for ₹${price}, invoice ${inv.data.invoice_number}`,
      meta: { therapist_id, purchase_id: purchaseId, service_id: Number(service_id), client_id: Number(client_id), invoice_id: inv.data.id, amount: price, special_price: price !== Number(svc.price) },
    });
    return { status: true, code: 201, message: isFree ? 'Booking created' : 'Booking created, invoice sent', data: (await getPurchaseByIdService({ therapist_id, purchase_id: purchaseId })).data };
  } catch (error) {
    console.log('Error in createPurchaseService::>>', error);
    if (purchaseId) await db.query('DELETE FROM prodesk_service_purchases WHERE id = ? AND invoice_id IS NULL', [purchaseId]).catch(() => {});
    return null;
  }
};

// The service's payment method must actually work for this therapist
const paymentMethodReady = async (therapist_id, method) => {
  if (method === 'razorpay') {
    const [r] = await db.query("SELECT 1 FROM therapist_razorpay_accounts WHERE therapist_id = ? AND status = 'active'", [therapist_id]);
    if (!r || !r.length) return bad(422, 'Connect Razorpay in Payment integration to sell this service');
    return null;
  }
  const [b] = await db.query(
    'SELECT 1 FROM therapist_bank_accounts WHERE therapist_id = ? AND direct_pay_enabled = 1 AND (upi_id IS NOT NULL OR qr_url IS NOT NULL OR account_number IS NOT NULL)', [therapist_id]);
  if (!b || !b.length) return bad(422, 'Add UPI, QR or bank details in Payment integration and turn on direct payment first');
  return null;
};

// ─── When its invoice is paid, the purchase becomes active (called from the invoice code) ─

const activateForInvoice = async (invoice_id) => {
  const [rows] = await db.query("SELECT * FROM prodesk_service_purchases WHERE invoice_id = ? AND status = 'pending_payment'", [invoice_id]);
  for (const p of rows) {
    await db.query(
      `UPDATE prodesk_service_purchases SET status = 'active', activated_at = UTC_TIMESTAMP(),
         valid_until = IF(validity_days IS NULL, NULL, DATE_ADD(UTC_TIMESTAMP(), INTERVAL validity_days DAY)) WHERE id = ?`, [p.id]);
    await Activity.record({
      actor_user_id: null, performed_by: 'system', module_name: 'payment', action: 'purchase_paid', description: 'Invoice paid, booking is now active',
      meta: { therapist_id: p.therapist_id, purchase_id: p.id, service_id: p.service_id, client_id: p.client_id, invoice_id: Number(invoice_id) },
    });
    // The session(s) the therapist created and is holding for this payment confirm themselves now (all of a package, with one message)
    const confirmed = await require('./sessionService').confirmHeldSessionsService(p.id);
    for (const sid of confirmed) {
      await Activity.record({
        actor_user_id: null, performed_by: 'system', module_name: 'session', action: 'confirmed_on_payment', description: 'The session was confirmed because the client paid',
        meta: { therapist_id: p.therapist_id, purchase_id: p.id, session_id: sid, client_id: p.client_id, invoice_id: Number(invoice_id) },
      });
    }
  }
};

// ─── Therapist marks a direct payment as received (existing "mark paid") ─────

const confirmDirectPaymentService = async ({ therapist_id, actor_user_id, purchase_id, payment_mode, payer_reference }) => {
  try {
    if (!PAYMENT_MODES.includes(payment_mode)) return bad(400, `payment_mode must be one of ${PAYMENT_MODES.join(', ')}`);
    const [rows] = await db.query('SELECT * FROM prodesk_service_purchases WHERE id = ? AND therapist_id = ?', [purchase_id, therapist_id]);
    if (!rows || !rows.length) return bad(404, 'Purchase not found');
    const p = rows[0];
    if (p.status === 'cancelled') return bad(409, 'This purchase is cancelled, payment cannot be confirmed');
    if (!p.invoice_id) return bad(409, 'This request has no invoice yet. Approve the request first.');

    const [[inv]] = await db.query('SELECT status FROM prodesk_invoices WHERE id = ?', [p.invoice_id]);
    if (inv.status === 'paid') return { status: true, code: 200, message: 'Already confirmed', data: (await getPurchaseByIdService({ therapist_id, purchase_id })).data };

    const r = await Billing.markInvoicePaidService({ therapist_id, invoice_id: p.invoice_id, method: payment_mode, reference: payer_reference ? String(payer_reference).trim() : undefined });
    if (!r || !r.status) return r || bad(500, 'Could not mark the invoice paid');

    await Activity.record({
      actor_user_id, module_name: 'payment', action: 'direct_confirmed', description: `Marked invoice paid (${payment_mode})`,
      meta: { therapist_id, purchase_id: Number(purchase_id), service_id: p.service_id, client_id: p.client_id, invoice_id: p.invoice_id, payment_mode, payer_reference: payer_reference || null },
    });
    return { status: true, code: 200, message: 'Payment confirmed, booking is active', data: (await getPurchaseByIdService({ therapist_id, purchase_id })).data };
  } catch (error) {
    console.log('Error in confirmDirectPaymentService::>>', error);
    return null;
  }
};

// ─── Cancel a purchase: unpaid -> invoice cancelled; paid -> full refund ─────
// A Razorpay payment is refunded through the existing refund function. A direct payment cannot be pulled back by us,
// so the result says "manual": the therapist returns the money themselves.

const cancelPurchaseCore = async ({ therapist_id, actor_user_id, purchase, reason }) => {
  const [[inv]] = purchase.invoice_id ? await db.query('SELECT status FROM prodesk_invoices WHERE id = ?', [purchase.invoice_id]) : [[null]];
  let refund = 'none';
  if (inv && inv.status === 'paid') {
    const [[pay]] = await db.query("SELECT method FROM prodesk_payment WHERE invoice_id = ? AND status = 'captured' ORDER BY id DESC LIMIT 1", [purchase.invoice_id]);
    if (pay && pay.method === 'razorpay') {
      const r = await Billing.initiateRefundService({ therapist_id, invoice_id: purchase.invoice_id });
      if (!r || !r.status) return { error: r || bad(502, 'The refund could not be started') };
      refund = 'initiated';
    } else refund = 'manual';
  } else if (inv && inv.status !== 'cancelled') {
    await Billing.cancelInvoiceService({ therapist_id, invoice_id: purchase.invoice_id });
  }
  await db.query("UPDATE prodesk_service_purchases SET status = 'cancelled' WHERE id = ?", [purchase.id]);
  await Activity.record({
    actor_user_id, module_name: 'purchase', action: 'cancelled', description: `Cancelled a booking${refund === 'initiated' ? ' and refunded it in full' : refund === 'manual' ? ' (paid directly, refund the client yourself)' : ''}`,
    meta: { therapist_id, purchase_id: purchase.id, service_id: purchase.service_id, client_id: purchase.client_id, invoice_id: purchase.invoice_id, refund, reason: reason || null },
  });
  return { refund };
};

const cancelPurchaseService = async ({ therapist_id, actor_user_id, purchase_id, reason }) => {
  try {
    const [rows] = await db.query('SELECT * FROM prodesk_service_purchases WHERE id = ? AND therapist_id = ?', [purchase_id, therapist_id]);
    if (!rows || !rows.length) return bad(404, 'Purchase not found');
    const p = rows[0];
    if (p.status === 'cancelled') return { status: true, code: 200, message: 'Already cancelled', data: (await getPurchaseByIdService({ therapist_id, purchase_id })).data };

    const [[{ n }]] = await db.query(`SELECT COUNT(*) AS n FROM prodesk_sessions WHERE purchase_id = ? AND status IN ${CONSUMING}`, [purchase_id]);
    if (n > 0) return bad(409, 'This booking has sessions. Cancel or delete them first.');

    const r = await cancelPurchaseCore({ therapist_id, actor_user_id, purchase: p, reason });
    if (r.error) return r.error;
    return { status: true, code: 200, message: r.refund === 'initiated' ? 'Cancelled, full refund started' : r.refund === 'manual' ? 'Cancelled. It was paid directly, so please refund the client yourself' : 'Booking cancelled', data: { ...(await getPurchaseByIdService({ therapist_id, purchase_id })).data, refund: r.refund } };
  } catch (error) {
    console.log('Error in cancelPurchaseService::>>', error);
    return null;
  }
};

// ─── Public booking requests: approve / decline (existing session functions call these) ─

const purchaseOfSession = async (session_id) => {
  const [[s]] = await db.query('SELECT purchase_id, therapist_id FROM prodesk_sessions WHERE id = ?', [session_id]);
  if (!s || !s.purchase_id) return null;
  const [[p]] = await db.query('SELECT * FROM prodesk_service_purchases WHERE id = ?', [s.purchase_id]);
  return p || null;
};

// Pay-later request approved: now the invoice goes out (existing invoice create + send)
const onRequestApproved = async (session_id) => {
  try {
    const p = await purchaseOfSession(session_id);
    if (!p || p.invoice_id || p.status !== 'pending_payment') return;
    const [[svc]] = await db.query('SELECT * FROM prodesk_services WHERE id = ?', [p.service_id]);
    const inv = await openInvoiceForPurchase({ therapist_id: p.therapist_id, client_id: p.client_id, session_id, purchase_id: p.id, svc, price: Number(p.price_paid), notify: true });
    if (!inv || !inv.status) console.log('onRequestApproved: invoice not created::>>', inv && inv.message);
  } catch (e) { console.log('onRequestApproved failed (non-fatal)::>>', e.message); }
};

// Request declined: an unpaid invoice is cancelled, a paid one is refunded in full
const onRequestDeclined = async (session_id, actor_user_id = null) => {
  try {
    const p = await purchaseOfSession(session_id);
    if (!p || p.status === 'cancelled') return 'none';
    const r = await cancelPurchaseCore({ therapist_id: p.therapist_id, actor_user_id, purchase: p, reason: 'Booking request declined' });
    return r.error ? 'failed' : r.refund;          // 'initiated' | 'manual' | 'none' | 'failed'
  } catch (e) { console.log('onRequestDeclined failed (non-fatal)::>>', e.message); return 'failed'; }
};

// A prepaid request holds its time slot while the client pays. If it is not paid in time the slot is released again:
// online (Razorpay) after 60 minutes; direct payments after 24 hours, as the therapist has to confirm those by hand.
const expireUnpaidRequests = async ({ razorpayMinutes = 60, directHours = 24 } = {}) => {
  const out = { released: 0 };
  try {
    const [rows] = await db.query(
      `SELECT ps.id AS session_id, p.id AS purchase_id, p.therapist_id, p.service_id, p.client_id, p.invoice_id, s.payment_method
       FROM prodesk_sessions ps
       JOIN prodesk_service_purchases p ON p.id = ps.purchase_id
       JOIN prodesk_services s ON s.id = p.service_id
       JOIN prodesk_invoices i ON i.id = p.invoice_id
       WHERE ps.status = 'pending' AND p.status = 'pending_payment' AND (s.payment_timing = 'prepaid' OR ps.requested_by = 'therapist') AND i.status IN ('sent', 'overdue')
         AND ps.created_at < DATE_SUB(UTC_TIMESTAMP(), INTERVAL IF(s.payment_method = 'razorpay', ?, ?) MINUTE)
       LIMIT 200`, [razorpayMinutes, directHours * 60]);
    for (const r of rows) {
      try {
        // nothing was paid meanwhile
        const [[inv]] = await db.query('SELECT status FROM prodesk_invoices WHERE id = ?', [r.invoice_id]);
        if (!inv || !['sent', 'overdue'].includes(inv.status)) continue;
        const [[p]] = await db.query('SELECT * FROM prodesk_service_purchases WHERE id = ?', [r.purchase_id]);
        // every held session of this purchase (a package holds several), not just the first
        const [u] = await db.query("UPDATE prodesk_sessions SET status = 'cancelled' WHERE purchase_id = ? AND status = 'pending'", [r.purchase_id]);
        if (!u.affectedRows) continue;
        await cancelPurchaseCore({ therapist_id: r.therapist_id, actor_user_id: null, purchase: p, reason: 'Payment was not completed in time' });
        await Activity.record({
          actor_user_id: null, performed_by: 'system', module_name: 'booking_request', action: 'expired', description: 'A booking was released because it was not paid in time',
          meta: { therapist_id: r.therapist_id, session_id: r.session_id, purchase_id: r.purchase_id, service_id: r.service_id, client_id: r.client_id, invoice_id: r.invoice_id, payment_method: r.payment_method },
        });
        out.released++;
      } catch (e) { console.log('expireUnpaidRequests: one request failed (non-fatal)::>>', e.message); }
    }
  } catch (e) { console.log('expireUnpaidRequests failed (non-fatal)::>>', e.message); }
  return out;
};

// ─── The therapist adds a session for a client, with a service (+ Add Session) ───
// Prepaid:  the time is held (the calendar is blocked) and the client gets the invoice with the payment link. Paying confirms the
//           session by itself; if it is not paid in time the time is released again (see expireUnpaidRequests).
// Postpaid: the session is confirmed now and the invoice, with its payment link, goes to the client.
// Free:     the session is confirmed now. No invoice and nothing to pay.
const createServiceSessionService = async ({ therapist_id, actor_user_id, client_id, service_id, starts_at, starts_at_list, modality, pay_timing, meet_url, ip_address = null }) => {
  let purchaseId = null, sessionId = null, createdIds = [];
  try {
    if (!client_id || !service_id || !(starts_at || (Array.isArray(starts_at_list) && starts_at_list.length)) || !modality) return bad(400, 'client_id, service_id, starts_at and modality are required');

    const [[cl]] = await db.query('SELECT id, is_blocked FROM prodesk_clients WHERE id = ? AND therapist_id = ? AND deleted_at IS NULL', [client_id, therapist_id]);
    if (!cl) return bad(404, 'Client not found');
    if (cl.is_blocked) return bad(403, 'This client is blocked. Unblock them to book sessions.');
    const gate = await planGuard.checkUseClient(therapist_id, client_id);
    if (!gate.ok) return gate.response;

    const [[svc]] = await db.query('SELECT * FROM prodesk_services WHERE id = ? AND therapist_id = ?', [service_id, therapist_id]);
    if (!svc) return bad(404, 'Service not found');
    if (svc.status !== 'active') return bad(409, 'This service is not active, so it cannot be booked');
    if (svc.expires_at && new Date(String(svc.expires_at).replace(' ', 'T') + 'Z') < new Date()) return bad(409, 'This service has expired');
    if (!(MODALITIES[svc.session_mode] || []).includes(modality)) {
      return bad(422, `This service is ${svc.session_mode.replace('_', '-')}; allowed: ${MODALITIES[svc.session_mode].join(', ')}`);
    }

    // A package: all of its sessions are booked now, so every time is asked for up front
    const times = Array.isArray(starts_at_list) && starts_at_list.length ? starts_at_list : [starts_at];
    if (times.length !== Number(svc.sessions_count)) {
      return bad(422, Number(svc.sessions_count) > 1 ? `This package has ${svc.sessions_count} sessions. Pick all ${svc.sessions_count} times.` : 'Pick one time for this session');
    }
    starts_at = times[0];
    const multi = times.length > 1;

    const isFree = svc.payment_timing === 'free';
    const timing = isFree ? 'free' : (pay_timing || svc.payment_timing);
    if (!['prepaid', 'postpaid', 'free'].includes(timing)) return bad(400, 'pay_timing must be prepaid or postpaid');
    if (!isFree) { const notReady = await paymentMethodReady(therapist_id, svc.payment_method); if (notReady) return notReady; }

    const { price } = await Catalog.resolvePrice(service_id, client_id);   // the client's special price, else the normal one
    const fee = Math.round((price / svc.sessions_count) * 100) / 100;      // fee of ONE session

    const [pr] = await db.query(
      `INSERT INTO prodesk_service_purchases (therapist_id, client_id, service_id, sessions_total, price_paid, validity_days, status${isFree ? ', activated_at' : ''})
       VALUES (?, ?, ?, ?, ?, ?, ?${isFree ? ', UTC_TIMESTAMP()' : ''})`,
      [therapist_id, client_id, service_id, svc.sessions_count, price, svc.validity_days, isFree ? 'active' : 'pending_payment']);
    purchaseId = pr.insertId;

    // one session per time: held until paid (prepaid) or confirmed now (postpaid, free). A package sends ONE message instead of one per session.
    const createdRows = [];
    for (let i = 0; i < times.length; i++) {
      const r1 = await createSessionService({
        therapist_id, client_id, starts_at: times[i], duration_min: svc.duration_min, modality, fee, title: svc.name, meet_url,
        service_id: Number(service_id), purchase_id: purchaseId, hold: timing === 'prepaid', skip_notifications: multi,
      });
      if (!r1 || !r1.status) {
        if (createdIds.length) await db.query('DELETE FROM prodesk_sessions WHERE id IN (?)', [createdIds]);
        createdIds = [];
        await db.query('DELETE FROM prodesk_service_purchases WHERE id = ?', [purchaseId]); purchaseId = null;
        return r1 && r1.message ? { ...r1, message: multi ? `Session ${i + 1}: ${r1.message}. Nothing was booked.` : r1.message } : r1;
      }
      createdIds.push(r1.data.id); createdRows.push(r1.data);
    }
    const created = { status: true, data: createdRows[0] };
    sessionId = created.data.id;
    if (multi && timing !== 'prepaid') {
      await require('./sessionService').sendMultipleScheduledMessages({ therapist_id, client_id, sessions: createdRows.map((c) => ({ id: c.id, starts_at: c.starts_at, duration_min: c.duration_min, meet_url: c.meet_url, modality: c.modality })) });
    }

    let invoice = null;
    if (timing !== 'free') {
      const holdText = svc.payment_method === 'razorpay' ? '1 hour' : '24 hours';
      const notes = timing === 'prepaid' ? (multi ? `Your ${times.length} sessions (${times.map((x) => formatISTWallClock(x)).join('; ')}) are held for you. Please pay within ${holdText} to confirm them.` : `Your session on ${formatISTWallClock(starts_at)} is held for you. Please pay within ${holdText} to confirm it.`) : null;
      const inv = await openInvoiceForPurchase({ therapist_id, client_id, session_id: sessionId, purchase_id: purchaseId, svc, price, notify: true, notes });
      if (!inv || !inv.status) {
        // nothing half-made is left behind: no held time, no purchase
        await db.query('DELETE FROM prodesk_sessions WHERE id IN (?)', [createdIds]); sessionId = null; createdIds = [];
        await db.query('DELETE FROM prodesk_service_purchases WHERE id = ?', [purchaseId]); purchaseId = null;
        return inv || bad(500, 'Could not create the invoice');
      }
      invoice = { id: inv.data.id, invoice_number: inv.data.invoice_number, pay_url: await require('./invoicePayService').payUrl(inv.data.id) };
    }

    await Activity.record({
      actor_user_id, module_name: 'session', action: 'created_with_service',
      description: `Added a ${timing} session for "${svc.name}"${timing === 'free' ? '' : ` (₹${price})`}${timing === 'prepaid' ? ', held until the client pays' : ''}`,
      meta: { therapist_id, session_id: sessionId, purchase_id: purchaseId, service_id: Number(service_id), client_id: Number(client_id), price, payment_timing: timing, starts_at, modality, invoice_id: invoice ? invoice.id : null },
    });
    return {
      status: true, code: 201,
      message: timing === 'prepaid' ? 'Session held. The client has the invoice with the payment link' : timing === 'postpaid' ? 'Session booked. The client has the invoice' : 'Free session booked',
      data: { ...created.data, ...(multi ? { session_ids: createdIds, sessions_count: createdIds.length } : {}), purchase_id: purchaseId, service_id: Number(service_id), payment_timing: timing, price, invoice },
    };
  } catch (error) {
    console.log('Error in createServiceSessionService::>>', error);
    if (createdIds.length) await db.query('DELETE FROM prodesk_sessions WHERE id IN (?)', [createdIds]).catch(() => {});
    if (purchaseId) await db.query('DELETE FROM prodesk_service_purchases WHERE id = ? AND invoice_id IS NULL', [purchaseId]).catch(() => {});
    return null;
  }
};

// ─── Book a session against a purchase ───────────────────────────────────────

const bookPurchaseSessionService = async ({ therapist_id, actor_user_id, purchase_id, starts_at, modality, title, meet_url, skip_notifications = false }) => {
  let lockConn;
  const lockName = `purchase_book_${purchase_id}`;
  try {
    if (!starts_at || !modality) return bad(400, 'starts_at and modality are required');

    // Serialise bookings of one purchase, so two requests cannot both take the last credit.
    lockConn = await db.getConnection();
    const [[{ got }]] = await lockConn.query('SELECT GET_LOCK(?, 5) AS got', [lockName]);
    if (!got) return bad(409, 'Another booking for this purchase is in progress, try again');

    const got1 = await getPurchaseByIdService({ therapist_id, purchase_id });
    if (!got1 || !got1.status) return got1;
    const p = got1.data.purchase;

    if (p.state === 'pending_payment') return bad(409, 'Payment is not confirmed yet');
    if (p.state === 'cancelled') return bad(409, 'This purchase is cancelled');
    if (p.state === 'expired') return bad(409, 'This package has expired');
    if (p.sessions_remaining <= 0) return bad(409, 'No sessions left in this purchase');
    if (!(MODALITIES[p.session_mode] || []).includes(modality)) {
      return bad(422, `This service is ${p.session_mode.replace('_', '-')}; allowed: ${MODALITIES[p.session_mode].join(', ')}`);
    }
    if (p.valid_until) {
      // starts_at is IST wall-clock, valid_until is UTC
      const [[{ ok }]] = await db.query('SELECT (? <= DATE_ADD(?, INTERVAL 330 MINUTE)) AS ok', [starts_at, p.valid_until]);
      if (!ok) return bad(422, 'This date is after the package validity ends. Pick an earlier date.');
    }

    const fee = Math.round((Number(p.price_paid) / Number(p.sessions_total)) * 100) / 100;
    const created = await createSessionService({
      therapist_id, client_id: p.client_id, starts_at, duration_min: p.duration_min, modality, fee,
      title: title || p.service_name, meet_url, skip_notifications,
      service_id: p.service_id, purchase_id: p.id,           // saved with the session itself, so it can never be left unlinked
    });
    if (!created || !created.status) return created;

    const sessionId = created.data.id;

    await Activity.record({
      actor_user_id, module_name: 'session', action: 'booked_from_purchase',
      description: `Booked session ${p.sessions_used + 1} of ${p.sessions_total} for "${p.service_name}"`,
      meta: { therapist_id, purchase_id: p.id, service_id: p.service_id, session_id: sessionId, client_id: p.client_id, starts_at, modality },
    });
    return { status: true, code: 201, message: 'Session booked', data: { session: { ...created.data, service_id: p.service_id, purchase_id: p.id }, sessions_remaining: p.sessions_remaining - 1 } };
  } catch (error) {
    console.log('Error in bookPurchaseSessionService::>>', error);
    return null;
  } finally {
    if (lockConn) {
      await lockConn.query('SELECT RELEASE_LOCK(?)', [lockName]).catch(() => {});
      lockConn.release();
    }
  }
};

module.exports = {
  getPurchasesService, getPurchaseByIdService, createPurchaseService, getRequirementsService,
  confirmDirectPaymentService, cancelPurchaseService, bookPurchaseSessionService, createServiceSessionService,
  activateForInvoice, expireUnpaidRequests, onRequestApproved, onRequestDeclined, openInvoiceForPurchase, paymentMethodReady,
};
