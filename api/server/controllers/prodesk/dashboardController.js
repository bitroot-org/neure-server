const {
  getDashboardService,
  getMetricsService,
  getNotificationsService,
  markNotificationReadService,
  markAllNotificationsReadService,
  closeNotificationService
} = require('../../services/prodesk/dashboardService');
const { convertDatesToIST } = require('../../utils/dateHelper');

const respond = (res, result) => {
  if (!result) return res.status(500).json({ status: false, code: 500, message: 'Internal server error', data: null });
  return res.status(result.code).json({ ...result, data: convertDatesToIST(result.data) });
};

class ProdeskDashboardController {
  static async getDashboard(req, res) {
    try {
      const result = await getDashboardService({ therapist_id: req.user.therapist_id, user_id: req.user.user_id });
      return respond(res, result);
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }

  static async getMetrics(req, res) {
    try {
      const result = await getMetricsService({ therapist_id: req.user.therapist_id, ...req.body });
      return respond(res, result);
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }

  static async getNotifications(req, res) {
    try {
      const result = await getNotificationsService({ user_id: req.user.user_id, ...req.body });
      return respond(res, result);
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }

  static async markNotificationRead(req, res) {
    try {
      const { notification_id } = req.body;
      if (!notification_id) return res.status(400).json({ status: false, code: 400, message: 'notification_id required', data: null });
      const result = await markNotificationReadService({ user_id: req.user.user_id, notification_id });
      return respond(res, result);
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }

  static async markAllNotificationsRead(req, res) {
    try {
      const result = await markAllNotificationsReadService({ user_id: req.user.user_id });
      return respond(res, result);
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }

  static async closeNotification(req, res) {
    try {
      const { notification_id } = req.body;
      if (!notification_id) return res.status(400).json({ status: false, code: 400, message: 'notification_id required', data: null });
      const result = await closeNotificationService({ user_id: req.user.user_id, notification_id });
      return respond(res, result);
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }
}

module.exports = ProdeskDashboardController;
