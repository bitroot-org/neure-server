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

const getPeriodRange = (period) => {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  // end defaults to today (day/week can't look into the future); month/year
  // override it below to the full period end, so sessions/invoices already
  // booked later this month/year aren't excluded from "this month" totals.
  let start, end = today, prevStart, prevEnd;

  if (period === 'day') {
    start = today;
    const yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1);
    prevStart = prevEnd = yesterday.toISOString().slice(0, 10);
  } else if (period === 'week') {
    const weekAgo = new Date(now); weekAgo.setDate(weekAgo.getDate() - 6);
    start = weekAgo.toISOString().slice(0, 10);
    const prevWeekEnd = new Date(weekAgo); prevWeekEnd.setDate(prevWeekEnd.getDate() - 1);
    const prevWeekStart = new Date(prevWeekEnd); prevWeekStart.setDate(prevWeekStart.getDate() - 6);
    prevStart = prevWeekStart.toISOString().slice(0, 10);
    prevEnd = prevWeekEnd.toISOString().slice(0, 10);
  } else if (period === 'year') {
    start = `${now.getFullYear()}-01-01`;
    end = `${now.getFullYear()}-12-31`;
    prevStart = `${now.getFullYear() - 1}-01-01`;
    prevEnd = `${now.getFullYear() - 1}-12-31`;
  } else {
    // month (default)
    start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    prevStart = prevMonthStart.toISOString().slice(0, 10);
    prevEnd = prevMonthEnd.toISOString().slice(0, 10);
  }

  return { start, end, prevStart, prevEnd: prevEnd || today };
};

