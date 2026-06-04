const db = require('../../../config/db');
const NotificationService = require('../notificationsAndAnnouncements/notificationService');
const { createMeetingSpace } = require('./googleMeetService');

const checkOverlap = async (therapistId, startsAt, durationMin, excludeId = null) => {
  const query = `
    SELECT id FROM prodesk_sessions
    WHERE therapist_id = ? AND status NOT IN ('cancelled')
    AND starts_at < DATE_ADD(?, INTERVAL ? MINUTE)
    AND DATE_ADD(starts_at, INTERVAL duration_min MINUTE) > ?
    ${excludeId ? 'AND id != ?' : ''}
    LIMIT 1`;
  const params = excludeId
    ? [therapistId, startsAt, durationMin, startsAt, excludeId]
    : [therapistId, startsAt, durationMin, startsAt];
  const [rows] = await db.query(query, params);
  return rows && rows.length > 0;
};

const getSessionByIdService = async (payload) => {
  try {
    console.log('Payload in getSessionByIdService::>>', payload);
    const { therapist_id, session_id } = payload;

    const [rows] = await db.query(
      `SELECT ps.*,
              CONCAT(u.first_name, ' ', u.last_name) AS client_name,
              pc.avatar_color AS client_avatar_color,
              CONCAT(UPPER(LEFT(u.first_name,1)), UPPER(LEFT(u.last_name,1))) AS client_initials
       FROM prodesk_sessions ps
       JOIN prodesk_clients pc ON pc.id = ps.client_id
       JOIN users u ON u.user_id = pc.user_id
       WHERE ps.id = ? AND ps.therapist_id = ?`,
      [session_id, therapist_id]
    );

    if (!rows || !rows.length) {
      return { status: false, code: 404, message: 'Session not found', data: null };
    }

    return { status: true, code: 200, message: 'Session fetched', data: rows[0] };
  } catch (error) {
    console.log('Error in getSessionByIdService::>>', error);
    return null;
  }
};

const createSessionService = async (payload) => {
  try {
    console.log('Payload in createSessionService::>>', payload);
    const { therapist_id, client_id, starts_at, duration_min = 60, modality, fee, title, location } = payload;

    if (!client_id || !starts_at || !modality) {
      return { status: false, code: 400, message: 'client_id, starts_at and modality are required', data: null };
    }

    const [clientCheck] = await db.query(
      'SELECT id FROM prodesk_clients WHERE id = ? AND therapist_id = ?',
      [client_id, therapist_id]
    );
    if (!clientCheck || !clientCheck.length) {
      return { status: false, code: 404, message: 'Client not found', data: null };
    }

    if (new Date(starts_at) < new Date()) {
      return { status: false, code: 422, message: 'Session time cannot be in the past', data: null };
    }

    const overlap = await checkOverlap(therapist_id, starts_at, duration_min);
    if (overlap) {
      return { status: false, code: 409, message: 'Slot unavailable — overlaps with an existing session', data: null };
    }

    const [[{ cnt }]] = await db.query(
      'SELECT COUNT(*) AS cnt FROM prodesk_sessions WHERE client_id = ?',
      [client_id]
    );
    const sessionNum = cnt + 1;
    const sessionTitle = title || `Session ${sessionNum}`;

    const [result] = await db.query(
      `INSERT INTO prodesk_sessions
       (therapist_id, client_id, session_number, title, starts_at, duration_min, modality, fee, location)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [therapist_id, client_id, sessionNum, sessionTitle, starts_at, duration_min, modality, fee || 0, location || null]
    );

    // For video sessions, create a Google Meet space and store the link.
    // Best-effort: if Google credentials aren't configured, URL is created
    // lazily on first join via getMeetingRoomService.
    if (modality === 'video') {
      try {
        const url = await createMeetingSpace(therapist_id);
        await db.query('UPDATE prodesk_sessions SET meet_url = ? WHERE id = ?', [url, result.insertId]);
      } catch (e) {
        console.log('Meet room create (deferred):', e.message);
      }
    }

    return getSessionByIdService({ therapist_id, session_id: result.insertId });
  } catch (error) {
    console.log('Error in createSessionService::>>', error);
    return null;
  }
};

const getSessionsService = async (payload) => {
  try {
    console.log('Payload in getSessionsService::>>', payload);
    const { therapist_id, client_id, status, from, to, page = 1, limit = 20 } = payload;

    const offset = (page - 1) * limit;
    const conditions = ['ps.therapist_id = ?'];
    const vals = [therapist_id];

    if (client_id) { conditions.push('ps.client_id = ?'); vals.push(client_id); }
    if (status) { conditions.push('ps.status = ?'); vals.push(status); }
    if (from) { conditions.push('ps.starts_at >= ?'); vals.push(from); }
    if (to) { conditions.push('ps.starts_at <= ?'); vals.push(to); }

    const where = conditions.join(' AND ');
    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total FROM prodesk_sessions ps WHERE ${where}`,
      vals
    );

    const [rows] = await db.query(
      `SELECT ps.*,
              CONCAT(u.first_name, ' ', u.last_name) AS client_name,
              pc.avatar_color AS client_avatar_color,
              CONCAT(UPPER(LEFT(u.first_name,1)), UPPER(LEFT(u.last_name,1))) AS client_initials
       FROM prodesk_sessions ps
       JOIN prodesk_clients pc ON pc.id = ps.client_id
       JOIN users u ON u.user_id = pc.user_id
       WHERE ${where}
       ORDER BY ps.starts_at DESC LIMIT ? OFFSET ?`,
      [...vals, limit, offset]
    );

    return {
      status: true, code: 200, message: 'Sessions fetched',
      data: rows || [],
      pagination: { total, current_page: page, per_page: limit, total_pages: Math.ceil(total / limit) }
    };
  } catch (error) {
    console.log('Error in getSessionsService::>>', error);
    return null;
  }
};

