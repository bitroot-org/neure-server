const db = require('../../../config/db');
const Activity = require('./activityLogService');
const { sanitizeHtml } = require('../../utils/safeHtml');

// ─── Services ────────────────────────────────────────────────────────────────
// One service = one thing the therapist sells, with one price.
//   sessions_count = 1   → a single session at `price`
//   sessions_count = 4   → a 4-session bundle at `price` (the total), usable within `validity_days` of payment
// A "package" is simply a service with more than one session.

const SESSION_MODES = ['online', 'in_person', 'both'];
const STATUSES = ['draft', 'active', 'archived'];
const FORM_MODES = ['none', 'optional', 'required'];
const PAY_METHODS = ['direct', 'razorpay'];
const PAY_TIMINGS = ['prepaid', 'postpaid', 'free'];

const bad = (message, code = 400) => ({ error: { status: false, code, message, data: null } });
const money = (n) => Math.round(Number(n) * 100) / 100;

// "2000.00" (from the DB) and 2000 (validated input) are the same value
const same = (a, b) => {
  if (a == null && b == null) return true;
  if (a != null && b != null && a !== '' && b !== '' && !isNaN(a) && !isNaN(b)) return Number(a) === Number(b);
  return String(a ?? '') === String(b ?? '');
};

const SERVICE_FIELDS = [
  'name', 'description', 'session_mode', 'duration_min', 'sessions_count', 'validity_days', 'price',
  'payment_method', 'payment_timing', 'intake_form_id', 'intake_form_mode', 'consent_form_id', 'status', 'expires_at',
];

const razorpayIsActive = async (therapist_id) => {
  const [rows] = await db.query("SELECT 1 FROM therapist_razorpay_accounts WHERE therapist_id = ? AND status = 'active'", [therapist_id]);
  return !!(rows && rows.length);
};

// `s` is the merged service (existing values + changes). Returns { value } or { error }.
const validateService = async (s, therapist_id) => {
  const name = String(s.name || '').trim();
  if (!name) return bad('Service name is required');
  if (name.length > 200) return bad('Service name is too long (max 200 characters)');
  if (s.description && String(s.description).length > 10000) return bad('Description is too long');
  const description = sanitizeHtml(s.description);

  if (!SESSION_MODES.includes(s.session_mode)) return bad(`session_mode must be one of ${SESSION_MODES.join(', ')}`);
  const duration = Number(s.duration_min);
  if (!Number.isInteger(duration) || duration < 5 || duration > 480) return bad('Duration must be a whole number of minutes between 5 and 480');

  const sessions_count = Number(s.sessions_count ?? 1);
  if (!Number.isInteger(sessions_count) || sessions_count < 1 || sessions_count > 52) return bad('Number of sessions must be between 1 and 52');
  let validity_days = null;
  if (sessions_count > 1) {
    validity_days = Number(s.validity_days);
    if (!Number.isInteger(validity_days) || validity_days < 1 || validity_days > 730) return bad('Validity must be between 1 and 730 days when a service has more than one session');
  }

  // Prepaid: the client pays before the request reaches you. Postpaid: the request comes first, the invoice follows when you approve.
  // Free: no invoice and no payment at all (e.g. a short consultation call), so it is always a single session.
  const payment_timing = s.payment_timing || 'postpaid';
  if (!PAY_TIMINGS.includes(payment_timing)) return bad(`payment_timing must be one of ${PAY_TIMINGS.join(', ')}`);
  const isFree = payment_timing === 'free';
  if (isFree && sessions_count !== 1) return bad('A free service is a single session');

  const price = isFree ? 0 : money(s.price);
  if (!isFree && (!Number.isFinite(price) || price <= 0 || price > 10000000)) return bad('Price must be greater than 0');

  // One payment method per service: direct (UPI / bank / cash) or online through the therapist's Razorpay. A free service has none.
  const payment_method = isFree ? 'direct' : s.payment_method;
  if (!PAY_METHODS.includes(payment_method)) return bad(`payment_method must be one of ${PAY_METHODS.join(', ')}`);
  if (!isFree && payment_method === 'razorpay' && !(await razorpayIsActive(therapist_id))) {
    return bad('Connect Razorpay in Payment integration before choosing online payment', 422);
  }

  const intake_form_mode = s.intake_form_mode || 'none';
  if (!FORM_MODES.includes(intake_form_mode)) return bad(`intake_form_mode must be one of ${FORM_MODES.join(', ')}`);
  let intake_form_id = null;
  if (intake_form_mode !== 'none') {
    if (!s.intake_form_id) return bad('Select an intake form, or choose "No form"');
    const [f] = await db.query("SELECT id FROM prodesk_intake_forms WHERE id = ? AND therapist_id = ? AND status = 'active'", [s.intake_form_id, therapist_id]);
    if (!f || !f.length) return bad('Intake form not found', 404);
    intake_form_id = Number(s.intake_form_id);
  }

  let consent_form_id = null;
  if (s.consent_form_id) {
    const [c] = await db.query("SELECT id FROM prodesk_consent_forms WHERE id = ? AND therapist_id = ? AND status = 'active'", [s.consent_form_id, therapist_id]);
    if (!c || !c.length) return bad('Consent form not found', 404);
    consent_form_id = Number(s.consent_form_id);
  }

  if (!STATUSES.includes(s.status)) return bad(`status must be one of ${STATUSES.join(', ')}`);

  let expires_at = null;
  if (s.expires_at) {
    const d = new Date(String(s.expires_at).replace(' ', 'T'));
    if (isNaN(d.getTime())) return bad('expires_at is not a valid date');
    expires_at = String(s.expires_at).replace('T', ' ').slice(0, 19);
  }

  return {
    value: {
      name, description, session_mode: s.session_mode, duration_min: duration, sessions_count, validity_days, price,
      payment_method, payment_timing, intake_form_id, intake_form_mode, consent_form_id, status: s.status, expires_at,
    },
  };
};

