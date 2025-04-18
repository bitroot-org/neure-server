const db = require("../../../config/db");

class DashboardService {
  static async getDashboardMetrics() {
    try {
      // Get today's date at midnight
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get date 30 days ago
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Get various metrics using Promise.all for parallel execution
      const [
        totalStats,
        newStats,
        companyMetrics,
        userEngagement,
        topCompanies
      ] = await Promise.all([
        this.getTotalStats(),
        this.getNewStats(today),
        this.getCompanyMetrics(),
        this.getUserEngagement(),
        this.getTopCompanies()
      ]);

      return {
        status: true,
        code: 200,
        message: "Dashboard metrics retrieved successfully",
        data: {
          totalStats,
          newStats,
          companyMetrics,
          userEngagement,
          topCompanies
        }
      };
    } catch (error) {
      throw new Error(`Error fetching dashboard metrics: ${error.message}`);
    }
  }

  // Get total counts of companies, users, etc.
  static async getTotalStats() {
    console.log("Fetching total stats");
    const [results] = await db.query(`
      SELECT
        (SELECT COUNT(*) FROM companies WHERE active = 1) as total_companies,
        (SELECT COUNT(*) FROM users WHERE is_active = 1) as total_users,
        (SELECT COUNT(*) FROM soundscapes) as total_soundscapes,
        (SELECT COUNT(*) FROM articles) as total_articles,
        (SELECT COUNT(*) FROM workshops) as total_workshops
    `);
    
    return results[0];
  }

  // Get new registrations/creations for today
  static async getNewStats(today) {
    const [results] = await db.query(`
      SELECT
        (SELECT COUNT(*) FROM companies WHERE DATE(created_at) = DATE(?) AND active = 1) as new_companies,
        (SELECT COUNT(*) FROM users WHERE DATE(created_at) = DATE(?) AND is_active = 1) as new_users,
        (SELECT COUNT(*) FROM soundscapes WHERE DATE(created_at) = DATE(?)) as new_soundscapes,
        (SELECT COUNT(*) FROM articles WHERE DATE(created_at) = DATE(?)) as new_articles,
        (SELECT COUNT(*) FROM workshops WHERE DATE(created_at) = DATE(?)) as new_workshops
    `, [today, today, today, today, today]);
    
    return results[0];
  }

  // Get company-related metrics
  static async getCompanyMetrics() {
    const [results] = await db.query(`
      SELECT
        ROUND(AVG(stress_level), 2) as average_stress_level,
        ROUND(AVG(psychological_safety_index), 2) as average_psi,
        ROUND(AVG(retention_rate), 2) as average_retention_rate,
        ROUND(AVG(engagement_score), 2) as average_engagement_score
      FROM companies
      WHERE active = 1
    `);
    
    return results[0];
  }

  // Get user engagement metrics
  static async getUserEngagement() {
    const [results] = await db.query(`
      SELECT
        (SELECT COUNT(*) FROM company_employees WHERE workshop_attendance_count > 0) as workshop_engaged_users,
        (SELECT COUNT(*) FROM company_employees WHERE content_engagement_percentage > 0) as content_engaged_users,
        (SELECT COUNT(*) FROM company_employees WHERE stress_bar_updated = 1) as stress_tracking_users,
        (SELECT COUNT(*) FROM company_employees WHERE assessment_completion = 1) as assessment_complete_users
      FROM dual
    `);
    
    return results[0];
  }

  // Get top performing companies
  static async getTopCompanies() {
    const [results] = await db.query(`
      SELECT 
        c.id,
        c.company_name,
        c.company_profile_url,
        c.psychological_safety_index as psi,
        c.retention_rate,
        c.engagement_score,
        COUNT(ce.user_id) as total_employees
      FROM companies c
      LEFT JOIN company_employees ce ON c.id = ce.company_id
      WHERE c.active = 1
      GROUP BY c.id
      ORDER BY c.psychological_safety_index DESC
      LIMIT 5
    `);
    
    return results;
  }
}

module.exports = DashboardService;