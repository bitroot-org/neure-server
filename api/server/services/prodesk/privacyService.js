const db = require('../../../config/db');
const { s3Client } = require('../../../config/s3Client');
const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
const crypto = require('crypto');
const RazorpayService = require('./razorpayService');

// ─── Deleting data (DPDP) ────────────────────────────────────────────────────
//  • A deleted client is hidden at once and kept as a backup for 30 days, then personal data is erased.
//  • Invoices, payments and consent records are kept (8 years, per the accountant); the person's name and
//    contact details on them are blanked instead.
//  • Notes, files, photos, reminders and the client's profile details are erased.

const GRACE_DAYS = 30;
const LOG_KEEP_MONTHS = 12;
const NOTE_KEEP_YEARS = 3;               // clinical notes: kept 3 years after the client's last session

const keyFromUrl = (url) => {
  const m = String(url || '').match(/amazonaws\.com\/(.+)$/);
  return m ? decodeURIComponent(m[1]) : null;
};

const deleteFromS3 = async (url) => {
  const Key = keyFromUrl(url);
  if (!Key) return;
  try {
    await s3Client.send(new DeleteObjectCommand({ Bucket: process.env.AWS_BUCKET_NAME, Key }));
  } catch (e) {
    console.log('S3 delete failed (non-fatal)::>>', Key, e.message);
  }
};

// Message logs and in-app notifications keep names, phone numbers and e-mail addresses.
// When a person is erased, every trace of them is blanked here too.
const digits10 = (v) => String(v || '').replace(/\D/g, '').slice(-10);
const scrubLogsFor = async ({ emails = [], phones = [], sessionIds = [] }) => {
  if (sessionIds.length) {
    await db.query("UPDATE notification_log SET message = '[erased]', message_body = NULL, error = NULL WHERE JSON_EXTRACT(meta, '$.session_id') IN (?)", [sessionIds]);
  }
  for (const e of emails.filter((x) => x && !/@deleted\.invalid$/.test(x))) {
    await db.query("UPDATE notification_log SET message = '[erased]', message_body = NULL, error = NULL WHERE message LIKE ? OR message_body LIKE ?", [`%${e}%`, `%${e}%`]);
  }
  for (const p of phones.map(digits10).filter((x) => x.length === 10)) {
    await db.query("UPDATE notification_log SET message = '[erased]', message_body = NULL, error = NULL WHERE message LIKE ? OR message_body LIKE ?", [`%${p}%`, `%${p}%`]);
  }
};

// ─── Therapist deletes a client: hidden now, erased after 30 days ───────────
// Deleting does NOT free a Starter place (active clients are final), so starter_active is left alone.
const deleteClientService = async ({ therapist_id, client_id }) => {
  try {
    const [[c]] = await db.query(
      'SELECT id FROM prodesk_clients WHERE id = ? AND therapist_id = ? AND deleted_at IS NULL',
      [client_id, therapist_id]
    );
    if (!c) return { status: false, code: 404, message: 'Client not found', data: null };

    await db.query("UPDATE prodesk_clients SET deleted_at = NOW(), status = 'archived' WHERE id = ?", [client_id]);
    // Their upcoming sessions and open requests are cancelled quietly (the client is not messaged)
    await db.query("UPDATE prodesk_sessions SET status = 'cancelled' WHERE client_id = ? AND status IN ('scheduled', 'pending')", [client_id]);
    return {
      status: true, code: 200,
      message: `Client deleted. Their personal data is permanently erased after ${GRACE_DAYS} days.`,
      data: null
    };
  } catch (error) {
    console.log('Error in deleteClientService::>>', error);
    return null;
  }
};

// Notes and their attachments (files on S3 included). The sessions themselves stay.
const purgeClientNotes = async (client_id) => {
  const [atts] = await db.query(
    `SELECT a.file_url FROM prodesk_note_attachments a
     JOIN prodesk_session_notes n ON n.id = a.note_id WHERE n.client_id = ?`, [client_id]
  );
  for (const a of atts) await deleteFromS3(a.file_url);
  await db.query('UPDATE prodesk_sessions SET note_id = NULL WHERE client_id = ?', [client_id]);
  const [r] = await db.query('DELETE FROM prodesk_session_notes WHERE client_id = ?', [client_id]);   // attachments cascade
  return r.affectedRows;
};

