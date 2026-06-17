const db = require("../../../config/db");
const axios = require("axios");

const MSG91_AUTH_KEY = "520733ARLmjeFtYE6a227444P1";
const MSG91_INTEGRATED_NUMBER = "919004364096";
const MSG91_WHATSAPP_URL = "https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/";

const BREVO_SENDER_EMAIL = "prodesk@neure.co.in";
const BREVO_SENDER_NAME  = "Neure Sessions"; // used for session emails only — see per-function overrides below

let _brevoApiKey = null;
const getBrevoApiKey = async () => {
  if (_brevoApiKey) return _brevoApiKey;
  const [rows] = await db.query(
    "SELECT secret FROM client_integration WHERE type = 'email' AND is_active = 1 LIMIT 1"
  );
  if (!rows || !rows.length) throw new Error('Brevo API key not configured in client_integration table');
  _brevoApiKey = rows[0].secret;
  return _brevoApiKey;
};

class NotificationService {
  /**
   * Send a WhatsApp template message via MSG91.
   *
   * @param {string}   to           - Recipient phone with country code, e.g. "919876543210"
   * @param {string}   templateName - MSG91 approved template name
   * @param {string[]} variables    - Values for body_1, body_2, body_3 ... in order
   * @param {object}   [meta]       - Optional extra data for notification_log
   */
  static async sendWhatsAppNotification({ to, templateName, variables = [], meta = null }) {
    // Build body_1, body_2 ... components from the variables array
    const components = {};
    variables.forEach((val, i) => {
      components[`body_${i + 1}`] = { type: "text", value: String(val) };
    });

    const payload = {
      integrated_number: MSG91_INTEGRATED_NUMBER,
      content_type: "template",
      payload: {
        messaging_product: "whatsapp",
        type: "template",
        template: {
          name: templateName,
          language: {
            code: "en",
            policy: "deterministic"
          },
          namespace: "a29a37a6_0359_4978_8b42_ab8d3b9f256e",
          to_and_components: [
            {
              to: [to],
              components
            }
          ]
        }
      }
    };

    let status = "SUCCESS";
    let statusCode = 200;
    let errorMsg = null;

    try {
      const response = await axios.post(MSG91_WHATSAPP_URL, payload, {
        headers: {
          authkey: MSG91_AUTH_KEY,
          "Content-Type": "application/json"
        }
      });
      statusCode = response.status;
      console.log("WhatsApp sent to", to, "| template:", templateName, "| status:", statusCode);
    } catch (err) {
      status = "FAILED";
      statusCode = err.response?.status || 500;
      errorMsg = err.message;
      console.error("sendWhatsAppNotification error:", err.message);
    }

    await NotificationService.logNotification({
      platform: "WHATSAPP",
      status_code: statusCode,
      status,
      type: "WHATSAPP",
      message: templateName,
      error: errorMsg,
      message_body: JSON.stringify(payload),
      template_name: templateName,
      meta
    });

    return status === "SUCCESS";
  }

  // ─── ICS CALENDAR FILE GENERATOR ─────────────────────────────────────────
  // Generates a .ics file content string for a session.
  // Gmail shows "Add to Calendar", iPhone Mail shows "Add to Calendar" banner.
  static generateICS({ summary, description, startISO, durationMin, location = '' }) {
    const pad  = (n) => String(n).padStart(2, '0');
    const toICSDate = (iso) => {
      const d = new Date(iso);
      return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
             `T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
    };
    const start = toICSDate(startISO);
    const endDate = new Date(new Date(startISO).getTime() + durationMin * 60000);
    const end = toICSDate(endDate.toISOString());
    const uid = `session-${Date.now()}@neure.co.in`;
    const now = toICSDate(new Date().toISOString());

    return [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Neure Prodesk//Session//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:REQUEST',
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${now}`,
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `SUMMARY:${summary}`,
      `DESCRIPTION:${description.replace(/\n/g, '\\n')}`,
      location ? `LOCATION:${location}` : '',
      'STATUS:CONFIRMED',
      'SEQUENCE:0',
      'END:VEVENT',
      'END:VCALENDAR'
    ].filter(Boolean).join('\r\n');
  }

