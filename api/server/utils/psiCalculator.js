const db = require("../../config/db");

const updateCompanyPSI = async (company_id) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Get all active employees' PSI scores for the company
    const [results] = await connection.query(
      `SELECT 
        ce.psi,
        COUNT(*) as employee_count
      FROM company_employees ce
      WHERE ce.company_id = ? 
        AND ce.is_active = 1 
        AND ce.psi IS NOT NULL
      GROUP BY ce.psi`,
      [company_id]
    );

    if (results && results.length > 0) {
      // Calculate total score and maximum possible score
      let totalScore = 0;
      let totalEmployees = 0;

      results.forEach(result => {
        totalScore += (result.psi * result.employee_count);
        totalEmployees += result.employee_count;
      });

      const maxPossibleScore = totalEmployees * 5; // 5 is the maximum score possible
      const psiPercentage = (totalScore / maxPossibleScore) * 100;

      // Update the company's PSI
      await connection.query(
        `UPDATE companies 
        SET 
          psychological_safety_index = ?,
          updated_at = NOW()
        WHERE id = ?`,
        [psiPercentage, company_id]
      );

      await connection.commit();

      console.log(`Company ${company_id} PSI updated to: ${psiPercentage}%`);

      return {
        status: true,
        company_id,
        psi: psiPercentage,
        total_employees: totalEmployees
      };
    }

    return {
      status: false,
      message: "No PSI data available for calculation"
    };

  } catch (error) {
    await connection.rollback();
    console.error("Error updating company PSI:", error);
    return {
      status: false,
      error: error.message
    };
  } finally {
    connection.release();
  }
};

module.exports = {
  updateCompanyPSI
};