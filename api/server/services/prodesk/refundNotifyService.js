const db = require('../../../config/db');
const NotificationService = require('../notificationsAndAnnouncements/notificationService');
const { applyParentContact } = require('./clientContact');

// Tells the client about their refund, in plain words (email + an in-app note). Never throws: a refund must not fail because a message did.
// stage: 'started' | 'processed' | 'manual'
const notifyRefund = async ({ invoice_id, amount, stage, refund_id = null }) => {
  try {
    const [[inv]] = await db.query('SELECT id, therapist_id, client_id, total FROM prodesk_invoices WHERE id = ?', [invoice_id]);
    if (!inv || !inv.client_id) return false;
    const [[row]] = await db.query(
      `SELECT u.email, u.user_id, CONCAT(u.first_name, ' ', u.last_name) AS client_name,
              CONCAT(tu.first_name, ' ', tu.last_name) AS therapist_name,
              (SELECT sv.name FROM prodesk_service_purchases p JOIN prodesk_services sv ON sv.id = p.service_id WHERE p.invoice_id = ? LIMIT 1) AS service_name
       FROM prodesk_clients pc
       JOIN users u ON u.user_id = pc.user_id
       JOIN therapists t ON t.id = ?
       JOIN users tu ON tu.user_id = t.user_id
       WHERE pc.id = ?`, [invoice_id, inv.therapist_id, inv.client_id]);
    if (!row) return false;
    await applyParentContact(inv.client_id, row);   // a client under 18: the parent is the one who is told
    const money = `₹${Number(amount ?? inv.total).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
    const service_name = row.service_name || 'your session';
    if (row.email) {
      await NotificationService.sendEmail({
        toEmail: row.email, toName: row.client_name, template: 'prodesk_session_refund',
        data: { stage, client_name: row.client_name, therapist_name: row.therapist_name, service_name, amount: money, refund_id },
      });
    }
    if (row.user_id) {
      await NotificationService.createNotification({
        user_id: row.user_id, type: 'SESSION_CANCELLED',
        title: stage === 'processed' ? 'Refund processed' : stage === 'manual' ? 'Booking cancelled' : 'Refund started',
        content: stage === 'processed' ? `Your refund of ${money} for ${service_name} has been processed.`
          : stage === 'manual' ? `${row.therapist_name} will return your ${money} for ${service_name} directly.`
          : `Your refund of ${money} for ${service_name} has been started. It usually reaches you in 5 to 7 working days.`,
      });
    }
    return true;
  } catch (e) { console.log('Refund message (non-blocking)::>>', e.message); return false; }
};

module.exports = { notifyRefund };
