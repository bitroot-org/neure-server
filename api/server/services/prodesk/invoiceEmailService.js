const puppeteer = require('puppeteer');
const axios = require('axios');
const { s3Client } = require('../../../config/s3Client');
const { PutObjectCommand } = require('@aws-sdk/client-s3');
const NotificationService = require('../notificationsAndAnnouncements/notificationService');

const LOGO_URL = 'https://neure-staging.s3.ap-south-1.amazonaws.com/prodesk/assets/neure-white-strip-logo.png';

const TERMS = `
  <ul style="margin:0;padding-left:18px;list-style:disc;">
    <li>Payment is due as per the agreed fee schedule.</li>
    <li>Services are billed for sessions conducted and professional services rendered.</li>
    <li>Cancellation and refund matters are governed by the practitioner's policies.</li>
    <li>Limited client information may be displayed to maintain confidentiality.</li>
  </ul>
`;

const MSG91_INVOICE_TEMPLATE = 'neure_invoice1';

const BREVO_SENDER = { name: 'Neure', email: 'varun@neure.co.in' };

const db = require('../../../config/db');
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

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const formatDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatINR = (n) =>
  parseFloat(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ─── HTML TEMPLATE ────────────────────────────────────────────────────────────
// forPDF = true  → no download button (the PDF itself is the download)
// forPDF = false → shows "Download Invoice PDF" button

const buildInvoiceHTML = ({ invoice, client, therapist, forPDF = false }) => {
  const lineItems = Array.isArray(invoice.line_items)
    ? invoice.line_items
    : JSON.parse(invoice.line_items || '[]');

  const clinicName   = therapist.brand_name || 'NEURE INNOVATIONS LLP';
  const supportEmail = therapist.email || 'support@neure.co.in';
  const hasGST       = parseFloat(invoice.tax_percent) > 0 && parseFloat(invoice.tax) > 0;

  const TD  = 'padding:10px 14px;border:1px solid #d0d0d0;font-size:13px;color:#222;';
  const TDC = TD + 'text-align:center;';
  const TDR = TD + 'text-align:right;';
  const TH  = 'padding:10px 14px;border:1px solid #d0d0d0;font-size:12px;font-weight:700;background:#f5f5f5;color:#333;text-align:center;';

  const lineRows = lineItems.map((item, i) => `
    <tr>
      <td style="${TDC}">${i + 1}</td>
      <td style="${TD}">${item.description}</td>
      <td style="${TDC}">${item.duration || '—'}</td>
      <td style="${TDR}">₹${formatINR(item.amount != null ? item.amount : item.qty * item.rate)}</td>
    </tr>`).join('');

  const gstRow = hasGST ? `
    <tr>
      <td style="${TDC}"></td>
      <td style="${TD}">GST (${invoice.tax_percent}%)</td>
      <td style="${TDC}">${invoice.tax_percent}%</td>
      <td style="${TDR}">₹${formatINR(invoice.tax)}</td>
    </tr>` : '';

  const totalRow = `
    <tr style="background:#f9f9f9;">
      <td style="${TDC}"></td>
      <td style="${TD}font-weight:700;">Grand total</td>
      <td style="${TDC}"></td>
      <td style="${TDR}font-weight:700;font-size:14px;">₹${formatINR(invoice.total)}</td>
    </tr>`;

  const logoHtml = `<img src="${LOGO_URL}" alt="Neure" style="height:64px;margin-bottom:6px;" />`;

  const downloadBtn = (!forPDF && invoice.invoice_pdf_url) ? `
    <div style="text-align:center;margin:24px 0 8px;">
      <a href="${invoice.invoice_pdf_url}"
         style="display:inline-block;padding:13px 32px;background:#1a1a2e;
                color:#ffffff;text-decoration:none;border-radius:8px;font-weight:700;font-size:14px;">
        &#128196; Download Invoice PDF
      </a>
    </div>` : '';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
</head>
<body style="margin:0;padding:${forPDF ? '24px' : '20px 0'};background:#f4f4f4;font-family:Arial,sans-serif;">
<div style="max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #ddd;
            border-radius:${forPDF ? '0' : '10px'};overflow:hidden;">

  <!-- HEADER -->
  <div style="background:#1a1a2e;padding:24px 28px;text-align:center;">
    ${logoHtml}
    <div style="font-size:11px;font-weight:700;letter-spacing:3px;color:#9898b8;text-transform:uppercase;">TAX INVOICE</div>
  </div>

  <!-- INVOICE META -->
  <div style="padding:20px 28px;border-bottom:2px solid #1a1a2e;">
    <table style="width:100%;border-collapse:collapse;">
      <tr>
        <td style="vertical-align:top;width:55%;">
          <div style="font-size:11px;font-weight:700;letter-spacing:1px;color:#888;text-transform:uppercase;margin-bottom:4px;">FROM</div>
          <div style="font-size:15px;font-weight:700;color:#1a1a2e;">${clinicName}</div>
          <div style="font-size:12px;color:#666;margin-top:2px;">${supportEmail}</div>
        </td>
        <td style="vertical-align:top;text-align:right;">
          <div style="font-size:11px;font-weight:700;letter-spacing:1px;color:#888;text-transform:uppercase;margin-bottom:4px;">INVOICE NO.</div>
          <div style="font-size:15px;font-weight:700;color:#1a1a2e;">${invoice.invoice_number}</div>
          <div style="font-size:12px;color:#666;margin-top:6px;">
            <span style="font-weight:700;">Issue date:</span> ${formatDate(invoice.issue_date)}
          </div>
          ${invoice.due_date ? `<div style="font-size:12px;color:#c0603a;margin-top:2px;">
            <span style="font-weight:700;">Due date:</span> ${formatDate(invoice.due_date)}
          </div>` : ''}
        </td>
      </tr>
    </table>
  </div>

  <!-- BILLING TO -->
  <div style="padding:16px 28px;border-bottom:1px solid #eee;background:#fafafa;">
    <div style="font-size:11px;font-weight:700;letter-spacing:1px;color:#888;text-transform:uppercase;margin-bottom:6px;">BILLED TO</div>
    <div style="font-size:14px;font-weight:700;color:#1a1a2e;">${client.first_name} ${client.last_name}</div>
    ${client.phone ? `<div style="font-size:12px;color:#555;margin-top:2px;">${client.phone}</div>` : ''}
    <div style="font-size:12px;color:#555;margin-top:2px;">${client.email}</div>
  </div>

  <!-- LINE ITEMS TABLE -->
  <div style="padding:20px 28px;">
    <table style="width:100%;border-collapse:collapse;border:1px solid #d0d0d0;">
      <thead>
        <tr>
          <th style="${TH}width:50px;">Sr. No</th>
          <th style="${TH}text-align:left;">Description</th>
          <th style="${TH}width:90px;">Duration</th>
          <th style="${TH}width:100px;">Fees</th>
        </tr>
      </thead>
      <tbody>
        ${lineRows}
        ${gstRow}
        ${totalRow}
      </tbody>
    </table>
  </div>

  <!-- NOTES -->
  ${invoice.notes ? `
  <div style="padding:0 28px 16px;">
    <div style="font-size:11px;font-weight:700;letter-spacing:1px;color:#888;text-transform:uppercase;margin-bottom:6px;">NOTES</div>
    <p style="font-size:13px;color:#555;margin:0;font-style:italic;">${invoice.notes}</p>
  </div>` : ''}

  <!-- DOWNLOAD BUTTON (email only) -->
  ${downloadBtn}

  <!-- TERMS & CONDITIONS -->
  <div style="padding:16px 28px;border-top:1px solid #eee;background:#fafafa;">
    <div style="font-size:11px;font-weight:700;letter-spacing:1px;color:#888;text-transform:uppercase;margin-bottom:8px;">TERMS AND CONDITIONS</div>
    <div style="font-size:12px;color:#666;line-height:1.7;">${TERMS}</div>
  </div>

  <!-- FOOTER -->
  <div style="background:#1a1a2e;padding:16px 28px;text-align:center;">
    <div style="font-size:12px;color:#9898b8;">
      ${clinicName} &nbsp;·&nbsp;
      <a href="mailto:${supportEmail}" style="color:#7c9cbf;text-decoration:none;">${supportEmail}</a>
    </div>
    <div style="font-size:10px;color:#555;margin-top:6px;">
      This is a computer-generated invoice and does not require a signature.
    </div>
  </div>

</div>
</body>
</html>`;
};

// ─── PDF GENERATION ───────────────────────────────────────────────────────────

const generatePDF = async (html) => {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      cacheDirectory: process.env.PUPPETEER_CACHE_DIR || '/opt/render/.cache/puppeteer',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage']
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0', bottom: '0', left: '0', right: '0' }
    });
    return pdf;
  } finally {
    if (browser) await browser.close();
  }
};

// ─── S3 UPLOAD ────────────────────────────────────────────────────────────────

const uploadPDFToS3 = async (pdfBuffer, invoiceNumber) => {
  const key = `prodesk/invoices/${invoiceNumber}.pdf`;
  await s3Client.send(new PutObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
    Body: pdfBuffer,
    ContentType: 'application/pdf',
    ContentDisposition: `attachment; filename="${invoiceNumber}.pdf"`
  }));
  return `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION || 'ap-south-1'}.amazonaws.com/${key}`;
};

// ─── SHORT REDIRECT URL ───────────────────────────────────────────────────────
// Builds an internal redirect URL — instant 302, no interstitial, your own domain.
// Route: GET /api/prodesk/i/:invoice_number → redirects to S3 PDF

const getInvoiceShortUrl = (invoiceNumber) => {
  return `https://neure-api.bitroot.org/api/prodesk/i/${invoiceNumber}`;
};

