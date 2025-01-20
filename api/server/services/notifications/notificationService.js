const db = require("../../../config/db");

class NotificationService {
    static async getNotificationAndAnnouncementsService({ company_id, is_announcements, is_notification }) {
        try {
            let announcements = [];
            let notifications = [];

            // Check if only announcements are requested
            if (is_announcements === 1) {
                [announcements] = await db.query(
                    `SELECT a.id, a.title, a.content, a.image_url, a.link, a.created_at
           FROM announcements a
           JOIN announcement_company ac ON a.id = ac.announcement_id
           WHERE ac.company_id = ? AND a.is_active = 1`,
                    [company_id]
                );
            }

            // Check if only notifications are requested
            if (is_notification === 1) {
                [notifications] = await db.query(
                    `SELECT n.id, n.title, n.content, n.type, n.created_at
           FROM notifications n
           WHERE n.company_id = ?`,
                    [company_id]
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

                [notifications] = await db.query(
                    `SELECT n.id, n.title, n.content, n.type, n.created_at
           FROM notifications n
           WHERE n.company_id = ?`,
                    [company_id]
                );
            }

            return { announcements, notifications };
        } catch (error) {
            console.error('Error in NotificationService:', error.message);
            throw new Error('Database query failed');
        }
    }
    
}

module.exports = NotificationService;
