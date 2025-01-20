const db = require("../../../config/db");

class CompanyService {
  // Register a new company
  static async registerCompany(companyName, emailDomain) {
    try {
      const [result] = await db.query(
        `INSERT INTO companies (company_name, email_domain) VALUES (?, ?)`,
        [companyName, emailDomain]
      );
      return {
        status: true,
        code: 201,
        message: "Company registered successfully",
        data: {
          id: result.insertId,
          company_name: companyName,
          email_domain: emailDomain,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  // Get company details by ID
  static async getCompanyById(id) {
    try {
      const [rows] = await db.query(
        `SELECT 
          c.*,
          u.*
        FROM companies c
        LEFT JOIN users u ON c.contact_person_id = u.id
        WHERE c.id = ?`,
        [id]
      );

      if (!rows[0]) return null;

      const companyData = {
        company: {
          id: rows[0].id,
          company_name: rows[0].company_name,
          email_domain: rows[0].email_domain,
          company_size: rows[0].company_size,
          industry: rows[0].industry,
          onboarding_date: rows[0].onboarding_date,
          status: rows[0].status,
          contact_person_id: rows[0].contact_person_id,
        },
        contact_person: rows[0].id
          ? {
              id: rows[0].id,
              email: rows[0].email,
              username: rows[0].username,
              first_name: rows[0].first_name,
              last_name: rows[0].last_name,
              gender: rows[0].gender,
              date_of_birth: rows[0].date_of_birth,
              age: rows[0].age,
              job_title: rows[0].job_title,
              phone: rows[0].phone,
              created_at: rows[0].created_at,
              updated_at: rows[0].updated_at,
              last_login: rows[0].last_login,
              is_active: rows[0].is_active,
              user_type: rows[0].user_type,
              role_id: rows[0].role_id,
            }
          : null,
      };

      return {
        status: true,
        code: 200,
        message: "Company details retrieved successfully",
        data: companyData,
      };
    } catch (error) {
      throw error;
    }
  }

  // Update company details
  static async updateCompany(companyData, contactPersonData) {
    try {
      // Update company information
      await db.query(
        `UPDATE companies 
         SET company_name = ?, 
             email_domain = ?,
             company_size = ?,
             industry = ?,
             status = ?,
             contact_person_id = ?
         WHERE id = ?`,
        [
          companyData.company_name,
          companyData.email_domain,
          companyData.company_size,
          companyData.industry,
          companyData.status,
          companyData.contact_person_id,
          companyData.id,
        ]
      );

      // Update contact person information
      if (contactPersonData) {
        await db.query(
          `UPDATE users 
           SET email = ?,
               username = ?,
               first_name = ?,
               last_name = ?,
               gender = ?,
               date_of_birth = ?,
               age = ?,
               job_title = ?,
               phone = ?,
               user_type = ?,
               role_id = ?
           WHERE id = ?`,
          [
            contactPersonData.email,
            contactPersonData.username,
            contactPersonData.first_name,
            contactPersonData.last_name,
            contactPersonData.gender,
            contactPersonData.date_of_birth,
            contactPersonData.age,
            contactPersonData.job_title,
            contactPersonData.phone,
            contactPersonData.user_type,
            contactPersonData.role_id,
            contactPersonData.id,
          ]
        );
      }

      return {
        status: true,
        code: 200,
        message: "Company information updated successfully",
        data: { company: companyData, contact_person: contactPersonData },
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = CompanyService;
