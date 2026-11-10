const db = require('../../../config/db');
const Activity = require('./activityLogService');
const Intake = require('./intakeFormService');
const { createSessionService } = require('./sessionService');

// ─── Purchases: what a client bought (one session or a package) ──────────────
// Stored: status (pending_payment | active | cancelled), price_paid, validity_days, activated_at, valid_until.
// Derived on read (never stored, so it cannot drift):
//   sessions_used      = this purchase's sessions that are scheduled / completed / no_show
//   sessions_remaining = sessions_total - sessions_used
//   state              = pending_payment | cancelled | expired | completed | active
//   payment_status     = unpaid | awaiting_confirmation | paid | rejected | refunded

const PAYMENT_MODES = ['upi', 'bank_transfer', 'cash'];
const CONSUMING = "('scheduled','completed','no_show')";

const bad = (code, message, data = null) => ({ status: false, code, message, data });

const MODALITIES = { online: ['video', 'phone'], in_person: ['in_person'], both: ['video', 'phone', 'in_person'] };

// ─── Shared read (list + detail) ─────────────────────────────────────────────

const BASE_SELECT = `
  SELECT p.*,
         s.name AS service_name, s.session_mode, s.duration_min, s.price AS service_price,
         pk.sessions_count AS package_sessions, pk.discount_percent AS package_discount,
         CONCAT_WS(' ', u.first_name, u.last_name) AS client_name, u.email AS client_email, u.phone AS client_phone,
         (SELECT COUNT(*) FROM prodesk_sessions x WHERE x.purchase_id = p.id AND x.status IN ${CONSUMING}) AS sessions_used,
         (SELECT COUNT(*) FROM prodesk_sessions x WHERE x.purchase_id = p.id AND x.status = 'completed') AS sessions_completed,
         (p.valid_until IS NOT NULL AND p.valid_until < UTC_TIMESTAMP()) AS past_validity,
         pay.id AS payment_id, pay.status AS pay_status, pay.payment_mode, pay.payer_reference,
         pay.confirmed_at, pay.reject_reason, pay.amount AS payment_amount
  FROM prodesk_service_purchases p
  JOIN prodesk_services s ON s.id = p.service_id
  JOIN prodesk_clients pc ON pc.id = p.client_id
  JOIN users u ON u.user_id = pc.user_id
  LEFT JOIN prodesk_service_packages pk ON pk.id = p.package_id
  LEFT JOIN prodesk_payment pay ON pay.id = (SELECT MAX(id) FROM prodesk_payment WHERE purchase_id = p.id)`;

const shape = (r) => {
  const used = Number(r.sessions_used), total = Number(r.sessions_total);
  const remaining = Math.max(total - used, 0);
  let payment_status = 'unpaid';
  if (r.pay_status === 'captured') payment_status = 'paid';
  else if (r.pay_status === 'rejected') payment_status = 'rejected';
  else if (r.pay_status === 'refunded') payment_status = 'refunded';
  else if (r.payer_reference) payment_status = 'awaiting_confirmation';

  let state = r.status;                                         // pending_payment | cancelled | active
  if (r.status === 'active') {
    if (Number(r.sessions_completed) >= total) state = 'completed';
    else if (r.past_validity && remaining > 0) state = 'expired';
  }
  const { past_validity, pay_status, ...rest } = r;
  return { ...rest, sessions_used: used, sessions_remaining: remaining, sessions_completed: Number(r.sessions_completed), state, payment_status, is_package: !!r.package_id };
};

const getPurchasesService = async ({ therapist_id, client_id, service_id, state, payment_status }) => {
  try {
    const where = ['p.therapist_id = ?'];
    const params = [therapist_id];
    if (client_id) { where.push('p.client_id = ?'); params.push(client_id); }
    if (service_id) { where.push('p.service_id = ?'); params.push(service_id); }
    const [rows] = await db.query(`${BASE_SELECT} WHERE ${where.join(' AND ')} ORDER BY p.id DESC LIMIT 500`, params);
    let data = rows.map(shape);

    const counts = { all: data.length, pending_payment: 0, awaiting_confirmation: 0, active: 0, completed: 0, expired: 0, cancelled: 0 };
    for (const d of data) {
      counts[d.state] = (counts[d.state] || 0) + 1;
      if (d.state === 'pending_payment' && d.payment_status === 'awaiting_confirmation') counts.awaiting_confirmation++;
    }
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
    const [payments] = await db.query('SELECT * FROM prodesk_payment WHERE purchase_id = ? ORDER BY id', [purchase_id]);
    const payIds = payments.map((p) => p.id);
    const [logs] = payIds.length
      ? await db.query('SELECT id, payment_id, status, event_type, source, meta, created_at FROM prodesk_payment_log WHERE payment_id IN (?) ORDER BY id', [payIds])
      : [[]];
    const intake = await Intake.getResponsesService({ therapist_id, purchase_id });
    return { status: true, code: 200, message: 'Purchase fetched', data: { purchase, sessions, payments, payment_logs: logs, intake_responses: intake ? intake.data : [] } };
  } catch (error) {
    console.log('Error in getPurchaseByIdService::>>', error);
    return null;
  }
};

