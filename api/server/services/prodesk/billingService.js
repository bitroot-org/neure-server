const db = require('../../../config/db');
const RazorpayService = require('./razorpayService');
const NotificationService = require('../notificationsAndAnnouncements/notificationService');

const generateInvoiceNumber = (id) => {
  const year = new Date().getFullYear();
  return `INV-${year}-${String(id).padStart(3, '0')}`;
};

const computeTotals = (lineItems, taxPercent = 18) => {
  const subtotal = lineItems.reduce((s, item) => s + item.qty * item.rate, 0);
  const tax = parseFloat((subtotal * taxPercent / 100).toFixed(2));
  const total = parseFloat((subtotal + tax).toFixed(2));
  return { subtotal: parseFloat(subtotal.toFixed(2)), tax, total };
};

// Write a payment log entry — used by all billing actions
const writePaymentLog = async ({ paymentId, invoiceId, referenceId, status, eventType, source, refundId = null, meta = null }) => {
  try {
    await db.query(
      `INSERT INTO prodesk_payment_log
       (payment_id, invoice_id, reference_id, status, event_type, source, refund_id, meta)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [paymentId, invoiceId || null, referenceId || null, status, eventType, source, refundId, meta ? JSON.stringify(meta) : null]
    );
  } catch (err) {
    console.log('Error in writePaymentLog::>>', err);
  }
};

// ─── GET INVOICE BY ID ────────────────────────────────────────────────────────

const getInvoiceByIdService = async (payload) => {
  try {
    console.log('Payload in getInvoiceByIdService::>>', payload);
    const { therapist_id, invoice_id } = payload;

    const [rows] = await db.query(
      `SELECT pi.*, CONCAT(u.first_name, ' ', u.last_name) AS client_name, u.email AS client_email
       FROM prodesk_invoices pi
       JOIN prodesk_clients pc ON pc.id = pi.client_id
       JOIN users u ON u.user_id = pc.user_id
       WHERE pi.id = ? AND pi.therapist_id = ?`,
      [invoice_id, therapist_id]
    );

    if (!rows || !rows.length) {
      return { status: false, code: 404, message: 'Invoice not found', data: null };
    }

    const inv = rows[0];
    if (typeof inv.line_items === 'string') {
      try { inv.line_items = JSON.parse(inv.line_items); } catch { inv.line_items = []; }
    }

    return { status: true, code: 200, message: 'Invoice fetched', data: inv };
  } catch (error) {
    console.log('Error in getInvoiceByIdService::>>', error);
    return null;
  }
};

// ─── CREATE INVOICE ───────────────────────────────────────────────────────────

const createInvoiceService = async (payload) => {
  try {
    console.log('Payload in createInvoiceService::>>', payload);
    const { therapist_id, client_id, session_id, due_date, line_items, tax_percent = 18, notes, action = 'draft' } = payload;

    if (!client_id || !line_items || !line_items.length) {
      return { status: false, code: 400, message: 'client_id and line_items are required', data: null };
    }

    const [clientCheck] = await db.query(
      'SELECT id FROM prodesk_clients WHERE id = ? AND therapist_id = ?',
      [client_id, therapist_id]
    );
    if (!clientCheck || !clientCheck.length) {
      return { status: false, code: 404, message: 'Client not found', data: null };
    }

    const enriched = line_items.map(i => ({ ...i, amount: parseFloat((i.qty * i.rate).toFixed(2)) }));
    const { subtotal, tax, total } = computeTotals(enriched, tax_percent);
    const issue_date = new Date().toISOString().slice(0, 10);

    const [result] = await db.query(
      `INSERT INTO prodesk_invoices
       (therapist_id, client_id, session_id, issue_date, due_date, line_items,
        subtotal, tax_percent, tax, total, notes, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft')`,
      [therapist_id, client_id, session_id || null, issue_date, due_date || null,
       JSON.stringify(enriched), subtotal, tax_percent, tax, total, notes || null]
    );

    const invoiceNumber = generateInvoiceNumber(result.insertId);
    await db.query('UPDATE prodesk_invoices SET invoice_number = ? WHERE id = ?', [invoiceNumber, result.insertId]);

    if (action === 'send') {
      return sendInvoiceService({ therapist_id, invoice_id: result.insertId });
    }

    return getInvoiceByIdService({ therapist_id, invoice_id: result.insertId });
  } catch (error) {
    console.log('Error in createInvoiceService::>>', error);
    return null;
  }
};

// ─── SEND INVOICE ─────────────────────────────────────────────────────────────

const sendInvoiceService = async (payload) => {
  try {
    console.log('Payload in sendInvoiceService::>>', payload);
    const { therapist_id, invoice_id } = payload;

    const inv = await getInvoiceByIdService({ therapist_id, invoice_id });
    if (!inv || !inv.status) return inv;
    const invoice = inv.data;

    if (!['draft', 'overdue'].includes(invoice.status)) {
      return { status: false, code: 409, message: 'Only draft invoices can be sent', data: null };
    }

    const [clientRows] = await db.query(
      `SELECT u.first_name, u.last_name, u.email, u.phone
       FROM prodesk_clients pc JOIN users u ON u.user_id = pc.user_id WHERE pc.id = ?`,
      [invoice.client_id]
    );
    if (!clientRows || !clientRows.length) {
      return { status: false, code: 404, message: 'Client not found', data: null };
    }

    const client = clientRows[0];
    let razorpayId = null;
    let shortUrl = null;

    try {
      const rzInv = await RazorpayService.createInvoice({
        customer: {
          name: `${client.first_name} ${client.last_name}`,
          email: client.email,
          contact: client.phone
        },
        lineItems: invoice.line_items,
        taxAmount: invoice.tax,
        totalAmount: invoice.total,
        dueBy: invoice.due_date,
        receipt: invoice.invoice_number,
        notes: { prodesk_invoice_id: String(invoice.id), therapist_id: String(therapist_id) }
      });
      razorpayId = rzInv.id;
      shortUrl = rzInv.short_url;
    } catch (e) {
      console.log('Razorpay invoice creation error::>>', e.message);
      return { status: false, code: 502, message: `Razorpay error: ${e.message}`, data: null };
    }

    await db.query(
      `UPDATE prodesk_invoices
       SET status = 'sent', razorpay_invoice_id = ?, razorpay_short_url = ?, last_sent_at = NOW()
       WHERE id = ?`,
      [razorpayId, shortUrl, invoice_id]
    );

    // Create initial payment record in 'created' state
    const [clientUser] = await db.query('SELECT user_id FROM prodesk_clients WHERE id = ?', [invoice.client_id]);
    const [payResult] = await db.query(
      `INSERT INTO prodesk_payment
       (user_id, therapist_id, invoice_id, payment_type, provider, amount, currency, status, method)
       VALUES (?, ?, ?, 'invoice', 'razorpay', ?, 'INR', 'created', 'razorpay')`,
      [clientUser[0]?.user_id, therapist_id, invoice_id, invoice.total]
    );

    await writePaymentLog({
      paymentId: payResult.insertId,
      invoiceId: invoice_id,
      status: 'created',
      eventType: 'invoice.sent',
      source: 'therapist'
    });

    return getInvoiceByIdService({ therapist_id, invoice_id });
  } catch (error) {
    console.log('Error in sendInvoiceService::>>', error);
    return null;
  }
};

// ─── RESEND INVOICE (notify client again) ────────────────────────────────────

const resendInvoiceService = async (payload) => {
  try {
    console.log('Payload in resendInvoiceService::>>', payload);
    const { therapist_id, invoice_id, channel = 'email' } = payload;

    const inv = await getInvoiceByIdService({ therapist_id, invoice_id });
    if (!inv || !inv.status) return inv;
    const invoice = inv.data;

    if (!['sent', 'payment_initiated', 'overdue'].includes(invoice.status)) {
      return { status: false, code: 409, message: 'Invoice must be in sent/overdue state to resend', data: null };
    }

    if (!invoice.razorpay_invoice_id) {
      return { status: false, code: 409, message: 'No Razorpay invoice linked. Send the invoice first.', data: null };
    }

    // Enforce a 10-minute cooldown to avoid spamming the client
    if (invoice.last_sent_at) {
      const cooldownMs = 10 * 60 * 1000;
      const lastSent = new Date(invoice.last_sent_at).getTime();
      if (Date.now() - lastSent < cooldownMs) {
        const waitSec = Math.ceil((cooldownMs - (Date.now() - lastSent)) / 1000);
        return { status: false, code: 429, message: `Please wait ${waitSec}s before resending`, data: null };
      }
    }

    let rzResponse = null;
    try {
      rzResponse = await RazorpayService.notifyInvoice({
        razorpayInvoiceId: invoice.razorpay_invoice_id,
        channel
      });
    } catch (e) {
      console.log('Razorpay notify error::>>', e.message);
      return { status: false, code: 502, message: `Razorpay error: ${e.message}`, data: null };
    }

    await db.query(
      'UPDATE prodesk_invoices SET last_sent_at = NOW() WHERE id = ?',
      [invoice_id]
    );

    const [payRow] = await db.query(
      'SELECT id FROM prodesk_payment WHERE invoice_id = ? ORDER BY created_at DESC LIMIT 1',
      [invoice_id]
    );

    if (payRow && payRow.length) {
      await writePaymentLog({
        paymentId: payRow[0].id,
        invoiceId: invoice_id,
        status: invoice.status,
        eventType: 'invoice.resent',
        source: 'therapist',
        meta: { channel }
      });
    }

    return { status: true, code: 200, message: 'Invoice resent successfully', data: { channel } };
  } catch (error) {
    console.log('Error in resendInvoiceService::>>', error);
    return null;
  }
};

// ─── GET INVOICE PAYMENT LINK ─────────────────────────────────────────────────

const getInvoicePaymentLinkService = async (payload) => {
  try {
    console.log('Payload in getInvoicePaymentLinkService::>>', payload);
    const { therapist_id, invoice_id } = payload;

    const inv = await getInvoiceByIdService({ therapist_id, invoice_id });
    if (!inv || !inv.status) return inv;

    if (!inv.data.razorpay_short_url) {
      return { status: false, code: 404, message: 'Payment link not available. Send the invoice first.', data: null };
    }

    return {
      status: true, code: 200, message: 'Payment link fetched',
      data: { payment_link: inv.data.razorpay_short_url, invoice_number: inv.data.invoice_number }
    };
  } catch (error) {
    console.log('Error in getInvoicePaymentLinkService::>>', error);
    return null;
  }
};

// ─── GET INVOICES (list) ──────────────────────────────────────────────────────

const getInvoicesService = async (payload) => {
  try {
    console.log('Payload in getInvoicesService::>>', payload);
    const { therapist_id, status, client_id, from, to, page = 1, limit = 20 } = payload;

    const offset = (page - 1) * limit;
    const conds = ['pi.therapist_id = ?'];
    const vals = [therapist_id];

    if (status) { conds.push('pi.status = ?'); vals.push(status); }
    if (client_id) { conds.push('pi.client_id = ?'); vals.push(client_id); }
    if (from) { conds.push('pi.issue_date >= ?'); vals.push(from); }
    if (to) { conds.push('pi.issue_date <= ?'); vals.push(to); }

    const where = conds.join(' AND ');
    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total FROM prodesk_invoices pi WHERE ${where}`,
      vals
    );

    const [rows] = await db.query(
      `SELECT pi.*, CONCAT(u.first_name, ' ', u.last_name) AS client_name
       FROM prodesk_invoices pi
       JOIN prodesk_clients pc ON pc.id = pi.client_id
       JOIN users u ON u.user_id = pc.user_id
       WHERE ${where} ORDER BY pi.created_at DESC LIMIT ? OFFSET ?`,
      [...vals, limit, offset]
    );

    return {
      status: true, code: 200, message: 'Invoices fetched',
      data: rows || [],
      pagination: { total, current_page: page, per_page: limit, total_pages: Math.ceil(total / limit) }
    };
  } catch (error) {
    console.log('Error in getInvoicesService::>>', error);
    return null;
  }
};

// ─── CANCEL INVOICE ───────────────────────────────────────────────────────────

const cancelInvoiceService = async (payload) => {
  try {
    console.log('Payload in cancelInvoiceService::>>', payload);
    const { therapist_id, invoice_id } = payload;

    const inv = await getInvoiceByIdService({ therapist_id, invoice_id });
    if (!inv || !inv.status) return inv;
    if (inv.data.status === 'paid') {
      return { status: false, code: 409, message: 'Cannot cancel a paid invoice', data: null };
    }

    if (inv.data.razorpay_invoice_id) {
      try { await RazorpayService.cancelInvoice(inv.data.razorpay_invoice_id); } catch (e) {
        console.log('Razorpay cancel error::>>', e.message);
      }
    }

    await db.query("UPDATE prodesk_invoices SET status = 'cancelled' WHERE id = ?", [invoice_id]);

    const [payRow] = await db.query(
      'SELECT id FROM prodesk_payment WHERE invoice_id = ? ORDER BY created_at DESC LIMIT 1',
      [invoice_id]
    );
    if (payRow && payRow.length) {
      await writePaymentLog({
        paymentId: payRow[0].id,
        invoiceId: invoice_id,
        status: 'cancelled',
        eventType: 'invoice.cancelled',
        source: 'therapist'
      });
    }

    return getInvoiceByIdService({ therapist_id, invoice_id });
  } catch (error) {
    console.log('Error in cancelInvoiceService::>>', error);
    return null;
  }
};

// ─── MARK INVOICE PAID (offline) ─────────────────────────────────────────────

const markInvoicePaidService = async (payload) => {
  try {
    console.log('Payload in markInvoicePaidService::>>', payload);
    const { therapist_id, invoice_id, method, paid_at } = payload;

    const inv = await getInvoiceByIdService({ therapist_id, invoice_id });
    if (!inv || !inv.status) return inv;
    if (inv.data.status === 'paid') {
      return { status: false, code: 409, message: 'Invoice already paid', data: null };
    }

    const paidDate = paid_at || new Date().toISOString();
    await db.query("UPDATE prodesk_invoices SET status = 'paid', paid_at = ? WHERE id = ?", [paidDate, invoice_id]);

    const [client] = await db.query('SELECT user_id FROM prodesk_clients WHERE id = ?', [inv.data.client_id]);
    const [payResult] = await db.query(
      `INSERT INTO prodesk_payment
       (user_id, therapist_id, invoice_id, payment_type, provider, amount, currency, status, method)
       VALUES (?, ?, ?, 'invoice', 'offline', ?, 'INR', 'captured', 'offline')`,
      [client[0]?.user_id, therapist_id, invoice_id, inv.data.total]
    );

    await writePaymentLog({
      paymentId: payResult.insertId,
      invoiceId: invoice_id,
      status: 'captured',
      eventType: 'manual.marked_paid',
      source: 'therapist',
      meta: { method: method || 'offline', paid_at: paidDate }
    });

    return getInvoiceByIdService({ therapist_id, invoice_id });
  } catch (error) {
    console.log('Error in markInvoicePaidService::>>', error);
    return null;
  }
};

// ─── INITIATE REFUND ─────────────────────────────────────────────────────────

const initiateRefundService = async (payload) => {
  try {
    console.log('Payload in initiateRefundService::>>', payload);
    const { therapist_id, invoice_id, amount } = payload;

    const inv = await getInvoiceByIdService({ therapist_id, invoice_id });
    if (!inv || !inv.status) return inv;
    if (inv.data.status !== 'paid') {
      return { status: false, code: 409, message: 'Only paid invoices can be refunded', data: null };
    }

    // Find the captured Razorpay payment record for this invoice
    const [payRows] = await db.query(
      "SELECT * FROM prodesk_payment WHERE invoice_id = ? AND status = 'captured' AND method = 'razorpay' ORDER BY created_at DESC LIMIT 1",
      [invoice_id]
    );

    if (!payRows || !payRows.length || !payRows[0].razorpay_ref_id) {
      return { status: false, code: 409, message: 'No captured Razorpay payment found for this invoice', data: null };
    }

    const payment = payRows[0];
    let refundData;

    try {
      refundData = await RazorpayService.createRefund({
        razorpayPaymentId: payment.razorpay_ref_id,
        amount,
        notes: { prodesk_invoice_id: String(invoice_id), therapist_id: String(therapist_id) }
      });
    } catch (e) {
      console.log('Razorpay refund error::>>', e.message);
      return { status: false, code: 502, message: `Razorpay error: ${e.message}`, data: null };
    }

    await db.query(
      "UPDATE prodesk_payment SET status = 'refund_initiated', razorpay_refund_id = ? WHERE id = ?",
      [refundData.id, payment.id]
    );

    await writePaymentLog({
      paymentId: payment.id,
      invoiceId: invoice_id,
      referenceId: payment.razorpay_ref_id,
      refundId: refundData.id,
      status: 'refund_initiated',
      eventType: 'refund.initiated',
      source: 'therapist',
      meta: refundData
    });

    return {
      status: true, code: 200, message: 'Refund initiated successfully',
      data: { refund_id: refundData.id, amount: refundData.amount / 100, status: refundData.status }
    };
  } catch (error) {
    console.log('Error in initiateRefundService::>>', error);
    return null;
  }
};

// ─── GET PAYMENT LOGS ─────────────────────────────────────────────────────────

const getPaymentLogsService = async (payload) => {
  try {
    console.log('Payload in getPaymentLogsService::>>', payload);
    const { therapist_id, invoice_id, payment_id, page = 1, limit = 50 } = payload;

    // Verify the invoice belongs to this therapist if invoice_id given
    if (invoice_id) {
      const [check] = await db.query(
        'SELECT id FROM prodesk_invoices WHERE id = ? AND therapist_id = ?',
        [invoice_id, therapist_id]
      );
      if (!check || !check.length) {
        return { status: false, code: 404, message: 'Invoice not found', data: null };
      }
    }

    const offset = (page - 1) * limit;
    const conds = [];
    const vals = [];

    if (invoice_id) { conds.push('ppl.invoice_id = ?'); vals.push(invoice_id); }
    if (payment_id) { conds.push('ppl.payment_id = ?'); vals.push(payment_id); }

    if (!conds.length) {
      return { status: false, code: 400, message: 'invoice_id or payment_id required', data: null };
    }

    const where = conds.join(' AND ');

    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total FROM prodesk_payment_log ppl WHERE ${where}`,
      vals
    );

    const [rows] = await db.query(
      `SELECT ppl.* FROM prodesk_payment_log ppl
       WHERE ${where}
       ORDER BY ppl.created_at ASC LIMIT ? OFFSET ?`,
      [...vals, limit, offset]
    );

    return {
      status: true, code: 200, message: 'Payment logs fetched',
      data: rows || [],
      pagination: { total, current_page: page, per_page: limit, total_pages: Math.ceil(total / limit) }
    };
  } catch (error) {
    console.log('Error in getPaymentLogsService::>>', error);
    return null;
  }
};