// ─── Special prices for existing clients ─────────────────────────────────────
// [{ client_id, price }] replaces the whole list. The stored value is the final price the client pays.

const normaliseClientPrices = async (list, therapist_id) => {
  if (!Array.isArray(list)) return bad('client_prices must be a list');
  if (list.length > 200) return bad('Too many client prices');
  const seen = new Set();
  const out = [];
  for (const row of list) {
    const client_id = Number(row.client_id);
    const price = money(row.price);
    if (!client_id) return bad('Each special price needs a client');
    if (seen.has(client_id)) return bad('A client appears twice in the special prices');
    seen.add(client_id);
    if (!Number.isFinite(price) || price <= 0 || price > 10000000) return bad('A special price must be greater than 0');
    out.push({ client_id, price });
  }
  if (out.length) {
    const [ok] = await db.query('SELECT id FROM prodesk_clients WHERE therapist_id = ? AND id IN (?)', [therapist_id, out.map((o) => o.client_id)]);
    if (ok.length !== out.length) return bad('One of the clients was not found', 404);
  }
  return { value: out };
};

const writeClientPrices = async (service_id, prices) => {
  await db.query('DELETE FROM prodesk_service_client_prices WHERE service_id = ?', [service_id]);
  for (const p of prices) await db.query('INSERT INTO prodesk_service_client_prices (service_id, client_id, price) VALUES (?, ?, ?)', [service_id, p.client_id, p.price]);
};

// What this client pays for this service: their special price if they have one, else the normal price.
const resolvePrice = async (service_id, client_id) => {
  const [[svc]] = await db.query('SELECT price, payment_timing FROM prodesk_services WHERE id = ?', [service_id]);
  if (!svc) return null;
  if (svc.payment_timing === 'free') return { price: 0, special: false, regular_price: 0 };   // a free service is free for everyone
  if (client_id) {
    const [[cp]] = await db.query('SELECT price FROM prodesk_service_client_prices WHERE service_id = ? AND client_id = ?', [service_id, client_id]);
    if (cp) return { price: Number(cp.price), special: true, regular_price: Number(svc.price) };
  }
  return { price: Number(svc.price), special: false, regular_price: Number(svc.price) };
};

// ─── Reading ─────────────────────────────────────────────────────────────────

const decorate = (svc, sold = 0, client_prices = []) => ({
  ...svc,
  client_prices,
  per_session_price: money(Number(svc.price) / svc.sessions_count),
  sold_count: Number(sold) || 0,
});

