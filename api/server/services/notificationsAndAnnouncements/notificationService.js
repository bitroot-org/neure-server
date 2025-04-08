const db = require("../../../config/db");

class NotificationService {
  static async getNotificationAndAnnouncementsService({
    company_id,
    is_announcements,
    is_notification,
    page = 1,
    limit = 10,
  }) {
    try {
      const offset = (page - 1) * limit;
      let announcements = [];
      let notifications = [];
      let totalAnnouncements = 0;
      let totalNotifications = 0;

      if (is_announcements === 1) {
        // Get total announcements count
        const [announcementCount] = await db.query(
          `SELECT COUNT(*) as count
             FROM announcements a
             JOIN announcement_company ac ON a.id = ac.announcement_id
             WHERE ac.company_id = ? AND a.is_active = 1`,
          [company_id]
        );
        totalAnnouncements = announcementCount[0].count;

        // Get paginated announcements
        [announcements] = await db.query(
          `SELECT a.id, a.title, a.content, a.image_url, a.link, a.created_at
             FROM announcements a
             JOIN announcement_company ac ON a.id = ac.announcement_id
             WHERE ac.company_id = ? AND a.is_active = 1
             ORDER BY a.created_at DESC
             LIMIT ? OFFSET ?`,
          [company_id, limit, offset]
        );
      }

      if (is_notification === 1) {
        // Get total notifications count
        const [notificationCount] = await db.query(
          `SELECT COUNT(*) as count
             FROM notifications n
             WHERE n.company_id = ?`,
          [company_id]
        );
        totalNotifications = notificationCount[0].count;

        // Get paginated notifications
        [notifications] = await db.query(
          `SELECT n.id, n.title, n.content, n.type, n.created_at
             FROM notifications n
             WHERE n.company_id = ?
             ORDER BY n.created_at DESC
             LIMIT ? OFFSET ?`,
          [company_id, limit, offset]
        );
      }

      // If no specific flag is passed, fetch both
      if (!is_announcements && !is_notification) {
        [announcements] = await db.query(
          `SELECT a.id, a.title, a.content, a.image_url, a.link, a.created_at
           FROM announcements a
           JOIN announcement_company ac ON a.id = ac.announcement_id
           WHERE ac.company_id = ? AND a.is_active = 1`,
          [company_id]
        );
        totalAnnouncements = announcements.length;

        [notifications] = await db.query(
          `SELECT n.id, n.title, n.content, n.type, n.created_at
           FROM notifications n
           WHERE n.company_id = ?`,
          [company_id]
        );
        totalNotifications = notifications.length;
      }

      return {
        announcements,
        notifications,
        pagination: {
            current_page: page,
            per_page: limit,
            total_announcements: totalAnnouncements,
            total_notifications: totalNotifications,
        }
    };    } catch (error) {
      console.error("Error in NotificationService:", error.message);
      throw new Error("Database query failed");
    }
  }

  
}

module.exports = NotificationService;
