const db = require('../../../config/db');
const Activity = require('./activityLogService');
const { sanitizeHtml } = require('../../utils/safeHtml');

// ─── Consent (agreement) forms ───────────────────────────────────────────────
// The terms a client accepts before booking. Either typed text (body) or an uploaded PDF (file_url).
// A saved version is never edited: changing the content creates the next version (v1, v2, ...).
// Clients are asked again only when the therapist publishes a newer version than the one they accepted.

const bad = (message, code = 400) => ({ error: { status: false, code, message, data: null } });

// Only files we uploaded ourselves are accepted as an agreement file
const ownFile = (url) => typeof url === 'string' && url.startsWith(`https://${process.env.AWS_BUCKET_NAME}.s3.`) && url.length <= 500;

// { body, file_url } -> { value: { body, file_url } } | { error }. Exactly one of them.
const normaliseContent = ({ body, file_url }) => {
  const hasBody = body != null && String(body).trim() !== '';
  const hasFile = file_url != null && String(file_url).trim() !== '';
  if (hasBody === hasFile) return bad('Provide the agreement either as text or as an uploaded PDF, not both and not neither');
  if (hasFile) {
    if (!ownFile(file_url)) return bad('The agreement file must be uploaded through this app');
    return { value: { body: null, file_url: String(file_url) } };
  }
  if (String(body).length > 100000) return bad('The agreement text is too long');
  const clean = sanitizeHtml(body);
  if (!clean) return bad('The agreement text is empty');
  return { value: { body: clean, file_url: null } };
};

const latestVersion = async (consent_form_id, conn = db) => {
  const [rows] = await conn.query('SELECT * FROM prodesk_consent_versions WHERE consent_form_id = ? ORDER BY version_no DESC LIMIT 1', [consent_form_id]);
  return rows && rows[0] ? rows[0] : null;
};

const loadForm = async (id, therapist_id) => {
  const [rows] = await db.query("SELECT * FROM prodesk_consent_forms WHERE id = ? AND therapist_id = ? AND status = 'active'", [id, therapist_id]);
  if (!rows || !rows.length) return null;
  const current = await latestVersion(id);
  const [versions] = await db.query(
    'SELECT id, version_no, change_note, created_by, created_at, (file_url IS NOT NULL) AS is_file FROM prodesk_consent_versions WHERE consent_form_id = ? ORDER BY version_no DESC', [id]);
  const [[{ n }]] = await db.query('SELECT COUNT(*) AS n FROM prodesk_consent_acceptances a JOIN prodesk_consent_versions v ON v.id = a.version_id WHERE v.consent_form_id = ?', [id]);
  return { ...rows[0], current_version: current, versions: versions.map((v) => ({ ...v, is_file: !!v.is_file })), acceptance_count: n };
};

const getConsentFormsService = async ({ therapist_id }) => {
  try {
    const [rows] = await db.query(
      `SELECT f.id, f.title, f.created_at, f.updated_at,
              (SELECT MAX(version_no) FROM prodesk_consent_versions v WHERE v.consent_form_id = f.id) AS version_no,
              (SELECT (file_url IS NOT NULL) FROM prodesk_consent_versions v WHERE v.consent_form_id = f.id ORDER BY version_no DESC LIMIT 1) AS is_file,
              (SELECT COUNT(*) FROM prodesk_services s WHERE s.consent_form_id = f.id AND s.status <> 'archived') AS used_by_services,
              (SELECT COUNT(*) FROM prodesk_consent_acceptances a JOIN prodesk_consent_versions v ON v.id = a.version_id WHERE v.consent_form_id = f.id) AS acceptance_count
       FROM prodesk_consent_forms f WHERE f.therapist_id = ? AND f.status = 'active' ORDER BY f.updated_at DESC, f.id DESC`, [therapist_id]);
    return { status: true, code: 200, message: 'Consent forms fetched', data: rows.map((r) => ({ ...r, is_file: !!r.is_file })) };
  } catch (error) {
    console.log('Error in getConsentFormsService::>>', error);
    return null;
  }
};

