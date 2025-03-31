const db = require("../../../config/db");

class AnalyticsService {
  static async getAnalytics(timeRange = 30) {
    try {
      const [
        userTrends,
        companyTrends,
        engagementTrends,
        contentUsageTrends
      ] = await Promise.all([
        this.getUserTrends(timeRange),
        this.getCompanyTrends(timeRange),
        this.getEngagementTrends(timeRange),
        this.getContentUsageTrends(timeRange)
      ]);

      return {
        status: true,
        code: 200,
        message: "Analytics data retrieved successfully",
        data: {
          userTrends,
          companyTrends,
          engagementTrends,
          contentUsageTrends
        }
      };
    } catch (error) {
      throw new Error(`Error fetching analytics: ${error.message}`);
    }
  }

  static async getUserTrends(days) {
    const [results] = await db.query(`
      WITH RECURSIVE dates AS (
        SELECT CURDATE() - INTERVAL ? DAY as date
        UNION ALL
        SELECT date + INTERVAL 1 DAY
        FROM dates
        WHERE date < CURDATE()
      )
      SELECT 
        DATE_FORMAT(d.date, '%Y-%m-%d') as date,
        COUNT(u.user_id) as new_users,
        (
          SELECT COUNT(*)
          FROM users
          WHERE DATE(created_at) <= d.date
            AND is_active = 1
        ) as total_users
      FROM dates d
      LEFT JOIN users u ON DATE(u.created_at) = d.date
      GROUP BY d.date
      ORDER BY d.date
    `, [days]);
    
    return results;
  }

  static async getCompanyTrends(days) {
    const [results] = await db.query(`
      WITH RECURSIVE dates AS (
        SELECT CURDATE() - INTERVAL ? DAY as date
        UNION ALL
        SELECT date + INTERVAL 1 DAY
        FROM dates
        WHERE date < CURDATE()
      )
      SELECT 
        DATE_FORMAT(d.date, '%Y-%m-%d') as date,
        ROUND(AVG(c.psychological_safety_index), 2) as avg_psi,
        ROUND(AVG(c.stress_level), 2) as avg_stress,
        ROUND(AVG(c.engagement_score), 2) as avg_engagement,
        COUNT(DISTINCT c.id) as active_companies
      FROM dates d
      LEFT JOIN companies c ON DATE(c.created_at) <= d.date AND c.active = 1
      GROUP BY d.date
      ORDER BY d.date
    `, [days]);
    
    return results;
  }

  static async getEngagementTrends(days) {
    const [results] = await db.query(`
      WITH RECURSIVE dates AS (
        SELECT CURDATE() - INTERVAL ? DAY as date
        UNION ALL
        SELECT date + INTERVAL 1 DAY
        FROM dates
        WHERE date < CURDATE()
      )
      SELECT 
        DATE_FORMAT(d.date, '%Y-%m-%d') as date,
        ROUND(AVG(ce.workshop_attendance_percentage), 2) as avg_workshop_attendance,
        ROUND(AVG(ce.content_engagement_percentage), 2) as avg_content_engagement,
        COUNT(DISTINCT CASE WHEN ce.stress_bar_updated = 1 THEN ce.user_id END) as stress_tracking_users,
        COUNT(DISTINCT CASE 
          WHEN ce.last_activity_date = d.date THEN ce.user_id 
        END) as daily_active_users,
        COUNT(DISTINCT CASE 
          WHEN ce.last_activity_type = 'workshop' AND ce.last_activity_date = d.date THEN ce.user_id 
        END) as workshop_active_users,
        COUNT(DISTINCT CASE 
          WHEN ce.last_activity_type = 'content' AND ce.last_activity_date = d.date THEN ce.user_id 
        END) as content_active_users
      FROM dates d
      LEFT JOIN company_employees ce ON DATE(ce.last_activity_date) = d.date
      GROUP BY d.date
      ORDER BY d.date
    `, [days]);
    
    return results;
  }

  static async getContentUsageTrends(days) {
    const [results] = await db.query(`
      WITH RECURSIVE dates AS (
        SELECT CURDATE() - INTERVAL ? DAY as date
        UNION ALL
        SELECT date + INTERVAL 1 DAY
        FROM dates
        WHERE date < CURDATE()
      )
      SELECT 
        DATE_FORMAT(d.date, '%Y-%m-%d') as date,
        COUNT(DISTINCT s.id) as new_soundscapes,
        COUNT(DISTINCT a.id) as new_articles,
        COUNT(DISTINCT w.id) as new_workshops,
        COUNT(DISTINCT CASE WHEN g.file_type = 'image' THEN g.id END) as new_images,
        COUNT(DISTINCT CASE WHEN g.file_type = 'video' THEN g.id END) as new_videos,
        COUNT(DISTINCT CASE WHEN g.file_type = 'document' THEN g.id END) as new_documents,
        (
          SELECT COUNT(DISTINCT cga.company_id)
          FROM company_gallery_assignments cga
          JOIN gallery g2 ON g2.id = cga.gallery_item_id
          WHERE DATE(cga.created_at) = d.date
        ) as companies_using_resources
      FROM dates d
      LEFT JOIN soundscapes s ON DATE(s.created_at) = d.date
      LEFT JOIN articles a ON DATE(a.created_at) = d.date
      LEFT JOIN workshops w ON DATE(w.created_at) = d.date
      LEFT JOIN gallery g ON DATE(g.created_at) = d.date
      GROUP BY d.date
      ORDER BY d.date
    `, [days]);
    
    return results;
  }
}

module.exports = AnalyticsService;