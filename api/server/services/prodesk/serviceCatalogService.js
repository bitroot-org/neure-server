const db = require('../../../config/db');
const Activity = require('./activityLogService');
const { sanitizeHtml } = require('../../utils/safeHtml');

// ─── Services + their session packages ───────────────────────────────────────
// A service is what the therapist offers ("Therapy Session, ₹2,000, 60 min").
// A package is a discounted bundle of that service ("4 sessions for ₹6,800, use within 60 days").

const SESSION_MODES = ['online', 'in_person', 'both'];
const STATUSES = ['draft', 'active', 'archived'];
const CUTOFFS = [12, 24, 48, 72];
const FORM_MODES = ['none', 'optional', 'required'];

const bad = (message, code = 400) => ({ error: { status: false, code, message, data: null } });
const bool = (v) => (v === true || v === 1 || v === '1' || v === 'true' ? 1 : 0);
const money = (n) => Math.round(Number(n) * 100) / 100;

// "2000.00" (from the DB) and 2000 (validated input) are the same value
const same = (a, b) => {
  if (a == null && b == null) return true;
  if (a != null && b != null && a !== '' && b !== '' && !isNaN(a) && !isNaN(b)) return Number(a) === Number(b);
  return String(a ?? '') === String(b ?? '');
};

const SERVICE_FIELDS = [
  'name', 'description', 'session_mode', 'duration_min', 'price', 'accept_direct', 'accept_razorpay',
  'allow_reschedule', 'reschedule_cutoff_hrs', 'allow_cancel', 'cancel_cutoff_hrs',
  'intake_form_id', 'intake_form_mode', 'status', 'expires_at',
];

// ─── Validation ──────────────────────────────────────────────────────────────

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
  const price = money(s.price);
  if (!Number.isFinite(price) || price <= 0 || price > 10000000) return bad('Price per session must be greater than 0');

  const accept_direct = bool(s.accept_direct);
  const accept_razorpay = bool(s.accept_razorpay);
  if (!accept_direct && !accept_razorpay) return bad('At least one payment method must be enabled');
  if (accept_razorpay && !(await razorpayIsActive(therapist_id))) {
    return bad('Connect Razorpay in Payment integration before enabling Online Payment', 422);
  }

  const allow_reschedule = bool(s.allow_reschedule);
  const allow_cancel = bool(s.allow_cancel);
  let reschedule_cutoff_hrs = null, cancel_cutoff_hrs = null;
  if (allow_reschedule) {
    reschedule_cutoff_hrs = Number(s.reschedule_cutoff_hrs);
    if (!CUTOFFS.includes(reschedule_cutoff_hrs)) return bad(`Reschedule cutoff must be one of ${CUTOFFS.join(', ')} hours`);
  }
  if (allow_cancel) {
    cancel_cutoff_hrs = Number(s.cancel_cutoff_hrs);
    if (!CUTOFFS.includes(cancel_cutoff_hrs)) return bad(`Cancellation cutoff must be one of ${CUTOFFS.join(', ')} hours`);
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

  if (!STATUSES.includes(s.status)) return bad(`status must be one of ${STATUSES.join(', ')}`);

  let expires_at = null;
  if (s.expires_at) {
    const d = new Date(String(s.expires_at).replace(' ', 'T'));
    if (isNaN(d.getTime())) return bad('expires_at is not a valid date');
    expires_at = String(s.expires_at).replace('T', ' ').slice(0, 19);
  }

  return {
    value: {
      name, description, session_mode: s.session_mode, duration_min: duration, price,
      accept_direct, accept_razorpay, allow_reschedule, reschedule_cutoff_hrs, allow_cancel, cancel_cutoff_hrs,
      intake_form_id, intake_form_mode, status: s.status, expires_at,
    },
  };
};

// Package input: [{ sessions_count, discount_percent?, total_price?, validity_days }]
// The therapist edits EITHER discount or total. Total wins if both are sent, the other is derived.
const normalisePackages = (list, price) => {
  if (!Array.isArray(list)) return bad('packages must be a list');
  if (list.length > 20) return bad('Too many packages (max 20)');
  const seen = new Set();
  const out = [];
  for (const p of list) {
    const count = Number(p.sessions_count);
    if (!Number.isInteger(count) || count < 2 || count > 52) return bad('A package needs between 2 and 52 sessions');
    if (seen.has(count)) return bad(`Two packages have ${count} sessions`);
    seen.add(count);

    const validity = Number(p.validity_days);
    if (!Number.isInteger(validity) || validity < 1 || validity > 730) return bad(`Package of ${count}: validity must be 1 to 730 days`);

    const base = money(price * count);
    let total, discount;
    if (p.total_price !== undefined && p.total_price !== null && p.total_price !== '') {
      total = money(p.total_price);
      if (!Number.isFinite(total) || total <= 0) return bad(`Package of ${count}: total must be greater than 0`);
      if (total > base) return bad(`Package of ${count}: total cannot be more than ${count} × the session price (${base})`);
      discount = money((1 - total / base) * 100);
    } else {
      discount = money(p.discount_percent || 0);
      if (!Number.isFinite(discount) || discount < 0 || discount >= 100) return bad(`Package of ${count}: discount must be 0 to under 100`);
      total = money(base * (1 - discount / 100));
    }
    out.push({ sessions_count: count, discount_percent: discount, total_price: total, validity_days: validity });
  }
  return { value: out.sort((a, b) => a.sessions_count - b.sessions_count) };
};