// ─── Payment log helper (same table invoices use) ────────────────────────────

const payLog = (payment_id, event_type, status, source, meta = {}, conn = db) =>
  conn.query(
    'INSERT INTO prodesk_payment_log (payment_id, reference_id, status, event_type, source, meta) VALUES (?, ?, ?, ?, ?, ?)',
    [payment_id, null, status, event_type, source, JSON.stringify(meta)]
  );

// ─── Create ──────────────────────────────────────────────────────────────────

const createPurchaseService = async (payload) => {
  const { therapist_id, actor_user_id, client_id, service_id, package_id = null, payment_method = 'direct', intake_answers } = payload;
  let conn;
  try {
    if (!client_id || !service_id) return bad(400, 'client_id and service_id are required');
    if (payment_method !== 'direct') {
      return bad(501, 'Online (Razorpay) payment for services arrives with the booking page. Use direct payment for now.');
    }

    const [cl] = await db.query('SELECT pc.id, pc.user_id FROM prodesk_clients pc WHERE pc.id = ? AND pc.therapist_id = ?', [client_id, therapist_id]);
    if (!cl || !cl.length) return bad(404, 'Client not found');

    const [sv] = await db.query('SELECT * FROM prodesk_services WHERE id = ? AND therapist_id = ?', [service_id, therapist_id]);
    if (!sv || !sv.length) return bad(404, 'Service not found');
    const svc = sv[0];
    if (svc.status !== 'active') return bad(409, 'This service is not active, so it cannot be sold');
    if (svc.expires_at && new Date(String(svc.expires_at).replace(' ', 'T') + 'Z') < new Date()) return bad(409, 'This service has expired');
    if (!svc.accept_direct) return bad(422, 'This service does not accept direct payment');

    const [bank] = await db.query(
      'SELECT 1 FROM therapist_bank_accounts WHERE therapist_id = ? AND direct_pay_enabled = 1 AND (upi_id IS NOT NULL OR qr_url IS NOT NULL OR account_number IS NOT NULL)', [therapist_id]);
    if (!bank || !bank.length) return bad(422, 'Add UPI, QR or bank details in Payment integration and turn on direct payment first');

    let sessions_total = 1, price_paid = Number(svc.price), validity_days = null, pkgId = null;
    if (package_id) {
      const [pk] = await db.query('SELECT * FROM prodesk_service_packages WHERE id = ? AND service_id = ? AND is_active = 1', [package_id, service_id]);
      if (!pk || !pk.length) return bad(404, 'Package not found for this service');
      sessions_total = pk[0].sessions_count; price_paid = Number(pk[0].total_price); validity_days = pk[0].validity_days; pkgId = pk[0].id;
    }

    // Intake form: required forms must be answered, optional ones are saved if sent.
    let responseId = null;
    if (svc.intake_form_mode === 'required' && !Array.isArray(intake_answers)) return bad(422, 'This service needs the intake form to be filled in');
    if (svc.intake_form_mode !== 'none' && Array.isArray(intake_answers)) {
      const r = await Intake.submitResponseService({ therapist_id, form_id: svc.intake_form_id, client_id, answers: intake_answers });
      if (!r) return null;
      if (!r.status) return r;
      responseId = r.data.id;
    }

    conn = await db.getConnection();
    await conn.beginTransaction();
    const [pr] = await conn.query(
      `INSERT INTO prodesk_service_purchases (therapist_id, client_id, service_id, package_id, sessions_total, price_paid, validity_days, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending_payment')`,
      [therapist_id, client_id, service_id, pkgId, sessions_total, price_paid, validity_days]
    );
    const [py] = await conn.query(
      `INSERT INTO prodesk_payment (user_id, therapist_id, payment_type, provider, amount, currency, status, method, purchase_id)
       VALUES (?, ?, 'booking', 'offline', ?, 'INR', 'created', 'offline', ?)`,
      [cl[0].user_id, therapist_id, price_paid, pr.insertId]
    );
    await payLog(py.insertId, 'purchase.created', 'created', 'therapist', { purchase_id: pr.insertId, service_id: Number(service_id), package_id: pkgId, amount: price_paid, method: 'direct' }, conn);
    if (responseId) await conn.query('UPDATE prodesk_intake_responses SET purchase_id = ? WHERE id = ?', [pr.insertId, responseId]);
    await conn.commit();

    await Activity.record({
      actor_user_id, module_name: 'purchase', action: 'created',
      description: `Sold "${svc.name}"${pkgId ? ` (${sessions_total}-session package)` : ' (single session)'} for ₹${price_paid}`,
      meta: { therapist_id, purchase_id: pr.insertId, service_id: Number(service_id), package_id: pkgId, client_id: Number(client_id), payment_id: py.insertId, amount: price_paid, method: 'direct' },
    });
    return { status: true, code: 201, message: 'Purchase created, waiting for payment', data: (await getPurchaseByIdService({ therapist_id, purchase_id: pr.insertId })).data };
  } catch (error) {
    if (conn) await conn.rollback().catch(() => {});
    console.log('Error in createPurchaseService::>>', error);
    return null;
  } finally {
    if (conn) conn.release();
  }
};

