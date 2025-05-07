const cron = require('node-cron');
const db = require('../config/db');

const checkAssessmentCompletion = async () => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Get all active assessments count
    const [totalAssessments] = await connection.query(`
      SELECT COUNT(*) as total
      FROM assessments
      WHERE is_active = 1
    `);

    // console.log(`Total active assessments: ${totalAssessments[0].total}`);

    if (totalAssessments[0].total === 0) {
      console.log('No active assessments found');
      await connection.commit();
      return {
        status: true,
        message: "No active assessments to check"
      };
    }

    // Update assessment_completion for all employees
    const updateQuery = `
      UPDATE company_employees ce
      SET 
        assessment_completion = CASE 
          WHEN (
            SELECT COUNT(DISTINCT ua.assessment_id)
            FROM user_assessments ua
            WHERE 
              ua.user_id = ce.user_id 
              AND ua.completed_at <= LAST_DAY(CURRENT_DATE)
          ) = ? THEN 1
          ELSE 0
        END,
        last_activity_date = NOW(),
        last_activity_type = 'assessment_completion_check'
      WHERE ce.is_active = 1
    `;

    const [updateResult] = await connection.query(updateQuery, [totalAssessments[0].total]);

    // Get summary statistics
    const [stats] = await connection.query(`
      SELECT 
        COUNT(*) as total_employees,
        SUM(assessment_completion) as completed_all_assessments,
        (SUM(assessment_completion) / COUNT(*)) * 100 as completion_percentage
      FROM company_employees
      WHERE is_active = 1
    `);

    await connection.commit();

    // console.log(`[${new Date().toISOString()}] Assessment completion check stats:`, stats[0]);

    return {
      status: true,
      message: "Assessment completion check successful",
      rowsAffected: updateResult.affectedRows,
      stats: stats[0]
    };

  } catch (error) {
    await connection.rollback();
    console.error(`[${new Date().toISOString()}] Error checking assessment completion:`, error);
    return {
      status: false,
      error: error.message
    };
  } finally {
    connection.release();
  }
};

// Assessment completion check - 11:00 PM on last day of month
cron.schedule('0 23 * * *', async () => {
  // Check if today is the last day of the month
  const now = new Date();
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  
  if (now.getDate() !== lastDayOfMonth) {
    console.log(`[${new Date().toISOString()}] Not the last day of the month, skipping assessment completion check`);
    return;
  }
  
  console.log(`[${new Date().toISOString()}] Starting assessment completion check...`);
  try {
    const result = await checkAssessmentCompletion();
    console.log(`[${new Date().toISOString()}] Assessment completion check completed:`, result);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error in assessment completion cron job:`, error);
  }
}, {
  scheduled: true,
  timezone: "Asia/Kolkata"
});

module.exports = {
  checkAssessmentCompletion
};