const getConsentFormByIdService = async ({ therapist_id, consent_form_id, version_no }) => {
  try {
    const form = await loadForm(consent_form_id, therapist_id);
    if (!form) return { status: false, code: 404, message: 'Consent form not found', data: null };
    if (version_no) {
      const [v] = await db.query('SELECT * FROM prodesk_consent_versions WHERE consent_form_id = ? AND version_no = ?', [consent_form_id, version_no]);
      if (!v || !v.length) return { status: false, code: 404, message: 'Version not found', data: null };
      form.viewing_version = v[0];
    }
    return { status: true, code: 200, message: 'Consent form fetched', data: form };
  } catch (error) {
    console.log('Error in getConsentFormByIdService::>>', error);
    return null;
  }
};

const createConsentFormService = async ({ therapist_id, actor_user_id, title, body, file_url }) => {
  let conn;
  try {
    const t = String(title || '').trim();
    if (!t) return { status: false, code: 400, message: 'Title is required', data: null };
    if (t.length > 200) return { status: false, code: 400, message: 'Title is too long', data: null };
    const c = normaliseContent({ body, file_url });
    if (c.error) return c.error;

    conn = await db.getConnection();
    await conn.beginTransaction();
    const [r] = await conn.query('INSERT INTO prodesk_consent_forms (therapist_id, title) VALUES (?, ?)', [therapist_id, t]);
    await conn.query('INSERT INTO prodesk_consent_versions (consent_form_id, version_no, body, file_url, change_note, created_by) VALUES (?, 1, ?, ?, ?, ?)',
      [r.insertId, c.value.body, c.value.file_url, 'First version', actor_user_id]);
    await conn.commit();

    await Activity.record({
      actor_user_id, module_name: 'consent_form', action: 'created', description: `Created consent form "${t}" (v1)`,
      meta: { therapist_id, consent_id: r.insertId, title: t, version_no: 1, is_file: !!c.value.file_url },
    });
    return { status: true, code: 201, message: 'Consent form created', data: await loadForm(r.insertId, therapist_id) };
  } catch (error) {
    if (conn) await conn.rollback().catch(() => {});
    console.log('Error in createConsentFormService::>>', error);
    return null;
  } finally {
    if (conn) conn.release();
  }
};

// Title change alone does not create a version. New text or a new file does.
const updateConsentFormService = async ({ therapist_id, actor_user_id, consent_form_id, title, body, file_url, change_note }) => {
  let conn;
  try {
    const form = await loadForm(consent_form_id, therapist_id);
    if (!form) return { status: false, code: 404, message: 'Consent form not found', data: null };

    const t = title === undefined ? form.title : String(title || '').trim();
    if (!t) return { status: false, code: 400, message: 'Title is required', data: null };
    if (t.length > 200) return { status: false, code: 400, message: 'Title is too long', data: null };

    let newVersion = null;
    const sendsContent = (body != null && String(body).trim() !== '') || (file_url != null && String(file_url).trim() !== '');
    if (sendsContent) {
      const c = normaliseContent({ body, file_url });
      if (c.error) return c.error;
      const cur = form.current_version;
      const unchanged = (c.value.body && c.value.body === cur.body) || (c.value.file_url && c.value.file_url === cur.file_url);
      if (!unchanged) newVersion = c.value;
    }
    if (t === form.title && !newVersion) return { status: true, code: 200, message: 'Nothing changed', data: form };

    conn = await db.getConnection();
    await conn.beginTransaction();
    if (t !== form.title) await conn.query('UPDATE prodesk_consent_forms SET title = ? WHERE id = ?', [t, consent_form_id]);
    let versionNo = form.current_version.version_no;
    if (newVersion) {
      versionNo += 1;
      await conn.query('INSERT INTO prodesk_consent_versions (consent_form_id, version_no, body, file_url, change_note, created_by) VALUES (?, ?, ?, ?, ?, ?)',
        [consent_form_id, versionNo, newVersion.body, newVersion.file_url, change_note ? String(change_note).slice(0, 255) : null, actor_user_id]);
      await conn.query('UPDATE prodesk_consent_forms SET updated_at = UTC_TIMESTAMP() WHERE id = ?', [consent_form_id]);
    }
    await conn.commit();

    await Activity.record({
      actor_user_id, module_name: 'consent_form', action: newVersion ? 'new_version' : 'renamed',
      description: newVersion ? `Published v${versionNo} of consent form "${t}"` : `Renamed consent form to "${t}"`,
      meta: { therapist_id, consent_id: Number(consent_form_id), title: t, version_no: versionNo, ...(newVersion ? { change_note: change_note || null, is_file: !!newVersion.file_url } : { old_title: form.title }) },
    });
    return { status: true, code: 200, message: newVersion ? `Version ${versionNo} published` : 'Consent form updated', data: await loadForm(consent_form_id, therapist_id) };
  } catch (error) {
    if (conn) await conn.rollback().catch(() => {});
    console.log('Error in updateConsentFormService::>>', error);
    return null;
  } finally {
    if (conn) conn.release();
  }
};

