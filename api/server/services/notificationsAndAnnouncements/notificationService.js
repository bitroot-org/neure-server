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
    is_read = null,
    page = 1,
    limit = 10
  }) {
    console.log("user_id: ", user_id);
    console.log("company_id: ", company_id);
    try {
      const offset = (page - 1) * limit;
      let query = `
        SELECT DISTINCT n.* 
        FROM notifications n
        WHERE n.user_id = ?
      `;
      let countQuery = `
        SELECT COUNT(DISTINCT n.id) as total 
        FROM notifications n
        WHERE n.user_id = ?
      `;
      
      const params = [user_id];
      const countParams = [user_id];

      // Add company notifications if company_id is provided
      if (company_id) {
        query = `
          SELECT DISTINCT n.* 
          FROM notifications n
          WHERE n.user_id = ?
          OR (n.company_id = ? AND n.user_id IS NULL)
        `;
        countQuery = `
          SELECT COUNT(DISTINCT n.id) as total 
          FROM notifications n
          WHERE n.user_id = ?
          OR (n.company_id = ? AND n.user_id IS NULL)
        `;
        params.push(company_id);
        countParams.push(company_id);
      }

      if (type) {
        query += ` AND n.type = ?`;
        countQuery += ` AND n.type = ?`;
        params.push(type);
        countParams.push(type);
      }

      // Add read status filter if provided
      if (is_read !== null) {
        query += ` AND n.is_read = ?`;
        countQuery += ` AND n.is_read = ?`;
        params.push(is_read);
        countParams.push(is_read);
      }

      query += ` ORDER BY 
        CASE 
          WHEN n.priority = 'HIGH' THEN 1
          WHEN n.priority = 'MEDIUM' THEN 2
          WHEN n.priority = 'LOW' THEN 3
          ELSE 4
        END,
        n.created_at DESC 
        LIMIT ? OFFSET ?`;
      params.push(limit, offset);

      console.log("query: ", query);
      console.log("params: ", params);

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

  // Mark notification as read
  static async markNotificationAsRead(notification_id, user_id) {
    try {
      console.log("notification_id: ", notification_id);
      console.log("user_id: ", user_id);
      const [notification] = await db.query(
        `SELECT * FROM notifications 
         WHERE id = ? AND (user_id = ? OR user_id IS NULL)`,
        [notification_id, user_id]
      );
      console.log("notification: ", notification);

      if (notification.length === 0) {
        throw new Error("Notification not found or not accessible");
      }

      // Update the is_read status
      const [result] = await db.query(
        `UPDATE notifications 
         SET is_read = 1
         WHERE id = ?`,
        [notification_id]
      );

      if (result.affectedRows === 0) {
        throw new Error("Failed to mark notification as read");
      }

      return { success: true };
    } catch (error) {
      console.error("Error in markNotificationAsRead:", error.message);
      throw new Error("Failed to mark notification as read");
    }
  }

  // Mark multiple notifications as read
  static async markMultipleNotificationsAsRead(user_id, notification_ids = []) {
    try {
      // If specific IDs are provided, mark only those
      if (notification_ids && notification_ids.length > 0) {
        const placeholders = notification_ids.map(() => '?').join(',');
        const params = [...notification_ids, user_id];
        
        const [result] = await db.query(
          `UPDATE notifications 
           SET is_read = 1
           WHERE id IN (${placeholders}) 
           AND (user_id = ? OR user_id IS NULL)`,
          params
        );

        return { 
          success: true,
          count: result.affectedRows
        };
      } 
      // Otherwise mark all unread notifications for this user
      else {
        const [result] = await db.query(
          `UPDATE notifications 
           SET is_read = 1
           WHERE is_read = 0 
           AND (user_id = ? OR user_id IS NULL)`,
          [user_id]
        );

        return { 
          success: true,
          count: result.affectedRows
        };
      }
    } catch (error) {
      console.error("Error in markMultipleNotificationsAsRead:", error.message);
      throw new Error("Failed to mark notifications as read");
    }
  }
}

module.exports = NotificationService;