  /**
   * Send session scheduled email via Brevo transactional API.
   *
   * @param {string} toEmail         - Recipient email
   * @param {string} toName          - Recipient full name (client)
   * @param {string} therapistName   - Therapist full name
   * @param {string} sessionTime     - Formatted date & time string (IST)
   * @param {string} meetUrl         - Google Meet URL or null for in-person
   * @param {string} clinicName      - Therapist brand/clinic name
   * @param {object} [meta]          - Optional extra data for notification_log
   * @param {string} [sessionStartISO] - ISO datetime of session start (for ICS)
   * @param {number} [durationMin]   - Session duration in minutes (for ICS)
   */
  static async sendSessionScheduledEmail({ toEmail, toName, therapistName, sessionTime, meetUrl = null, clinicName = "Neure Prodesk", meta = null, sessionStartISO = null, durationMin = 60 }) {
    const meetRowHtml = meetUrl ? `
      <tr>
        <td style="padding:14px 20px;border-top:1px solid #E5EAF0;">
          <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#9CA3AF;">Session Link</p>
          <a href="${meetUrl}" style="font-size:15px;font-weight:600;color:#5EA89A;text-decoration:none;word-break:break-all;">Join Session &rarr;</a>
        </td>
      </tr>` : '';

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <style>
    @media only screen and (max-width: 600px) {
      .email-wrapper { padding: 16px 8px !important; }
      .email-card { border-radius: 10px !important; }
      .card-header { padding: 20px 20px !important; border-radius: 10px 10px 0 0 !important; }
      .card-body { padding: 24px 20px 20px !important; }
      .heading { font-size: 20px !important; }
      .clinic-name { font-size: 12px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#F0F4F8;font-family:Arial,Helvetica,sans-serif;-webkit-text-size-adjust:100%;">
  <table width="100%" cellpadding="0" cellspacing="0" class="email-wrapper" style="background:#F0F4F8;padding:32px 16px;">
    <tr><td align="center">

      <!-- Outer card -->
      <table cellpadding="0" cellspacing="0" class="email-card" style="width:100%;max-width:540px;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">

        <!-- Dark header -->
        <tr>
          <td class="card-header" style="background:#1A2332;padding:22px 28px;border-radius:12px 12px 0 0;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <span class="clinic-name" style="font-size:13px;font-weight:700;letter-spacing:0.07em;text-transform:uppercase;color:#5EA89A;">${clinicName}</span>
                </td>
                <td align="right">
                  <span style="font-size:11px;color:#3E5470;white-space:nowrap;">Neure Prodesk</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Sage accent line -->
        <tr><td style="background:#5EA89A;height:3px;line-height:3px;font-size:0;">&nbsp;</td></tr>

        <!-- White body -->
        <tr>
          <td class="card-body" style="background:#FFFFFF;padding:28px 28px 24px;">

            <!-- Title -->
            <p class="heading" style="margin:0 0 4px;font-size:22px;font-weight:700;color:#111827;">Session Confirmed ✓</p>
            <p style="margin:0 0 22px;font-size:13px;color:#5EA89A;font-weight:500;">Your upcoming session details are below</p>

            <!-- Greeting -->
            <p style="margin:0 0 22px;font-size:15px;color:#4B5563;line-height:1.7;">
              Hi <strong style="color:#111827;">${toName}</strong>,<br>
              Your session with <strong style="color:#111827;">${therapistName}</strong> has been successfully scheduled.
            </p>

            <!-- Details — stacked rows, each full width (works on any screen) -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFB;border:1px solid #E5EAF0;border-radius:10px;margin-bottom:20px;">
              <tr>
                <td style="padding:14px 20px;border-bottom:1px solid #E5EAF0;">
                  <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#9CA3AF;">Therapist</p>
                  <p style="margin:0;font-size:15px;font-weight:600;color:#111827;">${therapistName}</p>
                </td>
              </tr>
              <tr>
                <td style="padding:14px 20px;${meetUrl ? 'border-bottom:1px solid #E5EAF0;' : ''}">
                  <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#9CA3AF;">Date &amp; Time</p>
                  <p style="margin:0;font-size:15px;font-weight:600;color:#111827;">${sessionTime} IST</p>
                </td>
              </tr>
              ${meetRowHtml}
            </table>

            <!-- Reminder -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
              <tr>
                <td style="background:#F0FBF9;border-left:3px solid #5EA89A;border-radius:0 6px 6px 0;padding:12px 16px;">
                  <p style="margin:0;font-size:13px;color:#374151;line-height:1.65;">
                    Please be ready <strong style="color:#5EA89A;">5 minutes</strong> before your scheduled time.
                    Reach out to your therapist if you need to reschedule.
                  </p>
                </td>
              </tr>
            </table>

            <!-- Footer -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="border-top:1px solid #E5EAF0;padding-top:18px;text-align:center;">
                  <p style="margin:0;font-size:12px;color:#9CA3AF;">
                    ${clinicName} &nbsp;&bull;&nbsp; Powered by <span style="color:#5EA89A;font-weight:600;">Neure Prodesk</span>
                  </p>
                </td>
              </tr>
            </table>

          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;


    let status = "SUCCESS";
    let statusCode = 200;
    let errorMsg = null;

    // Build ICS attachment if session datetime is provided
    const attachments = [];
    if (sessionStartISO) {
      try {
        const icsContent = NotificationService.generateICS({
          summary: `Session with ${therapistName}`,
          description: meetUrl
            ? `Your therapy session with ${therapistName}.\nJoin: ${meetUrl}`
            : `Your therapy session with ${therapistName}.`,
          startISO: sessionStartISO,
          durationMin,
          location: meetUrl || ''
        });
        attachments.push({
          content: Buffer.from(icsContent).toString('base64'),
          name: 'session.ics'
        });
      } catch (e) {
        console.log('ICS generation failed (non-fatal):', e.message);
      }
    }

    try {
      const payload = {
        sender: { name: BREVO_SENDER_NAME, email: BREVO_SENDER_EMAIL },
        to: [{ email: toEmail, name: toName }],
        subject: `Your session with ${therapistName} is confirmed`,
        htmlContent
      };
      if (attachments.length) payload.attachment = attachments;

      const response = await axios.post(
        "https://api.brevo.com/v3/smtp/email",
        payload,
        {
          headers: {
            "api-key": await getBrevoApiKey(),
            "Content-Type": "application/json"
          }
        }
      );
      statusCode = response.status;
      console.log("Session email sent to", toEmail, "| status:", statusCode);
    } catch (err) {
      status = "FAILED";
      statusCode = err.response?.status || 500;
      errorMsg = err.message;
      console.error("sendSessionScheduledEmail error:", err.message, err.response?.data);
    }

    await NotificationService.logNotification({
      platform: "EMAIL",
      status_code: statusCode,
      status,
      type: "SESSION_SCHEDULED",
      message: `Session scheduled email to ${toEmail}`,
      error: errorMsg,
      template_name: "session_scheduled_email",
      meta
    });

    return status === "SUCCESS";
  }

  /**
   * Send a session reminder email — same design as confirmation but with reminder messaging.
   */
  static async sendSessionReminderEmail({ toEmail, toName, therapistName, sessionTime, meetUrl = null, clinicName = "Neure Prodesk", meta = null }) {
    const meetRowHtml = meetUrl ? `
      <tr>
        <td style="padding:14px 20px;">
          <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#9CA3AF;">Session Link</p>
          <a href="${meetUrl}" style="font-size:15px;font-weight:600;color:#5EA89A;text-decoration:none;word-break:break-all;">Join Session &rarr;</a>
        </td>
      </tr>` : '';

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    @media only screen and (max-width: 600px) {
      .email-wrapper { padding: 16px 8px !important; }
      .card-header { padding: 20px 20px !important; }
      .card-body { padding: 24px 20px 20px !important; }
      .heading { font-size: 20px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#F0F4F8;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" class="email-wrapper" style="background:#F0F4F8;padding:32px 16px;">
    <tr><td align="center">
      <table cellpadding="0" cellspacing="0" style="width:100%;max-width:540px;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">
        <tr>
          <td class="card-header" style="background:#1A2332;padding:22px 28px;">
            <table width="100%" cellpadding="0" cellspacing="0"><tr>
              <td><span style="font-size:13px;font-weight:700;letter-spacing:0.07em;text-transform:uppercase;color:#C89364;">${clinicName}</span></td>
              <td align="right"><span style="font-size:11px;color:#3E5470;">Neure Prodesk</span></td>
            </tr></table>
          </td>
        </tr>
        <tr><td style="background:#C89364;height:3px;line-height:3px;font-size:0;">&nbsp;</td></tr>
        <tr>
          <td class="card-body" style="background:#FFFFFF;padding:28px 28px 24px;">
            <p class="heading" style="margin:0 0 4px;font-size:22px;font-weight:700;color:#111827;">Session Reminder 🔔</p>
            <p style="margin:0 0 22px;font-size:13px;color:#C89364;font-weight:500;">Your session is coming up soon</p>
            <p style="margin:0 0 22px;font-size:15px;color:#4B5563;line-height:1.7;">
              Hi <strong style="color:#111827;">${toName}</strong>,<br>
              This is a reminder for your upcoming session with <strong style="color:#111827;">${therapistName}</strong>.
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFB;border:1px solid #E5EAF0;border-radius:10px;margin-bottom:20px;">
              <tr>
                <td style="padding:14px 20px;border-bottom:1px solid #E5EAF0;">
                  <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#9CA3AF;">Therapist</p>
                  <p style="margin:0;font-size:15px;font-weight:600;color:#111827;">${therapistName}</p>
                </td>
              </tr>
              <tr>
                <td style="padding:14px 20px;${meetUrl ? 'border-bottom:1px solid #E5EAF0;' : ''}">
                  <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#9CA3AF;">Date &amp; Time</p>
                  <p style="margin:0;font-size:15px;font-weight:600;color:#111827;">${sessionTime} IST</p>
                </td>
              </tr>
              ${meetRowHtml}
            </table>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
              <tr>
                <td style="background:#FFF8F0;border-left:3px solid #C89364;border-radius:0 6px 6px 0;padding:12px 16px;">
                  <p style="margin:0;font-size:13px;color:#374151;line-height:1.65;">
                    Please be ready <strong style="color:#C89364;">5 minutes</strong> before your scheduled time.
                    Reach out to your therapist if you need to reschedule.
                  </p>
                </td>
              </tr>
            </table>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td style="border-top:1px solid #E5EAF0;padding-top:18px;text-align:center;">
                <p style="margin:0;font-size:12px;color:#9CA3AF;">
                  ${clinicName} &nbsp;&bull;&nbsp; Powered by <span style="color:#5EA89A;font-weight:600;">Neure Prodesk</span>
                </p>
              </td></tr>
            </table>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    let status = "SUCCESS";
    let statusCode = 200;
    let errorMsg = null;

    try {
      const response = await axios.post(
        "https://api.brevo.com/v3/smtp/email",
        {
          sender: { name: BREVO_SENDER_NAME, email: BREVO_SENDER_EMAIL },
          to: [{ email: toEmail, name: toName }],
          subject: `Reminder: Your session with ${therapistName} is tomorrow`,
          htmlContent
        },
        { headers: { "api-key": await getBrevoApiKey(), "Content-Type": "application/json" } }
      );
      statusCode = response.status;
      console.log("Reminder email sent to", toEmail, "| status:", statusCode);
    } catch (err) {
      status = "FAILED";
      statusCode = err.response?.status || 500;
      errorMsg = err.message;
      console.error("sendSessionReminderEmail error:", err.message);
    }

    await NotificationService.logNotification({
      platform: "EMAIL", status_code: statusCode, status,
      type: "SESSION_REMINDER",
      message: `Session reminder email to ${toEmail}`,
      error: errorMsg,
      template_name: "session_reminder_email",
      meta
    });

    return status === "SUCCESS";
  }

  /**
   * Send a password reset success confirmation email.
   */
  static async sendPasswordResetSuccessEmail({ toEmail, toName }) {
    const time = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' });

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F0F4F8;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F0F4F8;padding:32px 16px;">
    <tr><td align="center">
      <table cellpadding="0" cellspacing="0" style="width:100%;max-width:520px;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">
        <tr>
          <td style="background:#1A2332;padding:22px 28px;">
            <table width="100%" cellpadding="0" cellspacing="0"><tr>
              <td><span style="font-size:13px;font-weight:700;letter-spacing:0.07em;text-transform:uppercase;color:#C89364;">Neure Prodesk</span></td>
              <td align="right"><span style="font-size:11px;color:#3E5470;">Security Alert</span></td>
            </tr></table>
          </td>
        </tr>
        <tr><td style="background:#C89364;height:3px;line-height:3px;font-size:0;">&nbsp;</td></tr>
        <tr>
          <td style="background:#FFFFFF;padding:32px 28px 28px;">
            <p style="margin:0 0 4px;font-size:22px;font-weight:700;color:#111827;">Password Reset Successful 🔐</p>
            <p style="margin:0 0 24px;font-size:13px;color:#C89364;font-weight:500;">Your account password has been changed</p>

            <p style="margin:0 0 24px;font-size:15px;color:#4B5563;line-height:1.75;">
              Hi <strong style="color:#111827;">${toName}</strong>,<br>
              Your password was successfully reset on <strong style="color:#111827;">${time} IST</strong>.
            </p>

            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
              <tr>
                <td style="background:#FFF8F0;border-left:3px solid #C89364;border-radius:0 6px 6px 0;padding:14px 16px;">
                  <p style="margin:0;font-size:13px;color:#374151;line-height:1.65;">
                    ⚠️ <strong>If you did not make this change</strong>, your account may be compromised.
                    Please contact support immediately at <span style="color:#C89364;font-weight:600;">support@neure.co.in</span>
                  </p>
                </td>
              </tr>
            </table>

            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
              <tr><td align="center">
                <a href="https://prodesk-stag.neure.co.in/login"
                  style="display:inline-block;background:#5EA89A;color:#0E1218;font-size:14px;font-weight:700;padding:14px 32px;border-radius:10px;text-decoration:none;">
                  Sign in to your account →
                </a>
              </td></tr>
            </table>

            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td style="border-top:1px solid #E5EAF0;padding-top:18px;text-align:center;">
                <p style="margin:0;font-size:12px;color:#9CA3AF;">
                  Neure Prodesk &nbsp;&bull;&nbsp; Powered by <span style="color:#5EA89A;font-weight:600;">Neure</span>
                </p>
              </td></tr>
            </table>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    let status = "SUCCESS";
    let statusCode = 200;
    let errorMsg = null;

    try {
      const response = await axios.post(
        "https://api.brevo.com/v3/smtp/email",
        {
          sender: { name: "Neure Account", email: BREVO_SENDER_EMAIL },
          to: [{ email: toEmail, name: toName }],
          subject: "Your Neure Prodesk password has been reset",
          htmlContent
        },
        { headers: { "api-key": await getBrevoApiKey(), "Content-Type": "application/json" } }
      );
      statusCode = response.status;
      console.log("Password reset success email sent to", toEmail, "| status:", statusCode);
    } catch (err) {
      status = "FAILED";
      statusCode = err.response?.status || 500;
      errorMsg = err.message;
      console.error("sendPasswordResetSuccessEmail error:", err.message);
    }

    await NotificationService.logNotification({
      platform: "EMAIL", status_code: statusCode, status,
      type: "PASSWORD_RESET_SUCCESS",
      message: `Password reset success email to ${toEmail}`,
      error: errorMsg,
      template_name: "password_reset_success_email",
      meta: { email: toEmail }
    });

    return status === "SUCCESS";
  }

  /**
   * Send a welcome email after successful registration and email verification.
   */
  static async sendWelcomeEmail({ toEmail, toName, clinicName = "Neure Prodesk" }) {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>@media only screen and (max-width:600px){.card-body{padding:28px 20px 24px !important;}}</style>
</head>
<body style="margin:0;padding:0;background:#F0F4F8;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F0F4F8;padding:32px 16px;">
    <tr><td align="center">
      <table cellpadding="0" cellspacing="0" style="width:100%;max-width:520px;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">
        <tr>
          <td style="background:#1A2332;padding:22px 28px;">
            <table width="100%" cellpadding="0" cellspacing="0"><tr>
              <td><span style="font-size:13px;font-weight:700;letter-spacing:0.07em;text-transform:uppercase;color:#5EA89A;">Neure Prodesk</span></td>
              <td align="right"><span style="font-size:11px;color:#3E5470;">Welcome</span></td>
            </tr></table>
          </td>
        </tr>
        <tr><td style="background:#5EA89A;height:3px;line-height:3px;font-size:0;">&nbsp;</td></tr>
        <tr>
          <td class="card-body" style="background:#FFFFFF;padding:32px 28px 28px;">

            <p style="margin:0 0 4px;font-size:24px;font-weight:700;color:#111827;">Welcome, ${toName}! 🎉</p>
            <p style="margin:0 0 24px;font-size:13px;color:#5EA89A;font-weight:500;">Your account is ready. Let's get started.</p>

            <p style="margin:0 0 24px;font-size:15px;color:#4B5563;line-height:1.75;">
              Your <strong style="color:#111827;">Neure Prodesk</strong> account has been successfully created and verified.
              You can now log in and start managing your practice.
            </p>

            <!-- What you can do -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFB;border:1px solid #E5EAF0;border-radius:10px;margin-bottom:24px;">
              <tr><td style="padding:16px 20px 8px;">
                <p style="margin:0 0 12px;font-size:12px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#9CA3AF;">What you can do with Prodesk</p>
              </td></tr>
              <tr><td style="padding:0 20px 16px;">
                <table cellpadding="0" cellspacing="0">
                  <tr><td style="padding:4px 0;font-size:14px;color:#374151;">📅 &nbsp; Schedule and manage sessions</td></tr>
                  <tr><td style="padding:4px 0;font-size:14px;color:#374151;">👥 &nbsp; Add and track clients</td></tr>
                  <tr><td style="padding:4px 0;font-size:14px;color:#374151;">🧾 &nbsp; Generate invoices and billing</td></tr>
                  <tr><td style="padding:4px 0;font-size:14px;color:#374151;">📝 &nbsp; Write session notes</td></tr>
                  <tr><td style="padding:4px 0;font-size:14px;color:#374151;">🎥 &nbsp; Video sessions via Google Meet</td></tr>
                </table>
              </td></tr>
            </table>

            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
              <tr><td align="center">
                <a href="https://prodesk-stag.neure.co.in/login"
                  style="display:inline-block;background:#5EA89A;color:#0E1218;font-size:14px;font-weight:700;padding:14px 32px;border-radius:10px;text-decoration:none;letter-spacing:0.01em;">
                  Go to Dashboard →
                </a>
              </td></tr>
            </table>

            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td style="border-top:1px solid #E5EAF0;padding-top:18px;text-align:center;">
                <p style="margin:0;font-size:12px;color:#9CA3AF;">
                  ${clinicName} &nbsp;&bull;&nbsp; Powered by <span style="color:#5EA89A;font-weight:600;">Neure</span>
                </p>
              </td></tr>
            </table>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    let status = "SUCCESS";
    let statusCode = 200;
    let errorMsg = null;

    try {
      const response = await axios.post(
        "https://api.brevo.com/v3/smtp/email",
        {
          sender: { name: "Neure Account", email: BREVO_SENDER_EMAIL },
          to: [{ email: toEmail, name: toName }],
          subject: `Welcome to Neure Prodesk, ${toName}!`,
          htmlContent
        },
        { headers: { "api-key": await getBrevoApiKey(), "Content-Type": "application/json" } }
      );
      statusCode = response.status;
      console.log("Welcome email sent to", toEmail, "| status:", statusCode);
    } catch (err) {
      status = "FAILED";
      statusCode = err.response?.status || 500;
      errorMsg = err.message;
      console.error("sendWelcomeEmail error:", err.message);
    }

    await NotificationService.logNotification({
      platform: "EMAIL", status_code: statusCode, status,
      type: "WELCOME",
      message: `Welcome email to ${toEmail}`,
      error: errorMsg,
      template_name: "welcome_email",
      meta: { email: toEmail }
    });

    return status === "SUCCESS";
  }

  /**
   * Send a 6-digit OTP email for email verification or forgot password.
   * @param {string} type - 'verify' | 'forgot_password'
   */
  static async sendOtpEmail({ toEmail, toName, otp, type }) {
    const isVerify = type === 'verify';
    const subject = isVerify ? 'Verify your Neure Prodesk account' : 'Your password reset OTP';
    const heading = isVerify ? 'Verify Your Email' : 'Reset Your Password';
    const subtext = isVerify
      ? 'Use the OTP below to verify your email and activate your account.'
      : 'Use the OTP below to reset your password. Valid for 10 minutes.';
    const accentColor = isVerify ? '#5EA89A' : '#C89364';

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>@media only screen and (max-width:600px){.card-body{padding:28px 20px 24px !important;}}</style>
</head>
<body style="margin:0;padding:0;background:#F0F4F8;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F0F4F8;padding:32px 16px;">
    <tr><td align="center">
      <table cellpadding="0" cellspacing="0" style="width:100%;max-width:520px;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">
        <tr>
          <td style="background:#1A2332;padding:22px 28px;">
            <table width="100%" cellpadding="0" cellspacing="0"><tr>
              <td><span style="font-size:13px;font-weight:700;letter-spacing:0.07em;text-transform:uppercase;color:${accentColor};">Neure Prodesk</span></td>
              <td align="right"><span style="font-size:11px;color:#3E5470;">Account Security</span></td>
            </tr></table>
          </td>
        </tr>
        <tr><td style="background:${accentColor};height:3px;line-height:3px;font-size:0;">&nbsp;</td></tr>
        <tr>
          <td class="card-body" style="background:#FFFFFF;padding:32px 28px 28px;">
            <p style="margin:0 0 4px;font-size:22px;font-weight:700;color:#111827;">${heading}</p>
            <p style="margin:0 0 24px;font-size:13px;color:${accentColor};font-weight:500;">${subtext}</p>
            <p style="margin:0 0 20px;font-size:15px;color:#4B5563;line-height:1.7;">
              Hi <strong style="color:#111827;">${toName}</strong>,
            </p>
            <!-- OTP Box -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
              <tr>
                <td align="center" style="background:#F8FAFB;border:2px dashed ${accentColor};border-radius:12px;padding:24px;">
                  <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#9CA3AF;">Your OTP</p>
                  <p style="margin:0;font-size:40px;font-weight:700;letter-spacing:12px;color:#111827;">${otp}</p>
                  <p style="margin:8px 0 0;font-size:12px;color:#9CA3AF;">Valid for 10 minutes</p>
                </td>
              </tr>
            </table>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
              <tr>
                <td style="background:#F0FBF9;border-left:3px solid ${accentColor};border-radius:0 6px 6px 0;padding:12px 16px;">
                  <p style="margin:0;font-size:13px;color:#374151;line-height:1.6;">
                    Never share this OTP with anyone. Neure will never ask for your OTP.
                  </p>
                </td>
              </tr>
            </table>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td style="border-top:1px solid #E5EAF0;padding-top:18px;text-align:center;">
                <p style="margin:0;font-size:12px;color:#9CA3AF;">
                  Neure Prodesk &nbsp;&bull;&nbsp; Powered by <span style="color:#5EA89A;font-weight:600;">Neure</span>
                </p>
              </td></tr>
            </table>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    let status = "SUCCESS";
    let statusCode = 200;
    let errorMsg = null;

    try {
      const response = await axios.post(
        "https://api.brevo.com/v3/smtp/email",
        {
          sender: { name: "Neure Account", email: BREVO_SENDER_EMAIL },
          to: [{ email: toEmail, name: toName }],
          subject,
          htmlContent
        },
        { headers: { "api-key": await getBrevoApiKey(), "Content-Type": "application/json" } }
      );
      statusCode = response.status;
      console.log("OTP email sent to", toEmail, "| type:", type, "| status:", statusCode);
    } catch (err) {
      status = "FAILED";
      statusCode = err.response?.status || 500;
      errorMsg = err.message;
      console.error("sendOtpEmail error:", err.message);
    }

    await NotificationService.logNotification({
      platform: "EMAIL", status_code: statusCode, status,
      type: isVerify ? "EMAIL_VERIFY_OTP" : "FORGOT_PASSWORD_OTP",
      message: `OTP email to ${toEmail}`,
      error: errorMsg,
      template_name: "otp_email",
      meta: { email: toEmail, otp_type: type }
    });

    return status === "SUCCESS";
  }

  // Create notification
  static async createNotification({
    title,
    content,
    type,
    company_id = null,
    user_id = null
  }) {
    try {
      const [result] = await db.query(
        `INSERT INTO notifications (title, content, type, company_id, user_id)
         VALUES (?, ?, ?, ?, ?)`,
        [title, content, type, company_id, user_id]
      );

      return {
        id: result.insertId,
        title,
        content,
        type,
        company_id,
        user_id,
        created_at: new Date()
      };
    } catch (error) {
      console.error("Error in createNotification:", error.message);
      throw new Error("Failed to create notification");
    }
  }

  // Get notifications with filters
  static async getNotifications({
    company_id = null,
    user_id = null,
    type = null,
    is_read = null,
    page = 1,
    limit = 10,
    join_date = null
  }) {
    try {
      const offset = (page - 1) * limit;
      let query = `
        SELECT DISTINCT n.* 
        FROM notifications n
        WHERE n.user_id = ?
      `;
      let countQuery = `
        SELECT COUNT(DISTINCT n.id) as total 
        FROM notifications n
        WHERE n.user_id = ?
      `;
      
      const params = [user_id];
      const countParams = [user_id];

      // Add company notifications if company_id is provided
      if (company_id) {
        query = `
          SELECT DISTINCT n.* 
          FROM notifications n
          WHERE (n.user_id = ?
          OR (n.company_id = ? AND n.user_id IS NULL))
        `;
        countQuery = `
          SELECT COUNT(DISTINCT n.id) as total 
          FROM notifications n
          WHERE (n.user_id = ?
          OR (n.company_id = ? AND n.user_id IS NULL))
        `;
        params.push(company_id);
        countParams.push(company_id);
      }

      // Filter by join date if provided
      if (join_date) {
        query += ` AND n.created_at >= ? `;
        countQuery += ` AND n.created_at >= ? `;
        params.push(join_date);
        countParams.push(join_date);
      }

      if (type) {
        query += ` AND n.type = ?`;
        countQuery += ` AND n.type = ?`;
        params.push(type);
        countParams.push(type);
      }

      // Add read status filter if provided
      if (is_read !== null) {
        query += ` AND n.is_read = ?`;
        countQuery += ` AND n.is_read = ?`;
        params.push(is_read);
        countParams.push(is_read);
      }

      query += ` ORDER BY 
        CASE 
          WHEN n.priority = 'HIGH' THEN 1
          WHEN n.priority = 'MEDIUM' THEN 2
          WHEN n.priority = 'LOW' THEN 3
          ELSE 4
        END,
        n.created_at DESC 
        LIMIT ? OFFSET ?`;
      params.push(limit, offset);


      const [notifications] = await db.query(query, params);
      const [countResult] = await db.query(countQuery, countParams);

      return {
        notifications,
        pagination: {
          current_page: page,
          per_page: limit,
          total: countResult[0].total
        }
      };
    } catch (error) {
      console.error("Error in getNotifications:", error.message);
      throw new Error("Failed to fetch notifications");
    }
  }

  // Update notification
  static async updateNotification({
    id,
    title,
    content,
    type
  }) {
    try {
      const [result] = await db.query(
        `UPDATE notifications 
         SET title = ?, content = ?, type = ?
         WHERE id = ?`,
        [title, content, type, id]
      );

      if (result.affectedRows === 0) {
        throw new Error("Notification not found");
      }

      return {
        id,
        title,
        content,
        type,
        updated_at: new Date()
      };
    } catch (error) {
      console.error("Error in updateNotification:", error.message);
      throw new Error("Failed to update notification");
    }
  }

  // Delete notification
  static async deleteNotification(id) {
    try {
      const [result] = await db.query(
        `DELETE FROM notifications WHERE id = ?`,
        [id]
      );

      if (result.affectedRows === 0) {
        throw new Error("Notification not found");
      }

      return true;
    } catch (error) {
      console.error("Error in deleteNotification:", error.message);
      throw new Error("Failed to delete notification");
    }
  }

  // Mark notification as read
  static async markNotificationAsRead(notification_id, user_id) {
    try {
      console.log("notification_id: ", notification_id);
      console.log("user_id: ", user_id);
      const [notification] = await db.query(
        `SELECT * FROM notifications 
         WHERE id = ? AND (user_id = ? OR user_id IS NULL)`,
        [notification_id, user_id]
      );
      console.log("notification: ", notification);

      if (notification.length === 0) {
        throw new Error("Notification not found or not accessible");
      }

      // Update the is_read status
      const [result] = await db.query(
        `UPDATE notifications 
         SET is_read = 1
         WHERE id = ?`,
        [notification_id]
      );

      if (result.affectedRows === 0) {
        throw new Error("Failed to mark notification as read");
      }

      return { success: true };
    } catch (error) {
      console.error("Error in markNotificationAsRead:", error.message);
      throw new Error("Failed to mark notification as read");
    }
  }

  // Mark multiple notifications as read
  static async markMultipleNotificationsAsRead(user_id, notification_ids = []) {
    try {
      // If specific IDs are provided, mark only those
      if (notification_ids && notification_ids.length > 0) {
        const placeholders = notification_ids.map(() => '?').join(',');
        const params = [...notification_ids, user_id];
        
        const [result] = await db.query(
          `UPDATE notifications 
           SET is_read = 1
           WHERE id IN (${placeholders}) 
           AND (user_id = ? OR user_id IS NULL)`,
          params
        );

        return { 
          success: true,
          count: result.affectedRows
        };
      } 
      // Otherwise mark all unread notifications for this user
      else {
        const [result] = await db.query(
          `UPDATE notifications 
           SET is_read = 1
           WHERE is_read = 0 
           AND (user_id = ? OR user_id IS NULL)`,
          [user_id]
        );

        return { 
          success: true,
          count: result.affectedRows
        };
      }
    } catch (error) {
      console.error("Error in markMultipleNotificationsAsRead:", error.message);
      throw new Error("Failed to mark notifications as read");
    }
  }

  // Add this new method to NotificationService class
  static async getUnreadNotificationCount(user_id, company_id = null) {
    try {
      let query = `
        SELECT COUNT(*) as count 
        FROM notifications n
        WHERE n.user_id = ? AND n.is_read = 0
      `;
      
      const params = [user_id];
      
      // Add company notifications if company_id is provided
      if (company_id) {
        query = `
          SELECT COUNT(*) as count 
          FROM notifications n
          WHERE (n.user_id = ? OR (n.company_id = ? AND n.user_id IS NULL))
          AND n.is_read = 0
        `;
        params.push(company_id);
      }
      
      const [result] = await db.query(query, params);
      return result[0].count;
    } catch (error) {
      console.error("Error in getUnreadNotificationCount:", error.message);
      throw new Error("Failed to fetch notification count");
    }
  }

  // Log a notification delivery attempt to notification_log
  static async logNotification({
    user_id = null,
    user_type = null,
    platform = 'IN_APP',
    status_code = null,
    status = null,
    type = null,
    message = null,
    error = null,
    message_body = null,
    template_name = null,
    meta = null
  }) {
    try {
      await db.query(
        `INSERT INTO notification_log
         (user_id, user_type, platform, status_code, status, type, message, error, message_body, template_name, meta)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [user_id, user_type, platform, status_code, status, type, message, error, message_body, template_name,
         meta ? JSON.stringify(meta) : null]
      );
    } catch (e) {
      console.error("Error in logNotification:", e.message);
    }
  }

  /**
   * Generic email sender for all ProDesk transactional emails.
   * Templates: prodesk_starter_activated, prodesk_subscription_activated,
   * prodesk_subscription_renewed, prodesk_offer_redeemed,
   * prodesk_referral_reward_credited, prodesk_referral_payout_processed,
   * prodesk_feedback_received_admin
   */
  static async sendEmail({ toEmail, toName, template, data = {} }) {
    const DASHBOARD_URL = process.env.PRODESK_DASHBOARD_URL || 'https://prodesk-stag.neure.co.in';

    let subject = '';
    let htmlContent = '';

    // ── Shared layout helpers ────────────────────────────────────────────────
    const shell = (tagline, body) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <style>
    @media only screen and (max-width:600px){
      .body-cell{padding:28px 18px 24px !important;}
      .hide-sm{display:none !important;}
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#EEF2F7;font-family:'Helvetica Neue',Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#EEF2F7;padding:40px 16px 48px;">
  <tr><td align="center">
    <table cellpadding="0" cellspacing="0" style="width:100%;max-width:560px;border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.12);">

      <!-- HEADER -->
      <tr>
        <td style="background:#0F1C2E;padding:20px 28px;">
          <table width="100%" cellpadding="0" cellspacing="0"><tr>
            <td>
              <span style="font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#5EA89A;">NEURE</span>
              <span style="font-size:11px;font-weight:400;letter-spacing:0.08em;text-transform:uppercase;color:#3E5470;">&nbsp;ProDesk</span>
            </td>
            <td align="right" class="hide-sm">
              <span style="font-size:11px;color:#3E5470;letter-spacing:0.04em;">${tagline}</span>
            </td>
          </tr></table>
        </td>
      </tr>

      <!-- ACCENT LINE -->
      <tr><td style="background:linear-gradient(90deg,#5EA89A,#4A8F82);height:3px;line-height:3px;font-size:0;">&nbsp;</td></tr>

      <!-- BODY -->
      <tr>
        <td class="body-cell" style="background:#FFFFFF;padding:36px 32px 32px;">
          ${body}

          <!-- FOOTER -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:32px;">
            <tr><td style="border-top:1px solid #E8EDF4;padding-top:20px;">
              <table width="100%" cellpadding="0" cellspacing="0"><tr>
                <td>
                  <p style="margin:0;font-size:11px;color:#9CA3AF;line-height:1.6;">
                    Neure ProDesk &nbsp;&bull;&nbsp; Helping mental health professionals grow their practice.<br>
                    <a href="${DASHBOARD_URL}" style="color:#5EA89A;text-decoration:none;">prodesk-stag.neure.co.in</a>
                  </p>
                </td>
                <td align="right" class="hide-sm">
                  <span style="font-size:18px;">🧠</span>
                </td>
              </tr></table>
            </td></tr>
          </table>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body></html>`;

    const heading = (title, subtitle, color = '#5EA89A') => `
      <p style="margin:0 0 4px;font-size:24px;font-weight:700;color:#0F1C2E;letter-spacing:-0.3px;">${title}</p>
      <p style="margin:0 0 28px;font-size:13px;color:${color};font-weight:600;letter-spacing:0.02em;">${subtitle}</p>`;

    const infoBox = (rows) => `
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#F7F9FC;border:1px solid #E8EDF4;border-radius:12px;margin-bottom:24px;overflow:hidden;">
        <tr><td style="padding:6px 20px 0;">
          <p style="margin:0 0 14px;font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#9CA3AF;">Details</p>
        </td></tr>
        ${rows.map((r, i) => `
          <tr>
            <td style="padding:${i === 0 ? '0' : '0'} 20px ${i === rows.length - 1 ? '18px' : '12px'};">
              <table width="100%" cellpadding="0" cellspacing="0"><tr>
                <td style="font-size:13px;color:#6B7280;width:40%;padding-right:8px;">${r[0]}</td>
                <td style="font-size:13px;color:#0F1C2E;font-weight:600;">${r[1]}</td>
              </tr></table>
            </td>
          </tr>`).join('')}
      </table>`;

    const cta = (url, label) => `
      <table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0 4px;">
        <tr><td align="center">
          <a href="${url}"
            style="display:inline-block;background:#5EA89A;color:#FFFFFF;font-size:14px;font-weight:700;
                   padding:15px 36px;border-radius:10px;text-decoration:none;letter-spacing:0.02em;
                   box-shadow:0 4px 12px rgba(94,168,154,0.35);">
            ${label} &nbsp;→
          </a>
        </td></tr>
      </table>`;

    const note = (text) => `
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;">
        <tr>
          <td style="background:#F0FBF9;border-left:3px solid #5EA89A;border-radius:0 8px 8px 0;padding:12px 16px;">
            <p style="margin:0;font-size:13px;color:#374151;line-height:1.65;">${text}</p>
          </td>
        </tr>
      </table>`;

    // ── Templates ────────────────────────────────────────────────────────────

    if (template === 'prodesk_starter_activated') {
      subject = 'Welcome to ProDesk — Your free plan is active';
      htmlContent = shell('Account Activated', `
        ${heading('Welcome to ProDesk!', 'Your Starter plan is now active and ready to use.')}
        <p style="margin:0 0 24px;font-size:15px;color:#4B5563;line-height:1.8;">
          Hi <strong style="color:#0F1C2E;">${data.therapist_name}</strong>, you're all set. Your free Starter plan gives you
          access to all core ProDesk features for up to <strong>2 clients</strong>.
        </p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#F7F9FC;border:1px solid #E8EDF4;border-radius:12px;margin-bottom:24px;">
          <tr><td style="padding:18px 20px;">
            <p style="margin:0 0 12px;font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#9CA3AF;">What you can do now</p>
            <table cellpadding="0" cellspacing="0">
              <tr><td style="padding:5px 0;font-size:14px;color:#374151;">📅 &nbsp; Schedule and manage sessions</td></tr>
              <tr><td style="padding:5px 0;font-size:14px;color:#374151;">👥 &nbsp; Add up to 2 clients</td></tr>
              <tr><td style="padding:5px 0;font-size:14px;color:#374151;">🧾 &nbsp; Generate invoices and track billing</td></tr>
              <tr><td style="padding:5px 0;font-size:14px;color:#374151;">📝 &nbsp; Write and store session notes</td></tr>
              <tr><td style="padding:5px 0;font-size:14px;color:#374151;">🎥 &nbsp; Video sessions via Google Meet</td></tr>
            </table>
          </td></tr>
        </table>
        ${cta(`${DASHBOARD_URL}/dashboard`, 'Go to Dashboard')}
        ${note('Need more clients? Upgrade to Professional anytime from your dashboard to unlock unlimited clients and all features.')}
      `);
    }

    else if (template === 'prodesk_subscription_activated') {
      subject = `Your ProDesk ${data.plan_name} plan is active`;
      htmlContent = shell('Subscription Active', `
        ${heading(`${data.plan_name} Plan Activated`, 'Your subscription is live. You\'re all set to grow your practice.')}
        <p style="margin:0 0 24px;font-size:15px;color:#4B5563;line-height:1.8;">
          Hi <strong style="color:#0F1C2E;">${data.therapist_name}</strong>, thank you for subscribing to ProDesk.
          Your <strong>${data.plan_name}</strong> plan is now active with full access to all features.
        </p>
        ${infoBox([
          ['Plan', data.plan_name],
          ['Billing', data.billing_cycle === 'annual' ? 'Annual' : 'Monthly'],
          ['Valid Until', data.period_end],
        ])}
        ${cta(`${DASHBOARD_URL}/dashboard`, 'Open ProDesk')}
        ${note('You can manage your subscription, view invoices, and upgrade your plan anytime from the Settings section of your dashboard.')}
      `);
    }

    else if (template === 'prodesk_subscription_renewed') {
      subject = 'Your ProDesk subscription has been renewed';
      htmlContent = shell('Subscription Renewed', `
        ${heading('Subscription Renewed!', 'Your ProDesk access continues without interruption.')}
        <p style="margin:0 0 24px;font-size:15px;color:#4B5563;line-height:1.8;">
          Hi <strong style="color:#0F1C2E;">${data.therapist_name}</strong>, your <strong>${data.plan_name}</strong> plan
          has been renewed successfully. Everything continues exactly as before — no action required.
        </p>
        ${infoBox([
          ['Plan', data.plan_name],
          ['Billing', data.billing_cycle === 'annual' ? 'Annual' : 'Monthly'],
          ['New Expiry', data.period_end],
        ])}
        ${cta(`${DASHBOARD_URL}/dashboard`, 'Continue on ProDesk')}
        ${note('If you did not expect this renewal or have questions about billing, please contact our support team.')}
      `);
    }

    else if (template === 'prodesk_offer_redeemed') {
      subject = `Your offer code "${data.offer_code}" has been applied`;
      htmlContent = shell('Offer Applied', `
        ${heading('Offer Code Applied!', 'Your special pricing has been activated.', '#C89364')}
        <p style="margin:0 0 24px;font-size:15px;color:#4B5563;line-height:1.8;">
          Hi <strong style="color:#0F1C2E;">${data.therapist_name}</strong>, your offer code
          <strong style="color:#C89364;">${data.offer_code}</strong> was successfully applied to your subscription.
        </p>
        ${infoBox([
          ['Offer', data.offer_name],
          ['Code', data.offer_code],
          ['Plan', data.plan_name],
          ['Amount Paid', `₹${data.final_amount}`],
        ])}
        ${cta(`${DASHBOARD_URL}/dashboard`, 'Go to Dashboard')}
        ${note('This offer has been applied to your account. The discounted pricing is now active for the duration specified in the offer terms.')}
      `);
    }

    else if (template === 'prodesk_referral_reward_credited') {
      subject = `You earned ₹${data.reward_amount} — referral reward credited to your wallet`;
      htmlContent = shell('Referral Reward', `
        ${heading('You Earned a Referral Reward!', `₹${data.reward_amount} has been credited to your ProDesk wallet.`)}
        <p style="margin:0 0 24px;font-size:15px;color:#4B5563;line-height:1.8;">
          Hi <strong style="color:#0F1C2E;">${data.referrer_name}</strong>, great news!
          <strong>${data.referred_name}</strong> signed up on ProDesk using your referral code
          and made their first subscription payment. Your reward has been credited.
        </p>
        ${infoBox([
          ['Referred By You', data.referred_name],
          ['Reward Amount', `₹${data.reward_amount}`],
          ['Wallet Balance', `₹${data.wallet_balance}`],
          ['Payout Date', 'On or around the 5th of next month'],
        ])}
        ${cta(`${DASHBOARD_URL}/referral`, 'View Referral Dashboard')}
        ${note('Referral payouts are transferred to your registered bank account on the 5th of every month. Keep sharing your code to earn more!')}
      `);
    }

    else if (template === 'prodesk_referral_payout_processed') {
      subject = `Your ProDesk referral payout of ₹${data.payout_amount} has been processed`;
      htmlContent = shell('Payout Processed', `
        ${heading('Referral Payout Sent!', `₹${data.payout_amount} is on its way to your bank account.`)}
        <p style="margin:0 0 24px;font-size:15px;color:#4B5563;line-height:1.8;">
          Hi <strong style="color:#0F1C2E;">${data.therapist_name}</strong>, your ProDesk referral
          earnings for <strong>${data.payout_month}</strong> have been processed and transferred to
          your registered bank account.
        </p>
        ${infoBox([
          ['Amount Transferred', `₹${data.payout_amount}`],
          ['Payout Month', data.payout_month],
          ...(data.bank_ref ? [['Bank Reference', data.bank_ref]] : []),
        ])}
        ${cta(`${DASHBOARD_URL}/referral`, 'View Referral History')}
        ${note('Please allow 1–2 business days for the amount to reflect in your account. If you have any questions, contact our support team.')}
      `);
    }

    else if (template === 'prodesk_feedback_received_admin') {
      subject = `New ProDesk Feedback — ${data.therapist_name}`;
      htmlContent = shell('Internal — Feedback', `
        ${heading('New Feedback Received', `Submitted by ${data.therapist_name}`, '#6B7280')}
        ${infoBox([
          ['From', `${data.therapist_name}`],
          ['Email', data.therapist_email],
          ['Subject', data.subject],
          ...(data.rating ? [['Rating', `${data.rating} / 5`]] : []),
          ['Submitted', data.submitted_at ? new Date(data.submitted_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : 'Just now'],
        ])}
        <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#9CA3AF;">Message</p>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="background:#F7F9FC;border:1px solid #E8EDF4;border-radius:10px;padding:16px 18px;">
            <p style="margin:0;font-size:14px;color:#374151;line-height:1.8;">${data.message}</p>
          </td></tr>
        </table>
      `);
    }

    else {
      console.warn(`sendEmail: unknown template "${template}"`);
      return false;
    }

    // ── Send via Brevo ───────────────────────────────────────────────────────
    let status = 'SUCCESS';
    let statusCode = 200;
    try {
      const response = await axios.post(
        'https://api.brevo.com/v3/smtp/email',
        {
          sender: { name: 'Neure ProDesk', email: BREVO_SENDER_EMAIL },
          to: [{ email: toEmail, name: toName }],
          subject,
          htmlContent
        },
        { headers: { 'api-key': await getBrevoApiKey(), 'Content-Type': 'application/json' } }
      );
      statusCode = response.status;
      console.log(`sendEmail [${template}] → ${toEmail} | status: ${statusCode}`);
    } catch (err) {
      status = 'FAILED';
      statusCode = err.response?.status || 500;
      console.error(`sendEmail [${template}] error:`, err.message);
    }

    await NotificationService.logNotification({
      platform: 'EMAIL', status_code: statusCode, status,
      type: template.toUpperCase(),
      message: `${template} → ${toEmail}`,
      template_name: template
    });

    return status === 'SUCCESS';
  }
}

module.exports = NotificationService;
