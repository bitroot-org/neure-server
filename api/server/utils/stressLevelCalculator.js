const db = require("../../config/db");

const updateCompanyStressLevel = async (company_id) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Calculate average stress level for the specific company
    const [results] = await connection.query(
      `SELECT 
        AVG(stress_level) as average_stress_level
      FROM company_employees
      WHERE company_id = ? AND is_active = 1`,
      [company_id]
    );

    if (results && results[0].average_stress_level !== null) {
      // Update the company's stress level
      await connection.query(
        `UPDATE companies 
        SET 
          stress_level = ?,
          updated_at = NOW()
        WHERE id = ?`,
        [results[0].average_stress_level, company_id]
      );
    }

    await connection.commit();
    
    console.log(`Company ${company_id} stress level updated to: ${results[0].average_stress_level}`);
    
    return {
      status: true,
      company_id,
      average_stress_level: results[0].average_stress_level
    };
  } catch (error) {
    await connection.rollback();
    console.error("Error updating company stress level:", error);
    return {
      status: false,
      error: error.message
    };
  } finally {
    connection.release();
  }
};

module.exports = {
  updateCompanyStressLevel
};