const loadService = async (id, therapist_id) => {
  const [rows] = await db.query('SELECT * FROM prodesk_services WHERE id = ? AND therapist_id = ?', [id, therapist_id]);
  if (!rows || !rows.length) return null;
  const [[{ n }]] = await db.query('SELECT COUNT(*) AS n FROM prodesk_service_purchases WHERE service_id = ?', [id]);
  const [cp] = await db.query(
    `SELECT cp.client_id, cp.price, CONCAT(u.first_name, ' ', u.last_name) AS client_name
     FROM prodesk_service_client_prices cp JOIN prodesk_clients pc ON pc.id = cp.client_id JOIN users u ON u.user_id = pc.user_id
     WHERE cp.service_id = ? ORDER BY client_name`, [id]);
  return decorate(rows[0], n, cp);
};

const getServicesService = async ({ therapist_id, include_archived = false, status }) => {
  try {
    const where = ['therapist_id = ?'];
    const params = [therapist_id];
    if (status) { where.push('status = ?'); params.push(status); }
    else if (!include_archived) where.push("status <> 'archived'");
    const [rows] = await db.query(`SELECT * FROM prodesk_services WHERE ${where.join(' AND ')} ORDER BY created_at DESC, id DESC`, params);
    if (!rows.length) return { status: true, code: 200, message: 'Services fetched', data: [] };

    const [sold] = await db.query('SELECT service_id, COUNT(*) AS n FROM prodesk_service_purchases WHERE service_id IN (?) GROUP BY service_id', [rows.map((r) => r.id)]);
    const soldBy = Object.fromEntries(sold.map((s) => [s.service_id, s.n]));
    const [cpc] = await db.query('SELECT service_id, COUNT(*) AS n FROM prodesk_service_client_prices WHERE service_id IN (?) GROUP BY service_id', [rows.map((r) => r.id)]);
    const cpBy = Object.fromEntries(cpc.map((c) => [c.service_id, c.n]));
    return { status: true, code: 200, message: 'Services fetched', data: rows.map((r) => ({ ...decorate(r, soldBy[r.id] || 0), special_price_count: cpBy[r.id] || 0 })) };
  } catch (error) {
    console.log('Error in getServicesService::>>', error);
    return null;
  }
};

const getServiceByIdService = async ({ therapist_id, service_id }) => {
  try {
    const svc = await loadService(service_id, therapist_id);
    if (!svc) return { status: false, code: 404, message: 'Service not found', data: null };
    return { status: true, code: 200, message: 'Service fetched', data: svc };
  } catch (error) {
    console.log('Error in getServiceByIdService::>>', error);
    return null;
  }
};

// ─── Writing ─────────────────────────────────────────────────────────────────

const COLS = 'name, description, session_mode, duration_min, sessions_count, validity_days, price, payment_method, payment_timing, intake_form_id, intake_form_mode, consent_form_id, status, expires_at';
const valuesOf = (s) => [s.name, s.description, s.session_mode, s.duration_min, s.sessions_count, s.validity_days, s.price, s.payment_method, s.payment_timing, s.intake_form_id, s.intake_form_mode, s.consent_form_id, s.status, s.expires_at];

const createServiceService = async (payload) => {
  const { therapist_id, actor_user_id } = payload;
  try {
    const merged = { session_mode: 'online', duration_min: 60, sessions_count: 1, payment_method: 'direct', payment_timing: 'postpaid', intake_form_mode: 'none', status: 'draft' };
    for (const f of SERVICE_FIELDS) if (payload[f] !== undefined) merged[f] = payload[f];

    const v = await validateService(merged, therapist_id);
    if (v.error) return v.error;
    if (v.value.status === 'archived') return { status: false, code: 400, message: 'A new service cannot be created as archived', data: null };
    let prices = null;
    if (v.value.payment_timing === 'free') prices = [];   // a free service has no special prices
    else if (payload.client_prices !== undefined) { const np = await normaliseClientPrices(payload.client_prices, therapist_id); if (np.error) return np.error; prices = np.value; }

    const s = v.value;
    const [r] = await db.query(
      `INSERT INTO prodesk_services (therapist_id, ${COLS}) VALUES (?, ${COLS.split(',').map(() => '?').join(', ')})`,
      [therapist_id, ...valuesOf(s)]
    );
    if (prices && prices.length) await writeClientPrices(r.insertId, prices);
    await Activity.record({
      actor_user_id, module_name: 'service', action: 'created',
      description: `Created service "${s.name}" (${s.status})`,
      meta: { therapist_id, service_id: r.insertId, name: s.name, price: s.price, sessions_count: s.sessions_count, status: s.status, special_prices: prices ? prices.length : 0 },
    });
    return { status: true, code: 201, message: 'Service created', data: await loadService(r.insertId, therapist_id) };
  } catch (error) {
    console.log('Error in createServiceService::>>', error);
    return null;
  }
};