// ─── Erase one client's personal data for good ───────────────────────────────
const purgeClient = async (client_id) => {
  const [[c]] = await db.query('SELECT id, user_id, profile_url FROM prodesk_clients WHERE id = ?', [client_id]);
  if (!c) return false;

  await purgeClientNotes(client_id);   // notes and their attachments

  // Message logs and in-app notifications that name this person
  const [[who]] = await db.query('SELECT email, phone FROM users WHERE user_id = ?', [c.user_id]);
  const [sess] = await db.query('SELECT id FROM prodesk_sessions WHERE client_id = ?', [client_id]);
  await db.query("DELETE FROM notifications WHERE JSON_EXTRACT(meta, '$.client_id') = ?", [client_id]);
  await scrubLogsFor({ emails: [who && who.email], phones: [who && who.phone], sessionIds: sess.map((x) => x.id) });
  const [[pc]] = await db.query('SELECT GROUP_CONCAT(parent_phone) AS phones, GROUP_CONCAT(parent_email) AS emails FROM prodesk_parent_consents WHERE client_id = ?', [client_id]);
  if (pc && (pc.phones || pc.emails)) {
    await scrubLogsFor({ emails: String(pc.emails || '').split(','), phones: String(pc.phones || '').split(',') });
  }

  // Reminders, and free text on the sessions (the session rows stay: invoices point at them)
  await db.query('DELETE FROM prodesk_session_reminders WHERE session_id IN (SELECT id FROM prodesk_sessions WHERE client_id = ?)', [client_id]);
  await db.query("UPDATE prodesk_sessions SET title = 'Session', location = NULL, meet_url = NULL WHERE client_id = ?", [client_id]);

  // Profile details and photo
  await deleteFromS3(c.profile_url);
  await db.query(
    `UPDATE prodesk_clients SET age = NULL, city = NULL, emergency_contact = NULL, presenting_concerns = NULL,
            treatment_given = NULL, issues = NULL, profile_url = NULL, purged_at = NOW() WHERE id = ?`,
    [client_id]
  );

  // The person's name and contact details: only when no other therapist's client record uses the same person
  const [[other]] = await db.query(
    'SELECT COUNT(*) AS n FROM prodesk_clients WHERE user_id = ? AND id <> ? AND purged_at IS NULL', [c.user_id, client_id]
  );
  if (!other.n) {
    await db.query('DELETE FROM notifications WHERE user_id = ?', [c.user_id]);
    await db.query(
      `UPDATE users SET first_name = 'Deleted', last_name = 'client', email = ?, phone = NULL
       WHERE user_id = ? AND role_id = 5`,
      [`deleted-client-${c.user_id}@deleted.invalid`, c.user_id]
    );
  }
  return true;
};

const purgeDueClients = async ({ dryRun = false } = {}) => {
  const [due] = await db.query(
    `SELECT id FROM prodesk_clients
     WHERE deleted_at IS NOT NULL AND purged_at IS NULL AND deleted_at < DATE_SUB(NOW(), INTERVAL ? DAY)`,
    [GRACE_DAYS]
  );
  if (dryRun) return { due: due.map((d) => d.id) };
  let done = 0;
  for (const d of due) {
    try { if (await purgeClient(d.id)) done++; } catch (e) { console.log('purgeClient failed::>>', d.id, e.message); }
  }
  return { due: due.length, purged: done };
};

// Clinical notes are kept 3 years after the client's last session, then erased.
const purgeOldNotes = async ({ dryRun = false } = {}) => {
  const [due] = await db.query(
    `SELECT pc.id AS client_id, pc.therapist_id, COUNT(n.id) AS notes,
            COALESCE(MAX(CASE WHEN s.status <> 'cancelled' THEN s.starts_at END), pc.created_at) AS last_session
     FROM prodesk_clients pc
     JOIN prodesk_session_notes n ON n.client_id = pc.id
     LEFT JOIN prodesk_sessions s ON s.client_id = pc.id
     GROUP BY pc.id, pc.therapist_id, pc.created_at
     HAVING last_session < DATE_SUB(NOW(), INTERVAL ? YEAR)`,
    [NOTE_KEEP_YEARS]
  );
  if (dryRun) return { due: due.map((d) => ({ client_id: d.client_id, therapist_id: d.therapist_id, notes: Number(d.notes), last_session: d.last_session })) };
  let erased = 0;
  for (const d of due) {
    try { erased += await purgeClientNotes(d.client_id); } catch (e) { console.log('purgeClientNotes failed::>>', d.client_id, e.message); }
  }
  return { clients: due.length, notes_erased: erased };
};