// Refused while a service uses it. With acceptances it is archived (they are legal records), otherwise deleted.
const deleteConsentFormService = async ({ therapist_id, actor_user_id, consent_form_id }) => {
  try {
    const form = await loadForm(consent_form_id, therapist_id);
    if (!form) return { status: false, code: 404, message: 'Consent form not found', data: null };
    const [[{ n: used }]] = await db.query("SELECT COUNT(*) AS n FROM prodesk_services WHERE consent_form_id = ? AND status <> 'archived'", [consent_form_id]);
    if (used) return { status: false, code: 409, message: `This consent form is used by ${used} service(s). Remove it from them first.`, data: null };

    const keep = form.acceptance_count > 0;
    await db.query('UPDATE prodesk_services SET consent_form_id = NULL WHERE consent_form_id = ?', [consent_form_id]);
    if (keep) await db.query("UPDATE prodesk_consent_forms SET status = 'archived' WHERE id = ?", [consent_form_id]);
    else await db.query('DELETE FROM prodesk_consent_forms WHERE id = ?', [consent_form_id]);

    await Activity.record({
      actor_user_id, module_name: 'consent_form', action: keep ? 'archived' : 'deleted',
      description: `${keep ? 'Archived' : 'Deleted'} consent form "${form.title}"`,
      meta: { therapist_id, consent_id: Number(consent_form_id), title: form.title, acceptances: form.acceptance_count },
    });
    return { status: true, code: 200, message: keep ? 'Clients have accepted this form, so it was archived and the records kept' : 'Consent form deleted', data: { deleted: !keep, archived: keep } };
  } catch (error) {
    console.log('Error in deleteConsentFormService::>>', error);
    return null;
  }
};

// ─── Acceptance ──────────────────────────────────────────────────────────────

// What does this client still need to accept? { needed, version } for a consent form.
const consentStatusFor = async (consent_form_id, client_id) => {
  const version = await latestVersion(consent_form_id);
  if (!version) return { needed: false, version: null };
  if (!client_id) return { needed: true, version };
  const [a] = await db.query('SELECT 1 FROM prodesk_consent_acceptances WHERE version_id = ? AND client_id = ?', [version.id, client_id]);
  return { needed: !(a && a.length), version };
};

const recordAcceptance = async ({ therapist_id, actor_user_id = null, performed_by = 'therapist', consent_form_id, client_id, purchase_id = null, ip_address = null }) => {
  const version = await latestVersion(consent_form_id);
  if (!version) return null;
  const [r] = await db.query('INSERT IGNORE INTO prodesk_consent_acceptances (version_id, client_id, purchase_id, ip_address) VALUES (?, ?, ?, ?)',
    [version.id, client_id, purchase_id, ip_address]);
  if (r.affectedRows) {
    await Activity.record({
      actor_user_id, performed_by, module_name: 'consent_form', action: 'accepted',
      description: `Agreement v${version.version_no} accepted`,
      meta: { therapist_id, consent_id: Number(consent_form_id), version_no: version.version_no, client_id: Number(client_id), purchase_id },
    });
  }
  return version;
};

module.exports = {
  getConsentFormsService, getConsentFormByIdService, createConsentFormService, updateConsentFormService, deleteConsentFormService,
  consentStatusFor, recordAcceptance,
};
