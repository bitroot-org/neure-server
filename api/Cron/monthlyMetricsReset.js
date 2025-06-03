const cron = require('node-cron');
const db = require('../config/db');

const recordCompanyMetricsHistory = async (connection) => {
  try {
    // Get the first day of current month
    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    firstDayOfMonth.setHours(0, 0, 0, 0);
    
    // Get the first day of previous month
    const firstDayOfPrevMonth = new Date(firstDayOfMonth);
    firstDayOfPrevMonth.setMonth(firstDayOfPrevMonth.getMonth() - 1);
    
    // Get the last day of previous month
    const lastDayOfPrevMonth = new Date(firstDayOfMonth);
    lastDayOfPrevMonth.setDate(0); // Setting to 0 gets the last day of previous month
    
    // Format dates for SQL
    const prevMonthStart = firstDayOfPrevMonth.toISOString().split('T')[0];
    const prevMonthEnd = lastDayOfPrevMonth.toISOString().split('T')[0];

    // Get all active companies
    const [companies] = await connection.query(`
      SELECT 
        c.id,
        c.retention_rate,
        c.engagement_score,
        c.psychological_safety_index,
        c.wellbeing_score,
        COUNT(CASE WHEN u.role_id NOT IN (1, 2) THEN ce.user_id END) as total_employees,
        SUM(CASE WHEN ce.is_active = 1 AND u.role_id NOT IN (1, 2) THEN 1 ELSE 0 END) as active_employees,
        SUM(CASE WHEN ce.is_active = 0 AND u.role_id NOT IN (1, 2) THEN 1 ELSE 0 END) as inactive_employees,
        (SELECT COUNT(*) FROM company_departments cd WHERE cd.company_id = c.id) as total_departments
      FROM companies c
      LEFT JOIN company_employees ce ON c.id = ce.company_id
      LEFT JOIN users u ON ce.user_id = u.user_id
      WHERE c.active = 1
      GROUP BY c.id
    `);

    // Insert metrics history for each company
    for (const company of companies) {
      // Get average daily stress level for the previous month
      const [stressData] = await connection.query(`
        SELECT AVG(stress_level) as avg_monthly_stress_level
        FROM company_daily_stress_history
        WHERE company_id = ? 
        AND recorded_date BETWEEN ? AND ?
      `, [company.id, prevMonthStart, prevMonthEnd]);
      
      const avgMonthlyStressLevel = stressData[0]?.avg_monthly_stress_level || company.stress_level || 0;
      
      await connection.query(`
        INSERT INTO company_metrics_history (
          company_id,
          month_year,
          stress_level,
          wellbeing_score,
          retention_rate,
          engagement_score,
          psychological_safety_index,
          total_employees,
          active_employees,
          inactive_employees,
          total_departments
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        company.id,
        firstDayOfPrevMonth, // Store for previous month
        avgMonthlyStressLevel,
        company.wellbeing_score || 0,
        company.retention_rate,
        company.engagement_score,
        company.psychological_safety_index,
        company.total_employees || 0,
        company.active_employees || 0,
        company.inactive_employees || 0,
        company.total_departments || 0
      ]);
    }

    return companies.length;
  } catch (error) {
    console.error('Error recording company metrics history:', error);
    throw error;
  }
};

// const resetStressModalTimes = async (connection) => {
//   try {
//     const [result] = await connection.query(`
//       UPDATE users 
//       SET last_stress_modal_seen_at = NULL 
//       WHERE user_id IN (
//         SELECT DISTINCT user_id 
//         FROM company_employees 
//         WHERE is_active = 1
//       )
//     `);
//     return result.affectedRows;
//   } catch (error) {
//     console.error('Error resetting stress modal times:', error);
//     throw error;
//   }
// };

const monthlyMetricsReset = async () => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // First record the current metrics
    const companiesUpdated = await recordCompanyMetricsHistory(connection);
    
    // Then reset stress modal times
    // const usersReset = await resetStressModalTimes(connection);

    await connection.commit();

    console.log(`Monthly metrics reset completed successfully at ${new Date().toISOString()}`);
    console.log(`- Recorded metrics for ${companiesUpdated} companies`);

    return {
      status: true,
      companiesUpdated
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