const purgeOldAccessLogs = async ({ dryRun = false } = {}) => {
  if (dryRun) {
    const [[r]] = await db.query('SELECT COUNT(*) AS n FROM prodesk_access_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL ? MONTH)', [LOG_KEEP_MONTHS]);
    return { due: r.n };
  }
  const [r] = await db.query('DELETE FROM prodesk_access_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL ? MONTH)', [LOG_KEEP_MONTHS]);
  return { purged: r.affectedRows };
};

// ─── Therapist withdraws consent: account closed now, erased after 30 days ───
// 1. paid plan is cancelled straight away (so nothing is charged again)   2. booking link is switched off
// 3. upcoming sessions are cancelled quietly                              4. everything is erased after 30 days
// Until then the therapist can log in and cancel the deletion.
const getAccountDeletionStatusService = async ({ therapist_id }) => {
  try {
    const [[t]] = await db.query(
      'SELECT deletion_requested_at, DATE_ADD(deletion_requested_at, INTERVAL ? DAY) AS scheduled_for FROM therapists WHERE id = ?',
      [GRACE_DAYS, therapist_id]
    );
    return {
      status: true, code: 200, message: 'Status fetched',
      data: { requested: !!(t && t.deletion_requested_at), scheduled_for: t && t.deletion_requested_at ? t.scheduled_for : null }
    };
  } catch (error) {
    console.log('Error in getAccountDeletionStatusService::>>', error);
    return null;
  }
};

const requestAccountDeletionService = async ({ therapist_id }) => {
  try {
    const [[t]] = await db.query('SELECT deletion_requested_at FROM therapists WHERE id = ?', [therapist_id]);
    if (!t) return { status: false, code: 404, message: 'Account not found', data: null };
    if (t.deletion_requested_at) return getAccountDeletionStatusService({ therapist_id });

    // Stop any paid plan first: if this fails we stop here, so they are never charged after asking to leave
    const [subs] = await db.query(
      `SELECT ps.id, ps.razorpay_subscription_id, ps.pending_new_subscription_id FROM prodesk_subscriptions ps
       JOIN prodesk_plans pp ON pp.id = ps.plan_id
       WHERE ps.therapist_id = ? AND ps.status IN ('active','authenticated','halted','pending_payment') AND pp.plan_type != 'starter'`,
      [therapist_id]
    );
    for (const sub of subs) {
      const ids = [sub.razorpay_subscription_id];
      if (sub.pending_new_subscription_id) {
        const [[f]] = await db.query('SELECT razorpay_subscription_id FROM prodesk_subscriptions WHERE id = ?', [sub.pending_new_subscription_id]);
        if (f) ids.push(f.razorpay_subscription_id);
      }
      for (const rid of ids.filter(Boolean)) {
        try {
          await RazorpayService.cancelSubscription({ razorpaySubscriptionId: rid, cancelAtCycleEnd: 0 });
        } catch (e) {
          // already cancelled / completed on Razorpay's side is fine; anything else must stop us
          if (!/already|cancelled|completed|not in a state/i.test(e.message || '')) {
            console.log('Razorpay cancel failed during account deletion::>>', rid, e.message);
            return { status: false, code: 502, message: 'We could not cancel your subscription just now, so nothing was changed. Please try again in a few minutes.', data: null };
          }
        }
      }
      await db.query(
        `UPDATE prodesk_subscriptions SET status = 'cancelled', cancel_at_period_end = 0, cancelled_at = NOW(),
                cancellation_reason = 'Account deletion requested', pending_plan_id = NULL, pending_billing_cycle = NULL,
                pending_new_subscription_id = NULL, downgrade_requested_at = NULL
         WHERE id = ? OR id = ?`,
        [sub.id, sub.pending_new_subscription_id || 0]
      );
    }

    await db.query('UPDATE therapists SET deletion_requested_at = NOW(), is_active = 0 WHERE id = ?', [therapist_id]);
    await db.query("UPDATE prodesk_sessions SET status = 'cancelled' WHERE therapist_id = ? AND status IN ('scheduled', 'pending')", [therapist_id]);
    return getAccountDeletionStatusService({ therapist_id });
  } catch (error) {
    console.log('Error in requestAccountDeletionService::>>', error);
    return null;
  }
};

const cancelAccountDeletionService = async ({ therapist_id }) => {
  try {
    const [[t]] = await db.query('SELECT deletion_requested_at FROM therapists WHERE id = ?', [therapist_id]);
    if (!t || !t.deletion_requested_at) return { status: false, code: 409, message: 'No deletion is scheduled for this account.', data: null };
    await db.query('UPDATE therapists SET deletion_requested_at = NULL, is_active = 1 WHERE id = ?', [therapist_id]);
    return { status: true, code: 200, message: 'Welcome back. Your account has been kept.', data: null };
  } catch (error) {
    console.log('Error in cancelAccountDeletionService::>>', error);
    return null;
  }
};

