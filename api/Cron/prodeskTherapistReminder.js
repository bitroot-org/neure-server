const cron = require('node-cron');
const db = require('../config/db');
const NotificationService = require('../server/services/notificationsAndAnnouncements/notificationService');
const { formatISTWallClock } = require('../server/utils/dateHelper');

// Runs every minute — reminds therapists ~15 minutes before their next
// session via email + WhatsApp. `therapist_reminder_sent_at` dedupes so a
// session already reminded (or caught in an earlier/overlapping tick) is
// never reminded twice.
const sendTherapistSessionReminders = async () => {
  try {
    const [sessions] = await db.query(
      `SELECT ps.id, ps.starts_at, ps.modality, ps.meet_url,
              CONCAT(cu.first_name, ' ', cu.last_name) AS client_name,
              CONCAT(tu.first_name, ' ', tu.last_name) AS therapist_name,
              tu.email AS therapist_email, tu.phone AS therapist_phone,
              COALESCE(tb.brand_name, CONCAT(tu.first_name, ' ', tu.last_name)) AS clinic_name
       FROM prodesk_sessions ps
       JOIN prodesk_clients pc ON pc.id = ps.client_id
       JOIN users cu ON cu.user_id = pc.user_id
       JOIN therapists t ON t.id = ps.therapist_id
       JOIN users tu ON tu.user_id = t.user_id
       LEFT JOIN therapist_branding tb ON tb.therapist_id = t.id
       WHERE ps.status = 'scheduled'
         AND ps.therapist_reminder_sent_at IS NULL
         AND TIMESTAMPDIFF(MINUTE, DATE_ADD(UTC_TIMESTAMP(), INTERVAL 330 MINUTE), ps.starts_at) BETWEEN 14 AND 15`,
      []
    );

    if (!sessions.length) return;

    for (const s of sessions) {
      const sessionTime = formatISTWallClock(s.starts_at);

      if (s.therapist_email) {
        await NotificationService.sendTherapistSessionReminderEmail({
          toEmail: s.therapist_email,
          toName: s.therapist_name,
          clientName: s.client_name,
          sessionTime,
          meetUrl: s.meet_url || null,
          clinicName: s.clinic_name,
          meta: { session_id: s.id, type: 'therapist_reminder' }
        });
      }

      if (s.therapist_phone) {
        const digits = s.therapist_phone.replace(/\D/g, '');
        const phone_e164 = digits.startsWith('91') && digits.length === 12 ? digits : `91${digits}`;
        // NOTE: "therapist_session_reminder" must be registered and approved
        // as a WhatsApp template in MSG91 before this will actually deliver.
        await NotificationService.sendWhatsAppNotification({
          to: phone_e164,
          templateName: 'therapist_session_reminder',
          variables: [s.therapist_name, s.client_name, sessionTime, s.meet_url || 'N/A'],
          meta: { session_id: s.id, type: 'therapist_reminder' }
        });
      }

      await db.query(
        'UPDATE prodesk_sessions SET therapist_reminder_sent_at = NOW() WHERE id = ?',
        [s.id]
      );
    }

    console.log(`[Cron] prodeskTherapistReminder: reminded ${sessions.length} therapist(s)`);
  } catch (error) {
    console.error('[Cron] prodeskTherapistReminder error:', error.message);
  }
};

const initProdeskTherapistReminder = () => {
  cron.schedule('* * * * *', sendTherapistSessionReminders);
};

module.exports = initProdeskTherapistReminder;
