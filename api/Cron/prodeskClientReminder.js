const cron = require('node-cron');
const db = require('../config/db');
const { sendClientReminder, parseOffsets } = require('../server/services/prodesk/clientReminderService');
const { applyParentContact } = require('../server/services/prodesk/clientContact');

// Runs every minute — sends each client the automatic reminder(s) before their session,
// at the time(s) the therapist chose (Settings → Client reminders: up to 2 of 24h / 12h / 1h / 15 min),
// by the channel(s) they chose (email / WhatsApp).
//
//  • A chosen time is matched inside a 10-minute window, so a short outage never skips it.
//  • If a session was booked too late for ALL the chosen times (e.g. chose 24h but booked
//    10 hours ahead) the client still gets one reminder, 15 minutes before.
//  • `prodesk_session_reminders` (unique per session + time) guarantees a reminder is never
//    sent twice. Rescheduling a session clears its rows.
//  • Reminders are best-effort: a failure is logged, never retried in a loop.
const WINDOW_MIN = 10;

const sendClientSessionReminders = async () => {
  try {
    const [sessions] = await db.query(
      `SELECT ps.id, ps.client_id, ps.starts_at, ps.modality, ps.meet_url,
              TIMESTAMPDIFF(MINUTE, DATE_ADD(UTC_TIMESTAMP(), INTERVAL 330 MINUTE), ps.starts_at) AS minutes_left,
              u.email, u.phone, CONCAT(u.first_name, ' ', u.last_name) AS client_name,
              t.client_reminder_offsets, t.client_reminder_email, t.client_reminder_whatsapp,
              CONCAT(tu.first_name, ' ', tu.last_name) AS therapist_name,
              COALESCE(tb.brand_name, CONCAT(tu.first_name, ' ', tu.last_name)) AS clinic_name
       FROM prodesk_sessions ps
       JOIN prodesk_clients pc ON pc.id = ps.client_id
       JOIN users u ON u.user_id = pc.user_id
       JOIN therapists t ON t.id = ps.therapist_id
       JOIN users tu ON tu.user_id = t.user_id
       LEFT JOIN therapist_branding tb ON tb.therapist_id = t.id
       WHERE ps.status = 'scheduled'
         AND (t.client_reminder_email = 1 OR t.client_reminder_whatsapp = 1)
         AND TIMESTAMPDIFF(MINUTE, DATE_ADD(UTC_TIMESTAMP(), INTERVAL 330 MINUTE), ps.starts_at) BETWEEN 1 AND 1440
       LIMIT 500`,
      []
    );
    if (!sessions.length) return;

    // Reminders already sent for these sessions
    const [sentRows] = await db.query(
      'SELECT session_id, offset_min FROM prodesk_session_reminders WHERE session_id IN (?)',
      [sessions.map((s) => s.id)]
    );
    const sentBySession = new Map();
    for (const r of sentRows) {
      if (!sentBySession.has(r.session_id)) sentBySession.set(r.session_id, new Set());
      sentBySession.get(r.session_id).add(r.offset_min);
    }

    let count = 0;
    for (const s of sessions) {
      await applyParentContact(s.client_id, s); // under 18: the parent is contacted
      const left = Number(s.minutes_left);
      const sent = sentBySession.get(s.id) || new Set();
      const offsets = parseOffsets(s.client_reminder_offsets);

      // Chosen times we are inside the window of right now
      let due = offsets.filter((o) => left <= o && left > Math.max(0, o - WINDOW_MIN));
      // Booked too late for every chosen time: one fallback reminder at 15 minutes
      if (!due.length && !sent.size && left <= 15) due = [15];

      for (const offset of due) {
        if (sent.has(offset)) continue;
        // Claim first, so a slow/failed send can never repeat on the next tick
        const [claim] = await db.query(
          'INSERT IGNORE INTO prodesk_session_reminders (session_id, offset_min) VALUES (?, ?)',
          [s.id, offset]
        );
        if (!claim.affectedRows) continue;
        sent.add(offset);
        count += 1;
        sendClientReminder(s, { email: !!s.client_reminder_email, whatsapp: !!s.client_reminder_whatsapp })
          .catch((e) => console.log('[Cron] client reminder failed:', e.message));
      }
    }

    if (count) console.log(`[Cron] prodeskClientReminder: sent ${count} reminder(s)`);
  } catch (error) {
    console.error('[Cron] prodeskClientReminder error:', error.message);
  }
};

const initProdeskClientReminder = () => {
  cron.schedule('* * * * *', sendClientSessionReminders);
};

module.exports = initProdeskClientReminder;
module.exports.run = sendClientSessionReminders; // exposed for tests