// ─── Erase one therapist account for good ────────────────────────────────────
// Invoices, payments, subscriptions and consent records stay (legal / tax). Everything personal goes.
const purgeTherapist = async (therapist_id) => {
  const [[t]] = await db.query('SELECT id, user_id, booking_preview_url FROM therapists WHERE id = ?', [therapist_id]);
  if (!t) return false;
  const step = async (label, fn) => { try { await fn(); } catch (e) { console.log(`purgeTherapist ${label} failed (continuing)::>>`, therapist_id, e.message); } };

  // All their clients
  const [clients] = await db.query('SELECT id FROM prodesk_clients WHERE therapist_id = ? AND purged_at IS NULL', [therapist_id]);
  for (const c of clients) await step(`client ${c.id}`, () => purgeClient(c.id));

  // Files
  const [docs] = await db.query('SELECT file_url FROM therapist_documents WHERE therapist_id = ?', [therapist_id]);
  for (const d of docs) await deleteFromS3(d.file_url);
  const [res] = await db.query("SELECT id, file_url FROM prodesk_resources WHERE therapist_id = ? AND scope = 'mine'", [therapist_id]);
  for (const r of res) await deleteFromS3(r.file_url);
  const [[b]] = await db.query('SELECT logo_url FROM therapist_branding WHERE therapist_id = ?', [therapist_id]).then((r) => (r[0] ? r : [[{}]]));
  await deleteFromS3(b && b.logo_url);
  await deleteFromS3(t.booking_preview_url);

  await step('documents', () => db.query('DELETE FROM therapist_documents WHERE therapist_id = ?', [therapist_id]));
  await step('resources', () => db.query("DELETE FROM prodesk_resources WHERE therapist_id = ? AND scope = 'mine'", [therapist_id]));
  await step('branding', () => db.query('UPDATE therapist_branding SET brand_name = NULL, clinic_address = NULL, logo_url = NULL, wallpaper_url = NULL WHERE therapist_id = ?', [therapist_id]));
  await step('notifications', async () => {
    const [[me]] = await db.query('SELECT email, phone FROM users WHERE user_id = ?', [t.user_id]);
    await db.query('DELETE FROM notifications WHERE user_id = ?', [t.user_id]);
    await db.query("UPDATE notification_log SET message = '[erased]', message_body = NULL, error = NULL WHERE user_id = ?", [t.user_id]);
    await scrubLogsFor({ emails: [me && me.email], phones: [me && me.phone] });
  });
  await step('devices', () => db.query('DELETE FROM prodesk_device_sessions WHERE user_id = ?', [t.user_id]));
  await step('therapist', () => db.query(
    `UPDATE therapists SET bio = NULL, about_me = NULL, designation = NULL, qualification = NULL, specialization = NULL,
            registration_number = NULL, booking_slug = ?, booking_preview_url = NULL, is_active = 0 WHERE id = ?`,
    [`deleted-${therapist_id}`, therapist_id]
  ));
  await db.query(
    `UPDATE users SET first_name = 'Deleted', last_name = 'therapist', email = ?, phone = NULL, password = ?, is_active = 0
     WHERE user_id = ? AND role_id = 4`,
    [`deleted-therapist-${t.user_id}@deleted.invalid`, crypto.randomBytes(24).toString('hex'), t.user_id]
  );
  return true;
};

const purgeDueAccounts = async ({ dryRun = false } = {}) => {
  const [due] = await db.query(
    `SELECT t.id FROM therapists t JOIN users u ON u.user_id = t.user_id
     WHERE t.deletion_requested_at IS NOT NULL AND t.deletion_requested_at < DATE_SUB(NOW(), INTERVAL ? DAY)
       AND u.email NOT LIKE 'deleted-therapist-%'`,
    [GRACE_DAYS]
  );
  if (dryRun) return { due: due.map((d) => d.id) };
  let done = 0;
  for (const d of due) {
    try { if (await purgeTherapist(d.id)) done++; } catch (e) { console.log('purgeTherapist failed::>>', d.id, e.message); }
  }
  return { due: due.length, purged: done };
};

module.exports = {
  GRACE_DAYS, deleteClientService, purgeClient, purgeClientNotes, purgeDueClients, purgeOldNotes, purgeOldAccessLogs, deleteFromS3, keyFromUrl,
  getAccountDeletionStatusService, requestAccountDeletionService, cancelAccountDeletionService, purgeTherapist, purgeDueAccounts
};
