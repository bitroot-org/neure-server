const cron = require('node-cron');
const db = require('../config/db');

const checkAssessmentCompletion = async () => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Get all active PSI assessments count
    const [totalPsiAssessments] = await connection.query(`
      SELECT COUNT(*) as total
      FROM assessments
      WHERE is_active = 1 AND is_psi_assessment = 1
    `);

    if (totalPsiAssessments[0].total === 0) {
      console.log('No active PSI assessments found');
      await connection.commit();
      return {
        status: true,
        message: "No active PSI assessments to check"
      };
    }

    // Get current month in IST timezone (YYYY-MM format)
    const istTimeZone = 'Asia/Kolkata';
    const currentDate = new Date().toLocaleString('en-US', { timeZone: istTimeZone });
    const istDate = new Date(currentDate);
    const currentMonth = `${istDate.getFullYear()}-${String(istDate.getMonth() + 1).padStart(2, '0')}`;

    console.log(`[${new Date().toISOString()}] Checking PSI assessments for month: ${currentMonth} (IST)`);

    // Update assessment_completion for all employees based on PSI assessments for current month in IST
    const updateQuery = `
      UPDATE company_employees ce
      SET 
        assessment_completion = CASE 
          WHEN (
            SELECT COUNT(DISTINCT ua.assessment_id)
            FROM user_assessments ua
            JOIN assessments a ON ua.assessment_id = a.id
            WHERE 
              ua.user_id = ce.user_id 
              AND a.is_psi_assessment = 1
              AND DATE_FORMAT(CONVERT_TZ(ua.completed_at, '+00:00', '+05:30'), '%Y-%m') = ?
          ) = ? THEN 1
          ELSE 0
        END,
        last_activity_date = NOW(),
        last_activity_type = 'psi_assessment_completion_check'
      WHERE ce.is_active = 1
    `;

    const [updateResult] = await connection.query(updateQuery, [currentMonth, totalPsiAssessments[0].total]);

    // Get summary statistics
    const [stats] = await connection.query(`
      SELECT 
        COUNT(*) as total_employees,
        SUM(assessment_completion) as completed_psi_assessments,
        (SUM(assessment_completion) / COUNT(*)) * 100 as completion_percentage
      FROM company_employees
      WHERE is_active = 1
    `);

    await connection.commit();

    return {
      status: true,
      message: "PSI assessment completion check successful",
      rowsAffected: updateResult.affectedRows,
      stats: stats[0]
    };
  } catch (error) {
    await connection.rollback();
    console.error(`[${new Date().toISOString()}] Error checking PSI assessment completion:`, error);
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

module.exports = function initAssessmentCompletionCheck() {
  console.log('Assessment completion check cron initialized');
  // The cron job is already scheduled when this file is imported
  return {
    checkAssessmentCompletion
  };
};
