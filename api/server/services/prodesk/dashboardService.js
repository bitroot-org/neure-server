const db = require('../../../config/db');

const getDashboardService = async (payload) => {
  try {
    console.log('Payload in getDashboardService::>>', payload);
    const { therapist_id, user_id } = payload;

    const [metricsResult, todaySessions, recentNotifications] = await Promise.all([
      getMetricsService({ therapist_id }),
      getTodaySessionsForDashboard(therapist_id),
      getRecentNotificationsForDashboard(user_id)
    ]);

    return {
      status: true, code: 200, message: 'Dashboard fetched',
      data: {
        metrics: metricsResult?.data || null,
        today_sessions: todaySessions,
        recent_notifications: recentNotifications
      }
    };
  } catch (error) {
    console.log('Error in getDashboardService::>>', error);
    return null;
  }
};

const getMetricsService = async (payload) => {
  try {
    console.log('Payload in getMetricsService::>>', payload);
    const { therapist_id, from, to } = payload;

    const startDate = from || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
    const endDate = to || new Date().toISOString().slice(0, 10);

    const [[sessionStats]] = await db.query(
      `SELECT COUNT(*) AS total_sessions,
              COALESCE(SUM(duration_min) / 60, 0) AS therapy_hours
       FROM prodesk_sessions
       WHERE therapist_id = ? AND status = 'completed'
       AND DATE(starts_at) BETWEEN ? AND ?`,
      [therapist_id, startDate, endDate]
    );

    const [[clientStats]] = await db.query(
      `SELECT COUNT(DISTINCT client_id) AS lives_impacted
       FROM prodesk_sessions
       WHERE therapist_id = ? AND status = 'completed'
       AND DATE(starts_at) BETWEEN ? AND ?`,
      [therapist_id, startDate, endDate]
    );

    const [[revenueStats]] = await db.query(
      `SELECT COALESCE(SUM(total), 0) AS revenue
       FROM prodesk_invoices
       WHERE therapist_id = ? AND status = 'paid'
       AND DATE(paid_at) BETWEEN ? AND ?`,
      [therapist_id, startDate, endDate]
    );

    const prevStart = new Date(startDate);
    prevStart.setMonth(prevStart.getMonth() - 1);
    const prevEnd = new Date(endDate);
    prevEnd.setMonth(prevEnd.getMonth() - 1);

    const [[prevRevenue]] = await db.query(
      `SELECT COALESCE(SUM(total), 0) AS revenue FROM prodesk_invoices
       WHERE therapist_id = ? AND status = 'paid'
       AND DATE(paid_at) BETWEEN ? AND ?`,
      [therapist_id, prevStart.toISOString().slice(0, 10), prevEnd.toISOString().slice(0, 10)]
    );

    const mom = prevRevenue.revenue > 0
      ? parseFloat(((revenueStats.revenue - prevRevenue.revenue) / prevRevenue.revenue * 100).toFixed(1))
      : 0;

    return {
      status: true, code: 200, message: 'Metrics fetched',
      data: {
        period: startDate.slice(0, 7),
        therapy_hours: Math.round((Number(sessionStats.therapy_hours) || 0) * 10) / 10,
        lives_impacted: Number(clientStats.lives_impacted) || 0,
        revenue: Number(revenueStats.revenue) || 0,
        sessions: Number(sessionStats.total_sessions) || 0,
        month_over_month_percent: mom,
        currency: 'INR'
      }
    };
  } catch (error) {
    console.log('Error in getMetricsService::>>', error);
    return null;
  }
};

const getTodaySessionsForDashboard = async (therapistId) => {
  try {
    const [rows] = await db.query(
      `SELECT ps.id, ps.starts_at, ps.duration_min, ps.modality, ps.status, ps.title,
              CONCAT(u.first_name, ' ', u.last_name) AS client_name,
              pc.avatar_color, pc.id AS client_id,
              CONCAT(UPPER(LEFT(u.first_name,1)), UPPER(LEFT(u.last_name,1))) AS client_initials
       FROM prodesk_sessions ps
       JOIN prodesk_clients pc ON pc.id = ps.client_id
       JOIN users u ON u.user_id = pc.user_id
       WHERE ps.therapist_id = ? AND DATE(ps.starts_at) = CURDATE()
       AND ps.status IN ('scheduled', 'completed')
       ORDER BY ps.starts_at ASC`,
      [therapistId]
    );
    return rows || [];
  } catch (error) {
    console.log('Error in getTodaySessionsForDashboard::>>', error);
    return [];
  }
};

const getRecentNotificationsForDashboard = async (userId) => {
  try {
    const [rows] = await db.query(
      `SELECT id, title, content AS text, type, is_read, created_at
       FROM notifications
       WHERE user_id = ? AND is_close = 0
       ORDER BY created_at DESC LIMIT 5`,
      [userId]
    );
    return rows || [];
  } catch (error) {
    console.log('Error in getRecentNotificationsForDashboard::>>', error);
    return [];
  }
};

const getNotificationsService = async (payload) => {
  try {
    console.log('Payload in getNotificationsService::>>', payload);
    const { user_id, unread, page = 1, limit = 20 } = payload;

    const offset = (page - 1) * limit;
    const conds = ['user_id = ?', 'is_close = 0'];
    const vals = [user_id];

    if (unread === true || unread === 'true') { conds.push('is_read = 0'); }

    const where = conds.join(' AND ');
    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total FROM notifications WHERE ${where}`,
      vals
    );
    const [[{ unread_count }]] = await db.query(
      'SELECT COUNT(*) AS unread_count FROM notifications WHERE user_id = ? AND is_read = 0 AND is_close = 0',
      [user_id]
    );

    const [rows] = await db.query(
      `SELECT * FROM notifications WHERE ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...vals, limit, offset]
    );

    return {
      status: true, code: 200, message: 'Notifications fetched',
      data: rows || [],
      meta: { total, unread_count, current_page: page, per_page: limit }
    };
  } catch (error) {
    console.log('Error in getNotificationsService::>>', error);
    return null;
  }
};

const markNotificationReadService = async (payload) => {
  try {
    console.log('Payload in markNotificationReadService::>>', payload);
    const { user_id, notification_id } = payload;

    await db.query(
      'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
      [notification_id, user_id]
    );

    return { status: true, code: 200, message: 'Notification marked as read', data: null };
  } catch (error) {
    console.log('Error in markNotificationReadService::>>', error);
    return null;
  }
};

const markAllNotificationsReadService = async (payload) => {
  try {
    console.log('Payload in markAllNotificationsReadService::>>', payload);
    const { user_id } = payload;

    await db.query(
      'UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0',
      [user_id]
    );

    return { status: true, code: 200, message: 'All notifications marked as read', data: null };
  } catch (error) {
    console.log('Error in markAllNotificationsReadService::>>', error);
    return null;
  }
};

const closeNotificationService = async (payload) => {
  try {
    console.log('Payload in closeNotificationService::>>', payload);
    const { user_id, notification_id } = payload;

    await db.query(
      'UPDATE notifications SET is_close = 1 WHERE id = ? AND user_id = ?',
      [notification_id, user_id]
    );

    return { status: true, code: 200, message: 'Notification closed', data: null };
  } catch (error) {
    console.log('Error in closeNotificationService::>>', error);
    return null;
  }
};

module.exports = {
  getDashboardService,
  getMetricsService,
  getNotificationsService,
  markNotificationReadService,
  markAllNotificationsReadService,
  closeNotificationService
};
