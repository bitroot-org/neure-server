const AnnouncementService = require("../../services/notificationsAndAnnouncements/announcementService");
const db = require("../../../config/db");

class AnnouncementController {
  // Create a new announcement
  static async createAnnouncement(req, res) {
    try {
      const { title, content, link, audience_type, company_ids, is_global = 0 } = req.body;

      const { role_id } = req.user;
      if (role_id !== 1) {
        return res.status(403).json({
          status: false,
          code: 403,
          message: "Access denied. Only superadmins can create articles",
          data: null,
        });
      }
  
      if (!title || !content) {
        return res.status(400).json({
          status: false,
          code: 400,
          message: "Title and content are required",
        });
      }
  
      const result = await AnnouncementService.createAnnouncement({
        title,
        content,
        link,
        audience_type,
        company_ids,
        is_global,
      });
  
      return res.status(201).json({
        status: true,
        code: 201,
        message: "Announcement created successfully",
        data: result,
      });
    } catch (error) {
      console.error("Error creating announcement:", error.message);
      return res.status(500).json({
        status: false,
        code: 500,
        message: "Failed to create announcement",
      });
    }
  }

  // Get announcements
  static async getAnnouncements(req, res) {
    try {
      const { company_id, page = 1, limit = 10, audience_type } = req.query;
      const user_id = req.user.user_id;
      
      // Get user's join date
      const [userJoinData] = await db.query(
        `SELECT joined_date FROM company_employees WHERE user_id = ? AND is_active = 1`,
        [user_id]
      );
      
      const joinDate = userJoinData && userJoinData.length > 0 ? 
        userJoinData[0].joined_date : null;
  
      const result = await AnnouncementService.getAnnouncements({
        company_id: company_id ? parseInt(company_id) : null,
        page: parseInt(page),
        limit: parseInt(limit),
        audience_type,
        user_id, // Pass user_id to get read status
        join_date: joinDate // Pass join date to filter announcements
      });
  
      return res.status(200).json({
        status: true,
        code: 200,
        message: "Announcements retrieved successfully",
        data: result,
      });
    } catch (error) {
      console.error("Error fetching announcements:", error.message);
      return res.status(500).json({
        status: false,
        code: 500,
        message: "Failed to fetch announcements",
      });
    }
  }

  // Update an announcement
  static async updateAnnouncement(req, res) {
    try {
      const { id, title, content, link, audience_type, is_active } = req.body;

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
          message: "Announcement ID is required",
        });
      }

      const result = await AnnouncementService.updateAnnouncement({
        id,
        title,
        content,
        link,
        audience_type,
        is_active,
      });

      return res.status(200).json({
        status: true,
        code: 200,
        message: "Announcement updated successfully",
        data: result,
      });
    } catch (error) {
      console.error("Error updating announcement:", error.message);
      return res.status(500).json({
        status: false,
        code: 500,
        message: "Failed to update announcement",
      });
    }
  }

  // Delete an announcement
  static async deleteAnnouncement(req, res) {
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
          message: "Announcement ID is required",
        });
      }

      const result = await AnnouncementService.deleteAnnouncement({ id });

      return res.status(200).json({
        status: true,
        code: 200,
        message: "Announcement deleted successfully",
        data: result,
      });
    } catch (error) {
      console.error("Error deleting announcement:", error.message);
      return res.status(500).json({
        status: false,
        code: 500,
        message: "Failed to delete announcement",
      });
    }
  }

  static async markAsRead(req, res) {
    try {
      const { announcement_id, company_id } = req.body;
      console.log("announcement_id: ", announcement_id);
      console.log("company_id: ", company_id);
      const user_id = req.user.user_id;

      if (!announcement_id) {
        return res.status(400).json({
          status: false,
          code: 400,
          message: "Announcement ID is required",
        });
      }

      if (!company_id) {
        return res.status(400).json({
          status: false,
          code: 400,
          message: "Company ID is required",
        });
      }

      await AnnouncementService.markAnnouncementAsRead(announcement_id, user_id, company_id);

      return res.status(200).json({
        status: true,
        code: 200,
        message: "Announcement marked as read",
      });
    } catch (error) {
      console.error("Error marking announcement as read:", error.message);
      return res.status(500).json({
        status: false,
        code: 500,
        message: error.message || "Failed to mark announcement as read",
      });
    }
  }

  static async markAllAsRead(req, res) {
    try {
      const { announcement_ids, company_id } = req.body;
      const user_id = req.user.user_id;

      if (!company_id) {
        return res.status(400).json({
          status: false,
          code: 400,
          message: "Company ID is required",
        });
      }

      const result = await AnnouncementService.markMultipleAnnouncementsAsRead(
        user_id,
        company_id,
        announcement_ids
      );

      return res.status(200).json({
        status: true,
        code: 200,
        message: announcement_ids && announcement_ids.length > 0 ? 
          "Selected announcements marked as read" : 
          `${result.count} announcements marked as read`,
      });
    } catch (error) {
      console.error("Error marking announcements as read:", error.message);
      return res.status(500).json({
        status: false,
        code: 500,
        message: error.message || "Failed to mark announcements as read",
      });
    }
  }

  static async getUnreadCount(req, res) {
    try {
      const { company_id } = req.query;
      const user_id = req.user.user_id;
      
      const count = await AnnouncementService.getUnreadAnnouncementCount(
        user_id,
        company_id ? parseInt(company_id) : null
      );
      
      return res.status(200).json({
        status: true,
        code: 200,
        message: 'Unread announcement count retrieved successfully',
        data: { count }
      });
    } catch (error) {
      console.error('Error fetching announcement count:', error.message);
      return res.status(500).json({
        status: false,
        code: 500,
        message: 'Failed to fetch announcement count'
      });
    }
  }
}

module.exports = AnnouncementController;