const updateServiceService = async (payload) => {
  const { therapist_id, actor_user_id, service_id } = payload;
  try {
    const [rows] = await db.query('SELECT * FROM prodesk_services WHERE id = ? AND therapist_id = ?', [service_id, therapist_id]);
    if (!rows || !rows.length) return { status: false, code: 404, message: 'Service not found', data: null };
    const current = rows[0];
    if (current.status === 'archived' && payload.status === undefined) {
      return { status: false, code: 409, message: 'This service is archived. Set a status to restore it.', data: null };
    }

    const merged = { ...current };
    for (const f of SERVICE_FIELDS) if (payload[f] !== undefined) merged[f] = payload[f];
    const v = await validateService(merged, therapist_id);
    if (v.error) return v.error;
    const s = v.value;
    let prices = null;
    if (v.value.payment_timing === 'free') prices = [];   // a free service has no special prices
    else if (payload.client_prices !== undefined) { const np = await normaliseClientPrices(payload.client_prices, therapist_id); if (np.error) return np.error; prices = np.value; }

    const changes = {};
    for (const f of SERVICE_FIELDS) if (!same(current[f], s[f])) changes[f] = { from: current[f] ?? null, to: s[f] ?? null };

    await db.query(`UPDATE prodesk_services SET ${COLS.split(', ').map((c) => `${c} = ?`).join(', ')} WHERE id = ?`, [...valuesOf(s), service_id]);

    if (prices) {
      const [before] = await db.query('SELECT client_id, price FROM prodesk_service_client_prices WHERE service_id = ?', [service_id]);
      const sameList = before.length === prices.length && prices.every((p) => before.some((b) => b.client_id === p.client_id && Number(b.price) === p.price));
      if (!sameList) { await writeClientPrices(service_id, prices); changes.special_prices = { from: before.length, to: prices.length }; }
    }
    if (Object.keys(changes).length) {
      await Activity.record({
        actor_user_id, module_name: 'service', action: 'updated', description: `Updated service "${s.name}"`,
        meta: { therapist_id, service_id: Number(service_id), changes },
      });
    }
    return { status: true, code: 200, message: 'Service updated', data: await loadService(service_id, therapist_id) };
  } catch (error) {
    console.log('Error in updateServiceService::>>', error);
    return null;
  }
};

// ─── One special price, saved on its own (the form saves each change as it is made) ───
// Same rules as the list above, but one client at a time, so choosing a client and a price needs no extra "save" step.

