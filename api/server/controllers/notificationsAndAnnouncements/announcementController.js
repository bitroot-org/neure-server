const AnnouncementService = require("../../services/notificationsAndAnnouncements/announcementService");

class AnnouncementController {
  // Create a new announcement
  static async createAnnouncement(req, res) {
    try {
      const { title, content, link, audience_type, company_ids, is_global = 0 } = req.body;
  
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
      const { company_id, page = 1, limit = 10 } = req.query;
  
      const result = await AnnouncementService.getAnnouncements({
        company_id: company_id ? parseInt(company_id) : null,
        page: parseInt(page),
        limit: parseInt(limit),
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
      console.log(id);

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
}

module.exports = AnnouncementController;