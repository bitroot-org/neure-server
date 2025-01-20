const db = require("../../../config/db");

class CompanyService {
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

  static async getTopPerformingEmployee(company_id, page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit;

      const [totalRows] = await db.query(
        `SELECT COUNT(*) as count 
         FROM company_employees ce 
         WHERE ce.company_id = ? AND ce.is_active = 1`,
        [company_id]
      );

      const [rows] = await db.query(
        `SELECT 
          u.user_id,
          u.email,
          u.phone,
          u.username,
          u.first_name,
          u.last_name,
          u.gender,
          u.date_of_birth,
          u.age,
          u.Workshop_attended,
          u.Task_completed,
          u.EngagementScore,
          u.job_title,
          u.user_type,
          ce.employee_code,
          ce.joined_date,
          d.id as department_id,
          d.department_name,
          ud.assigned_date as department_assigned_date
         FROM company_employees ce
         JOIN users u ON ce.user_id = u.user_id
         LEFT JOIN user_departments ud ON u.user_id = ud.user_id
         LEFT JOIN departments d ON ud.department_id = d.id
         WHERE ce.company_id = ? AND ce.is_active = 1
         ORDER BY u.EngagementScore DESC
         LIMIT ? OFFSET ?`,
        [company_id, limit, offset]
      );

      const totalPages = Math.ceil(totalRows[0].count / limit);

      return {
        status: true,
        code: 200,
        message: "Company employees retrieved successfully",
        data: {
          employees: rows.map(row => ({
            user_id: row.user_id,
            email: row.email,
            phone: row.phone,
            username: row.username,
            first_name: row.first_name,
            last_name: row.last_name,
            gender: row.gender,
            date_of_birth: row.date_of_birth,
            age: row.age,
            Workshop_attended: row.Workshop_attended,
            Task_completed: row.Task_completed,
            EngagementScore: row.EngagementScore,
            job_title: row.job_title,
            user_type: row.user_type,
            employee_code: row.employee_code,
            joined_date: row.joined_date,
            department: row.department_id ? row.department_name : null
          })),
          pagination: {
            total: totalRows[0].count,
            current_page: page,
            total_pages: totalPages,
            per_page: limit
          }
        }
      };
    } catch (error) {
      throw error;
    }
  }

  static async getCompanyEmployees(company_id, page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit;

      const [totalRows] = await db.query(
        `SELECT COUNT(*) as count 
         FROM company_employees ce 
         WHERE ce.company_id = ? AND ce.is_active = 1`,
        [company_id]
      );

      const [rows] = await db.query(
        `SELECT 
          u.user_id,
          u.email,
          u.phone,
          u.username,
          u.first_name,
          u.last_name,
          u.gender,
          u.date_of_birth,
          u.age,
          u.Workshop_attended,
          u.Task_completed,
          u.EngagementScore,
          u.job_title,
          u.user_type,
          ce.employee_code,
          ce.joined_date,
          ce.is_active,
          d.id as department_id,
          d.department_name,
          ud.assigned_date as department_assigned_date
         FROM company_employees ce
         JOIN users u ON ce.user_id = u.user_id
         LEFT JOIN user_departments ud ON u.user_id = ud.user_id
         LEFT JOIN departments d ON ud.department_id = d.id
         WHERE ce.company_id = ? AND ce.is_active = 1
         ORDER BY ce.joined_date DESC
         LIMIT ? OFFSET ?`,
        [company_id, limit, offset]
      );

      const totalPages = Math.ceil(totalRows[0].count / limit);

      return {
        status: true,
        code: 200,
        message: "Company employees retrieved successfully",
        data: {
          employees: rows.map(row => ({
            user_id: row.user_id,
            email: row.email,
            phone: row.phone,
            username: row.username,
            first_name: row.first_name,
            last_name: row.last_name,
            gender: row.gender,
            date_of_birth: row.date_of_birth,
            age: row.age,
            Workshop_attended: row.Workshop_attended,
            Task_completed: row.Task_completed,
            EngagementScore: row.EngagementScore,
            job_title: row.job_title,
            user_type: row.user_type,
            employee_code: row.employee_code,
            joined_date: row.joined_date,
            is_active: row.is_active,
            department: row.department_id ? row.department_name : null
          })),
          pagination: {
            total: totalRows[0].count,
            current_page: page,
            total_pages: totalPages,
            per_page: limit
          }
        }
      };
    } catch (error) {
      throw error;
    }
  }

  static async getQna() {
    try {
      const result = await db.query('SELECT question, answer, created_at, updated_at FROM qna WHERE is_active = 1');
      return result;
    } catch (error) {
      throw new Error('Error fetching Q&A: ' + error.message);
    }
  }

}

module.exports = CompanyService;
