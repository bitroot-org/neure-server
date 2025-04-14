const db = require("../../config/db");

const calculateMonthlyRetention = async () => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Get all active companies
    const [companies] = await connection.query(
      "SELECT id FROM companies WHERE active = 1"
    );

    // Calculate the date ranges for last month
    const now = new Date();
    const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    for (const company of companies) {
      // Get employee statistics for last month using the company_employees table
      const [employeeStats] = await connection.query(
        `SELECT 
          -- Total employees at start of month (excluding new joins)
          COUNT(DISTINCT CASE 
            WHEN joined_date < ? THEN user_id 
          END) as employees_start,

          -- Total active employees at end of month
          COUNT(DISTINCT CASE 
            WHEN joined_date <= ? AND is_active = 1 
            THEN user_id 
          END) as employees_end,

          -- New employees who joined during the month
          COUNT(DISTINCT CASE 
            WHEN DATE(joined_date) BETWEEN DATE(?) AND DATE(?)
            THEN user_id 
          END) as new_additions,

          -- Employees deactivated during the month
          COUNT(DISTINCT CASE 
            WHEN is_active = 0 
            AND DATE(last_activity_date) BETWEEN DATE(?) AND DATE(?)
            THEN user_id 
          END) as deactivated_employees
        FROM company_employees 
        WHERE company_id = ?`,
        [
          firstDayOfLastMonth,    // For employees_start
          lastDayOfLastMonth,     // For employees_end
          firstDayOfLastMonth,    // For new_additions start
          lastDayOfLastMonth,     // For new_additions end
          firstDayOfLastMonth,    // For deactivated start
          lastDayOfLastMonth,     // For deactivated end
          company.id
        ]
      );

      const stats = employeeStats[0];
      
      // Calculate retention rate
      // Formula: ((Employees at end - New additions) / Employees at start) * 100
      const retentionRate = stats.employees_start > 0 
        ? ((stats.employees_end - stats.new_additions) / stats.employees_start) * 100
        : 0;

      // Store the retention history
      await connection.query(
        `INSERT INTO company_retention_history (
          company_id,
          period_start,
          period_end,
          employees_start,
          employees_end,
          new_additions,
          deactivated_employees,
          retention_rate
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          company.id,
          firstDayOfLastMonth,
          lastDayOfLastMonth,
          stats.employees_start,
          stats.employees_end,
          stats.new_additions,
          stats.deactivated_employees,
          retentionRate
        ]
      );

      // Update the company's current retention rate
      await connection.query(
        `UPDATE companies 
         SET 
           retention_rate = ?,
           updated_at = NOW()
         WHERE id = ?`,
        [retentionRate, company.id]
      );

      console.log(`Updated retention rate for company ${company.id}:`, {
        retentionRate: `${retentionRate.toFixed(2)}%`,
        period: {
          start: firstDayOfLastMonth.toISOString().split('T')[0],
          end: lastDayOfLastMonth.toISOString().split('T')[0]
        },
        metrics: {
          startingEmployees: stats.employees_start,
          endingEmployees: stats.employees_end,
          newAdditions: stats.new_additions,
          deactivated: stats.deactivated_employees
        }
      });
    }

    await connection.commit();
    return { 
      status: true, 
      message: "Monthly retention rates updated successfully",
      period: {
        start: firstDayOfLastMonth,
        end: lastDayOfLastMonth
      }
    };

  } catch (error) {
    await connection.rollback();
    console.error("Error calculating monthly retention rates:", error);
    return { status: false, error: error.message };
  } finally {
    connection.release();
  }
};

// Function to get retention history for a specific company
const getCompanyRetentionHistory = async (company_id, months = 12) => {
  try {
    const [history] = await db.query(
      `SELECT 
        period_start,
        period_end,
        employees_start,
        employees_end,
        new_additions,
        deactivated_employees,
        retention_rate,
        created_at
      FROM company_retention_history
      WHERE company_id = ?
      ORDER BY period_end DESC
      LIMIT ?`,
      [company_id, months]
    );

    return {
      status: true,
      data: history
    };
  } catch (error) {
    console.error("Error fetching retention history:", error);
    return {
      status: false,
      error: error.message
    };
  }
};

module.exports = {
  calculateMonthlyRetention,
  getCompanyRetentionHistory
};
