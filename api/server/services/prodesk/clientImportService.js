// Bulk client import (CSV from the therapist's old records).
// The browser reads the file and sends the rows here. We check every row first (dry_run) so the therapist
// can see what will happen, then create the valid ones with the SAME code the Add client form uses,
// so the plan limit, duplicate rules and phone cleaning are identical. Nobody is emailed or messaged.
const db = require('../../../config/db');
const planGuard = require('./planGuard');
const { createClientService } = require('./clientService');

const MAX_ROWS = 500;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// India by default: a 10-digit number gets 91 in front, like the form's default country
const cleanPhone = (raw) => {
  let d = String(raw ?? '').replace(/\D/g, '');
  if (!d) return { ok: true, value: null };
  if (d.length === 11 && d.startsWith('0')) d = d.slice(1);
  if (d.length === 10) d = '91' + d;
  if (d.length < 8 || d.length > 15) return { ok: false };
  return { ok: true, value: d };
};

// YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY (day first, as used in India)
const cleanDate = (raw) => {
  const s = String(raw ?? '').trim();
  if (!s) return { ok: true, value: null };
  let y, m, d, x;
  if ((x = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/))) { y = +x[1]; m = +x[2]; d = +x[3]; }
  else if ((x = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/))) { d = +x[1]; m = +x[2]; y = +x[3]; }
  else return { ok: false };
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return { ok: false };
  if (y < 1990 || dt.getTime() > Date.now() + 366 * 86400000) return { ok: false };
  return { ok: true, value: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}` };
};

// Looks at every row. Returns [{ row, name, email, phone, start_date, error }] (error = null when it can be imported)
const checkRows = async (therapist_id, rawRows) => {
  const [mine] = await db.query(
    `SELECT LOWER(u.email) AS email, u.phone, pc.start_date,
            LOWER(TRIM(CONCAT(u.first_name, ' ', u.last_name))) AS full_name
     FROM prodesk_clients pc JOIN users u ON u.user_id = pc.user_id
     WHERE pc.therapist_id = ? AND pc.deleted_at IS NULL`, [therapist_id]);
  const haveEmail = new Set(mine.map((r) => r.email).filter(Boolean));
  const havePhone = new Set(mine.map((r) => String(r.phone || '').replace(/\D/g, '').slice(-10)).filter((p) => p.length === 10));
  // Same name + same start date = almost certainly the same person (a row with no date counts as today, like the form)
  const ymd = (d) => (d instanceof Date ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` : String(d || '').slice(0, 10));
  const today = new Date().toISOString().slice(0, 10);
  const haveNameDate = new Set(mine.map((r) => `${String(r.full_name).replace(/\s+/g, ' ')}|${ymd(r.start_date)}`));
  const seenEmail = new Set(), seenPhone = new Set(), seenNameDate = new Set();

  return rawRows.map((r, i) => {
    const name = String(r?.name ?? '').replace(/\s+/g, ' ').trim();
    const emailRaw = String(r?.email ?? '').trim().toLowerCase();
    const ph = cleanPhone(r?.phone), dt = cleanDate(r?.start_date);
    const out = { row: i + 1, name, email: emailRaw || null, phone: ph.value, start_date: dt.value, error: null };

    if (!name) out.error = 'Name is missing';
    else if (name.length > 100) out.error = 'Name is too long';
    else if (emailRaw && !EMAIL_RE.test(emailRaw)) out.error = 'Email is not valid';
    else if (!ph.ok) out.error = 'Phone number is not valid';
    else if (!dt.ok) out.error = 'Start date is not valid (use DD/MM/YYYY or YYYY-MM-DD)';
    else if (!emailRaw && !ph.value) out.error = 'Add an email or phone';
    else if (emailRaw && haveEmail.has(emailRaw)) out.error = 'Already your client (same email)';
    else if (ph.value && havePhone.has(ph.value.slice(-10))) out.error = 'Already your client (same phone)';
    else if (emailRaw && seenEmail.has(emailRaw)) out.error = 'Repeated in this file (same email)';
    else if (ph.value && seenPhone.has(ph.value.slice(-10))) out.error = 'Repeated in this file (same phone)';

    const nameDate = `${name.toLowerCase()}|${dt.value || today}`;
    if (!out.error && haveNameDate.has(nameDate)) out.error = 'Looks like an existing client (same name and start date)';
    else if (!out.error && seenNameDate.has(nameDate)) out.error = 'Repeated in this file (same name and start date)';

    if (!out.error) { seenNameDate.add(nameDate); if (emailRaw) seenEmail.add(emailRaw); if (ph.value) seenPhone.add(ph.value.slice(-10)); }
    return out;
  });
};

const importClientsService = async ({ therapist_id, rows, dry_run = true }) => {
  try {
    // Professional plan only
    const planInfo = await planGuard.getPlanInfo(therapist_id);
    if (planInfo.plan !== 'professional') return { status: false, code: 403, message: 'Importing clients from a file is available on the Professional plan. Please upgrade to use it.', data: null };

    if (!Array.isArray(rows) || !rows.length) return { status: false, code: 400, message: 'The file has no rows', data: null };
    if (rows.length > MAX_ROWS) return { status: false, code: 400, message: `Please upload at most ${MAX_ROWS} clients at a time`, data: null };

    const checked = await checkRows(therapist_id, rows);

    // Places left on the plan (Professional = unlimited)
    const access = await planGuard.getAccess(therapist_id);
    let room = access.plan === 'professional' ? Infinity : Math.max(0, access.limit - access.held.size);
    const PLAN_MSG = `Not imported: your Starter plan is full (${access.limit} active clients). Upgrade to add the rest`;

    const results = [];
    for (const r of checked) {
      if (r.error) { results.push({ ...r, status: 'skipped' }); continue; }
      if (room <= 0) { results.push({ ...r, status: 'skipped', error: PLAN_MSG }); continue; }
      if (dry_run) { room -= 1; results.push({ ...r, status: 'ready' }); continue; }

      const res = await createClientService({
        therapist_id, name: r.name, email: r.email || undefined, phone: r.phone || undefined, start_date: r.start_date || undefined,
      });
      if (res && res.status) { room -= 1; results.push({ ...r, status: 'created' }); }
      else {
        if (res && /Starter/.test(res.message || '')) room = 0;      // the plan filled up while importing
        results.push({ ...r, status: 'skipped', error: (res && res.message) || 'Could not be added' });
      }
    }

    const count = (s) => results.filter((x) => x.status === s).length;
    return {
      status: true, code: 200, message: dry_run ? 'Checked' : 'Import finished',
      data: { dry_run: !!dry_run, rows: results, summary: { total: results.length, ready: count('ready'), created: count('created'), skipped: count('skipped') } },
    };
  } catch (error) {
    console.log('Error in importClientsService::>>', error);
    return null;
  }
};

module.exports = { importClientsService, checkRows, cleanPhone, cleanDate, MAX_ROWS };
