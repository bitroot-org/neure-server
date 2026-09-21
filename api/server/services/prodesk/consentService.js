const db = require('../../../config/db');

const VALID_CONSENT_TYPES = [
  'terms_and_conditions',
  'payment_integration',
  'google_meet_integration',
  'compliance',
  'booking_consent'
];

// ─── RECORD CONSENT ──────────────────────────────────────────────────────────
// Accepts one or more consent types agreed to at once (e.g. all four
// checkboxes on the therapist onboarding consent step, submitted together).

const recordConsentService = async (payload) => {
  try {
    const {
      actor_type, actor_id, therapist_id = null, email = null,
      consent_types, consent_version = 'v1', ip_address = null, user_agent = null
    } = payload;

    if (!['therapist', 'client'].includes(actor_type)) {
      return { status: false, code: 400, message: 'actor_type must be therapist or client', data: null };
    }
    const types = Array.isArray(consent_types) ? consent_types : [consent_types];
    if (!types.length || types.some((t) => !VALID_CONSENT_TYPES.includes(t))) {
      return { status: false, code: 400, message: `consent_types must be one or more of: ${VALID_CONSENT_TYPES.join(', ')}`, data: null };
    }

    const rows = types.map((t) => [actor_type, actor_id || null, therapist_id, email, t, consent_version, ip_address, user_agent]);
    await db.query(
      `INSERT INTO consent_logs (actor_type, actor_id, therapist_id, email, consent_type, consent_version, ip_address, user_agent)
       VALUES ?`,
      [rows]
    );

    return { status: true, code: 200, message: 'Consent recorded', data: { recorded: types } };
  } catch (error) {
    console.log('Error in recordConsentService::>>', error);
    return null;
  }
};

// ─── LIST CONSENT LOGS (superadmin) ─────────────────────────────────────────

const listConsentLogsService = async (payload) => {
  try {
    const {
      page = 1, limit = 20, actor_type, consent_type, therapist_id,
      start_date, end_date, search
    } = payload;

    const where = [];
    const params = [];

    if (actor_type) { where.push('cl.actor_type = ?'); params.push(actor_type); }
    if (consent_type) { where.push('cl.consent_type = ?'); params.push(consent_type); }
    if (therapist_id) { where.push('cl.therapist_id = ?'); params.push(therapist_id); }
    if (start_date) { where.push('cl.created_at >= ?'); params.push(start_date); }
    if (end_date) { where.push('cl.created_at <= ?'); params.push(end_date); }
    if (search) { where.push('cl.email LIKE ?'); params.push(`%${search}%`); }

    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const [rows] = await db.query(
      `SELECT cl.id, cl.actor_type, cl.actor_id, cl.therapist_id, cl.email,
              cl.consent_type, cl.consent_version, cl.ip_address, cl.user_agent,
              DATE_ADD(DATE_ADD(cl.created_at, INTERVAL 5 HOUR), INTERVAL 30 MINUTE) AS created_at,
              CONCAT(tu.first_name, ' ', tu.last_name) AS therapist_name
       FROM consent_logs cl
       LEFT JOIN therapists t ON t.id = cl.therapist_id
       LEFT JOIN users tu ON tu.user_id = t.user_id
       ${whereClause}
       ORDER BY cl.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total FROM consent_logs cl ${whereClause}`,
      params
    );

    return {
      status: true, code: 200, message: 'Consent logs fetched',
      data: rows,
      pagination: { total, current_page: parseInt(page), per_page: parseInt(limit), total_pages: Math.ceil(total / limit) }
    };
  } catch (error) {
    console.log('Error in listConsentLogsService::>>', error);
    return null;
  }
};

module.exports = {
  recordConsentService,
  listConsentLogsService
};
