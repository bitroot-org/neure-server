const cron = require("node-cron");
const db = require("../config/db");
const { updateCompanyStressLevel } = require("../server/utils/stressLevelCalculator");
const { updateCompanyPSI } = require("../server/utils/psiCalculator");
const moment = require('moment-timezone');

const calculateNewCompanyMetrics = async () => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    
    // Get today's date range in IST, then convert to UTC for database query
    const istTimeZone = 'Asia/Kolkata';
    
    // Start of today in IST
    const startOfDayIST = moment().tz(istTimeZone).startOf('day');
    // End of today in IST
    const endOfDayIST = moment().tz(istTimeZone).endOf('day');
    
    // Convert to UTC for database comparison
    const startOfDayUTC = startOfDayIST.clone().utc().format('YYYY-MM-DD HH:mm:ss');
    const endOfDayUTC = endOfDayIST.clone().utc().format('YYYY-MM-DD HH:mm:ss');
    
    console.log(`[${new Date().toISOString()}] Calculating metrics for companies created between UTC ${startOfDayUTC} and ${endOfDayUTC}`);
    console.log(`This corresponds to IST: ${startOfDayIST.format('YYYY-MM-DD HH:mm:ss')} to ${endOfDayIST.format('YYYY-MM-DD HH:mm:ss')}`);
    
    // Get companies created in the exact UTC time range that corresponds to today in IST
    const [newCompanies] = await connection.query(`
      SELECT 
        id as company_id,
        company_name
      FROM 
        companies
      WHERE 
        created_at >= ?
        AND created_at < ?
        AND active = 1
        AND (stress_level IS NULL OR psychological_safety_index IS NULL)
    `, [startOfDayUTC, endOfDayUTC]);
    
    if (newCompanies.length === 0) {
      console.log(`[${new Date().toISOString()}] No new companies found that need metrics calculation`);
      await connection.commit();
      return {
        status: true,
        message: "No new companies to process",
        processed: 0
      };
    }
    
    console.log(`[${new Date().toISOString()}] Found ${newCompanies.length} new companies that need metrics calculation`);
    
    // Process each new company
    for (const company of newCompanies) {
      console.log(`Processing metrics for new company: ${company.company_name} (ID: ${company.company_id})`);
      
      // Calculate stress level
      let stressLevel = null;
      try {
        const stressResult = await updateCompanyStressLevel(company.company_id);
        console.log(`Stress level calculation for company ${company.company_id}: ${JSON.stringify(stressResult)}`);
        if (stressResult && stressResult.status) {
          stressLevel = stressResult.average_stress_level;
        }
      } catch (stressError) {
        console.error(`Error calculating stress level for company ${company.company_id}:`, stressError);
      }
      
      // Calculate PSI
      let psiValue = null;
      try {
        const psiResult = await updateCompanyPSI(company.company_id);
        console.log(`PSI calculation for company ${company.company_id}: ${JSON.stringify(psiResult)}`);
        if (psiResult && psiResult.status) {
          psiValue = psiResult.psi_value;
        }
      } catch (psiError) {
        console.error(`Error calculating PSI for company ${company.company_id}:`, psiError);
      }
      
      // Calculate wellbeing score (simple average of 100-stress and PSI)
      let wellbeingScore = 0;
      if (stressLevel !== null) {
        const inverseStress = 100 - stressLevel;
        if (psiValue !== null) {
          wellbeingScore = (inverseStress + psiValue) / 2;
        } else {
          wellbeingScore = inverseStress;
        }
      } else if (psiValue !== null) {
        wellbeingScore = psiValue;
      }
      
      // Update company record with calculated metrics
      if (stressLevel !== null || psiValue !== null) {
        try {
          await connection.query(`
            UPDATE companies 
            SET 
              stress_level = ?,
              psychological_safety_index = ?,
              wellbeing_score = ?
            WHERE id = ?
          `, [
            stressLevel || 0,
            psiValue || 0,
            wellbeingScore,
            company.company_id
          ]);
          
          console.log(`Updated metrics for company ${company.company_id}: stress level=${stressLevel || 0}, PSI=${psiValue || 0}, wellbeing=${wellbeingScore}`);
        } catch (updateError) {
          console.error(`Error updating metrics for company ${company.company_id}:`, updateError);
        }
      }
      
      // Add to company_metrics_history if we have calculated any metrics
      if (stressLevel !== null || psiValue !== null) {
        try {
          // Use current date for the history record
          const currentDate = moment().format('YYYY-MM-DD HH:mm:ss');
          
          // Use REPLACE INTO to avoid duplicates (it will delete and re-insert if a record exists)
          await connection.query(`
            REPLACE INTO company_metrics_history (
              company_id,
              month_year,
              stress_level,
              psychological_safety_index,
              wellbeing_score
            ) VALUES (?, ?, ?, ?, ?)
          `, [
            company.company_id,
            currentDate,
            stressLevel || 0,
            psiValue || 0,
            wellbeingScore
          ]);
          
          console.log(`Recorded metrics in history for company ${company.company_id} on ${currentDate}: stress level=${stressLevel || 0}, PSI=${psiValue || 0}, wellbeing=${wellbeingScore}`);
        } catch (historyError) {
          console.error(`Error recording metrics history for company ${company.company_id}:`, historyError);
        }
      }
    }
    
    await connection.commit();
    
    return {
      status: true,
      message: `Processed metrics for ${newCompanies.length} new companies`,
      processed: newCompanies.length
    };
    
  } catch (error) {
    await connection.rollback();
    console.error("Error in calculateNewCompanyMetrics:", error);
    throw new Error(`Error calculating new company metrics: ${error.message}`);
  } finally {
    connection.release();
  }
};

// Schedule to run daily at 1:00 AM IST
const initNewCompanyMetrics = () => {
  cron.schedule("0 1 * * *", async () => {
    console.log(`[${new Date().toISOString()}] Running new company metrics calculation...`);
    try {
      const result = await calculateNewCompanyMetrics();
      console.log(`[${new Date().toISOString()}] New company metrics calculation completed:`, result);
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Error in new company metrics cron job:`, error);
    }
  });
  
  console.log("New company metrics calculation scheduled to run daily at 1:00 AM IST");
};

module.exports = initNewCompanyMetrics;
