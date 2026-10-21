const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const db = require('../../../config/db');

// Neure logo (white) from api/templates/assets, embedded so the PDF never depends on the network
let LOGO_DATA_URI = '';
try {
  LOGO_DATA_URI = 'data:image/png;base64,' +
    fs.readFileSync(path.join(__dirname, '../../../templates/assets/neure-white-strip-logo.png')).toString('base64');
} catch (e) {
  console.log('Note export logo not loaded:', e.message);
}

const TEAL = '#4a8782';
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const esc = (v) => String(v == null ? '' : v)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

// starts_at is a naive IST wall-clock string ("2026-10-12 16:00:00") — format it as-is, no timezone maths.
const fmtDate = (s) => {
  const m = String(s || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${parseInt(m[3], 10)} ${MONTHS[parseInt(m[2], 10) - 1]} ${m[1]}` : '—';
};
const fmtTime = (s) => {
  const m = String(s || '').match(/(\d{2}):(\d{2})/);
  if (!m) return '—';
  let h = parseInt(m[1], 10);
  const ap = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m[2]} ${ap}`;
};
const MODALITY = { video: 'Video', phone: 'Phone', in_person: 'In person' };

const buildNoteHtml = ({ clientName, startsAt, modality, title, body }) => `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<style>
  @page { size: A4; margin: 14mm 0 16mm 0; }
  @page :first { margin-top: 0; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: Arial, Helvetica, sans-serif; color: #111; }
  .band { background: ${TEAL}; color: #fff; padding: 22px 36px; display: flex; align-items: center; justify-content: space-between; }
  .band h1 { margin: 0; font-size: 26px; font-weight: 700; }
  .brand { display: flex; align-items: center; gap: 8px; }
  .brand img { height: 40px; width: 40px; }
  .brand .name { font-size: 22px; font-weight: 700; line-height: 1; }
  .brand .by { font-size: 9px; opacity: .85; margin-top: 3px; }
  .meta { display: flex; justify-content: space-between; padding: 22px 36px 0; font-size: 15px; line-height: 1.7; }
  .meta .fmt { font-weight: 700; font-size: 14px; }
  .client { text-align: center; font-size: 28px; font-weight: 700; margin: 4px 36px 0; }
  .rule { border-top: 4px solid #111; margin: 12px 36px 22px; }
  .title { margin: 0 36px 10px; font-size: 16px; font-weight: 700; }
  .body { margin: 0 36px; font-size: 14.5px; line-height: 1.6; white-space: pre-wrap; word-wrap: break-word; }
</style></head>
<body>
  <div class="band">
    <h1>Session notes</h1>
    <div class="brand">
      ${LOGO_DATA_URI ? `<img src="${LOGO_DATA_URI}" alt="" />` : ''}
      <div><div class="name">ProDesk</div><div class="by">by Neure</div></div>
    </div>
  </div>
  <div class="meta">
    <div>Session Date : ${esc(fmtDate(startsAt))}<br>Session Time : ${esc(fmtTime(startsAt))}</div>
    <div class="fmt">Session format : ${esc(MODALITY[modality] || modality || '—')}</div>
  </div>
  <div class="client">${esc(clientName)}</div>
  <div class="rule"></div>
  ${title ? `<div class="title">${esc(title)}</div>` : ''}
  <div class="body">${esc(body)}</div>
</body></html>`;

const generateNotePdf = async (html) => {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage']
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    // puppeteer returns a Uint8Array; Express would JSON-encode that, so hand back a real Buffer
    return Buffer.from(await page.pdf({
      printBackground: true,
      preferCSSPageSize: true,
      displayHeaderFooter: true,
      headerTemplate: '<span></span>',
      footerTemplate: '<div style="width:100%;text-align:center;font-size:8.5px;font-style:italic;color:#8a8a8a;font-family:Arial,Helvetica,sans-serif;padding:0 36px;">*ProDesk is not responsible for the content of these session notes and only provides a PDF copy of the information entered by the user.</div>'
    }));
  } finally {
    if (browser) await browser.close();
  }
};

// Builds the PDF for a session's note. Only the therapist who owns the session can export it.
// Nothing is stored — the PDF is generated on the fly and streamed back.
const exportNotePdfService = async ({ therapist_id, session_id }) => {
  try {
    const [rows] = await db.query(
      `SELECT s.starts_at, s.modality, s.session_number,
              CONCAT(u.first_name, ' ', u.last_name) AS client_name,
              n.title, n.body
       FROM prodesk_sessions s
       JOIN prodesk_clients pc ON pc.id = s.client_id
       JOIN users u ON u.user_id = pc.user_id
       LEFT JOIN prodesk_session_notes n ON n.session_id = s.id AND n.therapist_id = s.therapist_id
       WHERE s.id = ? AND s.therapist_id = ?`,
      [session_id, therapist_id]
    );
    if (!rows || !rows.length) return { status: false, code: 404, message: 'Session not found', data: null };
    const r = rows[0];
    if (!r.body || !String(r.body).trim())
      return { status: false, code: 404, message: 'There are no session notes to export yet', data: null };

    const html = buildNoteHtml({
      clientName: r.client_name, startsAt: r.starts_at, modality: r.modality, title: r.title, body: r.body
    });
    const buffer = await generateNotePdf(html);
    const safeName = String(r.client_name).replace(/[^A-Za-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'Client';
    return { status: true, code: 200, message: 'PDF ready', data: { buffer, filename: `${safeName}-Session-${r.session_number || ''}`.replace(/-Session-$/, '-Session') + '.pdf' } };
  } catch (error) {
    console.log('Error in exportNotePdfService::>>', error);
    return null;
  }
};

module.exports = { exportNotePdfService, buildNoteHtml, generateNotePdf };