// ─── EMAIL (via Brevo) ────────────────────────────────────────────────────────

const sendInvoiceEmail = async ({ invoice, client, therapist, pdfUrl }) => {
  const invoiceWithUrl = { ...invoice, invoice_pdf_url: pdfUrl };
  const htmlContent = buildInvoiceHTML({ invoice: invoiceWithUrl, client, therapist, forPDF: false });
  const clinicName = therapist.brand_name || 'Neure';

  try {
    const response = await axios.post(
      'https://api.brevo.com/v3/smtp/email',
      {
        sender: { name: 'Neure Invoice', email: BREVO_SENDER.email },
        to: [{ email: client.email, name: `${client.first_name} ${client.last_name}` }],
        subject: `Invoice ${invoice.invoice_number} from ${clinicName} — INR ${formatINR(invoice.total)}`,
        htmlContent
      },
      {
        headers: {
          'api-key': await getBrevoApiKey(),
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('Invoice email sent via Brevo to', client.email, '| status:', response.status);
  } catch (err) {
    console.error('Brevo invoice email error:', err.response?.data || err.message);
    throw new Error(`Brevo email failed: ${err.response?.data?.message || err.message}`);
  }
};

// ─── WHATSAPP ─────────────────────────────────────────────────────────────────

const sendInvoiceWhatsApp = async ({ invoice, client, pdfUrl }) => {
  const rawPhone = (client.phone || '').replace(/\D/g, '');
  if (!rawPhone) {
    console.log('No phone number for client — skipping WhatsApp');
    return;
  }
  const to = rawPhone.startsWith('91') ? rawPhone : `91${rawPhone}`;
  const dueDate = invoice.due_date
    ? new Date(invoice.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : 'N/A';

  const shortUrl = getInvoiceShortUrl(invoice.invoice_number);

  await NotificationService.sendWhatsAppNotification({
    to,
    templateName: MSG91_INVOICE_TEMPLATE,
    variables: [
      client.first_name,
      invoice.invoice_number,
      formatINR(invoice.total),
      dueDate,
      shortUrl
    ],
    meta: { invoice_id: invoice.id, invoice_number: invoice.invoice_number }
  });
};

// ─── MAIN ORCHESTRATOR ────────────────────────────────────────────────────────

const sendCustomInvoice = async ({ invoice, client, therapist }) => {
  const pdfHtml   = buildInvoiceHTML({ invoice, client, therapist, forPDF: true });
  const pdfBuffer = await generatePDF(pdfHtml);
  const pdfUrl    = await uploadPDFToS3(pdfBuffer, invoice.invoice_number);

  await sendInvoiceEmail({ invoice, client, therapist, pdfUrl });

  try {
    await sendInvoiceWhatsApp({ invoice, client, pdfUrl });
  } catch (e) {
    console.log('WhatsApp send failed (non-fatal):', e.message);
  }

  return pdfUrl;
};

module.exports = { sendCustomInvoice, buildInvoiceHTML, generatePDF, uploadPDFToS3 };
