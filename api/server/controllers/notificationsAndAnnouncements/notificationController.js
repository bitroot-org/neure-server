const NotificationService = require('../../services/notificationsAndAnnouncements/notificationService');

class NotificationController {
  static async createNotification(req, res) {
    try {
      const { title, content, type, company_id, user_id } = req.body;

      const { role_id } = req.user;
      if (role_id !== 1) {
        return res.status(403).json({
          status: false,
          code: 403,
          message: "Access denied. Only superadmins can create articles",
          data: null,
        });
      }

      if (!title || !content || !type) {
        return res.status(400).json({
          status: false,
          code: 400,
          message: 'Title, content, and type are required'
        });
      }

      const notification = await NotificationService.createNotification({
        title,
        content,
        type,
        company_id,
        user_id
      });

      return res.status(201).json({
        status: true,
        code: 201,
        message: 'Notification created successfully',
        data: notification
      });
    } catch (error) {
      console.error('Error creating notification:', error.message);
      return res.status(500).json({
        status: false,
        code: 500,
        message: 'Failed to create notification'
      });
    }
  }

  static async getNotifications(req, res) {
    try {
      const { company_id, user_id, type, page = 1, limit = 10 } = req.query;

      const result = await NotificationService.getNotifications({
        company_id: company_id ? parseInt(company_id) : null,
        user_id: user_id ? parseInt(user_id) : null,
        type,
        page: parseInt(page),
        limit: parseInt(limit)
      });

      return res.status(200).json({
        status: true,
        code: 200,
        message: 'Notifications retrieved successfully',
        data: result
      });
    } catch (error) {
      console.error('Error fetching notifications:', error.message);
      return res.status(500).json({
        status: false,
        code: 500,
        message: 'Failed to fetch notifications'
      });
    }
  }

  static async updateNotification(req, res) {
    try {
      const { id, title, content, type } = req.body;

      const { role_id } = req.user;
      if (role_id !== 1) {
        return res.status(403).json({
          status: false,
          code: 403,
          message: "Access denied. Only superadmins can create articles",
          data: null,
        });
      }

      if (!id) {
        return res.status(400).json({
          status: false,
          code: 400,
          message: 'Notification ID is required'
        });
      }

      const notification = await NotificationService.updateNotification({
        id,
        title,
        content,
        type
      });

      return res.status(200).json({
        status: true,
        code: 200,
        message: 'Notification updated successfully',
        data: notification
      });
    } catch (error) {
      console.error('Error updating notification:', error.message);
      return res.status(500).json({
        status: false,
        code: 500,
        message: 'Failed to update notification'
      });
    }
  }

  static async deleteNotification(req, res) {
    try {
      const { id } = req.params;

      const { role_id } = req.user;
      if (role_id !== 1) {
        return res.status(403).json({
          status: false,
          code: 403,
          message: "Access denied. Only superadmins can create articles",
          data: null,
        });
      }

      if (!id) {
        return res.status(400).json({
          status: false,
          code: 400,
          message: 'Notification ID is required'
        });
      }

      await NotificationService.deleteNotification(id);

      return res.status(200).json({
        status: true,
        code: 200,
        message: 'Notification deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting notification:', error.message);
      return res.status(500).json({
        status: false,
        code: 500,
        message: 'Failed to delete notification'
      });
    }
  }
}

module.exports = NotificationController;
