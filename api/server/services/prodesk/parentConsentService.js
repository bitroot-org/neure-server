const crypto = require('crypto');
const db = require('../../../config/db');
const NotificationService = require('../notificationsAndAnnouncements/notificationService');

// ─── Parent / guardian consent for clients under 18 (DPDP) ───────────────────
// 1. The therapist enters the parent's name and mobile number  -> sendParentOtpService
// 2. The parent tells the therapist the OTP they received       -> verifyParentOtpService
// 3. Adding the client needs that verified consent              -> useParentConsent (called by createClientService)

const ADULT_AGE = 18;
const OTP_MINUTES = 10;
const MAX_ATTEMPTS = 5;
const RESEND_SECONDS = 60;
const MAX_PER_HOUR = 5;
const MAX_PER_PHONE_PER_DAY = 3;            // stops the public booking form being used to spam one number
const CONSENT_VALID_MINUTES = 60;           // a verified consent must be used within an hour
const WHATSAPP_TEMPLATE = 'parent_consent_otp';

const hashOtp = (otp) => crypto.createHash('sha256').update(`${otp}:${process.env.JWT_SECRET || ''}`).digest('hex');
const isMinor = (age) => age !== undefined && age !== null && age !== '' && Number(age) < ADULT_AGE;
const cleanPhone10 = (p) => String(p || '').replace(/\D/g, '').slice(-10);
const isTherapistsOwnNumber = async (therapist_id, phone) => {
  const [[t]] = await db.query('SELECT u.phone FROM therapists t JOIN users u ON u.user_id = t.user_id WHERE t.id = ?', [therapist_id]);
  return !!(t && cleanPhone10(t.phone) && cleanPhone10(t.phone) === phone);
};

const sendParentOtpService = async ({ therapist_id, parent_name, parent_phone, parent_email = null, ip_address = null }) => {
  try {
    const name = String(parent_name || '').trim();
    const phone = cleanPhone10(parent_phone);
    if (name.length < 2) return { status: false, code: 400, message: "Please enter the parent's name.", data: null };
    if (phone.length !== 10) return { status: false, code: 400, message: "Please enter the parent's 10-digit mobile number.", data: null };
    // The therapist cannot give their own number as the parent's (they would be consenting to themselves)
    if (await isTherapistsOwnNumber(therapist_id, phone)) {
      return { status: false, code: 400, message: "The parent's mobile number cannot be your own number.", data: null };
    }
    const email = String(parent_email || '').trim().toLowerCase() || null;
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { status: false, code: 400, message: "That parent email doesn't look right.", data: null };

    const [[recent]] = await db.query(
      `SELECT COUNT(*) AS n,
              SUM(parent_phone = ? AND created_at > DATE_SUB(UTC_TIMESTAMP(), INTERVAL ? SECOND)) AS same_recent
       FROM prodesk_parent_consents
       WHERE therapist_id = ? AND created_at > DATE_SUB(UTC_TIMESTAMP(), INTERVAL 1 HOUR)`,
      [phone, RESEND_SECONDS, therapist_id]
    );
    if (recent && Number(recent.same_recent) > 0) {
      return { status: false, code: 429, message: `Please wait ${RESEND_SECONDS} seconds before sending another OTP.`, data: null };
    }
    if (recent && Number(recent.n) >= MAX_PER_HOUR) {
      return { status: false, code: 429, message: 'Too many OTP requests. Please try again in an hour.', data: null };
    }

    const [[day]] = await db.query(
      'SELECT COUNT(*) AS n FROM prodesk_parent_consents WHERE parent_phone = ? AND created_at > DATE_SUB(UTC_TIMESTAMP(), INTERVAL 1 DAY)',
      [phone]
    );
    if (day && Number(day.n) >= MAX_PER_PHONE_PER_DAY) {
      return { status: false, code: 429, message: 'Too many OTPs have been sent to this number today. Please try again tomorrow.', data: null };
    }

    const otp = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
    const [r] = await db.query(
      `INSERT INTO prodesk_parent_consents (therapist_id, parent_name, parent_phone, parent_email, otp_hash, otp_expires_at, ip_address)
       VALUES (?, ?, ?, ?, ?, DATE_ADD(UTC_TIMESTAMP(), INTERVAL ? MINUTE), ?)`,
      [therapist_id, name, phone, email, hashOtp(otp), OTP_MINUTES, ip_address]
    );

    // Fire-and-forget: a slow or failing WhatsApp provider never blocks the therapist
    (async () => {
      const [[t]] = await db.query(
        `SELECT CONCAT(u.first_name, ' ', u.last_name) AS name FROM therapists t JOIN users u ON u.user_id = t.user_id WHERE t.id = ?`,
        [therapist_id]
      );
      await NotificationService.sendWhatsAppNotification({
        to: `91${phone}`,
        templateName: WHATSAPP_TEMPLATE,
        variables: [name, t ? t.name : 'your therapist', otp],
        meta: { parent_consent_id: r.insertId }
      });
    })().catch((e) => console.log('Parent OTP WhatsApp failed (non-fatal)::>>', e.message));

    return { status: true, code: 200, message: `OTP sent to the parent's mobile number.`, data: { consent_id: r.insertId, expires_in_minutes: OTP_MINUTES } };
  } catch (error) {
    console.log('Error in sendParentOtpService::>>', error);
    return null;
  }
};

