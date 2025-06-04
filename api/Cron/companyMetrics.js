const cron = require("node-cron");
const db = require("../config/db");
const { calculateMonthlyRetention } = require('../server/utils/retentionCalculator');

// Function to calculate the company stress level and record daily history
const calculateCompanyStressLevel = async () => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    
    // Today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    
    // Query to calculate the average stress level for each company from the company_employees table
    // Only include active employees
    const [results] = await connection.query(`
      SELECT 
        company_id, 
        AVG(stress_level) as average_stress_level
      FROM 
        company_employees
      WHERE
        is_active = 1
      GROUP BY 
        company_id
    `);

    // Prepare data for history table
    const historyRecords = [];
    
    // Update the company stress level in the companies table
    for (const result of results) {
      await connection.query(`
        UPDATE companies 
        SET 
          stress_level = ?,
          updated_at = NOW()
        WHERE id = ?
      `, [
        result.average_stress_level,
        result.company_id,
      ]);
      
      // Add to history records
      historyRecords.push([
        result.company_id,
        result.average_stress_level,
        today
      ]);
    }
    
    // Insert records into history table using ON DUPLICATE KEY UPDATE
    if (historyRecords.length > 0) {
      await connection.query(
        `INSERT INTO company_daily_stress_history 
          (company_id, stress_level, recorded_date) 
        VALUES ? 
        ON DUPLICATE KEY UPDATE 
          stress_level = VALUES(stress_level),
          created_at = NOW()`,
        [historyRecords]
      );
      
      console.log(`[${new Date().toISOString()}] Calculated and recorded daily stress levels for ${historyRecords.length} companies`);
    }
    
    await connection.commit();
    
    return {
      status: true,
      updated_companies: results.length
    };
  } catch (error) {
    await connection.rollback();
    console.error("Error calculating and recording company stress level:", error.message);
    return {
      status: false,
      error: error.message
    };
  } finally {
    connection.release();
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
    // Get first and last day of previous month
    const today = new Date();
    const firstDayPrevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastDayPrevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    
    // Format dates for SQL
    const prevMonthStart = firstDayPrevMonth.toISOString().split('T')[0];
    const prevMonthEnd = lastDayPrevMonth.toISOString().split('T')[0];
    
    // First, get workshop schedules for each company from previous month only
    const [companyWorkshops] = await db.query(`
      SELECT 
        company_id,
        COUNT(DISTINCT id) as total_workshop_schedules
      FROM 
        workshop_schedules
      WHERE 
        status NOT IN ('cancelled', 'canceled')
        AND DATE(start_time) BETWEEN ? AND ?
      GROUP BY 
        company_id
    `, [prevMonthStart, prevMonthEnd]);

    // Create a map for quick lookup of total workshop schedules per company
    const companyWorkshopsMap = companyWorkshops.reduce((acc, curr) => {
      acc[curr.company_id] = curr.total_workshop_schedules;
      return acc;
    }, {});

    // For each company, get the workshop attendance for each employee (previous month only)
    const [employeeAttendance] = await db.query(`
      SELECT 
        ce.company_id,
        ce.user_id,
        COUNT(DISTINCT wt.schedule_id) as workshops_attended
      FROM 
        company_employees ce
      LEFT JOIN workshop_tickets wt ON ce.user_id = wt.user_id 
        AND ce.company_id = wt.company_id 
        AND wt.is_attended = 1
      LEFT JOIN workshop_schedules ws ON wt.schedule_id = ws.id
        AND DATE(ws.start_time) BETWEEN ? AND ?
      GROUP BY 
        ce.company_id, ce.user_id
    `, [prevMonthStart, prevMonthEnd]);

    // Create a map for quick lookup of workshops attended per employee
    const employeeAttendanceMap = employeeAttendance.reduce((acc, curr) => {
      const key = `${curr.company_id}_${curr.user_id}`;
      acc[key] = curr.workshops_attended;
      return acc;
    }, {});

    // Query to calculate the engagement score for each employee
    const [employeeResults] = await db.query(`
      SELECT 
        ce.company_id,
        ce.user_id,
        ce.content_engagement_percentage,
        ce.stress_bar_updated,
        ce.assessment_completion
      FROM 
        company_employees ce
    `);

    // Update the engagement score for each employee
    for (const employee of employeeResults) {
      const totalWorkshops = companyWorkshopsMap[employee.company_id] || 0;
      const workshopsAttended = employeeAttendanceMap[`${employee.company_id}_${employee.user_id}`] || 0;
      
      // Calculate workshop attendance percentage (only for engagement score calculation)
      const workshopAttendancePercentage = totalWorkshops > 0
        ? Math.min((workshopsAttended / totalWorkshops) * 100, 100) // Cap at 100%
        : 0;

      const engagementScore =
        (workshopAttendancePercentage +
          employee.content_engagement_percentage +
          (employee.stress_bar_updated ? 100 : 0) +
          (employee.assessment_completion ? 100 : 0)) /
        4;

      await db.query(
        `UPDATE company_employees SET 
          engagement_score = ?,
          workshop_attendance_percentage = ?
        WHERE company_id = ? AND user_id = ?`,
        [
          engagementScore,
          workshopAttendancePercentage,
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

// Function to calculate the company wellbeing score
const calculateWellbeingScore = async () => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    
    // Get all active companies with their metrics
    const [companies] = await connection.query(`
      SELECT 
        id,
        stress_level,
        psychological_safety_index,
        engagement_score
      FROM 
        companies
      WHERE
        active = 1
    `);
    
    console.log(`[${new Date().toISOString()}] Calculating wellbeing scores for ${companies.length} companies`);
    
    // Update the wellbeing score for each company
    for (const company of companies) {
      // Calculate inverse stress score (100 - stress_level)
      const inverseStressScore = company.stress_level !== null ? 
        Math.max(0, Math.min(100, 100 - company.stress_level)) : 0;
      
      // Get PSI and engagement scores, defaulting to 0 if null
      const psiScore = company.psychological_safety_index || 0;
      const engagementScore = company.engagement_score || 0;
      
      // Calculate wellbeing score as average of the three components
      // Only include components that are not null/zero in the average
      let divisor = 0;
      let sum = 0;
      
      if (inverseStressScore > 0) {
        sum += inverseStressScore;
        divisor++;
      }
      
      if (psiScore > 0) {
        sum += psiScore;
        divisor++;
      }
      
      if (engagementScore > 0) {
        sum += engagementScore;
        divisor++;
      }
      
      // Calculate the average, default to 0 if no valid components
      const wellbeingScore = divisor > 0 ? sum / divisor : 0;
      
      // Update the company's wellbeing score
      await connection.query(`
        UPDATE companies 
        SET 
          wellbeing_score = ?,
          updated_at = NOW()
        WHERE id = ?
      `, [
        wellbeingScore,
        company.id
      ]);
      
      console.log(`Company ${company.id} wellbeing score updated to: ${wellbeingScore}`);
    }
    
    await connection.commit();
    
    return {
      status: true,
      updated_companies: companies.length
    };
  } catch (error) {
    await connection.rollback();
    console.error("Error calculating wellbeing scores:", error.message);
    return {
      status: false,
      error: error.message
    };
  } finally {
    connection.release();
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
// cron.schedule("0 2 * * *", recordEmployeeDailyHistory, {
//   scheduled: true,
//   timezone: "Asia/Kolkata"
// });

// Schedule the wellbeing score calculation to run daily at 01:00 AM
// This runs after stress level, PSI, and engagement score calculations
cron.schedule("0 1 * * *", () => {
  calculateWellbeingScore();
}, {
  scheduled: true,
  timezone: "Asia/Kolkata"
});

module.exports = function initCompanyMetrics() {
  console.log('Company metrics cron jobs initialized');
  // The cron jobs are already scheduled when this file is imported
  return {
    calculateCompanyStressLevel,
    calculateRetentionRate,
    calculatePSI,
    calculateEngagementScore,
    // recordEmployeeDailyHistory,
    calculateWellbeingScore
  };
};