// ─── Reading ─────────────────────────────────────────────────────────────────

const decorate = (svc, packages, sold = 0) => ({
  ...svc,
  accept_direct: !!svc.accept_direct, accept_razorpay: !!svc.accept_razorpay,
  allow_reschedule: !!svc.allow_reschedule, allow_cancel: !!svc.allow_cancel,
  sold_count: Number(sold) || 0,
  packages: packages.map((p) => ({ ...p, is_active: !!p.is_active, original_total: money(svc.price * p.sessions_count) })),
});

const loadService = async (id, therapist_id) => {
  const [rows] = await db.query('SELECT * FROM prodesk_services WHERE id = ? AND therapist_id = ?', [id, therapist_id]);
  if (!rows || !rows.length) return null;
  const [pk] = await db.query('SELECT * FROM prodesk_service_packages WHERE service_id = ? AND is_active = 1 ORDER BY sessions_count', [id]);
  const [[{ n }]] = await db.query('SELECT COUNT(*) AS n FROM prodesk_service_purchases WHERE service_id = ?', [id]);
  return decorate(rows[0], pk, n);
};

const getServicesService = async ({ therapist_id, include_archived = false, status }) => {
  try {
    const where = ['therapist_id = ?'];
    const params = [therapist_id];
    if (status) { where.push('status = ?'); params.push(status); }
    else if (!include_archived) where.push("status <> 'archived'");
    const [rows] = await db.query(`SELECT * FROM prodesk_services WHERE ${where.join(' AND ')} ORDER BY created_at DESC, id DESC`, params);
    if (!rows.length) return { status: true, code: 200, message: 'Services fetched', data: [] };

    const ids = rows.map((r) => r.id);
    const [pk] = await db.query('SELECT * FROM prodesk_service_packages WHERE is_active = 1 AND service_id IN (?) ORDER BY sessions_count', [ids]);
    const [sold] = await db.query('SELECT service_id, COUNT(*) AS n FROM prodesk_service_purchases WHERE service_id IN (?) GROUP BY service_id', [ids]);
    const soldBy = Object.fromEntries(sold.map((s) => [s.service_id, s.n]));
    const data = rows.map((r) => decorate(r, pk.filter((p) => p.service_id === r.id), soldBy[r.id] || 0));
    return { status: true, code: 200, message: 'Services fetched', data };
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

// Make the stored packages equal `wanted`. A package that already has purchases is switched off, never deleted.
const syncPackages = async (conn, service_id, wanted) => {
  const [existing] = await conn.query('SELECT * FROM prodesk_service_packages WHERE service_id = ?', [service_id]);
  const byCount = new Map(existing.map((p) => [p.sessions_count, p]));
  const keep = new Set(wanted.map((w) => w.sessions_count));

  for (const w of wanted) {
    const cur = byCount.get(w.sessions_count);
    if (cur) {
      await conn.query(
        'UPDATE prodesk_service_packages SET discount_percent = ?, total_price = ?, validity_days = ?, is_active = 1 WHERE id = ?',
        [w.discount_percent, w.total_price, w.validity_days, cur.id]
      );
    } else {
      await conn.query(
        'INSERT INTO prodesk_service_packages (service_id, sessions_count, discount_percent, total_price, validity_days) VALUES (?, ?, ?, ?, ?)',
        [service_id, w.sessions_count, w.discount_percent, w.total_price, w.validity_days]
      );
    }
  }
  for (const cur of existing) {
    if (keep.has(cur.sessions_count)) continue;
    const [[{ n }]] = await conn.query('SELECT COUNT(*) AS n FROM prodesk_service_purchases WHERE package_id = ?', [cur.id]);
    if (n > 0) await conn.query('UPDATE prodesk_service_packages SET is_active = 0 WHERE id = ?', [cur.id]);
    else await conn.query('DELETE FROM prodesk_service_packages WHERE id = ?', [cur.id]);
  }
};

const createServiceService = async (payload) => {
  const { therapist_id, actor_user_id } = payload;
  let conn;
  try {
    const merged = {
      session_mode: 'online', duration_min: 60, accept_direct: 1, accept_razorpay: 0,
      allow_reschedule: 0, allow_cancel: 0, intake_form_mode: 'none', status: 'draft',
    };
    for (const f of SERVICE_FIELDS) if (payload[f] !== undefined) merged[f] = payload[f];

    const v = await validateService(merged, therapist_id);
    if (v.error) return v.error;
    let pkgs = [];
    if (payload.packages !== undefined) {
      const np = normalisePackages(payload.packages, v.value.price);
      if (np.error) return np.error;
      pkgs = np.value;
    }
    if (v.value.status === 'archived') return { status: false, code: 400, message: 'A new service cannot be created as archived', data: null };

    conn = await db.getConnection();
    await conn.beginTransaction();
    const s = v.value;
    const [r] = await conn.query(
      `INSERT INTO prodesk_services (therapist_id, name, description, session_mode, duration_min, price, accept_direct, accept_razorpay,
         allow_reschedule, reschedule_cutoff_hrs, allow_cancel, cancel_cutoff_hrs, intake_form_id, intake_form_mode, status, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [therapist_id, s.name, s.description, s.session_mode, s.duration_min, s.price, s.accept_direct, s.accept_razorpay,
        s.allow_reschedule, s.reschedule_cutoff_hrs, s.allow_cancel, s.cancel_cutoff_hrs, s.intake_form_id, s.intake_form_mode, s.status, s.expires_at]
    );
    await syncPackages(conn, r.insertId, pkgs);
    await conn.commit();

    await Activity.record({
      actor_user_id, module_name: 'service', action: 'created',
      description: `Created service "${s.name}" (${s.status})`,
      meta: { therapist_id, service_id: r.insertId, name: s.name, price: s.price, status: s.status, packages: pkgs.map((p) => p.sessions_count) },
    });
    return { status: true, code: 201, message: 'Service created', data: await loadService(r.insertId, therapist_id) };
  } catch (error) {
    if (conn) await conn.rollback().catch(() => {});
    console.log('Error in createServiceService::>>', error);
    return null;
  } finally {
    if (conn) conn.release();
  }
};

const updateServiceService = async (payload) => {
  const { therapist_id, actor_user_id, service_id } = payload;
  let conn;
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

    let pkgs;
    if (payload.packages !== undefined) {
      const np = normalisePackages(payload.packages, v.value.price);
      if (np.error) return np.error;
      pkgs = np.value;
    } else if (Number(current.price) !== v.value.price) {
      // Price changed but packages were not re-sent: keep their discount %, recompute totals so they stay consistent
      const [old] = await db.query('SELECT sessions_count, discount_percent, validity_days FROM prodesk_service_packages WHERE service_id = ? AND is_active = 1', [service_id]);
      const np = normalisePackages(old.map((o) => ({ sessions_count: o.sessions_count, discount_percent: o.discount_percent, validity_days: o.validity_days })), v.value.price);
      if (np.error) return np.error;
      pkgs = np.value;
    }

    const s = v.value;
    const changes = {};
    for (const f of SERVICE_FIELDS) {
      const from = current[f], to = s[f];
      if (!same(from, to)) changes[f] = { from: from ?? null, to: to ?? null };
    }

    conn = await db.getConnection();
    await conn.beginTransaction();
    await conn.query(
      `UPDATE prodesk_services SET name = ?, description = ?, session_mode = ?, duration_min = ?, price = ?, accept_direct = ?, accept_razorpay = ?,
         allow_reschedule = ?, reschedule_cutoff_hrs = ?, allow_cancel = ?, cancel_cutoff_hrs = ?, intake_form_id = ?, intake_form_mode = ?, status = ?, expires_at = ?
       WHERE id = ?`,
      [s.name, s.description, s.session_mode, s.duration_min, s.price, s.accept_direct, s.accept_razorpay,
        s.allow_reschedule, s.reschedule_cutoff_hrs, s.allow_cancel, s.cancel_cutoff_hrs, s.intake_form_id, s.intake_form_mode, s.status, s.expires_at, service_id]
    );
    if (pkgs) await syncPackages(conn, service_id, pkgs);
    await conn.commit();

    const pkgChanged = !!pkgs;
    if (Object.keys(changes).length || pkgChanged) {
      await Activity.record({
        actor_user_id, module_name: 'service', action: 'updated',
        description: `Updated service "${s.name}"`,
        meta: { therapist_id, service_id: Number(service_id), changes, ...(pkgChanged ? { packages: pkgs.map((p) => ({ sessions: p.sessions_count, total: p.total_price })) } : {}) },
      });
    }
    return { status: true, code: 200, message: 'Service updated', data: await loadService(service_id, therapist_id) };
  } catch (error) {
    if (conn) await conn.rollback().catch(() => {});
    console.log('Error in updateServiceService::>>', error);
    return null;
  } finally {
    if (conn) conn.release();
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
        actor_user_id, module_name: 'service', action: 'archived',
        description: `Archived service "${rows[0].name}" (it has bookings)`,
        meta: { therapist_id, service_id: Number(service_id), purchases, sessions },
      });
      return { status: true, code: 200, message: 'Service has bookings, so it was archived instead of deleted', data: { deleted: false, archived: true } };
    }
    await db.query('DELETE FROM prodesk_services WHERE id = ?', [service_id]);
    await Activity.record({
      actor_user_id, module_name: 'service', action: 'deleted',
      description: `Deleted service "${rows[0].name}"`,
      meta: { therapist_id, service_id: Number(service_id), name: rows[0].name },
    });
    return { status: true, code: 200, message: 'Service deleted', data: { deleted: true, archived: false } };
  } catch (error) {
    console.log('Error in deleteServiceService::>>', error);
    return null;
  }
};

module.exports = {
  getServicesService, getServiceByIdService, createServiceService, updateServiceService, deleteServiceService, loadService,
};