// ─── BILLING SUMMARY ─────────────────────────────────────────────────────────

const getBillingSummaryService = async (payload) => {
  try {
    console.log('Payload in getBillingSummaryService::>>', payload);
    const { therapist_id } = payload;

    const [[outstanding]] = await db.query(
      `SELECT COALESCE(SUM(total), 0) AS outstanding FROM prodesk_invoices
       WHERE therapist_id = ? AND status IN ('sent','payment_initiated','overdue')`,
      [therapist_id]
    );

    const [[paidMonth]] = await db.query(
      `SELECT COALESCE(SUM(total), 0) AS paid_this_month FROM prodesk_invoices
       WHERE therapist_id = ? AND status = 'paid'
       AND MONTH(paid_at) = MONTH(NOW()) AND YEAR(paid_at) = YEAR(NOW())`,
      [therapist_id]
    );

    const [[overdueData]] = await db.query(
      "SELECT COUNT(*) AS overdue_count FROM prodesk_invoices WHERE therapist_id = ? AND status = 'overdue'",
      [therapist_id]
    );

    const [[refundedData]] = await db.query(
      "SELECT COALESCE(SUM(total), 0) AS total_refunded FROM prodesk_invoices WHERE therapist_id = ? AND status = 'refunded'",
      [therapist_id]
    );

    return {
      status: true, code: 200, message: 'Billing summary fetched',
      data: {
        outstanding: outstanding.outstanding,
        paid_this_month: paidMonth.paid_this_month,
        overdue_count: overdueData.overdue_count,
        total_refunded: refundedData.total_refunded,
        currency: 'INR'
      }
    };
  } catch (error) {
    console.log('Error in getBillingSummaryService::>>', error);
    return null;
  }
};