const updateSessionService = async (payload) => {
  try {
    console.log('Payload in updateSessionService::>>', payload);
    const { therapist_id, session_id, ...data } = payload;

    const [check] = await db.query(
      'SELECT id FROM prodesk_sessions WHERE id = ? AND therapist_id = ?',
      [session_id, therapist_id]
    );
    if (!check || !check.length) {
      return { status: false, code: 404, message: 'Session not found', data: null };
    }

    const allowed = ['title', 'fee', 'duration_min', 'location', 'modality', 'meet_url'];
    const fields = []; const vals = [];
    for (const f of allowed) {
      if (data[f] !== undefined) { fields.push(`${f} = ?`); vals.push(data[f]); }
    }
    if (!fields.length) {
      return { status: false, code: 400, message: 'No fields to update', data: null };
    }

    vals.push(session_id);
    await db.query(`UPDATE prodesk_sessions SET ${fields.join(', ')} WHERE id = ?`, vals);
    return getSessionByIdService({ therapist_id, session_id });
  } catch (error) {
    console.log('Error in updateSessionService::>>', error);
    return null;
  }
};

const rescheduleSessionService = async (payload) => {
  try {
    console.log('Payload in rescheduleSessionService::>>', payload);
    const { therapist_id, session_id, starts_at, duration_min } = payload;

    const [check] = await db.query(
      'SELECT id, status, duration_min AS cur_dur FROM prodesk_sessions WHERE id = ? AND therapist_id = ?',
      [session_id, therapist_id]
    );
    if (!check || !check.length) {
      return { status: false, code: 404, message: 'Session not found', data: null };
    }
    if (check[0].status === 'cancelled') {
      return { status: false, code: 409, message: 'Cannot reschedule a cancelled session', data: null };
    }
    if (new Date(starts_at) < new Date()) {
      return { status: false, code: 422, message: 'New time cannot be in the past', data: null };
    }

    const dur = duration_min || check[0].cur_dur;
    const overlap = await checkOverlap(therapist_id, starts_at, dur, session_id);
    if (overlap) {
      return { status: false, code: 409, message: 'Slot unavailable', data: null };
    }

    await db.query(
      'UPDATE prodesk_sessions SET starts_at = ?, duration_min = ? WHERE id = ?',
      [starts_at, dur, session_id]
    );
    return getSessionByIdService({ therapist_id, session_id });
  } catch (error) {
    console.log('Error in rescheduleSessionService::>>', error);
    return null;
  }
};

const cancelSessionService = async (payload) => {
  try {
    console.log('Payload in cancelSessionService::>>', payload);
    const { therapist_id, session_id, reason } = payload;

    const [check] = await db.query(
      'SELECT id, client_id FROM prodesk_sessions WHERE id = ? AND therapist_id = ?',
      [session_id, therapist_id]
    );
    if (!check || !check.length) {
      return { status: false, code: 404, message: 'Session not found', data: null };
    }

    await db.query("UPDATE prodesk_sessions SET status = 'cancelled' WHERE id = ?", [session_id]);

    const [clientUser] = await db.query(
      'SELECT u.user_id FROM prodesk_clients pc JOIN users u ON u.user_id = pc.user_id WHERE pc.id = ?',
      [check[0].client_id]
    );
    if (clientUser && clientUser.length) {
      await NotificationService.createNotification({
        title: 'Session Cancelled',
        content: reason || 'Your session has been cancelled.',
        type: 'SESSION_CANCELLED',
        user_id: clientUser[0].user_id
      });
    }

    return getSessionByIdService({ therapist_id, session_id });
  } catch (error) {
    console.log('Error in cancelSessionService::>>', error);
    return null;
  }
};