// ─── Direct payment: therapist verifies the money arrived ────────────────────

const lockPending = async (conn, purchase_id, therapist_id) => {
  const [rows] = await conn.query('SELECT * FROM prodesk_service_purchases WHERE id = ? AND therapist_id = ? FOR UPDATE', [purchase_id, therapist_id]);
  if (!rows || !rows.length) return { error: bad(404, 'Purchase not found') };
  const [pay] = await conn.query('SELECT * FROM prodesk_payment WHERE purchase_id = ? ORDER BY id DESC LIMIT 1 FOR UPDATE', [purchase_id]);
  if (!pay || !pay.length) return { error: bad(409, 'This purchase has no payment record') };
  return { purchase: rows[0], payment: pay[0] };
};

const confirmDirectPaymentService = async ({ therapist_id, actor_user_id, purchase_id, payment_mode, payer_reference }) => {
  let conn;
  try {
    if (!PAYMENT_MODES.includes(payment_mode)) return bad(400, `payment_mode must be one of ${PAYMENT_MODES.join(', ')}`);
    const ref = payer_reference ? String(payer_reference).trim().slice(0, 100) : null;

    conn = await db.getConnection();
    await conn.beginTransaction();
    const { error, purchase, payment } = await lockPending(conn, purchase_id, therapist_id);
    if (error) { await conn.rollback(); return error; }

    if (purchase.status === 'active' && payment.status === 'captured') {
      await conn.rollback();
      return { status: true, code: 200, message: 'Already confirmed', data: (await getPurchaseByIdService({ therapist_id, purchase_id })).data };
    }
    if (purchase.status !== 'pending_payment') { await conn.rollback(); return bad(409, `This purchase is ${purchase.status}, payment cannot be confirmed`); }
    if (payment.provider !== 'offline') { await conn.rollback(); return bad(409, 'This purchase is paid online, not by direct transfer'); }

    await conn.query(
      `UPDATE prodesk_payment SET status = 'captured', payment_mode = ?, payer_reference = COALESCE(?, payer_reference),
         confirmed_by = ?, confirmed_at = UTC_TIMESTAMP(), reject_reason = NULL WHERE id = ?`,
      [payment_mode, ref, actor_user_id, payment.id]
    );
    await conn.query(
      `UPDATE prodesk_service_purchases SET status = 'active', activated_at = UTC_TIMESTAMP(),
         valid_until = IF(validity_days IS NULL, NULL, DATE_ADD(UTC_TIMESTAMP(), INTERVAL validity_days DAY)) WHERE id = ?`,
      [purchase_id]
    );
    await payLog(payment.id, 'direct.confirmed', 'captured', 'therapist', { purchase_id: Number(purchase_id), payment_mode, payer_reference: ref, amount: payment.amount, confirmed_by: actor_user_id }, conn);
    await conn.commit();

    await Activity.record({
      actor_user_id, module_name: 'payment', action: 'direct_confirmed',
      description: `Confirmed direct payment of ₹${payment.amount} (${payment_mode})`,
      meta: { therapist_id, purchase_id: Number(purchase_id), service_id: purchase.service_id, client_id: purchase.client_id, payment_id: payment.id, payment_mode, payer_reference: ref, amount: payment.amount },
    });
    return { status: true, code: 200, message: 'Payment confirmed, purchase is active', data: (await getPurchaseByIdService({ therapist_id, purchase_id })).data };
  } catch (error) {
    if (conn) await conn.rollback().catch(() => {});
    console.log('Error in confirmDirectPaymentService::>>', error);
    return null;
  } finally {
    if (conn) conn.release();
  }
};

