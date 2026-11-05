const zlib = require('zlib');
const puppeteer = require('puppeteer');
const db = require('../../../config/db');
const { buildNoteHtml } = require('./noteExportService');
const { s3Client } = require('../../../config/s3Client');
const { GetObjectCommand } = require('@aws-sdk/client-s3');
const { keyFromUrl } = require('./privacyService');

// ─── "Download all my data" (DPDP) ───────────────────────────────────────────
// One zip with everything a therapist holds in ProDesk:
//   clients.csv, sessions.csv, invoices.csv  and  session-notes/<client>/<date>-<session>.pdf
// Built on the fly and sent straight back; nothing is stored.

const MAX_NOTES = 2000;
const MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024;       // one file
const MAX_ATTACHMENTS_TOTAL = 200 * 1024 * 1024;     // all files together

// ── tiny zip writer (no extra package needed) ───────────────────────────────
const dosDateTime = (d = new Date()) => ({
  time: (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1),
  date: ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate()
});

const makeZip = (files) => {
  const { time, date } = dosDateTime();
  const parts = [];
  const central = [];
  let offset = 0;
  for (const f of files) {
    const name = Buffer.from(f.name, 'utf8');
    const data = Buffer.isBuffer(f.data) ? f.data : Buffer.from(f.data, 'utf8');
    const deflated = zlib.deflateRawSync(data);
    const useDeflate = deflated.length < data.length;
    const body = useDeflate ? deflated : data;
    const crc = zlib.crc32(data);

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6);                 // UTF-8 names
    local.writeUInt16LE(useDeflate ? 8 : 0, 8);
    local.writeUInt16LE(time, 10);
    local.writeUInt16LE(date, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(body.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(name.length, 26);
    local.writeUInt16LE(0, 28);
    parts.push(local, name, body);

    const cd = Buffer.alloc(46);
    cd.writeUInt32LE(0x02014b50, 0);
    cd.writeUInt16LE(20, 4);
    cd.writeUInt16LE(20, 6);
    cd.writeUInt16LE(0x0800, 8);
    cd.writeUInt16LE(useDeflate ? 8 : 0, 10);
    cd.writeUInt16LE(time, 12);
    cd.writeUInt16LE(date, 14);
    cd.writeUInt32LE(crc, 16);
    cd.writeUInt32LE(body.length, 20);
    cd.writeUInt32LE(data.length, 24);
    cd.writeUInt16LE(name.length, 28);
    cd.writeUInt32LE(offset, 42);
    central.push(cd, name);
    offset += local.length + name.length + body.length;
  }
  const centralBuf = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(centralBuf.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...parts, centralBuf, end]);
};

