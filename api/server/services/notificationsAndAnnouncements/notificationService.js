const db = require("../../../config/db");
const axios = require("axios");

const MSG91_AUTH_KEY = "520733ARLmjeFtYE6a227444P1";
const MSG91_INTEGRATED_NUMBER = "919004364096";
const MSG91_WHATSAPP_URL = "https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/";

const BREVO_API_KEY = "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";
const BREVO_SENDER_EMAIL = "varun@neure.co.in";
const BREVO_SENDER_NAME = "Neure";

class NotificationService {
  /**
   * Send a WhatsApp template message via MSG91.
   *
   * @param {string}   to           - Recipient phone with country code, e.g. "919876543210"
   * @param {string}   templateName - MSG91 approved template name
   * @param {string}   templateId   - MSG91 template OID (for logging)
   * @param {string[]} variables    - Values for body_1, body_2, body_3 ... in order
   * @param {object}   [meta]       - Optional extra data for notification_log
   */
  static async sendWhatsAppNotification({ to, templateName, templateId, variables = [], meta = null }) {
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
          namespace: null,
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
      template_name: templateId,
      meta
    });

    return status === "SUCCESS";
  }

  /**
   * Send session scheduled email via Brevo transactional API.
   *
   * @param {string} toEmail       - Recipient email
   * @param {string} toName        - Recipient full name (client)
   * @param {string} therapistName - Therapist full name
   * @param {string} sessionTime   - Formatted date & time string (IST)
   * @param {string} meetUrl       - Google Meet URL or null for in-person
   * @param {string} clinicName    - Therapist brand/clinic name
   * @param {object} [meta]        - Optional extra data for notification_log
   */
  static async sendSessionScheduledEmail({ toEmail, toName, therapistName, sessionTime, meetUrl = null, clinicName = "Neure Prodesk", meta = null }) {
    const meetRowHtml = meetUrl ? `
      <tr>
        <td style="padding:14px 0 14px 0;border-top:1px solid #1E2738;">
          <span style="color:#8A9BB5;font-size:13px;text-transform:uppercase;letter-spacing:0.06em;font-weight:600;">Session Link</span>
        </td>
        <td style="padding:14px 0 14px 0;border-top:1px solid #1E2738;text-align:right;">
          <a href="${meetUrl}" style="color:#5EA89A;font-size:14px;font-weight:600;text-decoration:none;">Join Session &rarr;</a>
        </td>
      </tr>` : '';

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F0F4F8;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F0F4F8;padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:#1A2332;border-radius:12px 12px 0 0;padding:28px 36px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <span style="font-size:13px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#5EA89A;">${clinicName}</span>
                </td>
                <td align="right">
                  <span style="font-size:11px;color:#4A6080;letter-spacing:0.05em;">Neure Prodesk</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Sage accent strip -->
        <tr><td style="background:#5EA89A;height:3px;"></td></tr>

        <!-- White card body -->
        <tr>
          <td style="background:#FFFFFF;padding:36px 36px 32px;border-radius:0 0 12px 12px;box-shadow:0 4px 20px rgba(0,0,0,0.08);">

            <!-- Heading -->
            <p style="margin:0 0 4px;font-size:24px;font-weight:700;color:#111827;letter-spacing:-0.3px;">Session Confirmed ✓</p>
            <p style="margin:0 0 28px;font-size:14px;color:#5EA89A;font-weight:500;">Your upcoming session details are below</p>

            <!-- Greeting -->
            <p style="margin:0 0 28px;font-size:15px;color:#4B5563;line-height:1.75;">
              Hi <strong style="color:#111827;">${toName}</strong>,<br>
              Your session with <strong style="color:#111827;">${therapistName}</strong> has been successfully scheduled.
            </p>

            <!-- Details box -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFB;border:1px solid #E5EAF0;border-radius:10px;margin-bottom:24px;">
              <tr>
                <td style="padding:16px 20px;border-bottom:1px solid #E5EAF0;">
                  <table width="100%" cellpadding="0" cellspacing="0"><tr>
                    <td style="font-size:12px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#9CA3AF;">Therapist</td>
                    <td align="right" style="font-size:15px;font-weight:600;color:#111827;">${therapistName}</td>
                  </tr></table>
                </td>
              </tr>
              <tr>
                <td style="padding:16px 20px;${meetUrl ? 'border-bottom:1px solid #E5EAF0;' : ''}">
                  <table width="100%" cellpadding="0" cellspacing="0"><tr>
                    <td style="font-size:12px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#9CA3AF;">Date &amp; Time</td>
                    <td align="right" style="font-size:15px;font-weight:600;color:#111827;">${sessionTime} IST</td>
                  </tr></table>
                </td>
              </tr>
              ${meetUrl ? `<tr>
                <td style="padding:16px 20px;">
                  <table width="100%" cellpadding="0" cellspacing="0"><tr>
                    <td style="font-size:12px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#9CA3AF;">Session Link</td>
                    <td align="right"><a href="${meetUrl}" style="font-size:14px;font-weight:600;color:#5EA89A;text-decoration:none;">Join Session &rarr;</a></td>
                  </tr></table>
                </td>
              </tr>` : ''}
            </table>

            <!-- Reminder note -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
              <tr>
                <td style="background:#F0FBF9;border-left:3px solid #5EA89A;border-radius:0 6px 6px 0;padding:14px 16px;">
                  <span style="font-size:13px;color:#374151;line-height:1.6;">
                    Please be ready <strong style="color:#5EA89A;">5 minutes</strong> before your scheduled time.
                    Reach out to your therapist if you need to reschedule.
                  </span>
                </td>
              </tr>
            </table>

            <!-- Footer -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td style="border-top:1px solid #E5EAF0;padding-top:20px;">
                <p style="margin:0;font-size:12px;color:#9CA3AF;text-align:center;">
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
          subject: `Your session with ${therapistName} is confirmed`,
          htmlContent
        },
        {
          headers: {
            "api-key": BREVO_API_KEY,
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
}

module.exports = NotificationService;