const completeSessionService = async (payload) => {
  try {
    console.log('Payload in completeSessionService::>>', payload);
    const { therapist_id, session_id, no_show = false } = payload;

    const [check] = await db.query(
      'SELECT id FROM prodesk_sessions WHERE id = ? AND therapist_id = ?',
      [session_id, therapist_id]
    );
    if (!check || !check.length) {
      return { status: false, code: 404, message: 'Session not found', data: null };
    }

    const newStatus = no_show ? 'no_show' : 'completed';
    await db.query('UPDATE prodesk_sessions SET status = ? WHERE id = ?', [newStatus, session_id]);
    return getSessionByIdService({ therapist_id, session_id });
  } catch (error) {
    console.log('Error in completeSessionService::>>', error);
    return null;
  }
};

const getCalendarSessionsService = async (payload) => {
  try {
    console.log('Payload in getCalendarSessionsService::>>', payload);
    const { therapist_id, from, to } = payload;

    if (!from || !to) {
      return { status: false, code: 400, message: 'from and to dates are required', data: null };
    }

    const [rows] = await db.query(
      `SELECT ps.id, ps.starts_at, ps.duration_min, ps.modality, ps.status, ps.title,
              CONCAT(u.first_name, ' ', u.last_name) AS client_name,
              pc.avatar_color AS client_avatar_color,
              CONCAT(UPPER(LEFT(u.first_name,1)), UPPER(LEFT(u.last_name,1))) AS client_initials
       FROM prodesk_sessions ps
       JOIN prodesk_clients pc ON pc.id = ps.client_id
       JOIN users u ON u.user_id = pc.user_id
       WHERE ps.therapist_id = ? AND DATE(ps.starts_at) BETWEEN ? AND ?
       ORDER BY ps.starts_at ASC`,
      [therapist_id, from, to]
    );

    const dayMap = {};
    for (const s of (rows || [])) {
      const d = new Date(s.starts_at).toISOString().slice(0, 10);
      if (!dayMap[d]) dayMap[d] = [];
      dayMap[d].push(s);
    }
    const days = Object.entries(dayMap).map(([date, sessions]) => ({ date, sessions }));

    return { status: true, code: 200, message: 'Calendar sessions fetched', data: { range: { from, to }, days } };
  } catch (error) {
    console.log('Error in getCalendarSessionsService::>>', error);
    return null;
  }
};

const getTodaySessionsService = async (payload) => {
  try {
    console.log('Payload in getTodaySessionsService::>>', payload);
    const { therapist_id } = payload;

    const [rows] = await db.query(
      `SELECT ps.id, ps.starts_at, ps.duration_min, ps.modality, ps.status, ps.title,
              CONCAT(u.first_name, ' ', u.last_name) AS client_name,
              pc.avatar_color, pc.id AS client_id,
              CONCAT(UPPER(LEFT(u.first_name,1)), UPPER(LEFT(u.last_name,1))) AS client_initials
       FROM prodesk_sessions ps
       JOIN prodesk_clients pc ON pc.id = ps.client_id
       JOIN users u ON u.user_id = pc.user_id
       WHERE ps.therapist_id = ? AND DATE(ps.starts_at) = CURDATE()
       AND ps.status IN ('scheduled', 'completed')
       ORDER BY ps.starts_at ASC`,
      [therapist_id]
    );

    return { status: true, code: 200, message: "Today's sessions fetched", data: rows || [] };
  } catch (error) {
    console.log('Error in getTodaySessionsService::>>', error);
    return null;
  }
};

const getMeetingRoomService = async (payload) => {
  try {
    console.log('Payload in getMeetingRoomService::>>', payload);
    const { therapist_id, session_id } = payload;

    const [rows] = await db.query(
      'SELECT id, meet_url FROM prodesk_sessions WHERE id = ? AND therapist_id = ?',
      [session_id, therapist_id]
    );
    if (!rows || !rows.length) {
      return { status: false, code: 404, message: 'Session not found', data: null };
    }

    let url = rows[0].meet_url;
    // Create Google Meet link if missing
    if (!url) {
      try {
        url = await createMeetingSpace(therapist_id);
        await db.query('UPDATE prodesk_sessions SET meet_url = ? WHERE id = ?', [url, session_id]);
      } catch (e) {
        return { status: false, code: 503, message: e.message, data: null };
      }
    }

    return { status: true, code: 200, message: 'Meeting room ready', data: { url } };
  } catch (error) {
    console.log('Error in getMeetingRoomService::>>', error);
    return null;
  }
};

module.exports = {
  createSessionService,
  getSessionsService,
  getSessionByIdService,
  updateSessionService,
  rescheduleSessionService,
  cancelSessionService,
  completeSessionService,
  getCalendarSessionsService,
  getTodaySessionsService,
  getMeetingRoomService
};