// ─── GET PAYMENTS ─────────────────────────────────────────────────────────────

const getPaymentsService = async (payload) => {
  try {
    console.log('Payload in getPaymentsService::>>', payload);
    const { therapist_id, page = 1, limit = 20 } = payload;

    const offset = (page - 1) * limit;
    const [[{ total }]] = await db.query(
      'SELECT COUNT(*) AS total FROM prodesk_payment WHERE therapist_id = ?',
      [therapist_id]
    );

    const [rows] = await db.query(
      `SELECT pp.*, CONCAT(u.first_name, ' ', u.last_name) AS client_name
       FROM prodesk_payment pp
       JOIN users u ON u.user_id = pp.user_id
       WHERE pp.therapist_id = ?
       ORDER BY pp.created_at DESC LIMIT ? OFFSET ?`,
      [therapist_id, limit, offset]
    );

    return {
      status: true, code: 200, message: 'Payments fetched',
      data: rows || [],
      pagination: { total, current_page: page, per_page: limit, total_pages: Math.ceil(total / limit) }
    };
  } catch (error) {
    console.log('Error in getPaymentsService::>>', error);
    return null;
  }
};

// ─── FLAG OVERDUE INVOICES (called by cron) ───────────────────────────────────

const flagOverdueInvoicesService = async () => {
  try {
    console.log('Running flagOverdueInvoicesService...');

    const [invoices] = await db.query(
      `SELECT id, therapist_id FROM prodesk_invoices
       WHERE due_date < CURDATE() AND status IN ('sent', 'payment_initiated')`
    );

    if (!invoices || !invoices.length) {
      console.log('No invoices to flag as overdue');
      return;
    }

    const ids = invoices.map(i => i.id);
    await db.query(
      `UPDATE prodesk_invoices SET status = 'overdue' WHERE id IN (?)`,
      [ids]
    );

    for (const inv of invoices) {
      const [payRow] = await db.query(
        'SELECT id FROM prodesk_payment WHERE invoice_id = ? ORDER BY created_at DESC LIMIT 1',
        [inv.id]
      );
      if (payRow && payRow.length) {
        await writePaymentLog({
          paymentId: payRow[0].id,
          invoiceId: inv.id,
          status: 'overdue',
          eventType: 'overdue.flagged',
          source: 'system'
        });
      }
    }

    console.log(`Flagged ${ids.length} invoices as overdue`);
  } catch (error) {
    console.log('Error in flagOverdueInvoicesService::>>', error);
  }
};

