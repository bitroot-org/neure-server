const db = require('../../../config/db');
const NotificationService = require('../notificationsAndAnnouncements/notificationService');
const { formatISTWallClock } = require('../../utils/dateHelper');

// Reminder options a therapist can choose from (minutes before the session)
const REMINDER_OPTIONS = [1440, 720, 60, 15];
const DEFAULT_REMINDER_MINUTES = 1440;

const FORMAT_LABEL = { video: 'Video', in_person: 'In person', phone: 'Phone' };

// Sends ONE reminder (email + WhatsApp) to the client of a session.
// `s` needs: id, starts_at, modality, meet_url, client_name, email, phone, therapist_name, clinic_name.
// Each channel is independent — one failing never stops the other. Never throws.
const sendClientReminder = async (s, channels = { email: true, whatsapp: true }) => {
  const sent = { email: false, whatsapp: false };
  const formattedTime = formatISTWallClock(s.starts_at);
  const meta = { session_id: s.id, type: 'reminder' };

  try {
    if (channels.email && s.email) {
      sent.email = await NotificationService.sendSessionReminderEmail({
        toEmail: s.email,
        toName: s.client_name,
        therapistName: s.therapist_name,
        sessionTime: formattedTime,
        meetUrl: s.meet_url || null,
        clinicName: s.clinic_name,
        modality: s.modality,
        meta
      });
    }
  } catch (e) {
    console.log('Client reminder email failed (non-fatal):', e.message);
  }

  try {
    if (channels.whatsapp && s.phone) {
      const digits = String(s.phone).replace(/\D/g, '');
      const phone_e164 = digits.startsWith('91') && digits.length === 12 ? digits : `91${digits}`;
      // MSG91 template "session_reminder_client":
      // {{1}} client name, {{2}} therapist, {{3}} date & time, {{4}} session format, {{5}} session link
      sent.whatsapp = await NotificationService.sendWhatsAppNotification({
        to: phone_e164,
        templateName: 'session_reminder_client',
        variables: [
          s.client_name,
          s.therapist_name,
          formattedTime,
          FORMAT_LABEL[s.modality] || s.modality || 'Session',
          s.modality === 'video' ? (s.meet_url || 'Will be shared shortly') : 'Not applicable (in person)'
        ],
        meta
      });
    }
  } catch (e) {
    console.log('Client reminder WhatsApp failed (non-fatal):', e.message);
  }

  return sent;
};

// "1440,60" -> [1440, 60] (only valid options, no duplicates, at most 2, biggest first)
const parseOffsets = (raw) => {
  const list = String(raw || '').split(',').map((x) => parseInt(x)).filter((n) => REMINDER_OPTIONS.includes(n));
  return [...new Set(list)].slice(0, 2).sort((a, b) => b - a);
};

const getReminderSettingService = async ({ therapist_id }) => {
  try {
    const [[row]] = await db.query('SELECT client_reminder_offsets, client_reminder_email, client_reminder_whatsapp FROM therapists WHERE id = ?', [therapist_id]);
    const offsets = parseOffsets(row?.client_reminder_offsets);
    return { status: true, code: 200, message: 'Reminder setting fetched', data: {
      offsets: offsets.length ? offsets : [DEFAULT_REMINDER_MINUTES],
      email: row ? !!row.client_reminder_email : true,
      whatsapp: row ? !!row.client_reminder_whatsapp : true,
      options: REMINDER_OPTIONS
    } };
  } catch (error) {
    console.log('Error in getReminderSettingService::>>', error);
    return null;
  }
};

const updateReminderSettingService = async ({ therapist_id, offsets, email = true, whatsapp = true }) => {
  try {
    const list = Array.isArray(offsets) ? offsets.map((x) => parseInt(x)) : [];
    const unique = [...new Set(list)];
    if (!unique.length || unique.some((n) => !REMINDER_OPTIONS.includes(n))) {
      return { status: false, code: 400, message: 'Choose when to remind: 24 hours, 12 hours, 1 hour or 15 minutes', data: null };
    }
    if (unique.length > 2) {
      return { status: false, code: 400, message: 'You can choose up to 2 reminder times', data: null };
    }
    if (!email && !whatsapp) {
      return { status: false, code: 400, message: 'Choose at least one: Email or WhatsApp', data: null };
    }
    const saved = unique.sort((a, b) => b - a);
    await db.query(
      'UPDATE therapists SET client_reminder_offsets = ?, client_reminder_email = ?, client_reminder_whatsapp = ? WHERE id = ?',
      [saved.join(','), email ? 1 : 0, whatsapp ? 1 : 0, therapist_id]
    );
    return { status: true, code: 200, message: 'Reminder setting saved', data: { offsets: saved, email: !!email, whatsapp: !!whatsapp, options: REMINDER_OPTIONS } };
  } catch (error) {
    console.log('Error in updateReminderSettingService::>>', error);
    return null;
  }
};

module.exports = { parseOffsets, sendClientReminder, getReminderSettingService, updateReminderSettingService, REMINDER_OPTIONS, DEFAULT_REMINDER_MINUTES };
