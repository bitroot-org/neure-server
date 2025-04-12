const db = require("../../../config/db");

class NotificationService {
  // Create notification
  static async createNotification({
    title,
    content,
    type,
    company_id = null,
    user_id = null
  }) {
    try {
      const [result] = await db.query(
        `INSERT INTO notifications (title, content, type, company_id, user_id)
         VALUES (?, ?, ?, ?, ?)`,
        [title, content, type, company_id, user_id]
      );

      return {
        id: result.insertId,
        title,
        content,
        type,
        company_id,
        user_id,
        created_at: new Date()
      };
    } catch (error) {
      console.error("Error in createNotification:", error.message);
      throw new Error("Failed to create notification");
    }
  }

  // Get notifications with filters
  static async getNotifications({
    company_id = null,
    user_id = null,
    type = null,
    page = 1,
    limit = 10
  }) {
    try {
      const offset = (page - 1) * limit;
      let query = `SELECT * FROM notifications WHERE 1=1`;
      let countQuery = `SELECT COUNT(*) as total FROM notifications WHERE 1=1`;
      const params = [];
      const countParams = [];

      if (company_id) {
        query += ` AND company_id = ?`;
        countQuery += ` AND company_id = ?`;
        params.push(company_id);
        countParams.push(company_id);
      }

      if (user_id) {
        query += ` AND user_id = ?`;
        countQuery += ` AND user_id = ?`;
        params.push(user_id);
        countParams.push(user_id);
      }

      if (type) {
        query += ` AND type = ?`;
        countQuery += ` AND type = ?`;
        params.push(type);
        countParams.push(type);
      }

      query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
      params.push(limit, offset);

      const [notifications] = await db.query(query, params);
      const [countResult] = await db.query(countQuery, countParams);

      return {
        notifications,
        pagination: {
          current_page: page,
          per_page: limit,
          total: countResult[0].total
        }
      };
    } catch (error) {
      console.error("Error in getNotifications:", error.message);
      throw new Error("Failed to fetch notifications");
    }
  }

  // Update notification
  static async updateNotification({
    id,
    title,
    content,
    type
  }) {
    try {
      const [result] = await db.query(
        `UPDATE notifications 
         SET title = ?, content = ?, type = ?
         WHERE id = ?`,
        [title, content, type, id]
      );

      if (result.affectedRows === 0) {
        throw new Error("Notification not found");
      }

      return {
        id,
        title,
        content,
        type,
        updated_at: new Date()
      };
    } catch (error) {
      console.error("Error in updateNotification:", error.message);
      throw new Error("Failed to update notification");
    }
  }

  // Delete notification
  static async deleteNotification(id) {
    try {
      const [result] = await db.query(
        `DELETE FROM notifications WHERE id = ?`,
        [id]
      );

      if (result.affectedRows === 0) {
        throw new Error("Notification not found");
      }

      return true;
    } catch (error) {
      console.error("Error in deleteNotification:", error.message);
      throw new Error("Failed to delete notification");
    }
  }
}

module.exports = NotificationService;
