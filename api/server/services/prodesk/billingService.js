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
        customer: { name: `${client.first_name} ${client.last_name}`, email: client.email, contact: client.phone },
        lineItems: invoice.line_items,
        taxAmount: invoice.tax,
        totalAmount: invoice.total,
        dueBy: invoice.due_date,
        notes: { prodesk_invoice_id: invoice.id, therapist_id }
      });
      razorpayId = rzInv.id;
      shortUrl = rzInv.short_url;
    } catch (e) {
      console.log('Razorpay invoice creation error::>>', e.message);
    }

    await db.query(
      "UPDATE prodesk_invoices SET status = 'sent', razorpay_invoice_id = ?, razorpay_short_url = ? WHERE id = ?",
      [razorpayId, shortUrl, invoice_id]
    );

    return getInvoiceByIdService({ therapist_id, invoice_id });
  } catch (error) {
    console.log('Error in sendInvoiceService::>>', error);
    return null;
  }
};

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
    return getInvoiceByIdService({ therapist_id, invoice_id });
  } catch (error) {
    console.log('Error in cancelInvoiceService::>>', error);
    return null;
  }
};

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
    await db.query(
      `INSERT INTO prodesk_payment (user_id, therapist_id, invoice_id, payment_type, provider, amount, status)
       VALUES (?, ?, ?, 'invoice', ?, ?, 'captured')`,
      [client[0]?.user_id, therapist_id, invoice_id, method || 'offline', inv.data.total]
    );

    return getInvoiceByIdService({ therapist_id, invoice_id });
  } catch (error) {
    console.log('Error in markInvoicePaidService::>>', error);
    return null;
  }
};

const getBillingSummaryService = async (payload) => {
  try {
    console.log('Payload in getBillingSummaryService::>>', payload);
    const { therapist_id } = payload;

    const [[outstanding]] = await db.query(
      `SELECT COALESCE(SUM(total), 0) AS outstanding FROM prodesk_invoices
       WHERE therapist_id = ? AND status IN ('sent','overdue')`,
      [therapist_id]
    );

    const [[paidMonth]] = await db.query(
      `SELECT COALESCE(SUM(total), 0) AS paid_this_month FROM prodesk_invoices
       WHERE therapist_id = ? AND status = 'paid'
       AND MONTH(paid_at) = MONTH(NOW()) AND YEAR(paid_at) = YEAR(NOW())`,
      [therapist_id]
    );

    const [[overdue]] = await db.query(
      "SELECT COUNT(*) AS overdue_count FROM prodesk_invoices WHERE therapist_id = ? AND status = 'overdue'",
      [therapist_id]
    );

    return {
      status: true, code: 200, message: 'Billing summary fetched',
      data: {
        outstanding: outstanding.outstanding,
        paid_this_month: paidMonth.paid_this_month,
        overdue_count: overdue.overdue_count,
        currency: 'INR'
      }
    };
  } catch (error) {
    console.log('Error in getBillingSummaryService::>>', error);
    return null;
  }
};

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

const handleRazorpayWebhookService = async (payload) => {
  try {
    console.log('Payload in handleRazorpayWebhookService::>>', payload);
    const { rawBody, signature, event } = payload;

    const valid = await RazorpayService.verifyWebhookSignature(rawBody, signature);
    if (!valid) {
      return { status: false, code: 401, message: 'Invalid webhook signature', data: null };
    }

    const { event: eventType, payload: eventPayload } = event;
    const paymentEntity = eventPayload?.payment?.entity || eventPayload?.invoice?.entity;

    if (['payment.captured', 'invoice.paid', 'payment_link.paid'].includes(eventType)) {
      const notes = paymentEntity?.notes || {};
      const invoiceId = notes.prodesk_invoice_id;

      if (invoiceId) {
        await db.query(
          "UPDATE prodesk_invoices SET status = 'paid', paid_at = NOW() WHERE id = ?",
          [invoiceId]
        );

        const [payRows] = await db.query(
          'SELECT id FROM prodesk_payment WHERE invoice_id = ? LIMIT 1',
          [invoiceId]
        );
        if (payRows && payRows.length) {
          await db.query(
            'UPDATE prodesk_payment SET status = ?, razorpay_ref_id = ? WHERE id = ?',
            ['captured', paymentEntity?.id, payRows[0].id]
          );
          await db.query(
            'INSERT INTO prodesk_payment_log (payment_id, reference_id, status, meta) VALUES (?, ?, ?, ?)',
            [payRows[0].id, paymentEntity?.id, 'captured', JSON.stringify(event)]
          );
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
  cancelInvoiceService,
  markInvoicePaidService,
  getBillingSummaryService,
  getPaymentsService,
  handleRazorpayWebhookService
};