const setClientPriceService = async ({ therapist_id, actor_user_id, service_id, client_id, price }) => {
  try {
    const [[svc]] = await db.query('SELECT id, name, price, payment_timing FROM prodesk_services WHERE id = ? AND therapist_id = ?', [service_id, therapist_id]);
    if (!svc) return { status: false, code: 404, message: 'Service not found', data: null };
    if (svc.payment_timing === 'free') return { status: false, code: 400, message: 'A free service has no special prices', data: null };
    const p = money(price);
    if (!Number.isFinite(p) || p <= 0 || p > 10000000) return { status: false, code: 400, message: 'A special price must be greater than 0', data: null };
    const [[cl]] = await db.query('SELECT pc.id, CONCAT(u.first_name, \' \', u.last_name) AS name FROM prodesk_clients pc JOIN users u ON u.user_id = pc.user_id WHERE pc.id = ? AND pc.therapist_id = ? AND pc.deleted_at IS NULL', [client_id, therapist_id]);
    if (!cl) return { status: false, code: 404, message: 'Client not found', data: null };

    const [[before]] = await db.query('SELECT price FROM prodesk_service_client_prices WHERE service_id = ? AND client_id = ?', [service_id, client_id]);
    if (before && Number(before.price) === p) return { status: true, code: 200, message: 'Saved', data: { client_id: Number(client_id), price: p } };
    if (before) await db.query('UPDATE prodesk_service_client_prices SET price = ? WHERE service_id = ? AND client_id = ?', [p, service_id, client_id]);
    else await db.query('INSERT INTO prodesk_service_client_prices (service_id, client_id, price) VALUES (?, ?, ?)', [service_id, client_id, p]);
    await Activity.record({
      actor_user_id, module_name: 'service', action: 'special_price_set', description: `Set a special price of ₹${p} on "${svc.name}" for ${cl.name}`,
      meta: { therapist_id, service_id: Number(service_id), client_id: Number(client_id), price: p, previous_price: before ? Number(before.price) : null },
    });
    return { status: true, code: 200, message: 'Saved', data: { client_id: Number(client_id), price: p } };
  } catch (error) {
    console.log('Error in setClientPriceService::>>', error);
    return null;
  }
};

const removeClientPriceService = async ({ therapist_id, actor_user_id, service_id, client_id }) => {
  try {
    const [[svc]] = await db.query('SELECT id, name FROM prodesk_services WHERE id = ? AND therapist_id = ?', [service_id, therapist_id]);
    if (!svc) return { status: false, code: 404, message: 'Service not found', data: null };
    const [r] = await db.query('DELETE FROM prodesk_service_client_prices WHERE service_id = ? AND client_id = ?', [service_id, client_id]);
    if (r.affectedRows) {
      await Activity.record({
        actor_user_id, module_name: 'service', action: 'special_price_removed', description: `Removed a special price on "${svc.name}"`,
        meta: { therapist_id, service_id: Number(service_id), client_id: Number(client_id) },
      });
    }
    return { status: true, code: 200, message: 'Removed', data: { client_id: Number(client_id) } };
  } catch (error) {
    console.log('Error in removeClientPriceService::>>', error);
    return null;
  }
};

// A service that was ever bought or booked is archived (history must keep pointing at it). Otherwise it is deleted.
const deleteServiceService = async ({ therapist_id, actor_user_id, service_id }) => {
  try {
    const [rows] = await db.query('SELECT id, name FROM prodesk_services WHERE id = ? AND therapist_id = ?', [service_id, therapist_id]);
    if (!rows || !rows.length) return { status: false, code: 404, message: 'Service not found', data: null };
    const [[{ n: purchases }]] = await db.query('SELECT COUNT(*) AS n FROM prodesk_service_purchases WHERE service_id = ?', [service_id]);
    const [[{ n: sessions }]] = await db.query('SELECT COUNT(*) AS n FROM prodesk_sessions WHERE service_id = ?', [service_id]);

    if (purchases || sessions) {
      await db.query("UPDATE prodesk_services SET status = 'archived' WHERE id = ?", [service_id]);
      await Activity.record({
        actor_user_id, module_name: 'service', action: 'archived', description: `Archived service "${rows[0].name}" (it has bookings)`,
        meta: { therapist_id, service_id: Number(service_id), purchases, sessions },
      });
      return { status: true, code: 200, message: 'Service has bookings, so it was archived instead of deleted', data: { deleted: false, archived: true } };
    }
    await db.query('DELETE FROM prodesk_services WHERE id = ?', [service_id]);
    await Activity.record({
      actor_user_id, module_name: 'service', action: 'deleted', description: `Deleted service "${rows[0].name}"`,
      meta: { therapist_id, service_id: Number(service_id), name: rows[0].name },
    });
    return { status: true, code: 200, message: 'Service deleted', data: { deleted: true, archived: false } };
  } catch (error) {
    console.log('Error in deleteServiceService::>>', error);
    return null;
  }
};

module.exports = { getServicesService, getServiceByIdService, createServiceService, updateServiceService, deleteServiceService, setClientPriceService, removeClientPriceService, loadService, resolvePrice };
