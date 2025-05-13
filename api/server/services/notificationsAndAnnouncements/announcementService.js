const db = require("../../../config/db");

class AnnouncementService {
  static async createAnnouncement({
    title,
    content,
    link,
    audience_type = "all",
    company_ids,
  }) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Insert into announcements table without is_global
      const [result] = await connection.query(
        `INSERT INTO announcements (title, content, link, audience_type, is_active, created_at)
         VALUES (?, ?, ?, ?, 1, NOW())`,
        [title, content, link, audience_type]
      );

      const announcementId = result.insertId;

      // Insert into announcement_company table if company_ids are provided and audience_type isn't 'all'
      if (audience_type !== 'all' && company_ids && company_ids.length > 0) {
        const companyValues = company_ids.map((company_id) => [
          announcementId,
          company_id,
        ]);
        await connection.query(
          `INSERT INTO announcement_company (announcement_id, company_id)
           VALUES ?`,
          [companyValues]
        );
      }

      await connection.commit();
      return { success: true, announcementId };
    } catch (error) {
      await connection.rollback();
      console.error("Error in createAnnouncement:", error.message);
      throw new Error("Failed to create announcement");
    } finally {
      connection.release();
    }
  }

  static async getAnnouncements({ company_id, page = 1, limit = 10, audience_type, user_id }) {
    try {
      const offset = (page - 1) * limit;

      let query = `
        SELECT a.id, a.title, a.content, a.link, a.audience_type, a.created_at,
               CASE WHEN ar.id IS NOT NULL THEN 1 ELSE 0 END as is_read
        FROM announcements a
      `;
      
      let countQuery = `
        SELECT COUNT(*) as count
        FROM announcements a
      `;
      
      const queryParams = [];
      const countParams = [];

      // Add join for read status if user_id is provided
      if (user_id) {
        query += `
          LEFT JOIN announcement_reads ar ON a.id = ar.announcement_id AND ar.user_id = ?
        `;
        queryParams.push(user_id);
      } else {
        query += `
          LEFT JOIN announcement_reads ar ON a.id = ar.announcement_id AND ar.user_id = NULL
        `;
      }

      if (company_id) {
        if (audience_type === 'employees') {
          // For employees, fetch employee announcements, company_employees announcements AND 'all' announcements
          query += `
            LEFT JOIN announcement_company ac ON a.id = ac.announcement_id
            WHERE a.is_active = 1 
            AND (
              a.audience_type = 'employees' 
              OR a.audience_type = 'all' 
              OR (a.audience_type = 'company_employees' AND ac.company_id = ?)
            )
            AND (a.audience_type = 'all' OR a.audience_type = 'employees' OR ac.company_id = ?)
          `;
          countQuery += `
            LEFT JOIN announcement_company ac ON a.id = ac.announcement_id
            WHERE a.is_active = 1 
            AND (
              a.audience_type = 'employees' 
              OR a.audience_type = 'all' 
              OR (a.audience_type = 'company_employees' AND ac.company_id = ?)
            )
            AND (a.audience_type = 'all' OR a.audience_type = 'employees' OR ac.company_id = ?)
          `;
          queryParams.push(company_id, company_id);
          countParams.push(company_id, company_id);
        } else if (audience_type === 'company') {
          // For companies, fetch both company announcements AND 'all' announcements
          query += `
            LEFT JOIN announcement_company ac ON a.id = ac.announcement_id
            WHERE a.is_active = 1 
            AND (a.audience_type = 'company' OR a.audience_type = 'all')
            AND (a.audience_type = 'all' OR ac.company_id = ?)
          `;
          countQuery += `
            LEFT JOIN announcement_company ac ON a.id = ac.announcement_id
            WHERE a.is_active = 1 
            AND (a.audience_type = 'company' OR a.audience_type = 'all')
            AND (a.audience_type = 'all' OR ac.company_id = ?)
          `;
          queryParams.push(company_id);
          countParams.push(company_id);
        } else {
          // For 'all' audience_type, fetch all announcements for this company
          query += `
            LEFT JOIN announcement_company ac ON a.id = ac.announcement_id
            WHERE a.is_active = 1 
            AND (a.audience_type = 'all' OR ac.company_id = ?)
          `;
          countQuery += `
            LEFT JOIN announcement_company ac ON a.id = ac.announcement_id
            WHERE a.is_active = 1 
            AND (a.audience_type = 'all' OR ac.company_id = ?)
          `;
          queryParams.push(company_id);
          countParams.push(company_id);
        }
      } else {
        // If no company_id, fetch all active announcements
        query += `WHERE a.is_active = 1`;
        countQuery += `WHERE a.is_active = 1`;
      }

      query += `
        ORDER BY a.created_at DESC
        LIMIT ? OFFSET ?
      `;
      queryParams.push(limit, offset);

      console.log("Query: ", query);
      console.log("Params: ", queryParams);

      // Fetch total count of announcements
      const [countResult] = await db.query(countQuery, countParams);
      const totalAnnouncements = countResult[0].count;

      // Fetch paginated announcements
      const [announcements] = await db.query(query, queryParams);

      return {
        announcements,
        pagination: {
          current_page: page,
          per_page: limit,
          total: totalAnnouncements,
        },
      };
    } catch (error) {
      console.error("Error in getAnnouncements:", error.message);
      throw new Error("Failed to fetch announcements");
    }
  }

  static async updateAnnouncement({
    id,
    title,
    content,
    link,
    audience_type,
    is_active,
  }) {
    try {
      const [result] = await db.query(
        `UPDATE announcements
         SET title = ?, content = ?, link = ?, audience_type = ?, is_active = ?
         WHERE id = ?`,
        [title, content, link, audience_type, is_active, id]
      );

      if (result.affectedRows === 0) {
        throw new Error("Announcement not found");
      }

      return { success: true };
    } catch (error) {
      console.error("Error in updateAnnouncement:", error.message);
      throw new Error("Failed to update announcement");
    }
  }

  static async deleteAnnouncement({ id }) {
    try {
      const [result] = await db.query(
        `UPDATE announcements
       SET is_active = 0
       WHERE id = ?`,
        [id]
      );

      if (result.affectedRows === 0) {
        throw new Error("Announcement not found");
      }

      return { success: true };
    } catch (error) {
      console.error("Error in deleteAnnouncement:", error.message);
      throw new Error("Failed to delete announcement");
    }
  }

  // Mark announcement as read for a user
  static async markAnnouncementAsRead(announcement_id, user_id, company_id) {
    try {
      // First, check if the announcement exists and is active
      const [announcement] = await db.query(
        `SELECT id, audience_type FROM announcements WHERE id = ? AND is_active = 1`,
        [announcement_id]
      );
      console.log("announcement: ", announcement);

      if (announcement.length === 0) {
        throw new Error("Announcement not found or inactive");
      }

      // Check if this announcement is relevant for this user based on audience_type
      if (announcement[0].audience_type !== 'all') {
        // For targeted announcements, verify the user belongs to the target audience
        const [userRole] = await db.query(
          `SELECT role_id FROM users WHERE user_id = ?`,
          [user_id]
        );
        console.log("userRole: ", userRole);
        
        if (!userRole.length) {
          throw new Error("User not found");
        }
        
        // For 'employees' audience type, check if user is an employee (role_id = 3)
        if (announcement[0].audience_type === 'employees' && userRole[0].role_id !== 3) {
          throw new Error("This announcement is not targeted to this user");
        }
        
        // For 'company' audience type, check if user is a company admin (role_id = 2)
        if (announcement[0].audience_type === 'company' && userRole[0].role_id !== 2) {
          throw new Error("This announcement is not targeted to this user");
        }
        
        // For company-specific announcements, check if the company is targeted
        if (announcement[0].audience_type === 'company' || announcement[0].audience_type === 'company_employees') {
          const [targetedCompany] = await db.query(
            `SELECT * FROM announcement_company 
             WHERE announcement_id = ? AND company_id = ?`,
            [announcement_id, company_id]
          );
          
          if (targetedCompany.length === 0) {
            throw new Error("This announcement is not targeted to this company");
          }
        }
      }

      // Insert or update the read record
      await db.query(
        `INSERT INTO announcement_reads (announcement_id, user_id, company_id, read_at)
         VALUES (?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE read_at = NOW()`,
        [announcement_id, user_id, company_id]
      );

      return { success: true };
    } catch (error) {
      console.error("Error in markAnnouncementAsRead:", error.message);
      throw new Error("Failed to mark announcement as read: " + error.message);
    }
  }

  // Mark multiple announcements as read
  static async markMultipleAnnouncementsAsRead(user_id, company_id, announcement_ids = []) {
    try {
      // If specific IDs are provided, mark each one
      if (announcement_ids && announcement_ids.length > 0) {
        for (const announcement_id of announcement_ids) {
          await this.markAnnouncementAsRead(announcement_id, user_id, company_id);
        }
        return { success: true };
      }
      
      // If no specific IDs, get all relevant announcements for this user and company
      const [userRole] = await db.query(
        `SELECT role_id FROM users WHERE user_id = ?`,
        [user_id]
      );
      
      if (!userRole.length) {
        throw new Error("User not found");
      }
      
      let audienceCondition = "";
      
      // For employees (role_id = 3), include 'all' and 'employees' audience types
      if (userRole[0].role_id === 3) {
        audienceCondition = "AND (a.audience_type = 'all' OR a.audience_type = 'employees')";
      }
      // For company admins (role_id = 2), include 'all' and 'company' audience types
      else if (userRole[0].role_id === 2) {
        audienceCondition = "AND (a.audience_type = 'all' OR a.audience_type = 'company')";
      }
      // For superadmins (role_id = 1), include all audience types
      else if (userRole[0].role_id === 1) {
        audienceCondition = "";
      }
      
      // Get all relevant announcements
      const query = `
        SELECT a.id 
        FROM announcements a
        LEFT JOIN announcement_company ac ON a.id = ac.announcement_id
        WHERE a.is_active = 1 
        ${audienceCondition}
        AND (a.audience_type = 'all' OR ac.company_id = ?)
        AND NOT EXISTS (
          SELECT 1 FROM announcement_reads ar 
          WHERE ar.announcement_id = a.id AND ar.user_id = ?
        )
      `;
      
      const [announcements] = await db.query(query, [company_id, user_id]);
      
      // Mark each announcement as read
      for (const announcement of announcements) {
        await db.query(
          `INSERT INTO announcement_reads (announcement_id, user_id, company_id, read_at)
           VALUES (?, ?, ?, NOW())`,
          [announcement.id, user_id, company_id]
        );
      }
      
      return { 
        success: true,
        count: announcements.length
      };
    } catch (error) {
      console.error("Error in markMultipleAnnouncementsAsRead:", error.message);
      throw new Error("Failed to mark announcements as read: " + error.message);
    }
  }
}

module.exports = AnnouncementService;