const verifyParentOtpService = async ({ therapist_id, consent_id, otp }) => {
  try {
    const [[row]] = await db.query(
      `SELECT id, otp_hash, attempts, verified_at, (otp_expires_at < UTC_TIMESTAMP()) AS expired
       FROM prodesk_parent_consents WHERE id = ? AND therapist_id = ?`,
      [consent_id, therapist_id]
    );
    if (!row) return { status: false, code: 404, message: 'Please send the OTP again.', data: null };
    if (row.verified_at) return { status: true, code: 200, message: 'Already verified.', data: { consent_id: row.id } };
    if (row.expired) return { status: false, code: 410, message: 'This OTP has expired. Please send a new one.', data: null };
    if (row.attempts >= MAX_ATTEMPTS) return { status: false, code: 429, message: 'Too many wrong attempts. Please send a new OTP.', data: null };

    await db.query('UPDATE prodesk_parent_consents SET attempts = attempts + 1 WHERE id = ?', [row.id]);
    if (hashOtp(String(otp || '').trim()) !== row.otp_hash) {
      return { status: false, code: 400, message: 'That OTP is not correct.', data: null };
    }
    await db.query('UPDATE prodesk_parent_consents SET verified_at = UTC_TIMESTAMP() WHERE id = ?', [row.id]);
    return { status: true, code: 200, message: "Parent's consent verified.", data: { consent_id: row.id } };
  } catch (error) {
    console.log('Error in verifyParentOtpService::>>', error);
    return null;
  }
};

// Called before a client under 18 is created: is there a verified, unused, recent consent?
const checkParentConsent = async ({ therapist_id, consent_id, client_phone = null }) => {
  const refuse = (message) => ({ ok: false, response: { status: false, code: 403, message, data: { parent_consent_required: true } } });
  if (!consent_id) return refuse("This client is under 18. Please verify the parent's mobile number with an OTP first.");
  const [[row]] = await db.query(
    `SELECT id, client_id, parent_phone, (verified_at IS NULL) AS unverified,
            (verified_at < DATE_SUB(UTC_TIMESTAMP(), INTERVAL ? MINUTE)) AS stale
     FROM prodesk_parent_consents WHERE id = ? AND therapist_id = ?`,
    [CONSENT_VALID_MINUTES, consent_id, therapist_id]
  );
  if (!row || row.unverified) return refuse("Please verify the parent's OTP before adding this client.");
  if (row.client_id) return refuse("This parent's consent was already used for another client. Please verify again.");
  if (row.stale) return refuse("The parent's consent has expired. Please verify the OTP again.");
  if (cleanPhone10(client_phone) && cleanPhone10(client_phone) === cleanPhone10(row.parent_phone)) {
    return refuse("The parent's mobile number must be different from the client's own number.");
  }
  return { ok: true };
};

const attachParentConsent = async (consent_id, client_id) => {
  await db.query('UPDATE prodesk_parent_consents SET client_id = ? WHERE id = ?', [client_id, consent_id]);
};

// Does this client already have a verified parent consent on file?
const hasParentConsent = async (client_id) => {
  const [[r]] = await db.query('SELECT COUNT(*) AS n FROM prodesk_parent_consents WHERE client_id = ? AND verified_at IS NOT NULL', [client_id]);
  return !!(r && r.n);
};

module.exports = { hasParentConsent, isMinor, sendParentOtpService, verifyParentOtpService, checkParentConsent, attachParentConsent };
