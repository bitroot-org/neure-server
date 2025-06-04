const db = require("../../config/db");

const updateCompanyPSI = async (company_id) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Calculate average PSI for the company directly in the query
    const [results] = await connection.query(
      `SELECT 
        AVG(ce.psi) as average_psi,
        COUNT(*) as total_employees
      FROM company_employees ce
      WHERE ce.company_id = ? 
        AND ce.is_active = 1 
        AND ce.psi IS NOT NULL`,
      [company_id]
    );

    if (results && results[0] && results[0].average_psi !== null) {
      const averagePsi = results[0].average_psi;
      const totalEmployees = results[0].total_employees;

      // Update the company's PSI
      await connection.query(
        `UPDATE companies 
        SET 
          psychological_safety_index = ?,
          updated_at = NOW()
        WHERE id = ?`,
        [averagePsi, company_id]
      );

      await connection.commit();

      console.log(`Company ${company_id} PSI updated to: ${averagePsi} (based on ${totalEmployees} employees)`);

      return {
        status: true,
        company_id,
        psi: averagePsi,
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