// ─── RAZORPAY WEBHOOK HANDLER ─────────────────────────────────────────────────

const handleRazorpayWebhookService = async (payload) => {
  try {
    console.log('Payload in handleRazorpayWebhookService::>>', JSON.stringify(payload).slice(0, 300));
    const { rawBody, signature, event } = payload;

    const valid = await RazorpayService.verifyWebhookSignature(rawBody, signature);
    if (!valid) {
      return { status: false, code: 401, message: 'Invalid webhook signature', data: null };
    }

    const eventType = event?.event;
    const eventPayload = event?.payload || {};

    // Helper to safely extract notes.prodesk_invoice_id from any entity
    const extractInvoiceId = (entity) => {
      const raw = entity?.notes?.prodesk_invoice_id;
      return raw ? parseInt(raw, 10) : null;
    };

    // ── invoice.paid ─────────────────────────────────────────────────────────
    if (eventType === 'invoice.paid') {
      const entity = eventPayload?.invoice?.entity;
      const invoiceId = extractInvoiceId(entity);
      if (!invoiceId) return { status: true, code: 200, message: 'Ignored: no prodesk_invoice_id', data: null };

      await db.query(
        "UPDATE prodesk_invoices SET status = 'paid', paid_at = NOW() WHERE id = ?",
        [invoiceId]
      );

      const paymentEntity = eventPayload?.payment?.entity;
      const [payRows] = await db.query(
        "SELECT id FROM prodesk_payment WHERE invoice_id = ? ORDER BY created_at DESC LIMIT 1",
        [invoiceId]
      );
      if (payRows && payRows.length) {
        await db.query(
          "UPDATE prodesk_payment SET status = 'captured', razorpay_ref_id = ? WHERE id = ?",
          [paymentEntity?.id || null, payRows[0].id]
        );
        await writePaymentLog({
          paymentId: payRows[0].id,
          invoiceId,
          referenceId: paymentEntity?.id,
          status: 'captured',
          eventType: 'payment.captured',
          source: 'webhook',
          meta: event
        });
      }
    }

    // ── invoice.partially_paid ────────────────────────────────────────────────
    else if (eventType === 'invoice.partially_paid') {
      const entity = eventPayload?.invoice?.entity;
      const invoiceId = extractInvoiceId(entity);
      if (!invoiceId) return { status: true, code: 200, message: 'Ignored: no prodesk_invoice_id', data: null };

      await db.query(
        "UPDATE prodesk_invoices SET status = 'payment_initiated' WHERE id = ?",
        [invoiceId]
      );

      const [payRows] = await db.query(
        "SELECT id FROM prodesk_payment WHERE invoice_id = ? ORDER BY created_at DESC LIMIT 1",
        [invoiceId]
      );
      if (payRows && payRows.length) {
        await writePaymentLog({
          paymentId: payRows[0].id,
          invoiceId,
          status: 'attempted',
          eventType: 'payment.attempted',
          source: 'webhook',
          meta: event
        });
      }
    }

    // ── invoice.expired ───────────────────────────────────────────────────────
    else if (eventType === 'invoice.expired') {
      const entity = eventPayload?.invoice?.entity;
      const invoiceId = extractInvoiceId(entity);
      if (!invoiceId) return { status: true, code: 200, message: 'Ignored: no prodesk_invoice_id', data: null };

      await db.query(
        "UPDATE prodesk_invoices SET status = 'overdue' WHERE id = ? AND status NOT IN ('paid','cancelled')",
        [invoiceId]
      );

      const [payRows] = await db.query(
        "SELECT id FROM prodesk_payment WHERE invoice_id = ? ORDER BY created_at DESC LIMIT 1",
        [invoiceId]
      );
      if (payRows && payRows.length) {
        await writePaymentLog({
          paymentId: payRows[0].id,
          invoiceId,
          status: 'overdue',
          eventType: 'invoice.expired',
          source: 'webhook',
          meta: event
        });
      }
    }

    // ── invoice.cancelled (from Razorpay side) ────────────────────────────────
    else if (eventType === 'invoice.cancelled') {
      const entity = eventPayload?.invoice?.entity;
      const invoiceId = extractInvoiceId(entity);
      if (!invoiceId) return { status: true, code: 200, message: 'Ignored: no prodesk_invoice_id', data: null };

      await db.query(
        "UPDATE prodesk_invoices SET status = 'cancelled' WHERE id = ? AND status NOT IN ('paid')",
        [invoiceId]
      );

      const [payRows] = await db.query(
        "SELECT id FROM prodesk_payment WHERE invoice_id = ? ORDER BY created_at DESC LIMIT 1",
        [invoiceId]
      );
      if (payRows && payRows.length) {
        await writePaymentLog({
          paymentId: payRows[0].id,
          invoiceId,
          status: 'cancelled',
          eventType: 'invoice.cancelled',
          source: 'webhook',
          meta: event
        });
      }
    }

    // ── payment.failed ────────────────────────────────────────────────────────
    else if (eventType === 'payment.failed') {
      const paymentEntity = eventPayload?.payment?.entity;
      const invoiceId = extractInvoiceId(paymentEntity);

      if (invoiceId) {
        const [payRows] = await db.query(
          "SELECT id, therapist_id FROM prodesk_payment WHERE invoice_id = ? ORDER BY created_at DESC LIMIT 1",
          [invoiceId]
        );
        if (payRows && payRows.length) {
          await db.query(
            "UPDATE prodesk_payment SET status = 'failed' WHERE id = ?",
            [payRows[0].id]
          );
          await writePaymentLog({
            paymentId: payRows[0].id,
            invoiceId,
            referenceId: paymentEntity?.id,
            status: 'failed',
            eventType: 'payment.failed',
            source: 'webhook',
            meta: event
          });
        }

        // Notify therapist of the failed payment
        try {
          const [invRow] = await db.query(
            'SELECT therapist_id, invoice_number FROM prodesk_invoices WHERE id = ?',
            [invoiceId]
          );
          if (invRow && invRow.length) {
            await NotificationService.createNotification({
              user_id: invRow[0].therapist_id,
              user_type: 'therapist',
              type: 'payment_failed',
              message: `Payment failed for invoice ${invRow[0].invoice_number}`,
              meta: { invoice_id: invoiceId }
            });
          }
        } catch (notifErr) {
          console.log('Notification error (non-fatal)::>>', notifErr.message);
        }
      }
    }

    // ── payment.captured (backup — already handled by invoice.paid) ───────────
    else if (eventType === 'payment.captured') {
      const paymentEntity = eventPayload?.payment?.entity;
      const invoiceId = extractInvoiceId(paymentEntity);

      if (invoiceId) {
        const [invRow] = await db.query(
          "SELECT status FROM prodesk_invoices WHERE id = ?",
          [invoiceId]
        );
        // Only update if not already marked paid (idempotent)
        if (invRow && invRow.length && invRow[0].status !== 'paid') {
          await db.query(
            "UPDATE prodesk_invoices SET status = 'paid', paid_at = NOW() WHERE id = ?",
            [invoiceId]
          );
        }

        const [payRows] = await db.query(
          "SELECT id FROM prodesk_payment WHERE invoice_id = ? ORDER BY created_at DESC LIMIT 1",
          [invoiceId]
        );
        if (payRows && payRows.length) {
          await db.query(
            "UPDATE prodesk_payment SET status = 'captured', razorpay_ref_id = ? WHERE id = ? AND status != 'captured'",
            [paymentEntity?.id, payRows[0].id]
          );
          await writePaymentLog({
            paymentId: payRows[0].id,
            invoiceId,
            referenceId: paymentEntity?.id,
            status: 'captured',
            eventType: 'payment.captured',
            source: 'webhook',
            meta: event
          });
        }
      }
    }

    // ── refund.created ────────────────────────────────────────────────────────
    else if (eventType === 'refund.created') {
      const refundEntity = eventPayload?.refund?.entity;
      const paymentId = refundEntity?.payment_id;

      if (paymentId) {
        const [payRows] = await db.query(
          "SELECT id, invoice_id FROM prodesk_payment WHERE razorpay_ref_id = ? LIMIT 1",
          [paymentId]
        );
        if (payRows && payRows.length) {
          await writePaymentLog({
            paymentId: payRows[0].id,
            invoiceId: payRows[0].invoice_id,
            referenceId: paymentId,
            refundId: refundEntity?.id,
            status: 'refund_initiated',
            eventType: 'refund.created',
            source: 'webhook',
            meta: event
          });
        }
      }
    }

    // ── refund.processed ──────────────────────────────────────────────────────
    else if (eventType === 'refund.processed') {
      const refundEntity = eventPayload?.refund?.entity;
      const paymentId = refundEntity?.payment_id;

      if (paymentId) {
        const [payRows] = await db.query(
          "SELECT id, invoice_id FROM prodesk_payment WHERE razorpay_ref_id = ? LIMIT 1",
          [paymentId]
        );
        if (payRows && payRows.length) {
          await db.query(
            "UPDATE prodesk_payment SET status = 'refunded', razorpay_refund_id = ? WHERE id = ?",
            [refundEntity?.id, payRows[0].id]
          );
          await db.query(
            "UPDATE prodesk_invoices SET status = 'refunded', razorpay_refund_id = ?, refunded_at = NOW() WHERE id = ?",
            [refundEntity?.id, payRows[0].invoice_id]
          );
          await writePaymentLog({
            paymentId: payRows[0].id,
            invoiceId: payRows[0].invoice_id,
            referenceId: paymentId,
            refundId: refundEntity?.id,
            status: 'refunded',
            eventType: 'refund.processed',
            source: 'webhook',
            meta: event
          });
        }
      }
    }

    // ── refund.failed ─────────────────────────────────────────────────────────
    else if (eventType === 'refund.failed') {
      const refundEntity = eventPayload?.refund?.entity;
      const paymentId = refundEntity?.payment_id;

      if (paymentId) {
        const [payRows] = await db.query(
          "SELECT id, invoice_id, therapist_id FROM prodesk_payment WHERE razorpay_ref_id = ? LIMIT 1",
          [paymentId]
        );
        if (payRows && payRows.length) {
          // Revert payment status back to captured since refund failed
          await db.query(
            "UPDATE prodesk_payment SET status = 'captured' WHERE id = ?",
            [payRows[0].id]
          );
          await writePaymentLog({
            paymentId: payRows[0].id,
            invoiceId: payRows[0].invoice_id,
            referenceId: paymentId,
            refundId: refundEntity?.id,
            status: 'captured',
            eventType: 'refund.failed',
            source: 'webhook',
            meta: event
          });

          // Notify therapist
          try {
            const [invRow] = await db.query(
              'SELECT invoice_number FROM prodesk_invoices WHERE id = ?',
              [payRows[0].invoice_id]
            );
            if (invRow && invRow.length) {
              await NotificationService.createNotification({
                user_id: payRows[0].therapist_id,
                user_type: 'therapist',
                type: 'refund_failed',
                message: `Refund failed for invoice ${invRow[0].invoice_number}. Please retry.`,
                meta: { invoice_id: payRows[0].invoice_id }
              });
            }
          } catch (notifErr) {
            console.log('Notification error (non-fatal)::>>', notifErr.message);
          }
        }
      }
    }

    return { status: true, code: 200, message: 'Webhook handled', data: null };
  } catch (error) {
    console.log('Error in handleRazorpayWebhookService::>>', error);
    return null;
  }
};

module.exports = {
  createInvoiceService,
  getInvoicesService,
  getInvoiceByIdService,
  sendInvoiceService,
  resendInvoiceService,
  getInvoicePaymentLinkService,
  cancelInvoiceService,
  markInvoicePaidService,
  initiateRefundService,
  getPaymentLogsService,
  getBillingSummaryService,
  getPaymentsService,
  flagOverdueInvoicesService,
  handleRazorpayWebhookService
};
