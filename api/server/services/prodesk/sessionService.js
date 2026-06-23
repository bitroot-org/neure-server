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
      `SELECT ps.id, ps.therapist_id, ps.client_id, ps.session_number, ps.title,
              DATE_ADD(DATE_ADD(ps.starts_at, INTERVAL 5 HOUR), INTERVAL 30 MINUTE) AS starts_at,
              ps.duration_min, ps.modality, ps.fee, ps.status, ps.meet_url, ps.location,
              ps.note_id,
              DATE_ADD(DATE_ADD(ps.created_at, INTERVAL 5 HOUR), INTERVAL 30 MINUTE) AS created_at,
              DATE_ADD(DATE_ADD(ps.updated_at, INTERVAL 5 HOUR), INTERVAL 30 MINUTE) AS updated_at,
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
    const { therapist_id, client_id, starts_at, duration_min = 60, modality, fee, title, location, meet_url: manualMeetUrl } = payload;

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

    // Check therapist availability — day must have at least one block, time must fall within a block
    const sessionDate = new Date(starts_at);
    const dayName = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][sessionDate.getDay()];
    const sessionHHMM = sessionDate.toTimeString().slice(0, 5);

    const [dayBlocks] = await db.query(
      'SELECT from_time, to_time FROM therapist_availability_blocks WHERE therapist_id = ? AND day = ?',
      [therapist_id, dayName]
    );

    if (dayBlocks && dayBlocks.length) {
      const inWindow = dayBlocks.some(b =>
        sessionHHMM >= b.from_time.slice(0, 5) && sessionHHMM < b.to_time.slice(0, 5)
      );
      if (!inWindow) {
        return {
          status: false, code: 422,
          message: `Session time is outside the therapist's availability blocks for ${dayName}`,
          data: null
        };
      }
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

    // For video sessions — use manually provided URL first, else auto-generate via Google Meet.
    let meetUrl = null;
    if (modality === 'video') {
      if (manualMeetUrl) {
        meetUrl = manualMeetUrl;
        await db.query('UPDATE prodesk_sessions SET meet_url = ? WHERE id = ?', [meetUrl, result.insertId]);
      } else {
        try {
          meetUrl = await createMeetingSpace(therapist_id);
          await db.query('UPDATE prodesk_sessions SET meet_url = ? WHERE id = ?', [meetUrl, result.insertId]);
        } catch (e) {
          console.log('Meet room create (deferred):', e.message);
        }
      }
    }

    // Send email + WhatsApp notifications after session is scheduled (both best-effort)
    try {
      const [clientRow] = await db.query(
        `SELECT u.phone, u.email,
                CONCAT(u.first_name, ' ', u.last_name) AS client_name,
                CONCAT(tu.first_name, ' ', tu.last_name) AS therapist_name,
                COALESCE(tb.brand_name, CONCAT(tu.first_name, ' ', tu.last_name)) AS clinic_name
         FROM prodesk_clients pc
         JOIN users u ON u.user_id = pc.user_id
         JOIN therapists t ON t.id = ?
         JOIN users tu ON tu.user_id = t.user_id
         LEFT JOIN therapist_branding tb ON tb.therapist_id = t.id
         WHERE pc.id = ?`,
        [therapist_id, client_id]
      );

      if (clientRow && clientRow.length) {
        const { phone, email, client_name, therapist_name, clinic_name } = clientRow[0];
        const formattedTime = new Date(starts_at).toLocaleString('en-IN', {
          timeZone: 'Asia/Kolkata',
          dateStyle: 'medium',
          timeStyle: 'short'
        });
        const notifMeta = { session_id: result.insertId, client_id };

        // Email (primary — always fires while WhatsApp template is pending)
        if (email) {
          await NotificationService.sendSessionScheduledEmail({
            toEmail: email,
            toName: client_name,
            therapistName: therapist_name,
            sessionTime: formattedTime,
            meetUrl: meetUrl || null,
            clinicName: clinic_name,
            meta: notifMeta,
            sessionStartISO: starts_at,
            durationMin: duration_min || 60
          });
        }

        // WhatsApp
        if (phone) {
          const digits = phone.replace(/\D/g, '');
          const phone_e164 = digits.startsWith('91') && digits.length === 12 ? digits : `91${digits}`;
          await NotificationService.sendWhatsAppNotification({
            to: phone_e164,
            templateName: 'session_scheduled',
            variables: [
              client_name,                     // {{1}} Hi *{{1}}*
              therapist_name,                  // {{2}} session with *{{2}}*
              formattedTime,                   // {{3}} Date & Time
              meetUrl || 'N/A'                 // {{4}} Session Link
            ],
            meta: notifMeta
          });
        }
      }
    } catch (e) {
      console.log('Notification (non-blocking):', e.message);
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
    const { therapist_id, client_id, status, from, to, search = '', sort = 'date', order = 'desc', page = 1, limit = 20 } = payload;

    const offset = (page - 1) * limit;
    const conditions = ['ps.therapist_id = ?'];
    const vals = [therapist_id];

    if (client_id) { conditions.push('ps.client_id = ?'); vals.push(client_id); }
    if (status)    { conditions.push('ps.status = ?'); vals.push(status); }
    if (from)      { conditions.push('ps.starts_at >= ?'); vals.push(from); }
    if (to)        { conditions.push('ps.starts_at <= ?'); vals.push(to); }
    if (search) {
      conditions.push(`(CONCAT(u.first_name,' ',u.last_name) LIKE ? OR ps.title LIKE ?)`);
      vals.push(`%${search}%`, `%${search}%`);
    }

    const where = conditions.join(' AND ');

    // Sort column
    const sortCol = sort === 'date' ? 'ps.starts_at'
                  : sort === 'client' ? 'client_name'
                  : sort === 'status' ? 'ps.status'
                  : 'ps.starts_at';
    const sortDir = order === 'asc' ? 'ASC' : 'DESC';

    const joins = `JOIN prodesk_clients pc ON pc.id = ps.client_id
                   JOIN users u ON u.user_id = pc.user_id`;

    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total FROM prodesk_sessions ps ${joins} WHERE ${where}`,
      vals
    );

    const [rows] = await db.query(
      `SELECT ps.id, ps.therapist_id, ps.client_id, ps.session_number, ps.title,
              DATE_ADD(DATE_ADD(ps.starts_at, INTERVAL 5 HOUR), INTERVAL 30 MINUTE) AS starts_at,
              ps.duration_min, ps.modality, ps.fee, ps.status, ps.meet_url, ps.location,
              ps.note_id,
              DATE_ADD(DATE_ADD(ps.created_at, INTERVAL 5 HOUR), INTERVAL 30 MINUTE) AS created_at,
              DATE_ADD(DATE_ADD(ps.updated_at, INTERVAL 5 HOUR), INTERVAL 30 MINUTE) AS updated_at,
              CONCAT(u.first_name,' ',u.last_name) AS client_name,
              pc.avatar_color AS client_avatar_color,
              CONCAT(UPPER(LEFT(u.first_name,1)),UPPER(LEFT(u.last_name,1))) AS client_initials
       FROM prodesk_sessions ps ${joins}
       WHERE ${where}
       ORDER BY ${sortCol} ${sortDir} LIMIT ? OFFSET ?`,
      [...vals, parseInt(limit), offset]
    );

    return {
      status: true, code: 200, message: 'Sessions fetched',
      data: rows || [],
      pagination: { total, current_page: parseInt(page), per_page: parseInt(limit), total_pages: Math.ceil(total / limit) }
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

    const [[session]] = await db.query(
      `SELECT ps.id, ps.status, ps.duration_min AS cur_dur, ps.client_id, ps.title,
              ps.modality, ps.meet_url,
              CONCAT(tu.first_name,' ',tu.last_name) AS therapist_name,
              tb.brand_name AS clinic_name
       FROM prodesk_sessions ps
       JOIN therapists t ON ps.therapist_id = t.id
       JOIN users tu ON t.user_id = tu.user_id
       LEFT JOIN therapist_branding tb ON t.id = tb.therapist_id
       WHERE ps.id = ? AND ps.therapist_id = ?`,
      [session_id, therapist_id]
    );
    if (!session) return { status: false, code: 404, message: 'Session not found', data: null };
    if (session.status === 'cancelled') {
      return { status: false, code: 409, message: 'Cannot reschedule a cancelled session', data: null };
    }
    if (new Date(starts_at) < new Date()) {
      return { status: false, code: 422, message: 'New time cannot be in the past', data: null };
    }

    const dur = duration_min || session.cur_dur;
    const overlap = await checkOverlap(therapist_id, starts_at, dur, session_id);
    if (overlap) return { status: false, code: 409, message: 'Slot unavailable', data: null };

    // For video sessions — keep existing meet_url, create new one if missing
    let meetUrl = session.meet_url || null;
    if (session.modality === 'video' && !meetUrl) {
      try {
        meetUrl = await createMeetingSpace(therapist_id);
        await db.query('UPDATE prodesk_sessions SET meet_url = ? WHERE id = ?', [meetUrl, session_id]);
      } catch (e) {
        console.log('Meet room create on reschedule (deferred):', e.message);
      }
    }

    await db.query(
      'UPDATE prodesk_sessions SET starts_at = ?, duration_min = ? WHERE id = ?',
      [starts_at, dur, session_id]
    );

    // Send email + in-app notification to client
    try {
      const [[clientRow]] = await db.query(
        `SELECT u.email, u.first_name, u.user_id, u.phone
         FROM prodesk_clients pc JOIN users u ON pc.user_id = u.user_id
         WHERE pc.id = ?`, [session.client_id]
      );
      if (clientRow) {
        const sessionTime = new Date(starts_at).toLocaleString('en-IN', {
          timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short'
        });
        if (clientRow.email) {
          await NotificationService.sendEmail({
            toEmail: clientRow.email,
            toName: clientRow.first_name,
            template: 'prodesk_session_rescheduled',
            data: {
              client_name: clientRow.first_name,
              therapist_name: session.therapist_name,
              session_time: sessionTime,
              meet_url: meetUrl || null,
              clinic_name: session.clinic_name || 'Neure ProDesk'
            }
          });
        }
        await NotificationService.createNotification({
          title: 'Session Rescheduled',
          content: `Your session with ${session.therapist_name} has been rescheduled to ${sessionTime}.`,
          type: 'SESSION_RESCHEDULED',
          user_id: clientRow.user_id
        });
      }
    } catch (_) {}

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

    const [[session]] = await db.query(
      `SELECT ps.id, ps.client_id,
              DATE_ADD(DATE_ADD(ps.starts_at, INTERVAL 5 HOUR), INTERVAL 30 MINUTE) AS starts_at,
              ps.title,
              CONCAT(tu.first_name,' ',tu.last_name) AS therapist_name,
              tb.brand_name AS clinic_name
       FROM prodesk_sessions ps
       JOIN therapists t ON ps.therapist_id = t.id
       JOIN users tu ON t.user_id = tu.user_id
       LEFT JOIN therapist_branding tb ON t.id = tb.therapist_id
       WHERE ps.id = ? AND ps.therapist_id = ?`,
      [session_id, therapist_id]
    );
    if (!session) return { status: false, code: 404, message: 'Session not found', data: null };

    await db.query("UPDATE prodesk_sessions SET status = 'cancelled' WHERE id = ?", [session_id]);

    // Send email + in-app notification to client
    try {
      const [[clientRow]] = await db.query(
        `SELECT u.email, u.first_name, u.user_id
         FROM prodesk_clients pc JOIN users u ON pc.user_id = u.user_id
         WHERE pc.id = ?`, [session.client_id]
      );
      if (clientRow) {
        const sessionTime = new Date(session.starts_at).toLocaleString('en-IN', {
          timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short'
        });
        await NotificationService.sendEmail({
          toEmail: clientRow.email,
          toName: clientRow.first_name,
          template: 'prodesk_session_cancelled',
          data: {
            client_name: clientRow.first_name,
            therapist_name: session.therapist_name,
            session_time: sessionTime,
            reason: reason || 'Your session has been cancelled.',
            clinic_name: session.clinic_name || 'ProDesk'
          }
        });
        await NotificationService.createNotification({
          title: 'Session Cancelled',
          content: reason || `Your session with ${session.therapist_name} has been cancelled.`,
          type: 'SESSION_CANCELLED',
          user_id: clientRow.user_id
        });
      }
    } catch (_) {}

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
      `SELECT ps.id,
              DATE_ADD(DATE_ADD(ps.starts_at, INTERVAL 5 HOUR), INTERVAL 30 MINUTE) AS starts_at,
              ps.duration_min, ps.modality, ps.status, ps.title,
              ps.meet_url, ps.session_number,
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
      `SELECT ps.id,
              DATE_ADD(DATE_ADD(ps.starts_at, INTERVAL 5 HOUR), INTERVAL 30 MINUTE) AS starts_at,
              ps.duration_min, ps.modality, ps.status, ps.title,
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

const sendSessionReminderService = async (payload) => {
  try {
    const { therapist_id, session_id } = payload;

    const [rows] = await db.query(
      `SELECT ps.id,
              DATE_ADD(DATE_ADD(ps.starts_at, INTERVAL 5 HOUR), INTERVAL 30 MINUTE) AS starts_at,
              ps.modality, ps.meet_url, ps.status,
              u.email, CONCAT(u.first_name, ' ', u.last_name) AS client_name,
              CONCAT(tu.first_name, ' ', tu.last_name) AS therapist_name,
              COALESCE(tb.brand_name, CONCAT(tu.first_name, ' ', tu.last_name)) AS clinic_name,
              u.phone
       FROM prodesk_sessions ps
       JOIN prodesk_clients pc ON pc.id = ps.client_id
       JOIN users u ON u.user_id = pc.user_id
       JOIN therapists t ON t.id = ps.therapist_id
       JOIN users tu ON tu.user_id = t.user_id
       LEFT JOIN therapist_branding tb ON tb.therapist_id = t.id
       WHERE ps.id = ? AND ps.therapist_id = ?`,
      [session_id, therapist_id]
    );

    if (!rows || !rows.length) {
      return { status: false, code: 404, message: 'Session not found', data: null };
    }

    const s = rows[0];

    if (s.status === 'cancelled') {
      return { status: false, code: 409, message: 'Cannot send reminder for a cancelled session', data: null };
    }

    const formattedTime = new Date(s.starts_at).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short'
    });

    const sent = { email: false, whatsapp: false };

    if (s.email) {
      sent.email = await NotificationService.sendSessionReminderEmail({
        toEmail: s.email,
        toName: s.client_name,
        therapistName: s.therapist_name,
        sessionTime: formattedTime,
        meetUrl: s.meet_url || null,
        clinicName: s.clinic_name,
        meta: { session_id, type: 'reminder' }
      });
    }

    if (s.phone) {
      const digits = s.phone.replace(/\D/g, '');
      const phone_e164 = digits.startsWith('91') && digits.length === 12 ? digits : `91${digits}`;
      sent.whatsapp = await NotificationService.sendWhatsAppNotification({
        to: phone_e164,
        templateName: 'session_reminder',
        variables: [s.client_name, s.therapist_name, formattedTime, s.meet_url || 'N/A'],
        meta: { session_id, type: 'reminder' }
      });
    }

    return { status: true, code: 200, message: 'Reminder sent', data: sent };
  } catch (error) {
    console.log('Error in sendSessionReminderService::>>', error);
    return null;
  }
};

const getSlotsService = async ({ therapist_id, date, session_duration }) => {
  try {
    if (!therapist_id || !date || !session_duration) {
      return { status: false, code: 400, message: 'therapist_id, date and session_duration are required', data: null };
    }

    const duration = parseInt(session_duration);
    if (![30, 45, 60, 90, 120].includes(duration)) {
      return { status: false, code: 400, message: 'session_duration must be 30, 45, 60, 90 or 120 minutes', data: null };
    }

    const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dateObj = new Date(date + 'T00:00:00');
    const dayName = DAY_NAMES[dateObj.getDay()];

    // Get blocks for this day
    const [[settings]] = await db.query(
      'SELECT buffer_minutes FROM therapist_availability WHERE therapist_id = ?',
      [therapist_id]
    );
    const buffer = settings?.buffer_minutes || 0;

    const [dayBlocks] = await db.query(
      'SELECT from_time, to_time FROM therapist_availability_blocks WHERE therapist_id = ? AND day = ? ORDER BY from_time',
      [therapist_id, dayName]
    );

    if (!dayBlocks || dayBlocks.length === 0) {
      return {
        status: true, code: 200, message: 'No availability on this day',
        data: { date, day: dayName, is_working_day: false, available_slots: [], available_count: 0 }
      };
    }

    // Generate all possible slots across all blocks for the day
    const step = duration + buffer;
    const allSlots = [];
    for (const block of dayBlocks) {
      const [fromH, fromM] = block.from_time.slice(0, 5).split(':').map(Number);
      const [toH, toM]     = block.to_time.slice(0, 5).split(':').map(Number);
      const fromMins = fromH * 60 + fromM;
      const toMins   = toH * 60 + toM;
      for (let mins = fromMins; mins + duration <= toMins; mins += step) {
        const h = Math.floor(mins / 60).toString().padStart(2, '0');
        const m = (mins % 60).toString().padStart(2, '0');
        allSlots.push({ time: `${h}:${m}`, mins });
      }
    }
    allSlots.sort((a, b) => a.mins - b.mins);

    // Get booked sessions for this therapist on this date
    const [booked] = await db.query(
      `SELECT starts_at, duration_min FROM prodesk_sessions
       WHERE therapist_id = ? AND DATE(starts_at) = ? AND status NOT IN ('cancelled')`,
      [therapist_id, date]
    );

    const now = new Date();
    const isToday = date === now.toISOString().slice(0, 10);
    const nowMins = now.getHours() * 60 + now.getMinutes();

    const bookedSlotTimes = booked.map(sess => {
      const d = new Date(sess.starts_at);
      return { start_mins: d.getHours() * 60 + d.getMinutes(), duration_min: sess.duration_min };
    });

    const availableSlots = [];
    for (const slot of allSlots) {
      if (isToday && slot.mins <= nowMins + 30) continue;
      let blocked = false;
      for (const b of bookedSlotTimes) {
        if (slot.mins < b.start_mins + b.duration_min + buffer && slot.mins + duration > b.start_mins) {
          blocked = true; break;
        }
      }
      if (!blocked) availableSlots.push({
        time: slot.time,
        datetime: `${date}T${slot.time}:00`,
        label: formatSlotLabel(slot.time)
      });
    }

    return {
      status: true, code: 200, message: 'Slots fetched',
      data: {
        date, day: dayName, is_working_day: true, session_duration,
        blocks: dayBlocks.map(b => ({ from: b.from_time.slice(0,5), to: b.to_time.slice(0,5) })),
        buffer_minutes: buffer,
        available_slots: availableSlots,
        booked_slots: bookedSlotTimes.map(b => {
          const h = Math.floor(b.start_mins/60).toString().padStart(2,'0');
          const m = (b.start_mins%60).toString().padStart(2,'0');
          return `${h}:${m}`;
        }),
        available_count: availableSlots.length
      }
    };
  } catch (error) {
    console.log('Error in getSlotsService::>>', error);
    return null;
  }
};

const formatSlotLabel = (time) => {
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour   = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, '0')} ${period}`;
};

const deleteSessionService = async ({ therapist_id, session_id }) => {
  try {
    if (!session_id) return { status: false, code: 400, message: 'session_id is required', data: null };

    const [[session]] = await db.query(
      `SELECT id, status, starts_at FROM prodesk_sessions WHERE id = ? AND therapist_id = ?`,
      [session_id, therapist_id]
    );
    if (!session) return { status: false, code: 404, message: 'Session not found', data: null };

    if (session.status === 'completed') {
      return { status: false, code: 409, message: 'Cannot delete a completed session', data: null };
    }

    await db.query(`DELETE FROM prodesk_sessions WHERE id = ?`, [session_id]);
    return { status: true, code: 200, message: 'Session deleted', data: null };
  } catch (error) {
    console.log('Error in deleteSessionService::>>', error);
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
  getMeetingRoomService,
  sendSessionReminderService,
  getSlotsService,
  deleteSessionService
};
