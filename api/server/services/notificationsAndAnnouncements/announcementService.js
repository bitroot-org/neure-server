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

  static async getAnnouncements({ company_id, page = 1, limit = 10, audience_type }) {
    try {
      const offset = (page - 1) * limit;

      let query = `
        SELECT a.id, a.title, a.content, a.link, a.audience_type, a.created_at
        FROM announcements a
      `;
      let countQuery = `
        SELECT COUNT(*) as count
        FROM announcements a
      `;
      const queryParams = [];
      const countParams = [];

      if (company_id) {
        if (audience_type === 'employees') {
          console.log("employee type from servive: ", audience_type);
          // For employees, fetch both employee announcements AND 'all' announcements
          query += `
            LEFT JOIN announcement_company ac ON a.id = ac.announcement_id
            WHERE a.is_active = 1 
            AND (a.audience_type = 'employees' OR a.audience_type = 'all')
            AND (a.audience_type = 'all' OR ac.company_id = ?)
          `;
          countQuery += `
            LEFT JOIN announcement_company ac ON a.id = ac.announcement_id
            WHERE a.is_active = 1 
            AND (a.audience_type = 'employees' OR a.audience_type = 'all')
            AND (a.audience_type = 'all' OR ac.company_id = ?)
          `;
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
        }
        queryParams.push(company_id);
        countParams.push(company_id);
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
}

module.exports = AnnouncementService;
