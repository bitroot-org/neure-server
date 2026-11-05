const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const puppeteer = require('puppeteer');
const db = require('../../../config/db');
const { s3Client } = require('../../../config/s3Client');
const { PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');

// ─── Link-preview image for a therapist's public booking link ────────────────
// The picture shown when the booking link is shared (WhatsApp etc.):
//     Booking link of
//     <Therapist name>
//     from <Clinic name>        <- only when a real clinic name is set
// Generated from the therapist's name, stored on S3, and its link kept in therapists.booking_preview_url.

const WIDTH = 1200;
const HEIGHT = 630;
const S3_PREFIX = 'prodesk/booking-previews/';

// Fonts are bundled (api/templates/assets/fonts) and embedded, so generating never needs the internet
const FONT_DIR = path.join(__dirname, '../../../templates/assets/fonts');
const fontFace = (file, weight) => {
  try {
    const b64 = fs.readFileSync(path.join(FONT_DIR, file)).toString('base64');
    return `@font-face{font-family:'IBM Plex Sans';font-weight:${weight};src:url(data:font/ttf;base64,${b64}) format('truetype');}`;
  } catch (e) {
    console.log('Booking preview font missing:', file, e.message);
    return '';
  }
};
const FONT_CSS = [fontFace('IBMPlexSans-Light.ttf', 300), fontFace('IBMPlexSans-Regular.ttf', 400), fontFace('IBMPlexSans-Bold.ttf', 700)].join('\n');

const esc = (v) => String(v == null ? '' : v)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

// The brand name starts out as "ProDesk" for every account — that is not a real clinic name
const realClinicName = (brandName) => {
  const c = String(brandName || '').trim();
  if (!c || /^prodesk$/i.test(c)) return '';
  return c;
};

const buildPreviewHtml = ({ name, clinic }) => `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>
${FONT_CSS}
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:${WIDTH}px;height:${HEIGHT}px;overflow:hidden}
body{
  font-family:'IBM Plex Sans',Arial,Helvetica,sans-serif;color:#fff;background:#101216;position:relative;
  background-image:
    radial-gradient(820px 560px at 12% -6%, rgba(60,90,88,.92), rgba(60,90,88,0) 70%),
    radial-gradient(700px 470px at 96% 104%, rgba(46,57,76,.78), rgba(46,57,76,0) 70%);
}
.wrap{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:0 70px 28px}
.pre{font-weight:300;font-size:40px;color:#c9cdd3;line-height:1.2}
.name{font-weight:700;color:#fff;line-height:1.08;margin-top:4px;max-width:1060px;word-break:break-word}
.clinic{font-weight:400;color:#fff;margin-top:30px;line-height:1.2;max-width:1060px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
</style></head><body>
<div class="wrap">
  <div class="pre">Booking link of</div>
  <div class="name" id="name">${esc(name)}</div>
  ${clinic ? `<div class="clinic" id="clinic">from ${esc(clinic)}</div>` : ''}
</div>
<script>
  // Long names: shrink one line to fit; if it is still too long, let it wrap onto two lines
  (function(){
    const name=document.getElementById('name'); const MAX=1060;
    let size=116; name.style.fontSize=size+'px'; name.style.whiteSpace='nowrap';
    while(name.scrollWidth>MAX && size>66){size-=2;name.style.fontSize=size+'px';}
    if(name.scrollWidth>MAX){name.style.whiteSpace='normal';name.style.maxWidth=MAX+'px';name.style.fontSize='64px';}
    const clinic=document.getElementById('clinic');
    if(clinic){let s=38;clinic.style.fontSize=s+'px';while(clinic.scrollWidth>clinic.clientWidth&&s>24){s-=1;clinic.style.fontSize=s+'px';}}
  })();
</script>
</body></html>`;

const renderPng = async (html) => {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: WIDTH, height: HEIGHT, deviceScaleFactor: 1 });
    await page.setContent(html, { waitUntil: 'networkidle0' });
    await page.evaluate(() => document.fonts.ready);
    return Buffer.from(await page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT } }));
  } finally {
    if (browser) await browser.close();
  }
};

const publicUrl = (key) =>
  `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION || 'ap-south-1'}.amazonaws.com/${key}`;

const keyFromUrl = (url) => {
  const m = String(url || '').match(/amazonaws\.com\/(.+)$/);
  return m && m[1].startsWith(S3_PREFIX) ? m[1] : null;
};

// Makes (or re-makes) the preview image for one therapist and saves its link. Returns the new URL, or null.
const generateBookingPreview = async (therapist_id) => {
  try {
    const [rows] = await db.query(
      `SELECT t.booking_preview_url, u.first_name, u.last_name, b.brand_name
       FROM therapists t
       JOIN users u ON u.user_id = t.user_id
       LEFT JOIN therapist_branding b ON b.therapist_id = t.id
       WHERE t.id = ?`,
      [therapist_id]
    );
    if (!rows || !rows.length) return null;
    const r = rows[0];
    const name = `${r.first_name || ''} ${r.last_name || ''}`.replace(/\s+/g, ' ').trim();
    if (!name) return null;
    const clinic = realClinicName(r.brand_name);

    const png = await renderPng(buildPreviewHtml({ name, clinic }));

    // A fresh file name every time, so WhatsApp and other apps never show an old cached picture
    const hash = crypto.createHash('sha1').update(`${name}|${clinic}|${Date.now()}`).digest('hex').slice(0, 10);
    const key = `${S3_PREFIX}${therapist_id}-${hash}.png`;
    await s3Client.send(new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
      Body: png,
      ContentType: 'image/png',
      CacheControl: 'public, max-age=31536000, immutable'
    }));
    const url = publicUrl(key);
    await db.query('UPDATE therapists SET booking_preview_url = ? WHERE id = ?', [url, therapist_id]);

    // Remove the previous picture (best effort)
    const oldKey = keyFromUrl(r.booking_preview_url);
    if (oldKey && oldKey !== key) {
      s3Client.send(new DeleteObjectCommand({ Bucket: process.env.AWS_BUCKET_NAME, Key: oldKey }))
        .catch((e) => console.log('Old booking preview not deleted (non-fatal):', e.message));
    }
    return url;
  } catch (error) {
    console.log('Error in generateBookingPreview::>>', therapist_id, error.message);
    return null;
  }
};

// ── Background scheduling ────────────────────────────────────────────────────
// Name / clinic-name edits can fire several times in a row (the clinic name autosaves while typing),
// so a request waits a few seconds and only the last one runs. Runs one at a time so we never open
// several browsers at once. Always fire-and-forget: it never delays or fails the request that asked for it.
const timers = new Map();
let chain = Promise.resolve();

const scheduleBookingPreview = (therapist_id, delayMs = 8000) => {
  if (!therapist_id) return;
  clearTimeout(timers.get(therapist_id));
  timers.set(therapist_id, setTimeout(() => {
    timers.delete(therapist_id);
    chain = chain.then(() => generateBookingPreview(therapist_id)).catch(() => {});
  }, delayMs));
};

module.exports = { generateBookingPreview, scheduleBookingPreview, buildPreviewHtml, renderPng, realClinicName };
