const db = require('../../../config/db');
const Activity = require('./activityLogService');

// ─── Intake forms (Google-Forms style) ───────────────────────────────────────
// A form is a list of fields. A service links to one form (none / optional / required).
// Answers are stored with the label at the time, so editing the form later never rewrites history.

const FIELD_TYPES = ['short_text', 'long_text', 'single_choice', 'multi_choice', 'dropdown', 'date', 'number', 'email', 'phone', 'consent'];
const CHOICE_TYPES = ['single_choice', 'multi_choice', 'dropdown'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[+()\-\s\d]{7,20}$/;

const bad = (message, code = 400) => ({ error: { status: false, code, message, data: null } });
const flag = (v) => (v === true || v === 1 || v === '1' || v === 'true' ? 1 : 0);

const normaliseFields = (fields) => {
  if (!Array.isArray(fields)) return bad('fields must be a list');
  if (fields.length > 50) return bad('A form can have at most 50 fields');
  const out = [];
  for (let i = 0; i < fields.length; i++) {
    const f = fields[i];
    const label = String(f.label || '').trim();
    if (!label) return bad(`Field ${i + 1}: label is required`);
    if (label.length > 300) return bad(`Field ${i + 1}: label is too long`);
    if (!FIELD_TYPES.includes(f.field_type)) return bad(`Field ${i + 1}: type must be one of ${FIELD_TYPES.join(', ')}`);
    let options = null;
    if (CHOICE_TYPES.includes(f.field_type)) {
      const raw = Array.isArray(f.options) ? f.options : [];
      options = [...new Set(raw.map((o) => String(o).trim()).filter(Boolean))];
      if (options.length < 2) return bad(`Field ${i + 1}: add at least 2 choices`);
      if (options.length > 50 || options.some((o) => o.length > 200)) return bad(`Field ${i + 1}: too many or too long choices`);
    }
    out.push({ label, field_type: f.field_type, options, required: f.required ? 1 : 0, sort_order: i });
  }
  return { value: out };
};

const parseOptions = (v) => (typeof v === 'string' ? JSON.parse(v) : v);
const shapeField = (f) => ({ ...f, required: !!f.required, options: f.options ? parseOptions(f.options) : null });

const loadForm = async (id, therapist_id) => {
  const [rows] = await db.query("SELECT * FROM prodesk_intake_forms WHERE id = ? AND therapist_id = ? AND status = 'active'", [id, therapist_id]);
  if (!rows || !rows.length) return null;
  const [fields] = await db.query('SELECT * FROM prodesk_intake_form_fields WHERE form_id = ? ORDER BY sort_order, id', [id]);
  return { ...rows[0], new_clients_only: !!rows[0].new_clients_only, fields: fields.map(shapeField) };
};

const getFormsService = async ({ therapist_id }) => {
  try {
    const [rows] = await db.query(
      `SELECT f.*, (SELECT COUNT(*) FROM prodesk_intake_form_fields x WHERE x.form_id = f.id) AS field_count,
              (SELECT COUNT(*) FROM prodesk_services s WHERE s.intake_form_id = f.id AND s.status <> 'archived') AS used_by_services,
              (SELECT COUNT(*) FROM prodesk_intake_responses r WHERE r.form_id = f.id) AS response_count
       FROM prodesk_intake_forms f WHERE f.therapist_id = ? AND f.status = 'active' ORDER BY f.created_at DESC, f.id DESC`,
      [therapist_id]
    );
    return { status: true, code: 200, message: 'Forms fetched', data: rows };
  } catch (error) {
    console.log('Error in getFormsService::>>', error);
    return null;
  }
};

const getFormByIdService = async ({ therapist_id, form_id }) => {
  try {
    const form = await loadForm(form_id, therapist_id);
    if (!form) return { status: false, code: 404, message: 'Form not found', data: null };
    return { status: true, code: 200, message: 'Form fetched', data: form };
  } catch (error) {
    console.log('Error in getFormByIdService::>>', error);
    return null;
  }
};

const writeFields = async (conn, form_id, fields) => {
  await conn.query('DELETE FROM prodesk_intake_form_fields WHERE form_id = ?', [form_id]);
  for (const f of fields) {
    await conn.query(
      'INSERT INTO prodesk_intake_form_fields (form_id, label, field_type, options, required, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
      [form_id, f.label, f.field_type, f.options ? JSON.stringify(f.options) : null, f.required, f.sort_order]
    );
  }
};

const createFormService = async ({ therapist_id, actor_user_id, title, description, fields, new_clients_only }) => {
  let conn;
  try {
    const t = String(title || '').trim();
    if (!t) return { status: false, code: 400, message: 'Form title is required', data: null };
    if (t.length > 200) return { status: false, code: 400, message: 'Form title is too long', data: null };
    const nf = normaliseFields(fields === undefined ? [] : fields);
    if (nf.error) return nf.error;

    conn = await db.getConnection();
    await conn.beginTransaction();
    const [r] = await conn.query('INSERT INTO prodesk_intake_forms (therapist_id, title, description, new_clients_only) VALUES (?, ?, ?, ?)', [therapist_id, t, description || null, flag(new_clients_only)]);
    await writeFields(conn, r.insertId, nf.value);
    await conn.commit();

    await Activity.record({
      actor_user_id, module_name: 'intake_form', action: 'created', description: `Created intake form "${t}"`,
      meta: { therapist_id, form_id: r.insertId, title: t, field_count: nf.value.length, new_clients_only: flag(new_clients_only) },
    });
    return { status: true, code: 201, message: 'Form created', data: await loadForm(r.insertId, therapist_id) };
  } catch (error) {
    if (conn) await conn.rollback().catch(() => {});
    console.log('Error in createFormService::>>', error);
    return null;
  } finally {
    if (conn) conn.release();
  }
};

const updateFormService = async ({ therapist_id, actor_user_id, form_id, title, description, fields, new_clients_only }) => {
  let conn;
  try {
    const form = await loadForm(form_id, therapist_id);
    if (!form) return { status: false, code: 404, message: 'Form not found', data: null };
    const t = title === undefined ? form.title : String(title || '').trim();
    if (!t) return { status: false, code: 400, message: 'Form title is required', data: null };
    if (t.length > 200) return { status: false, code: 400, message: 'Form title is too long', data: null };
    let nf = null;
    if (fields !== undefined) { nf = normaliseFields(fields); if (nf.error) return nf.error; }

    conn = await db.getConnection();
    await conn.beginTransaction();
    const nco = new_clients_only === undefined ? form.new_clients_only : flag(new_clients_only);
    await conn.query('UPDATE prodesk_intake_forms SET title = ?, description = ?, new_clients_only = ? WHERE id = ?', [t, description === undefined ? form.description : (description || null), nco, form_id]);
    if (nf) await writeFields(conn, form_id, nf.value);
    await conn.commit();

    await Activity.record({
      actor_user_id, module_name: 'intake_form', action: 'updated', description: `Updated intake form "${t}"`,
      meta: { therapist_id, form_id: Number(form_id), title: t, new_clients_only: nco, ...(nf ? { field_count: nf.value.length } : {}) },
    });
    return { status: true, code: 200, message: 'Form updated', data: await loadForm(form_id, therapist_id) };
  } catch (error) {
    if (conn) await conn.rollback().catch(() => {});
    console.log('Error in updateFormService::>>', error);
    return null;
  } finally {
    if (conn) conn.release();
  }
};

// Refused while a service uses it. A form with submitted answers is archived (answers are client records), otherwise deleted.
const deleteFormService = async ({ therapist_id, actor_user_id, form_id }) => {
  try {
    const form = await loadForm(form_id, therapist_id);
    if (!form) return { status: false, code: 404, message: 'Form not found', data: null };
    const [[{ n: used }]] = await db.query("SELECT COUNT(*) AS n FROM prodesk_services WHERE intake_form_id = ? AND status <> 'archived'", [form_id]);
    if (used) return { status: false, code: 409, message: `This form is used by ${used} service(s). Remove it from them first.`, data: null };
    const [[{ n: answers }]] = await db.query('SELECT COUNT(*) AS n FROM prodesk_intake_responses WHERE form_id = ?', [form_id]);

    if (answers) {
      await db.query("UPDATE prodesk_intake_forms SET status = 'archived' WHERE id = ?", [form_id]);
      await db.query('UPDATE prodesk_services SET intake_form_id = NULL, intake_form_mode = ? WHERE intake_form_id = ?', ['none', form_id]);
    } else {
      await db.query('UPDATE prodesk_services SET intake_form_id = NULL, intake_form_mode = ? WHERE intake_form_id = ?', ['none', form_id]);
      await db.query('DELETE FROM prodesk_intake_forms WHERE id = ?', [form_id]);
    }
    await Activity.record({
      actor_user_id, module_name: 'intake_form', action: answers ? 'archived' : 'deleted',
      description: `${answers ? 'Archived' : 'Deleted'} intake form "${form.title}"`,
      meta: { therapist_id, form_id: Number(form_id), title: form.title, responses: answers },
    });
    return { status: true, code: 200, message: answers ? 'Form has answers, so it was archived' : 'Form deleted', data: { deleted: !answers, archived: !!answers } };
  } catch (error) {
    console.log('Error in deleteFormService::>>', error);
    return null;
  }
};

// ─── Answers ─────────────────────────────────────────────────────────────────

const checkAnswer = (f, value) => {
  const empty = value === undefined || value === null || value === '' || (Array.isArray(value) && !value.length);
  if (f.field_type === 'consent') {
    if (value !== true && value !== false && value !== undefined && value !== null) return `"${f.label}" must be yes or no`;
    if (f.required && value !== true) return `"${f.label}" must be accepted`;
    return null;
  }
  if (empty) return f.required ? `"${f.label}" is required` : null;

  switch (f.field_type) {
    case 'short_text': return String(value).length > 500 ? `"${f.label}" is too long (max 500)` : null;
    case 'long_text': return String(value).length > 5000 ? `"${f.label}" is too long (max 5000)` : null;
    case 'number': return Number.isFinite(Number(value)) ? null : `"${f.label}" must be a number`;
    case 'email': return EMAIL_RE.test(String(value)) ? null : `"${f.label}" must be a valid email`;
    case 'phone': return PHONE_RE.test(String(value)) ? null : `"${f.label}" must be a valid phone number`;
    case 'date': return isNaN(new Date(String(value)).getTime()) ? `"${f.label}" must be a valid date` : null;
    case 'single_choice':
    case 'dropdown': return f.options.includes(String(value)) ? null : `"${f.label}": choose one of the listed options`;
    case 'multi_choice': return Array.isArray(value) && value.every((v) => f.options.includes(String(v))) ? null : `"${f.label}": choose from the listed options`;
    default: return null;
  }
};

// Checks answers against the form's questions. Returns { error } or { stored } (what gets saved, with labels).
const validateAnswers = (form, answers) => {
  if (!Array.isArray(answers)) return { error: { status: false, code: 400, message: 'answers must be a list', data: null } };
  const byField = new Map(answers.map((a) => [Number(a.field_id), a.value]));
  for (const id of byField.keys()) {
    if (!form.fields.some((f) => f.id === id)) return { error: { status: false, code: 400, message: `Unknown field ${id}`, data: null } };
  }
  const stored = [];
  for (const f of form.fields) {
    const err = checkAnswer(f, byField.get(f.id));
    if (err) return { error: { status: false, code: 422, message: err, data: null } };
    if (byField.has(f.id)) stored.push({ field_id: f.id, label: f.label, value: byField.get(f.id) });
  }
  return { stored };
};

// answers: [{ field_id, value }]
const submitResponseService = async ({ therapist_id, form_id, client_id, purchase_id = null, answers }) => {
  try {
    const form = await loadForm(form_id, therapist_id);
    if (!form) return { status: false, code: 404, message: 'Form not found', data: null };
    const [c] = await db.query('SELECT id FROM prodesk_clients WHERE id = ? AND therapist_id = ?', [client_id, therapist_id]);
    if (!c || !c.length) return { status: false, code: 404, message: 'Client not found', data: null };
    const v = validateAnswers(form, answers);
    if (v.error) return v.error;

    const [r] = await db.query(
      'INSERT INTO prodesk_intake_responses (form_id, client_id, purchase_id, answers) VALUES (?, ?, ?, ?)',
      [form_id, client_id, purchase_id, JSON.stringify(v.stored)]
    );
    await Activity.record({
      actor_user_id: null, performed_by: 'client', module_name: 'intake_form', action: 'response_submitted',
      description: `Intake form "${form.title}" answered`,
      meta: { therapist_id, form_id: Number(form_id), client_id: Number(client_id), purchase_id, response_id: r.insertId },
    });
    return { status: true, code: 201, message: 'Response saved', data: { id: r.insertId } };
  } catch (error) {
    console.log('Error in submitResponseService::>>', error);
    return null;
  }
};

const getResponsesService = async ({ therapist_id, form_id, client_id, purchase_id }) => {
  try {
    const where = ['f.therapist_id = ?'];
    const params = [therapist_id];
    if (form_id) { where.push('r.form_id = ?'); params.push(form_id); }
    if (client_id) { where.push('r.client_id = ?'); params.push(client_id); }
    if (purchase_id) { where.push('r.purchase_id = ?'); params.push(purchase_id); }
    const [rows] = await db.query(
      `SELECT r.*, f.title AS form_title FROM prodesk_intake_responses r JOIN prodesk_intake_forms f ON f.id = r.form_id
       WHERE ${where.join(' AND ')} ORDER BY r.id DESC LIMIT 200`, params
    );
    return { status: true, code: 200, message: 'Responses fetched', data: rows };
  } catch (error) {
    console.log('Error in getResponsesService::>>', error);
    return null;
  }
};

module.exports = {
  getFormsService, getFormByIdService, createFormService, updateFormService, deleteFormService,
  submitResponseService, getResponsesService, loadForm, validateAnswers,
};
