const db = require('../../../config/db');
const NotificationService = require('../notificationsAndAnnouncements/notificationService');

const submitFeedbackService = async ({ therapist_id, subject, message, rating }) => {
  try {
    if (!subject || !message) return { status: false, code: 400, message: 'subject and message are required', data: null };
    if (rating !== undefined && rating !== null && (rating < 1 || rating > 5)) {
      return { status: false, code: 400, message: 'rating must be between 1 and 5', data: null };
    }

    const [result] = await db.query(
      `INSERT INTO prodesk_feedback (therapist_id, subject, message, rating) VALUES (?,?,?,?)`,
      [therapist_id, subject, message, rating || null]
    );

    const [[therapistRow]] = await db.query(
      `SELECT u.first_name, u.last_name, u.email FROM therapists t JOIN users u ON t.user_id = u.user_id WHERE t.id = ?`,
      [therapist_id]
    );

    try {
      await NotificationService.sendEmail({
        toEmail: process.env.ADMIN_EMAIL || 'tech@bitroot.org',
        toName: 'ProDesk Admin',
        template: 'prodesk_feedback_received_admin',
        data: {
          therapist_name: `${therapistRow.first_name} ${therapistRow.last_name}`,
          therapist_email: therapistRow.email,
          subject, message,
          rating: rating || 'Not provided',
          submitted_at: new Date().toISOString()
        }
      });
    } catch (_) {}

    return { status: true, code: 201, message: 'Feedback submitted. Thank you!', data: { feedback_id: result.insertId } };
  } catch (error) {
    console.log('Error in submitFeedbackService::>>', error);
    return null;
  }
};

const getFaqService = async ({ search = '', page = 1, limit = 50 }) => {
  try {
    const offset = (page - 1) * limit;
    const params = [];
    let where = 'WHERE 1=1';
    if (search) {
      where += ' AND (question LIKE ? OR answer LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    const [[{ total }]] = await db.query(`SELECT COUNT(*) AS total FROM qna ${where}`, params);
    const [rows] = await db.query(
      `SELECT id, question, answer, created_at FROM qna ${where} ORDER BY id ASC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );
    return {
      status: true, code: 200, message: 'FAQ fetched',
      data: rows,
      meta: { total, page: parseInt(page), limit: parseInt(limit) }
    };
  } catch (error) {
    console.log('Error in getFaqService::>>', error);
    return null;
  }
};

module.exports = { submitFeedbackService, getFaqService };