const rejectDirectPaymentService = async ({ therapist_id, actor_user_id, purchase_id, reason }) => {
  let conn;
  try {
    const why = String(reason || '').trim();
    if (!why) return bad(400, 'A reason is required');
    if (why.length > 255) return bad(400, 'Reason is too long (max 255 characters)');

    conn = await db.getConnection();
    await conn.beginTransaction();
    const { error, purchase, payment } = await lockPending(conn, purchase_id, therapist_id);
    if (error) { await conn.rollback(); return error; }
    if (purchase.status !== 'pending_payment' || payment.status === 'captured') {
      await conn.rollback(); return bad(409, 'Only a purchase that is waiting for payment can be rejected');
    }
    await conn.query("UPDATE prodesk_payment SET status = 'rejected', reject_reason = ?, confirmed_by = ?, confirmed_at = UTC_TIMESTAMP() WHERE id = ?", [why, actor_user_id, payment.id]);
    await payLog(payment.id, 'direct.rejected', 'rejected', 'therapist', { purchase_id: Number(purchase_id), reason: why, rejected_by: actor_user_id }, conn);
    await conn.commit();

    await Activity.record({
      actor_user_id, module_name: 'payment', action: 'direct_rejected', description: `Rejected direct payment: ${why}`,
      meta: { therapist_id, purchase_id: Number(purchase_id), service_id: purchase.service_id, client_id: purchase.client_id, payment_id: payment.id, reason: why },
    });
    return { status: true, code: 200, message: 'Payment rejected', data: (await getPurchaseByIdService({ therapist_id, purchase_id })).data };
  } catch (error) {
    if (conn) await conn.rollback().catch(() => {});
    console.log('Error in rejectDirectPaymentService::>>', error);
    return null;
  } finally {
    if (conn) conn.release();
  }
};

// Only an unpaid purchase can be cancelled here. A paid one needs a refund, which is a separate decision.
const cancelPurchaseService = async ({ therapist_id, actor_user_id, purchase_id, reason }) => {
  let conn;
  try {
    conn = await db.getConnection();
    await conn.beginTransaction();
    const { error, purchase, payment } = await lockPending(conn, purchase_id, therapist_id);
    if (error) { await conn.rollback(); return error; }
    if (purchase.status === 'cancelled') { await conn.rollback(); return { status: true, code: 200, message: 'Already cancelled', data: (await getPurchaseByIdService({ therapist_id, purchase_id })).data }; }
    if (purchase.status !== 'pending_payment') { await conn.rollback(); return bad(409, 'A paid purchase cannot be cancelled here. Refund it instead.'); }

    await conn.query("UPDATE prodesk_service_purchases SET status = 'cancelled' WHERE id = ?", [purchase_id]);
    await conn.query("UPDATE prodesk_payment SET status = 'cancelled' WHERE id = ? AND status <> 'captured'", [payment.id]);
    await payLog(payment.id, 'purchase.cancelled', 'cancelled', 'therapist', { purchase_id: Number(purchase_id), reason: reason ? String(reason).slice(0, 255) : null }, conn);
    await conn.commit();

    await Activity.record({
      actor_user_id, module_name: 'purchase', action: 'cancelled', description: 'Cancelled an unpaid purchase',
      meta: { therapist_id, purchase_id: Number(purchase_id), service_id: purchase.service_id, client_id: purchase.client_id, payment_id: payment.id, reason: reason || null },
    });
    return { status: true, code: 200, message: 'Purchase cancelled', data: (await getPurchaseByIdService({ therapist_id, purchase_id })).data };
  } catch (error) {
    if (conn) await conn.rollback().catch(() => {});
    console.log('Error in cancelPurchaseService::>>', error);
    return null;
  } finally {
    if (conn) conn.release();
  }
};

// ─── Book a session against a purchase ───────────────────────────────────────

const bookPurchaseSessionService = async ({ therapist_id, actor_user_id, purchase_id, starts_at, modality, title, skip_notifications = false }) => {
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
      title: title || p.service_name, skip_notifications,
    });
    if (!created || !created.status) return created;

    const sessionId = created.data.id;
    await db.query('UPDATE prodesk_sessions SET service_id = ?, purchase_id = ? WHERE id = ?', [p.service_id, p.id, sessionId]);

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
  getPurchasesService, getPurchaseByIdService, createPurchaseService,
  confirmDirectPaymentService, rejectDirectPaymentService, cancelPurchaseService, bookPurchaseSessionService,
};
