const cron = require("node-cron");
const db = require("../config/db");

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
    // Query to calculate the total score and maximum possible score for each company
    const [results] = await db.query(`
      SELECT 
        ce.company_id,
        SUM(ce.psi) as total_score,
        COUNT(ce.psi) * 5 as max_possible_score
      FROM 
        company_employees ce
      GROUP BY 
        ce.company_id
    `);

    // Update the PSI in the companies table
    for (const result of results) {
      const psi = (result.total_score / result.max_possible_score) * 100;
      await db.query(
        `UPDATE companies SET psychological_safety_index = ? WHERE id = ?`,
        [psi, result.company_id]
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
    // Query to calculate the engagement score for each employee
    const [employeeResults] = await db.query(`
      SELECT 
        company_id,
        user_id,
        workshop_attendance_percentage,
        content_engagement_percentage,
        stress_bar_updated,
        assessment_completion
      FROM 
        company_employees
    `);

    // Update the engagement score for each employee
    for (const employee of employeeResults) {
      const engagementScore =
        (employee.workshop_attendance_percentage +
          employee.content_engagement_percentage +
          (employee.stress_bar_updated ? 100 : 0) +
          (employee.assessment_completion ? 100 : 0)) /
        4;

      await db.query(
        `UPDATE company_employees SET engagement_score = ? WHERE company_id = ? AND user_id = ?`,
        [engagementScore, employee.company_id, employee.user_id]
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
      await db.query(`UPDATE companies SET engagement_score = ? WHERE id = ?`, [
        company.average_engagement_score,
        company.company_id,
      ]);
    }
  } catch (error) {
    console.error("Error calculating engagement score:", error.message);
  }
};

// Schedule the cron job to run every start of the day seconds for debugging
cron.schedule(
  "1 0 * * *",
  () => {
    calculateCompanyStressLevel();
  },
  {
    scheduled: true,
    timezone: "Asia/Kolkata",
  }
);

// Schedule the cron job to run every day at 00:01 IST for retention rate calculation
cron.schedule(
  "0 0 1 * *",
  () => {
    calculateRetentionRate();
  },
  {
    scheduled: true,
    timezone: "Asia/Kolkata",
  }
);

cron.schedule(
  "0 0 1 * *",
  () => {
    calculatePSI();
  },
  {
    scheduled: true,
    timezone: "Asia/Kolkata",
  }
);

cron.schedule(
  "0 0 * * *",
  () => {
    calculateEngagementScore();
  },
  {
    scheduled: true,
    timezone: "Asia/Kolkata",
  }
);

module.exports = {
  calculateCompanyStressLevel,
  calculateRetentionRate,
  calculatePSI,
  calculateEngagementScore,
};
