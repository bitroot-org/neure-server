const cron = require('node-cron');
const db = require('../config/db');

const recordCompanyMetricsHistory = async (connection) => {
  try {
    // Get the first day of current month
    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    firstDayOfMonth.setHours(0, 0, 0, 0);

    // Get all active companies and their current metrics
    const [companies] = await connection.query(`
      SELECT 
        id,
        stress_level,
        retention_rate,
        engagement_score,
        psychological_safety_index
      FROM companies 
      WHERE active = 1
    `);

    // Insert metrics history for each company
    for (const company of companies) {
      await connection.query(`
        INSERT INTO company_metrics_history (
          company_id,
          month_year,
          stress_level,
          retention_rate,
          engagement_score,
          psychological_safety_index
        ) VALUES (?, ?, ?, ?, ?, ?)
      `, [
        company.id,
        firstDayOfMonth,
        company.stress_level,
        company.retention_rate,
        company.engagement_score,
        company.psychological_safety_index
      ]);
    }

    return companies.length;
  } catch (error) {
    console.error('Error recording company metrics history:', error);
    throw error;
  }
};

const resetStressModalTimes = async (connection) => {
  try {
    const [result] = await connection.query(`
      UPDATE users 
      SET last_stress_modal_seen_at = NULL 
      WHERE user_id IN (
        SELECT DISTINCT user_id 
        FROM company_employees 
        WHERE is_active = 1
      )
    `);
    return result.affectedRows;
  } catch (error) {
    console.error('Error resetting stress modal times:', error);
    throw error;
  }
};

const monthlyMetricsReset = async () => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // First record the current metrics
    const companiesUpdated = await recordCompanyMetricsHistory(connection);
    
    // Then reset stress modal times
    const usersReset = await resetStressModalTimes(connection);

    await connection.commit();

    console.log(`Monthly metrics reset completed successfully at ${new Date().toISOString()}`);
    console.log(`- Recorded metrics for ${companiesUpdated} companies`);
    console.log(`- Reset stress modal times for ${usersReset} users`);

    return {
      status: true,
      companiesUpdated,
      usersReset
    };
  } catch (error) {
    await connection.rollback();
    console.error('Error in monthly metrics reset:', error);
    return {
      status: false,
      error: error.message
    };
  } finally {
    connection.release();
  }
};

// Monthly metrics reset - 1st day at 00:15 AM
cron.schedule('15 0 1 * *', monthlyMetricsReset, {
  scheduled: true,
  timezone: "Asia/Kolkata"
});

module.exports = monthlyMetricsReset;
