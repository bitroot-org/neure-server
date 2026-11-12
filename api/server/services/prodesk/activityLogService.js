const db = require('../../../config/db');

// ─── Activity log (services, packages, purchases, sessions, direct-payment decisions) ─────
// One row per event in the shared `activity_logs` table. What the event is about
// (service_id, session_id, purchase_id, payment_id, before/after values) lives in `meta` (JSON).
// module_name is always 'prodesk.<area>' so ProDesk rows are easy to tell apart from other modules.

const record = async ({ actor_user_id = null, performed_by = 'therapist', module_name, action, description = null, meta = {} }) => {
  try {
    await db.query(
      'INSERT INTO activity_logs (user_id, performed_by, module_name, action, description, meta) VALUES (?, ?, ?, ?, ?, ?)',
      [actor_user_id, performed_by, `prodesk.${module_name}`, action, description, JSON.stringify(meta)]
    );
  } catch (e) {
    console.log('activity log failed (non-fatal)::>>', e.message);   // never break the real action
  }
};

const ENTITY_KEYS = ['service_id', 'purchase_id', 'session_id', 'payment_id', 'form_id', 'consent_id'];

// History for one entity of this therapist, newest first.
const getActivityService = async ({ therapist_id, entity, id, limit = 50 }) => {
  try {
    if (!ENTITY_KEYS.includes(entity) || !id) {
      return { status: false, code: 400, message: `entity must be one of ${ENTITY_KEYS.join(', ')} and id is required`, data: null };
    }
    const [rows] = await db.query(
      `SELECT id, performed_by, module_name, action, description, meta, created_at
       FROM activity_logs
       WHERE module_name LIKE 'prodesk.%'
         AND JSON_EXTRACT(meta, '$.therapist_id') = ?
         AND JSON_EXTRACT(meta, ?) = ?
       ORDER BY id DESC LIMIT ?`,
      [Number(therapist_id), `$.${entity}`, Number(id), Math.min(Number(limit) || 50, 200)]
    );
    return { status: true, code: 200, message: 'Activity fetched', data: rows };
  } catch (error) {
    console.log('Error in getActivityService::>>', error);
    return null;
  }
};

module.exports = { record, getActivityService };
