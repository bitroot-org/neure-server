const db = require('../../../config/db');
const axios = require('axios');
const { getBrevoApiKey } = require('./invoiceEmailService');
const NotificationService = require('../notificationsAndAnnouncements/notificationService');
const { createShortLinkService } = require('../shortLinkService');

const BREVO_SENDER = { name: 'Prodesk', email: 'prodesk@neure.co.in' };

// MSG91-approved WhatsApp template for resource sharing.
// Body: "Hi {{1}}, {{2}} has shared a resource with you: {{3}}. Open it here: {{4}} Thanks,"
// Variables, in order: [client_first_name, therapist_brand_name, resource_title, resource_link]
const RESOURCE_WHATSAPP_TEMPLATE = 'prodesk_resource_share';

const getResourcesService = async (payload) => {
  try {
    console.log('Payload in getResourcesService::>>', payload);
    const { therapist_id, scope, type, category, q, page = 1, limit = 20 } = payload;

    const offset = (page - 1) * limit;
    const conds = ["(pr.therapist_id = ? OR pr.scope = 'catalogue') AND pr.is_deleted = 0"];
    const vals = [therapist_id];

    if (scope === 'mine') {
      conds.length = 0;
      conds.push("pr.therapist_id = ? AND pr.scope = 'mine' AND pr.is_deleted = 0");
      vals.length = 0;
      vals.push(therapist_id);
    } else if (scope === 'catalogue') {
      conds.length = 0;
      conds.push("pr.scope = 'catalogue' AND pr.is_deleted = 0");
      vals.length = 0;
    }

    if (type) { conds.push('pr.type = ?'); vals.push(type); }
    if (category) { conds.push('pr.category = ?'); vals.push(category); }
    if (q) { conds.push('pr.title LIKE ?'); vals.push(`%${q}%`); }

    const where = conds.join(' AND ');
    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total FROM prodesk_resources pr WHERE ${where}`,
      vals
    );

    const [rows] = await db.query(
      `SELECT * FROM prodesk_resources pr WHERE ${where} ORDER BY pr.created_at DESC LIMIT ? OFFSET ?`,
      [...vals, limit, offset]
    );

    return {
      status: true, code: 200, message: 'Resources fetched',
      data: rows || [],
      pagination: { total, current_page: page, per_page: limit, total_pages: Math.ceil(total / limit) }
    };
  } catch (error) {
    console.log('Error in getResourcesService::>>', error);
    return null;
  }
};

const getResourceCategoriesService = async (payload) => {
  try {
    console.log('Payload in getResourceCategoriesService::>>', payload);
    const { therapist_id } = payload;

    const [rows] = await db.query(
      `SELECT DISTINCT category FROM prodesk_resources
       WHERE (therapist_id = ? OR scope = 'catalogue') AND is_deleted = 0 AND category IS NOT NULL
       ORDER BY category ASC`,
      [therapist_id]
    );

    return {
      status: true, code: 200, message: 'Categories fetched',
      data: rows ? rows.map(r => r.category) : []
    };
  } catch (error) {
    console.log('Error in getResourceCategoriesService::>>', error);
    return null;
  }
};

const uploadResourceService = async (payload) => {
  try {
    console.log('Payload in uploadResourceService::>>', payload);
    const { therapist_id, title, type, category, file_url, size_bytes } = payload;

    if (!title || !type || !file_url) {
      return { status: false, code: 400, message: 'title, type and file_url are required', data: null };
    }

    const [result] = await db.query(
      `INSERT INTO prodesk_resources (therapist_id, title, type, category, scope, owner, file_url, size_bytes)
       VALUES (?, ?, ?, ?, 'mine', 'therapist', ?, ?)`,
      [therapist_id, title, type, category || null, file_url, size_bytes || null]
    );

    const [rows] = await db.query('SELECT * FROM prodesk_resources WHERE id = ?', [result.insertId]);
    return { status: true, code: 201, message: 'Resource uploaded', data: rows[0] };
  } catch (error) {
    console.log('Error in uploadResourceService::>>', error);
    return null;
  }
};

const updateResourceService = async (payload) => {
  try {
    console.log('Payload in updateResourceService::>>', payload);
    const { therapist_id, resource_id, title, category } = payload;

    const [check] = await db.query(
      'SELECT id, scope FROM prodesk_resources WHERE id = ? AND therapist_id = ?',
      [resource_id, therapist_id]
    );
    if (!check || !check.length) {
      return { status: false, code: 404, message: 'Resource not found', data: null };
    }
    if (check[0].scope === 'catalogue') {
      return { status: false, code: 403, message: 'Cannot edit catalogue resources', data: null };
    }

    const fields = []; const vals = [];
    if (title !== undefined) { fields.push('title = ?'); vals.push(title); }
    if (category !== undefined) { fields.push('category = ?'); vals.push(category); }
    if (!fields.length) {
      return { status: false, code: 400, message: 'No fields to update', data: null };
    }

    vals.push(resource_id);
    await db.query(`UPDATE prodesk_resources SET ${fields.join(', ')} WHERE id = ?`, vals);

    const [rows] = await db.query('SELECT * FROM prodesk_resources WHERE id = ?', [resource_id]);
    return { status: true, code: 200, message: 'Resource updated', data: rows[0] };
  } catch (error) {
    console.log('Error in updateResourceService::>>', error);
    return null;
  }
};

const deleteResourceService = async (payload) => {
  try {
    console.log('Payload in deleteResourceService::>>', payload);
    const { therapist_id, resource_id } = payload;

    const [check] = await db.query(
      'SELECT id, scope FROM prodesk_resources WHERE id = ? AND therapist_id = ?',
      [resource_id, therapist_id]
    );
    if (!check || !check.length) {
      return { status: false, code: 404, message: 'Resource not found', data: null };
    }
    if (check[0].scope === 'catalogue') {
      return { status: false, code: 403, message: 'Cannot delete catalogue resources', data: null };
    }

    await db.query('UPDATE prodesk_resources SET is_deleted = 1 WHERE id = ?', [resource_id]);
    return { status: true, code: 200, message: 'Resource deleted', data: null };
  } catch (error) {
    console.log('Error in deleteResourceService::>>', error);
    return null;
  }
};

const saveResourceToLibraryService = async (payload) => {
  try {
    console.log('Payload in saveResourceToLibraryService::>>', payload);
    const { therapist_id, resource_id } = payload;

    const [rows] = await db.query(
      "SELECT * FROM prodesk_resources WHERE id = ? AND scope = 'catalogue'",
      [resource_id]
    );
    if (!rows || !rows.length) {
      return { status: false, code: 404, message: 'Catalogue resource not found', data: null };
    }

    const src = rows[0];
    const [result] = await db.query(
      `INSERT INTO prodesk_resources (therapist_id, title, type, category, scope, owner, file_url, size_bytes)
       VALUES (?, ?, ?, ?, 'mine', 'therapist', ?, ?)`,
      [therapist_id, src.title, src.type, src.category, src.file_url, src.size_bytes]
    );

    const [newRows] = await db.query('SELECT * FROM prodesk_resources WHERE id = ?', [result.insertId]);
    return { status: true, code: 201, message: 'Saved to library', data: newRows[0] };
  } catch (error) {
    console.log('Error in saveResourceToLibraryService::>>', error);
    return null;
  }
};

// ─── SEND TO CLIENT (email / WhatsApp) ─────────────────────────────────────────

const fetchClientForSend = async (clientId) => {
  const [rows] = await db.query(
    `SELECT u.user_id, u.first_name, u.last_name, u.email, u.phone
     FROM prodesk_clients pc JOIN users u ON u.user_id = pc.user_id WHERE pc.id = ?`,
    [clientId]
  );
  return rows && rows.length ? rows[0] : null;
};

const fetchTherapistBrand = async (therapistId) => {
  const [rows] = await db.query(
    `SELECT u.email, COALESCE(tb.brand_name, 'PRODESK') AS brand_name
     FROM therapists t
     JOIN users u ON u.user_id = t.user_id
     LEFT JOIN therapist_branding tb ON tb.therapist_id = t.id
     WHERE t.id = ?`,
    [therapistId]
  );
  return rows && rows.length ? rows[0] : { brand_name: 'PRODESK', email: 'support@neure.co.in' };
};

const sendResourceEmail = async ({ resource, client, therapist }) => {
  const clinicName   = therapist.brand_name || 'Prodesk';
  const supportEmail = therapist.email || 'support@neure.co.in';

  const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
</head>
<body style="margin:0;padding:20px 0;background:#f4f4f4;font-family:Arial,sans-serif;">
<div style="max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #ddd;border-radius:10px;overflow:hidden;">

  <!-- HEADER -->
  <div style="background:#1a1a2e;padding:24px 28px;text-align:center;">
    <div style="font-size:18px;font-weight:700;color:#ffffff;letter-spacing:1px;">${clinicName}</div>
    <div style="font-size:11px;font-weight:700;letter-spacing:3px;color:#9898b8;text-transform:uppercase;margin-top:6px;">RESOURCE SHARED</div>
  </div>

  <!-- BODY -->
  <div style="padding:28px;">
    <p style="font-size:14px;color:#222;margin:0 0 12px;">Hi ${client.first_name},</p>
    <p style="font-size:14px;color:#222;margin:0 0 20px;">${clinicName} has shared a resource with you:</p>

    <div style="border:1px solid #d0d0d0;border-radius:8px;padding:16px;margin-bottom:24px;">
      <div style="font-size:15px;font-weight:700;color:#1a1a2e;">${resource.title}</div>
      <div style="font-size:12px;color:#666;margin-top:4px;">${resource.type}${resource.category ? ' · ' + resource.category : ''}</div>
    </div>

    <div style="text-align:center;margin:24px 0 8px;">
      <a href="${resource.file_url}"
         style="display:inline-block;padding:13px 32px;background:#1a1a2e;
                color:#ffffff;text-decoration:none;border-radius:8px;font-weight:700;font-size:14px;">
        &#128196; Open Resource
      </a>
    </div>
  </div>

  <!-- FOOTER -->
  <div style="background:#1a1a2e;padding:16px 28px;text-align:center;">
    <div style="font-size:12px;color:#9898b8;">
      ${clinicName} &nbsp;·&nbsp;
      <a href="mailto:${supportEmail}" style="color:#7c9cbf;text-decoration:none;">${supportEmail}</a>
    </div>
    <div style="font-size:10px;color:#555;margin-top:6px;">
      This is a computer-generated email and does not require a signature.
    </div>
  </div>

</div>
</body>
</html>`;

  try {
    const response = await axios.post(
      'https://api.brevo.com/v3/smtp/email',
      {
        sender: BREVO_SENDER,
        to: [{ email: client.email, name: `${client.first_name} ${client.last_name}` }],
        subject: `${clinicName} shared a resource with you: ${resource.title}`,
        htmlContent
      },
      { headers: { 'api-key': await getBrevoApiKey(), 'Content-Type': 'application/json' } }
    );
    console.log('Resource email sent via Brevo to', client.email, '| status:', response.status);
  } catch (err) {
    console.error('Brevo resource email error:', err.response?.data || err.message);
    throw new Error(err.response?.data?.message || err.message);
  }
};

const sendResourceWhatsApp = async ({ resource, client, therapist, therapist_id }) => {
  const rawPhone = (client.phone || '').replace(/\D/g, '');
  if (!rawPhone) throw new Error('Client has no phone number on file');
  const to = rawPhone.startsWith('91') ? rawPhone : `91${rawPhone}`;

  // WhatsApp renders template links as raw plain text, so the long signed S3
  // URL shows up huge and ugly — shorten it. Falls back to the real URL if
  // shortening fails for any reason, rather than silently dropping the link.
  const shortUrl = await createShortLinkService({ target_url: resource.file_url, therapist_id });
  const resourceLink = shortUrl || resource.file_url;

  await NotificationService.sendWhatsAppNotification({
    to,
    templateName: RESOURCE_WHATSAPP_TEMPLATE,
    variables: [client.first_name, therapist.brand_name, resource.title, resourceLink],
    meta: { resource_id: resource.id }
  });
};

const sendResourceService = async (payload) => {
  try {
    console.log('Payload in sendResourceService::>>', payload);
    const { therapist_id, resource_id, client_id, channels } = payload;

    if (!resource_id || !client_id || !Array.isArray(channels) || !channels.length) {
      return { status: false, code: 400, message: 'resource_id, client_id and channels are required', data: null };
    }

    const [rows] = await db.query(
      `SELECT * FROM prodesk_resources WHERE id = ? AND (therapist_id = ? OR scope = 'catalogue') AND is_deleted = 0`,
      [resource_id, therapist_id]
    );
    const resource = rows && rows.length ? rows[0] : null;
    if (!resource) return { status: false, code: 404, message: 'Resource not found', data: null };
    if (!resource.file_url) return { status: false, code: 409, message: 'Resource has no file to share', data: null };

    const client = await fetchClientForSend(client_id);
    if (!client) return { status: false, code: 404, message: 'Client not found', data: null };

    const therapist = await fetchTherapistBrand(therapist_id);

    const sent = []; const failed = [];

    if (channels.includes('email')) {
      if (!client.email) {
        failed.push({ channel: 'email', reason: 'Client has no email on file' });
      } else {
        try {
          await sendResourceEmail({ resource, client, therapist });
          sent.push('email');
        } catch (e) {
          failed.push({ channel: 'email', reason: e.message });
        }
      }
    }

    if (channels.includes('whatsapp')) {
      try {
        await sendResourceWhatsApp({ resource, client, therapist, therapist_id });
        sent.push('whatsapp');
      } catch (e) {
        failed.push({ channel: 'whatsapp', reason: e.message });
      }
    }

    if (!sent.length) {
      return {
        status: false, code: 502,
        message: failed.map((f) => `${f.channel}: ${f.reason}`).join('; ') || 'Send failed',
        data: { sent, failed }
      };
    }

    return {
      status: true, code: 200,
      message: `Resource sent via ${sent.join(' & ')}`,
      data: { sent, failed }
    };
  } catch (error) {
    console.log('Error in sendResourceService::>>', error);
    return null;
  }
};

module.exports = {
  getResourcesService,
  getResourceCategoriesService,
  uploadResourceService,
  updateResourceService,
  deleteResourceService,
  saveResourceToLibraryService,
  sendResourceService,
  sendResourceEmail
};
