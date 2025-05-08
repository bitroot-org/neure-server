const cron = require("node-cron");
const db = require("../config/db");
const { calculateMonthlyRetention } = require('../server/utils/retentionCalculator');

// Function to calculate the company stress level
const calculateCompanyStressLevel = async () => {
  try {
    // Query to calculate the average stress level for each company from the company_employees table
    const [results] = await db.query(`
      SELECT 
        company_id, 
        AVG(stress_level) as average_stress_level
      FROM 
        company_employees
      GROUP BY 
        company_id
    `);

    // Update the company stress level in the companies table
    for (const result of results) {
      await db.query(`UPDATE companies SET stress_level = ? WHERE id = ?`, [
        result.average_stress_level,
        result.company_id,
      ]);
    }
  } catch (error) {
    console.error("Error calculating company stress level:", error.message);
  }
};

// Function to calculate the retention rate
const calculateRetentionRate = async () => {
  try {
    // Query to calculate the retention rate for each company
    const [results] = await db.query(`
      SELECT 
        ce.company_id,
        (COUNT(*) - SUM(CASE WHEN ce.joined_date >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH) THEN 1 ELSE 0 END)) / COUNT(*) * 100 as retention_rate
      FROM 
        company_employees ce
      WHERE 
        ce.joined_date < CURDATE()
      GROUP BY 
        ce.company_id
    `);

    // Update the retention rate in the companies table
    for (const result of results) {
      await db.query(`UPDATE companies SET retention_rate = ? WHERE id = ?`, [
        result.retention_rate,
        result.company_id,
      ]);
    }
  } catch (error) {
    console.error("Error calculating retention rate:", error.message);
  }
};

const calculatePSI = async () => {
  try {
    // Query to calculate the average PSI for each company
    const [results] = await db.query(`
      SELECT 
        ce.company_id,
        AVG(ce.psi) as average_psi
      FROM 
        company_employees ce
      WHERE
        ce.psi IS NOT NULL
      GROUP BY 
        ce.company_id
    `);

    // Update the PSI in the companies table
    for (const result of results) {
      await db.query(
        `UPDATE companies SET psychological_safety_index = ? WHERE id = ?`,
        [result.average_psi, result.company_id]
      );
    }
  } catch (error) {
    console.error(
      "Error calculating Psychological Safety Index (PSI):",
      error.message
    );
  }
};

const calculateEngagementScore = async () => {
  try {
    // First, get total workshops scheduled for each company (excluding canceled ones)
    const [companyWorkshops] = await db.query(`
      SELECT 
        company_id,
        COUNT(DISTINCT workshop_id) as total_workshops
      FROM 
        workshop_schedules
      WHERE 
        status != 'canceled'
      GROUP BY 
        company_id
    `);

    // Create a map for quick lookup of total workshops per company
    const companyWorkshopsMap = companyWorkshops.reduce((acc, curr) => {
      acc[curr.company_id] = curr.total_workshops;
      return acc;
    }, {});

    // Query to calculate the engagement score for each employee
    const [employeeResults] = await db.query(`
      SELECT 
        ce.company_id,
        ce.user_id,
        ce.workshop_attendance_count,
        ce.content_engagement_percentage,
        ce.stress_bar_updated,
        ce.assessment_completion
      FROM 
        company_employees ce
    `);

    // Update the engagement score for each employee
    for (const employee of employeeResults) {
      const totalWorkshops = companyWorkshopsMap[employee.company_id] || 0;
      
      // Calculate workshop attendance percentage (only for engagement score calculation)
      const workshopAttendancePercentage = totalWorkshops > 0
        ? Math.min((employee.workshop_attendance_count / totalWorkshops) * 100, 100) // Cap at 100%
        : 0;

      const engagementScore =
        (workshopAttendancePercentage +
          employee.content_engagement_percentage +
          (employee.stress_bar_updated ? 100 : 0) +
          (employee.assessment_completion ? 100 : 0)) /
        4;

      await db.query(
        `UPDATE company_employees SET 
          engagement_score = ? 
        WHERE company_id = ? AND user_id = ?`,
        [
          engagementScore,
          employee.company_id,
          employee.user_id
        ]
      );
    }

    // Query to calculate the average engagement score for each company
    const [companyResults] = await db.query(`
      SELECT 
        company_id,
        AVG(engagement_score) as average_engagement_score
      FROM 
        company_employees
      GROUP BY 
        company_id
    `);

    // Update the average engagement score in the companies table
    for (const company of companyResults) {
      await db.query(
        `UPDATE companies SET engagement_score = ? WHERE id = ?`,
        [company.average_engagement_score, company.company_id]
      );
    }

    console.log(`[${new Date().toISOString()}] Engagement scores updated successfully`);
  } catch (error) {
    console.error("Error calculating engagement score:", error.message);
    throw error;
  }
};

const recordEmployeeDailyHistory = async () => {
  try {
    // Fetch the current stress level, engagement score, and active state for all employees
    const [employees] = await db.query(`
      SELECT 
        ce.user_id,
        ce.company_id,
        ce.stress_level,
        ce.engagement_score,
        ce.is_active
      FROM company_employees ce
    `);

    // Prepare the data for insertion
    const today = new Date().toISOString().split("T")[0]; 
    const historyData = employees.map(employee => [
      employee.user_id,
      employee.company_id,
      employee.stress_level,
      employee.engagement_score,
      employee.is_active,
      today
    ]);

    // Insert the data into the employee_daily_history table
    await db.query(
      `
      INSERT INTO employee_daily_history (
        user_id, 
        company_id, 
        stress_level, 
        engagement_score, 
        is_active, 
        recorded_date
      ) VALUES ?
      `,
      [historyData]
    );

    console.log("Employee daily history recorded successfully.");
  } catch (error) {
    console.error("Error recording employee daily history:", error.message);
  }
};

// Schedule the cron job to run every start of the day seconds for debugging
cron.schedule("30 0 * * *", () => {
  calculateCompanyStressLevel();
}, {
  scheduled: true,
  timezone: "Asia/Kolkata"
});

// Monthly retention rate - 1st day at 00:45 AM
cron.schedule("45 0 1 * *", async () => {
  try {
    const result = await calculateMonthlyRetention();
    console.log(`[${new Date().toISOString()}] Retention rate calculation completed:`, result);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error in retention calculation:`, error);
  }
}, {
  scheduled: true,
  timezone: "Asia/Kolkata"
});

// PSI calculation - 1st day at 01:15 AM
cron.schedule("15 1 1 * *", () => {
  calculatePSI();
}, {
  scheduled: true,
  timezone: "Asia/Kolkata"
});

// Engagement score - 1st day at 01:45 AM
cron.schedule("45 1 1 * *", () => {
  calculateEngagementScore();
}, {
  scheduled: true,
  timezone: "Asia/Kolkata"
});

// Employee daily history - daily at 02:00 AM
cron.schedule("0 2 * * *", recordEmployeeDailyHistory, {
  scheduled: true,
  timezone: "Asia/Kolkata"
});

module.exports = {
  calculateCompanyStressLevel,
  calculateRetentionRate,
  calculatePSI,
  calculateEngagementScore,
  recordEmployeeDailyHistory
};
