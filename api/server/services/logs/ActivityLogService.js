const db = require("../../../config/db");

class ActivityLogService {

  static async createLog({ user_id = null, performed_by, module_name, action, description }) {
    try {
      const [result] = await db.query(
        `INSERT INTO activity_logs 
         (user_id, performed_by, module_name, action, description) 
         VALUES (?, ?, ?, ?, ?)`,
        [user_id, performed_by, module_name, action, description]
      );

      return {
        status: true,
        code: 201,
        message: "Activity log created successfully",
        data: { id: result.insertId }
      };
    } catch (error) {
      console.error("Error creating activity log:", error.message);
      throw new Error("Failed to create activity log: " + error.message);
    }
  }

  static async getLogs({ page = 1, limit = 10, module_name, action, performed_by, start_date, end_date, user_id }) {
    try {
      const offset = (page - 1) * limit;
      let conditions = [];
      let params = [];
      
      // Build conditions array and params array
      if (module_name) {
        conditions.push("module_name = ?");
        params.push(module_name);
      }
      
      if (action) {
        conditions.push("action = ?");
        params.push(action);
      }
      
      if (performed_by) {
        conditions.push("performed_by = ?");
        params.push(performed_by);
      }
      
      if (user_id) {
        conditions.push("user_id = ?");
        params.push(user_id);
      }
      
      if (start_date && end_date) {
        conditions.push("created_at BETWEEN ? AND ?");
        params.push(start_date, end_date);
      } else if (start_date) {
        conditions.push("created_at >= ?");
        params.push(start_date);
      } else if (end_date) {
        conditions.push("created_at <= ?");
        params.push(end_date);
      }
      
      // Construct WHERE clause if conditions exist
      const whereClause = conditions.length > 0 ? ` WHERE ${conditions.join(" AND ")}` : "";
      
      // Count query
      const countQuery = `SELECT COUNT(*) as total FROM activity_logs${whereClause}`;
      const [countResult] = await db.query(countQuery, params);
      
      // Data query with pagination
      const query = `SELECT * FROM activity_logs${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`;
      const queryParams = [...params, limit, offset];
      const [logs] = await db.query(query, queryParams);
      
      return {
        status: true,
        code: 200,
        message: "Activity logs retrieved successfully",
        data: {
          logs,
          pagination: {
            total: countResult[0].total,
            current_page: page,
            total_pages: Math.ceil(countResult[0].total / limit),
            per_page: limit
          }
        }
      };
    } catch (error) {
      console.error("Error fetching activity logs:", error);
      throw new Error(`Failed to fetch activity logs: ${error.message}`);
    }
  }

  static async getActivitySummary(start_date = null, end_date = null) {
    try {
      let query = `
        SELECT 
          module_name, 
          COUNT(*) as total_activities,
          COUNT(DISTINCT user_id) as unique_users,
          COUNT(DISTINCT DATE(created_at)) as active_days
        FROM activity_logs
        WHERE TRUE
      `;
      const params = [];

      if (start_date) {
        query += ` AND DATE(created_at) >= ?`;
        params.push(start_date);
      }

      if (end_date) {
        query += ` AND DATE(created_at) <= ?`;
        params.push(end_date);
      }

      query += ` GROUP BY module_name ORDER BY total_activities DESC`;

      const [summary] = await db.query(query, params);

      return {
        status: true,
        code: 200,
        message: "Activity summary retrieved successfully",
        data: summary
      };
    } catch (error) {
      console.error("Error fetching activity summary:", error.message);
      throw new Error("Failed to fetch activity summary: " + error.message);
    }
  }
}

module.exports = ActivityLogService;