const getMetricsService = async (payload) => {
  try {
    console.log('Payload in getMetricsService::>>', payload);
    const { therapist_id, period = 'month', from, to } = payload;

    // Allow manual from/to override, else derive from period
    const range = getPeriodRange(period);
    const startDate = from || range.start;
    const endDate   = to   || range.end;
    const prevStart = range.prevStart;
    const prevEnd   = range.prevEnd;

    // ── Current period ────────────────────────────────────────────────────
    // "sessions" counts everything booked this period (scheduled + completed,
    // excluding cancelled) so the overview reflects real activity, not just
    // sessions that have already happened. therapy_hours stays completed-only
    // since it represents hours of therapy actually delivered.
    const [[sessionStats]] = await db.query(
      `SELECT COUNT(*) AS total_sessions,
              COALESCE(SUM(CASE WHEN status = 'completed' THEN duration_min ELSE 0 END) / 60, 0) AS therapy_hours
       FROM prodesk_sessions
       WHERE therapist_id = ? AND status != 'cancelled'
       AND DATE(starts_at) BETWEEN ? AND ?`,
      [therapist_id, startDate, endDate]
    );

    // "lives_impacted" is the practice's total active client count, not
    // scoped to this period — matches the count shown on the Clients page.
    const [[clientStats]] = await db.query(
      `SELECT COUNT(*) AS lives_impacted
       FROM prodesk_clients
       WHERE therapist_id = ? AND status = 'active'`,
      [therapist_id]
    );

    const [[revenueStats]] = await db.query(
      `SELECT COALESCE(SUM(total), 0) AS revenue
       FROM prodesk_invoices
       WHERE therapist_id = ? AND status = 'paid'
       AND DATE(paid_at) BETWEEN ? AND ?`,
      [therapist_id, startDate, endDate]
    );

    // ── Previous period (for change calculations) ─────────────────────────
    const [[prevSession]] = await db.query(
      `SELECT COUNT(*) AS total_sessions
       FROM prodesk_sessions
       WHERE therapist_id = ? AND status != 'cancelled'
       AND DATE(starts_at) BETWEEN ? AND ?`,
      [therapist_id, prevStart, prevEnd]
    );

    // clients_change = new clients added this period vs previous period
    // (lives_impacted itself is a total-active snapshot, not period-scoped).
    const [[curNewClients]] = await db.query(
      `SELECT COUNT(*) AS cnt FROM prodesk_clients
       WHERE therapist_id = ? AND DATE(created_at) BETWEEN ? AND ?`,
      [therapist_id, startDate, endDate]
    );
    const [[prevNewClients]] = await db.query(
      `SELECT COUNT(*) AS cnt FROM prodesk_clients
       WHERE therapist_id = ? AND DATE(created_at) BETWEEN ? AND ?`,
      [therapist_id, prevStart, prevEnd]
    );

    const [[prevRevenue]] = await db.query(
      `SELECT COALESCE(SUM(total), 0) AS revenue
       FROM prodesk_invoices
       WHERE therapist_id = ? AND status = 'paid'
       AND DATE(paid_at) BETWEEN ? AND ?`,
      [therapist_id, prevStart, prevEnd]
    );

    // ── Unpaid invoices (payments_due + overdue_count) ────────────────────
    const [[unpaidStats]] = await db.query(
      `SELECT COALESCE(SUM(total), 0) AS payments_due,
              SUM(CASE WHEN status = 'overdue' THEN 1 ELSE 0 END) AS overdue_count
       FROM prodesk_invoices
       WHERE therapist_id = ? AND status IN ('sent','overdue')`,
      [therapist_id]
    );

    // ── Calculate change values ────────────────────────────────────────────
    const curRevenue  = Number(revenueStats.revenue)         || 0;
    const prevRev     = Number(prevRevenue.revenue)          || 0;
    const curSessions = Number(sessionStats.total_sessions)  || 0;
    const prevSess    = Number(prevSession.total_sessions)   || 0;
    const curClients  = Number(clientStats.lives_impacted)   || 0;
    const curNewCli   = Number(curNewClients.cnt)             || 0;
    const prevNewCli  = Number(prevNewClients.cnt)             || 0;

    const pct = (cur, prev) => prev > 0
      ? parseFloat(((cur - prev) / prev * 100).toFixed(1))
      : cur > 0 ? 100 : 0;

    return {
      status: true, code: 200, message: 'Metrics fetched',
      data: {
        period,
        period_start: startDate,
        period_end: endDate,
        // Core metrics
        therapy_hours:         Math.round((Number(sessionStats.therapy_hours) || 0) * 10) / 10,
        lives_impacted:        curClients,
        revenue:               curRevenue,
        sessions:              curSessions,
        currency:              'INR',
        // Change vs previous period
        revenue_change_percent:   pct(curRevenue, prevRev),
        sessions_change_percent:  pct(curSessions, prevSess),
        clients_change:           curNewCli - prevNewCli,
        month_over_month_percent: pct(curRevenue, prevRev),
        // Unpaid invoices
        payments_due:   parseFloat(Number(unpaidStats.payments_due).toFixed(2)),
        overdue_count:  Number(unpaidStats.overdue_count) || 0
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
      `SELECT ps.id,
              ps.starts_at AS starts_at,
              ps.duration_min, ps.modality, ps.status, ps.title,
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
      `SELECT id, title, content, type, company_id, user_id, is_read, priority, is_close, is_popup, meta, created_at
       FROM notifications WHERE ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
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

const getPopupNotificationsService = async ({ user_id }) => {
  try {
    const [rows] = await db.query(
      `SELECT id, title, content, type, meta, created_at
       FROM notifications
       WHERE user_id = ? AND is_popup = 1 AND is_close = 0
       ORDER BY created_at ASC`,
      [user_id]
    );
    return { status: true, code: 200, message: 'Popup notifications fetched', data: rows || [] };
  } catch (error) {
    console.log('Error in getPopupNotificationsService::>>', error);
    return null;
  }
};

const getMaintenanceStatusService = async () => {
  try {
    // starts_at/ends_at are stored as UTC (written via NOW()/DATE_ADD(NOW()...)).
    // This controller's respond() runs convertDatesToIST, but that helper
    // ignores 'starts_at' (reserved elsewhere for a naive-IST field) and
    // doesn't know 'ends_at' at all — so convert explicitly here at the SQL
    // level instead, same as the admin-side maintenance queries.
    //
    // is_active only flips to 0 via an explicit deactivation — a window that
    // simply times out stays is_active=1 in the DB. The WHERE clause below
    // already excludes expired rows regardless of that stale flag, but we
    // also self-heal it here so the admin-side "last configured" fallback
    // (which does trust the flag) doesn't keep reporting it as active.
    await db.query(
      `UPDATE maintenance_mode SET is_active = 0
       WHERE is_active = 1 AND ends_at IS NOT NULL AND ends_at <= NOW()`
    );

    const [[row]] = await db.query(
      `SELECT is_active, message,
              DATE_ADD(DATE_ADD(starts_at, INTERVAL 5 HOUR), INTERVAL 30 MINUTE) AS starts_at,
              DATE_ADD(DATE_ADD(ends_at,   INTERVAL 5 HOUR), INTERVAL 30 MINUTE) AS ends_at
       FROM maintenance_mode
       WHERE is_active = 1 AND (ends_at IS NULL OR ends_at > NOW())
       ORDER BY created_at DESC LIMIT 1`
    );
    return { status: true, code: 200, message: 'Maintenance status fetched', data: row || null };
  } catch (error) {
    console.log('Error in getMaintenanceStatusService::>>', error);
    return null;
  }
};

module.exports = {
  getDashboardService,
  getMetricsService,
  getNotificationsService,
  markNotificationReadService,
  markAllNotificationsReadService,
  closeNotificationService,
  getPopupNotificationsService,
  getMaintenanceStatusService
};