// ── CSV ──────────────────────────────────────────────────────────────────────
// Cells starting with = + - @ are prefixed so a spreadsheet never runs them as a formula.
const cell = (v) => {
  if (v === null || v === undefined) return '';
  let s = v instanceof Date ? v.toISOString() : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const toCsv = (headers, rows) =>
  '﻿' + [headers.join(','), ...rows.map((r) => headers.map((h) => cell(r[h])).join(','))].join('\r\n') + '\r\n';

const safe = (s, fallback = 'Client') => String(s || '').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || fallback;

const buildAllDataZip = async ({ therapist_id }) => {
  const [clients] = await db.query(
    `SELECT pc.id, CONCAT(u.first_name, ' ', u.last_name) AS name, u.email, u.phone, pc.age, pc.gender, pc.city,
            pc.emergency_contact, pc.status, pc.start_date, pc.presenting_concerns, pc.treatment_given, pc.default_fee, pc.created_at
     FROM prodesk_clients pc JOIN users u ON u.user_id = pc.user_id
     WHERE pc.therapist_id = ? AND pc.is_confirmed = 1 AND pc.deleted_at IS NULL ORDER BY pc.id`,
    [therapist_id]
  );
  const [sessions] = await db.query(
    `SELECT s.id, CONCAT(u.first_name, ' ', u.last_name) AS client, s.session_number, s.title, s.starts_at, s.duration_min,
            s.modality, s.status, s.fee
     FROM prodesk_sessions s JOIN prodesk_clients pc ON pc.id = s.client_id JOIN users u ON u.user_id = pc.user_id
     WHERE s.therapist_id = ? AND pc.deleted_at IS NULL ORDER BY s.starts_at`,
    [therapist_id]
  );
  const [invoices] = await db.query(
    `SELECT pi.invoice_number, CONCAT(u.first_name, ' ', u.last_name) AS client, pi.issue_date, pi.due_date,
            pi.subtotal, pi.tax_percent, pi.tax, pi.total, pi.currency, pi.status, pi.paid_at, pi.notes
     FROM prodesk_invoices pi JOIN prodesk_clients pc ON pc.id = pi.client_id JOIN users u ON u.user_id = pc.user_id
     WHERE pi.therapist_id = ? ORDER BY pi.id`,
    [therapist_id]
  );
  const [notes] = await db.query(
    `SELECT s.starts_at, s.modality, s.session_number, s.title AS session_title,
            CONCAT(u.first_name, ' ', u.last_name) AS client_name, n.title, n.body
     FROM prodesk_session_notes n
     JOIN prodesk_sessions s ON s.id = n.session_id
     JOIN prodesk_clients pc ON pc.id = s.client_id AND pc.deleted_at IS NULL
     JOIN users u ON u.user_id = pc.user_id
     WHERE n.therapist_id = ? AND n.body IS NOT NULL AND TRIM(n.body) <> ''
     ORDER BY s.starts_at LIMIT ?`,
    [therapist_id, MAX_NOTES]
  );

  const files = [
    { name: 'clients.csv', data: toCsv(['id', 'name', 'email', 'phone', 'age', 'gender', 'city', 'emergency_contact', 'status', 'start_date', 'presenting_concerns', 'treatment_given', 'default_fee', 'created_at'], clients) },
    { name: 'sessions.csv', data: toCsv(['id', 'client', 'session_number', 'title', 'starts_at', 'duration_min', 'modality', 'status', 'fee'], sessions) },
    { name: 'invoices.csv', data: toCsv(['invoice_number', 'client', 'issue_date', 'due_date', 'subtotal', 'tax_percent', 'tax', 'total', 'currency', 'status', 'paid_at', 'notes'], invoices) }
  ];

  // One browser for every note, not one per PDF
  let pdfCount = 0;
  if (notes.length) {
    let browser;
    try {
      browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage'] });
      const page = await browser.newPage();
      const used = new Set();
      for (const n of notes) {
        const html = buildNoteHtml({ clientName: n.client_name, startsAt: n.starts_at, modality: n.modality, sessionTitle: n.session_title, title: n.title, body: n.body });
        await page.setContent(html, { waitUntil: 'load' });
        const pdf = Buffer.from(await page.pdf({
          printBackground: true, preferCSSPageSize: true, displayHeaderFooter: true, headerTemplate: '<span></span>',
          footerTemplate: '<div style="width:100%;text-align:center;font-size:8.5px;font-style:italic;color:#8a8a8a;font-family:Arial,Helvetica,sans-serif;padding:0 36px;">*ProDesk is not responsible for the content of these session notes and only provides a PDF copy of the information entered by the user.</div>'
        }));
        const day = String(n.starts_at || '').slice(0, 10) || 'undated';
        let path = `session-notes/${safe(n.client_name)}/${day}-Session-${n.session_number || ''}.pdf`;
        for (let i = 2; used.has(path); i++) path = path.replace(/(-\d+)?\.pdf$/, `-${i}.pdf`);
        used.add(path);
        files.push({ name: path, data: pdf });
        pdfCount++;
      }
    } finally {
      if (browser) await browser.close();
    }
  }

  // Files attached to notes (downloaded from storage). Anything too large is listed in README instead of included.
  const [atts] = await db.query(
    `SELECT a.file_name, a.file_url, a.size_bytes, CONCAT(u.first_name, ' ', u.last_name) AS client_name, s.starts_at
     FROM prodesk_note_attachments a
     JOIN prodesk_session_notes n ON n.id = a.note_id
     JOIN prodesk_sessions s ON s.id = n.session_id
     JOIN prodesk_clients pc ON pc.id = s.client_id AND pc.deleted_at IS NULL
     JOIN users u ON u.user_id = pc.user_id
     WHERE n.therapist_id = ? ORDER BY a.id`,
    [therapist_id]
  );
  let attCount = 0;
  let attBytes = 0;
  const skipped = [];
  const usedAtt = new Set();
  for (const a of atts) {
    const Key = keyFromUrl(a.file_url);
    if (!Key || (a.size_bytes && a.size_bytes > MAX_ATTACHMENT_BYTES) || attBytes + (a.size_bytes || 0) > MAX_ATTACHMENTS_TOTAL) { skipped.push(a.file_name); continue; }
    try {
      const obj = await s3Client.send(new GetObjectCommand({ Bucket: process.env.AWS_BUCKET_NAME, Key }));
      const data = Buffer.from(await obj.Body.transformToByteArray());
      attBytes += data.length;
      let path = `attachments/${safe(a.client_name)}/${String(a.starts_at || '').slice(0, 10)}-${String(a.file_name).replace(/[\\/:*?"<>|]+/g, '_')}`;
      for (let i = 2; usedAtt.has(path); i++) path = path.replace(/(-\d+)?(\.[^.]*)?$/, (m, n, ext) => `-${i}${ext || ''}`);
      usedAtt.add(path);
      files.push({ name: path, data });
      attCount++;
    } catch (e) {
      console.log('Export: attachment not included::>>', a.file_name, e.message);
      skipped.push(a.file_name);
    }
  }

  files.unshift({
    name: 'README.txt',
    data: `ProDesk data export\r\nCreated: ${new Date().toISOString()}\r\n\r\n` +
      `clients.csv   ${clients.length} clients\r\nsessions.csv  ${sessions.length} sessions\r\n` +
      `invoices.csv  ${invoices.length} invoices\r\nsession-notes/  ${pdfCount} session notes (PDF), one folder per client\r\n` +
      `attachments/  ${attCount} files attached to notes\r\n` +
      (skipped.length ? `\r\nNot included (too large or unavailable): ${skipped.join(', ')}\r\n` : '') +
      (notes.length >= MAX_NOTES ? `\r\nOnly the first ${MAX_NOTES} session notes are included.\r\n` : '')
  });

  return { buffer: makeZip(files), counts: { clients: clients.length, sessions: sessions.length, invoices: invoices.length, notes: pdfCount, attachments: attCount } };
};

module.exports = { buildAllDataZip, makeZip, toCsv };
