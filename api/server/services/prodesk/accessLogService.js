const db = require('../../../config/db');

// ─── Access log (DPDP) ───────────────────────────────────────────────────────
// Records who viewed or changed a client's records. Kept 12 months (see prodeskPrivacyJobs cron).

const ACTION_LABELS = {
  view_client: 'Viewed client profile',
  edit_client: 'Edited client details',
  archive_client: 'Archived client',
  delete_client: 'Deleted client',
  view_note: 'Opened session note',
  edit_note: 'Wrote or edited a session note',
  export_note: 'Exported a session note (PDF)',
  view_client_notes: "Viewed client's notes",
  view_invoice: 'Viewed invoice',
  create_invoice: 'Created invoice',
  send_invoice: 'Sent invoice',
  export_all_data: 'Downloaded all data'
};

const record = async ({ therapist_id, user_id = null, action, entity_type, entity_id = null, client_id = null, ip_address = null }) => {
  try {
    await db.query(
      `INSERT INTO prodesk_access_logs (therapist_id, user_id, action, entity_type, entity_id, client_id, ip_address)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [therapist_id, user_id, action, entity_type, entity_id, client_id, ip_address]
    );
  } catch (e) {
    console.log('accessLog record failed (non-fatal)::>>', e.message);
  }
};

// Which client does this request concern?
const clientIdFor = async (kind, id, therapist_id) => {
  if (!id) return null;
  if (kind === 'client') return Number(id);
  const table = { session: 'prodesk_sessions', invoice: 'prodesk_invoices' }[kind];
  if (!table) return null;
  const [[r]] = await db.query(`SELECT client_id FROM ${table} WHERE id = ? AND therapist_id = ?`, [id, therapist_id]);
  return r ? r.client_id : null;
};

// Route middleware: logs after a successful response, never slows or breaks the request.
//   router.post('/getClientById', authorization, accessLog('view_client', 'client', 'client_id'), ...)
const accessLog = (action, kind, idField) => (req, res, next) => {
  res.on('finish', () => {
    if (res.statusCode >= 400 || !req.user) return;
    (async () => {
      const entity_id = req.body && req.body[idField] ? Number(req.body[idField]) : null;
      const client_id = await clientIdFor(kind, entity_id, req.user.therapist_id);
      await record({
        therapist_id: req.user.therapist_id, user_id: req.user.user_id, action,
        entity_type: kind, entity_id, client_id, ip_address: req.ip
      });
    })().catch(() => {});
  });
  next();
};

const getAccessLogsService = async ({ therapist_id, page = 1, limit = 30, client_id = null }) => {
  try {
    const lim = Math.min(100, Math.max(1, parseInt(limit) || 30));
    const offset = (Math.max(1, parseInt(page) || 1) - 1) * lim;
    const where = ['l.therapist_id = ?'];
    const params = [therapist_id];
    if (client_id) { where.push('l.client_id = ?'); params.push(client_id); }

    const [[{ total }]] = await db.query(`SELECT COUNT(*) AS total FROM prodesk_access_logs l WHERE ${where.join(' AND ')}`, params);
    const [rows] = await db.query(
      `SELECT l.id, l.action, l.entity_type, l.entity_id, l.client_id, l.ip_address, l.created_at,
              TRIM(CONCAT(IFNULL(au.first_name, ''), ' ', IFNULL(au.last_name, ''))) AS actor_name,
              TRIM(CONCAT(IFNULL(cu.first_name, ''), ' ', IFNULL(cu.last_name, ''))) AS client_name
       FROM prodesk_access_logs l
       LEFT JOIN users au ON au.user_id = l.user_id
       LEFT JOIN prodesk_clients pc ON pc.id = l.client_id
       LEFT JOIN users cu ON cu.user_id = pc.user_id
       WHERE ${where.join(' AND ')}
       ORDER BY l.id DESC LIMIT ? OFFSET ?`,
      [...params, lim, offset]
    );
    const logs = rows.map((r) => ({ ...r, label: ACTION_LABELS[r.action] || r.action }));
    return { status: true, code: 200, message: 'Access logs fetched', data: logs, pagination: { page: Math.max(1, parseInt(page) || 1), limit: lim, total } };
  } catch (error) {
    console.log('Error in getAccessLogsService::>>', error);
    return null;
  }
};

module.exports = { record, accessLog, getAccessLogsService, ACTION_LABELS };
