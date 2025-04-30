const db = require("../../../config/db");
const bcrypt = require("bcrypt");
const EmailService = require("../email/emailService");
const {
  getCompanyRetentionHistory,
} = require("../../utils/retentionCalculator");

class CompanyService {
  static async generateUniqueUsername(firstName, lastName) {
    try {
      // Base username from first and last name
      let baseUsername =
        `${firstName.toLowerCase()}${lastName.toLowerCase()}`.replace(
          /\s+/g,
          ""
        );
      let username = baseUsername;
      let counter = 1;

      // Check if the username already exists in the database
      const [existingUser] = await db.query(
        `SELECT COUNT(*) as count FROM users WHERE username = ?`,
        [username]
      );

      // If the username exists, append a number to make it unique
      while (existingUser[0].count > 0) {
        username = `${baseUsername}${counter}`;
        counter++;

        // Check again for the new username
        const [newCheck] = await db.query(
          `SELECT COUNT(*) as count FROM users WHERE username = ?`,
          [username]
        );

        if (newCheck[0].count === 0) {
          break;
        }
      }

      return username;
    } catch (error) {
      throw new Error("Error generating unique username: " + error.message);
    }
  }

  static calculateAge(dateOfBirth) {
    const dob = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();

    // Adjust age if the current date is before the birthday in the current year
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }

    return age;
  }

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

  static async getCompanyInfo(id) {
    try {
      const [rows] = await db.query(
        `SELECT 
          c.*,
          c.company_profile_url,
          u.*,
          d.id as department_id,
          d.department_name
        FROM companies c
        LEFT JOIN users u ON c.contact_person_id = u.user_id
        LEFT JOIN user_departments ud ON u.user_id = ud.user_id
        LEFT JOIN departments d ON ud.department_id = d.id
        WHERE c.id = ?`,
        [id]
      );

      console.log("rows", rows);

      if (!rows[0]) return null;

      const companyData = {
        company: {
          id: rows[0].id,
          company_name: rows[0].company_name,
          email_domain: rows[0].email_domain,
          company_size: rows[0].company_size,
          industry: rows[0].industry,
          onboarding_date: rows[0].onboarding_date,
          company_profile_url: rows[0].company_profile_url,
          status: rows[0].status,
          contact_person_id: rows[0].contact_person_id,
        },
        contact_person: rows[0].id
          ? {
              id: rows[0].contact_person_id,
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
              department: rows[0].department_id
                ? {
                    id: rows[0].department_id,
                    name: rows[0].department_name,
                  }
                : null,
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
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      console.log("contactPersonData", contactPersonData);

      if (companyData && companyData.id) {
        console.log("companyData", companyData);
        if (companyData.services_interested) {
          companyData.services_interested = JSON.stringify(
            companyData.services_interested
          );
        }

        const companyKeys = Object.keys(companyData).filter(
          (key) => key !== "id"
        );

        const companySetQuery = companyKeys
          .map((key) => `${key} = ?`)
          .join(", ");

        console.log("companySetQuery: ", companySetQuery);

        const companyValues = companyKeys.map((key) => companyData[key]);
        companyValues.push(companyData.id);

        await connection.query(
          `UPDATE companies SET ${companySetQuery} WHERE id = ?`,
          companyValues
        );
      }

      if (contactPersonData && (contactPersonData.user_id || contactPersonData.id)) {
        console.log("contactPersonData", contactPersonData);
        const departmentData = contactPersonData.department;
        delete contactPersonData.department; 

        // Map id to user_id if needed
        if (contactPersonData.id && !contactPersonData.user_id) {
          contactPersonData.user_id = contactPersonData.id;
          delete contactPersonData.id;
        }

        const contactPersonKeys = Object.keys(contactPersonData).filter(
          (key) => key !== "user_id"
        );

        const contactSetQuery = contactPersonKeys
          .map((key) => `${key} = ?`)
          .join(", ");

        const contactValues = contactPersonKeys.map(
          (key) => contactPersonData[key]
        );
        contactValues.push(contactPersonData.user_id);


        console.log("contactSetQuery: ", contactSetQuery);


        // Update user information
        await connection.query(
          `UPDATE users SET ${contactSetQuery} WHERE user_id = ?`,
          contactValues
        );


        // Handle department update
        if (departmentData && departmentData.id) {
          // Check if user already has a department
          const [existingDept] = await connection.query(
            `SELECT department_id FROM user_departments WHERE user_id = ?`,
            [contactPersonData.user_id]
          );

          if (existingDept.length > 0) {
            // Update existing department
            await connection.query(
              `UPDATE user_departments SET department_id = ? WHERE user_id = ?`,
              [departmentData.id, contactPersonData.user_id]
            );
          } else {
            // Insert new department assignment
            await connection.query(
              `INSERT INTO user_departments (user_id, department_id) VALUES (?, ?)`,
              [contactPersonData.user_id, departmentData.id]
            );
          }
        }
      }

      await connection.commit();

      return {
        status: true,
        code: 200,
        message: "Company and contact person information updated successfully",
        data: { company: companyData, contact_person: contactPersonData },
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async getTopPerformingEmployee(
    company_id,
    page = 1,
    limit = 10,
    search = ""
  ) {
    try {
      console.log("company_id", company_id);
      const offset = (page - 1) * limit;

      // Base count query
      let countQuery = `
        SELECT COUNT(*) as count 
        FROM company_employees ce 
        JOIN users u ON ce.user_id = u.user_id
        WHERE ce.company_id = ? AND ce.is_active = 1
      `;

      // Base data query
      let dataQuery = `
        SELECT 
          u.user_id,
          u.email,
          u.phone,
          u.username,
          u.first_name,
          u.last_name,
          u.gender,
          u.date_of_birth,
          u.age,
          u.city,
          u.Workshop_attended,
          u.Task_completed,
          u.EngagementScore,
          u.job_title,
          ce.is_active,
          ce.joined_date,
          d.id as department_id,
          d.department_name,
          ud.assigned_date as department_assigned_date
        FROM company_employees ce
        JOIN users u ON ce.user_id = u.user_id
        LEFT JOIN user_departments ud ON u.user_id = ud.user_id
        LEFT JOIN departments d ON ud.department_id = d.id
        WHERE ce.company_id = ? AND ce.is_active = 1
      `;

      const queryParams = [company_id];
      const searchParams = [];

      // Add search condition if search term is provided
      if (search) {
        const searchCondition = `
          AND (
            u.first_name LIKE ? 
            OR u.last_name LIKE ? 
            OR u.email LIKE ?
            OR u.phone LIKE ?
          )
        `;
        countQuery += searchCondition;
        dataQuery += searchCondition;

        const searchTerm = `%${search}%`;
        searchParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
      }

      // Add ordering and pagination
      dataQuery += ` ORDER BY u.EngagementScore DESC LIMIT ? OFFSET ?`;

      const [totalRows] = await db.query(
        countQuery,
        search ? [company_id, ...searchParams] : [company_id]
      );

      const [rows] = await db.query(dataQuery, [
        ...(search ? [company_id, ...searchParams] : [company_id]),
        limit,
        offset,
      ]);

      const totalPages = Math.ceil(totalRows[0].count / limit);

      return {
        status: true,
        code: 200,
        message: "Company employees retrieved successfully",
        data: rows,
        pagination: {
          total: totalRows[0].count,
          current_page: page,
          total_pages: totalPages,
          per_page: limit,
        },
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
          employees: rows.map((row) => ({
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
            department: row.department_id ? row.department_name : null,
          })),
          pagination: {
            total: totalRows[0].count,
            current_page: page,
            total_pages: totalPages,
            per_page: limit,
          },
        },
      };
    } catch (error) {
      throw error;
    }
  }

  static async getQna() {
    try {
      const [rows] = await db.query(
        `SELECT id, question, answer, created_at, updated_at 
         FROM qna 
         WHERE is_active = 1 
         ORDER BY created_at DESC`
      );

      return {
        status: true,
        code: 200,
        message: "Q&A data retrieved successfully",
        data: rows,
      };
    } catch (error) {
      throw new Error("Error fetching Q&A: " + error.message);
    }
  }

  // static async getAllCompanies({ page = 1, limit = 10, search = "" }) {
  //   try {
  //     const offset = (page - 1) * limit;

  //     const searchCondition = search
  //       ? `WHERE c.company_name LIKE ? OR c.email_domain LIKE ? OR c.industry LIKE ?`
  //       : "";

  //     const searchParams = search
  //       ? [`%${search}%`, `%${search}%`, `%${search}%`]
  //       : [];

  //     // Get total count
  //     const [totalRows] = await db.query(
  //       `SELECT COUNT(DISTINCT c.id) as count
  //        FROM companies c
  //        ${searchCondition}`,
  //       searchParams
  //     );

  //     // Get companies with their departments
  //     const [companies] = await db.query(
  //       `SELECT
  //         c.*,
  //         GROUP_CONCAT(
  //           DISTINCT JSON_OBJECT(
  //             'id', d.id,
  //             'name', d.department_name
  //           )
  //         ) as departments
  //       FROM companies c
  //       LEFT JOIN company_departments cd ON c.id = cd.company_id
  //       LEFT JOIN departments d ON cd.department_id = d.id
  //       ${searchCondition}
  //       GROUP BY c.id
  //       ORDER BY c.created_at DESC
  //       LIMIT ? OFFSET ?`,
  //       [...searchParams, limit, offset]
  //     );

  //     // Parse the departments JSON string for each company
  //     const companiesWithDepartments = companies.map(company => ({
  //       ...company,
  //       departments: company.departments
  //         ? JSON.parse(`[${company.departments}]`)
  //         : []
  //     }));

  //     const totalPages = Math.ceil(totalRows[0].count / limit);

  //     return {
  //       companies: companiesWithDepartments,
  //       pagination: {
  //         total: totalRows[0].count,
  //         current_page: page,
  //         total_pages: totalPages,
  //         per_page: limit,
  //       },
  //     };
  //   } catch (error) {
  //     console.error("Error in getAllCompanies:", error);
  //     throw new Error("Error fetching companies: " + error.message);
  //   }
  // }

  static async getAllCompanies({ page = 1, limit = 10, search = "" }) {
    try {
      const offset = (page - 1) * limit;

      const searchCondition = search
        ? `WHERE c.company_name LIKE ? OR c.email_domain LIKE ? OR c.industry LIKE ?`
        : "";

      const searchParams = search
        ? [`%${search}%`, `%${search}%`, `%${search}%`]
        : [];

      // Get total count
      const [totalRows] = await db.query(
        `SELECT COUNT(DISTINCT c.id) as count 
         FROM companies c 
         ${searchCondition}`,
        searchParams
      );

      // Get companies with their departments and contact person info
      const [companies] = await db.query(
        `SELECT 
          c.*,
          GROUP_CONCAT(
            DISTINCT JSON_OBJECT(
              'id', d.id,
              'name', d.department_name
            )
          ) as departments,
          JSON_OBJECT(
            'id', u.user_id,
            'email', u.email,
            'phone', u.phone,
            'first_name', u.first_name,
            'last_name', u.last_name,
            'username', u.username
          ) as contact_person_info
        FROM companies c
        LEFT JOIN company_departments cd ON c.id = cd.company_id
        LEFT JOIN departments d ON cd.department_id = d.id
        LEFT JOIN users u ON c.contact_person_id = u.user_id
        ${searchCondition}
        GROUP BY c.id
        ORDER BY c.created_at DESC
        LIMIT ? OFFSET ?`,
        [...searchParams, limit, offset]
      );

      const companiesWithDetails = companies.map((company) => {

        return {
          ...company,
          departments: company.departments
            ? JSON.parse(`[${company.departments}]`)
            : [],
          contact_person_info:
            typeof company.contact_person_info === "string"
              ? JSON.parse(company.contact_person_info)
              : company.contact_person_info || null,
        };
      });


      const totalPages = Math.ceil(totalRows[0].count / limit);

      return {
        companies: companiesWithDetails,
        pagination: {
          total: totalRows[0].count,
          current_page: page,
          total_pages: totalPages,
          per_page: limit,
        },
      };
    } catch (error) {
      throw new Error("Error fetching companies: " + error.message);
    }
  }

  // static async getCompanyMetrics(company_id) {
  //   try {
  //     const [metrics] = await db.query(
  //       `SELECT
  //         c.id as company_id,
  //         c.company_name,
  //         c.company_profile_url,
  //         c.psychological_safety_index,
  //         c.retention_rate,
  //         c.stress_level,
  //         c.engagement_score,
  //         COUNT(*) as total_employees,
  //         SUM(CASE WHEN ce.is_active = 1 THEN 1 ELSE 0 END) as active_employees,
  //         SUM(CASE WHEN ce.is_active = 0 THEN 1 ELSE 0 END) as inactive_employees,
  //         MAX(ce.joined_date) as last_employee_joined,
  //         (SELECT COUNT(*) FROM company_departments cd WHERE cd.company_id = c.id) as total_departments
  //       FROM companies c
  //       LEFT JOIN company_employees ce ON c.id = ce.company_id
  //       LEFT JOIN users u ON ce.user_id = u.user_id
  //       WHERE c.id = ?
  //       GROUP BY c.id`,
  //       [company_id]
  //     );

  //     return {
  //       status: true,
  //       code: 200,
  //       message: "Company metrics retrieved successfully",
  //       data: {
  //         metrics: {
  //           companyId: metrics[0].company_id,
  //           companyName: metrics[0].company_name,
  //           company_profile_url: metrics[0].company_profile_url,
  //           psychological_safety_index:
  //             metrics[0].psychological_safety_index || 0,
  //           retention_rate: metrics[0].retention_rate || 0,
  //           stress_level: metrics[0].stress_level || 0,
  //           engagement_score: metrics[0].engagement_score || 0,
  //           total_employees: metrics[0].total_employees || 0,
  //           active_employees: metrics[0].active_employees || 0,
  //           inactive_employees: metrics[0].inactive_employees || 0,
  //           last_employee_joined: metrics[0].last_employee_joined,
  //           total_departments: metrics[0].total_departments || 0,
  //         },
  //       },
  //     };
  //   } catch (error) {
  //     throw error;
  //   }
  // }

  static async getCompanyMetrics(company_id) {
    try {
      // Get current company metrics
      const [metrics] = await db.query(
        `SELECT 
          c.id as company_id,
          c.company_name,
          c.company_profile_url,
          c.psychological_safety_index,
          c.retention_rate,
          c.stress_level,
          c.engagement_score,
          COUNT(*) as total_employees,
          SUM(CASE WHEN ce.is_active = 1 THEN 1 ELSE 0 END) as active_employees,
          SUM(CASE WHEN ce.is_active = 0 THEN 1 ELSE 0 END) as inactive_employees,
          MAX(ce.joined_date) as last_employee_joined,
          (SELECT COUNT(*) FROM company_departments cd WHERE cd.company_id = c.id) as total_departments
        FROM companies c
        LEFT JOIN company_employees ce ON c.id = ce.company_id
        LEFT JOIN users u ON ce.user_id = u.user_id
        WHERE c.id = ?
        GROUP BY c.id`,
        [company_id]
      );

      if (metrics.length === 0) {
        return {
          status: false,
          code: 404,
          message: "Company not found",
        };
      }

      const c = metrics[0];

      // Fetch most recent historical metrics
      const [history] = await db.query(
        `SELECT 
           stress_level,
           retention_rate,
           engagement_score,
           psychological_safety_index
         FROM company_metrics_history
         WHERE company_id = ?
         ORDER BY month_year DESC
         LIMIT 1`,
        [company_id]
      );

      const h = history[0] || {};

      const getTrend = (current, previous) => {
        if (previous == null) return "no_data";
        if (current > previous) return "up";
        if (current < previous) return "down";
        return "no_change";
      };

      return {
        status: true,
        code: 200,
        message: "Company metrics retrieved successfully",
        data: {
          metrics: {
            companyId: c.company_id,
            companyName: c.company_name,
            company_profile_url: c.company_profile_url,
            psychological_safety_index: c.psychological_safety_index || 0,
            retention_rate: c.retention_rate || 0,
            stress_level: c.stress_level || 0,
            engagement_score: c.engagement_score || 0,
            total_employees: c.total_employees || 0,
            active_employees: c.active_employees || 0,
            inactive_employees: c.inactive_employees || 0,
            last_employee_joined: c.last_employee_joined,
            total_departments: c.total_departments || 0,

            // Trend indicators
            psi_trend: getTrend(
              c.psychological_safety_index,
              h.psychological_safety_index
            ),
            retention_trend: getTrend(c.retention_rate, h.retention_rate),
            stress_trend: getTrend(c.stress_level, h.stress_level),
            engagement_trend: getTrend(c.engagement_score, h.engagement_score),
          },
        },
      };
    } catch (error) {
      throw error;
    }
  }

  static async createEmployee(employeeData) {
    const connection = await db.getConnection();

    console.log("employeeData:  ", employeeData);

    try {
      await connection.beginTransaction();

      const {
        company_id,
        email,
        phone,
        first_name,
        last_name,
        gender,
        date_of_birth,
        job_title,
        department_id,
        city,
      } = employeeData;

      // Calculate age based on date_of_birth
      const username = await CompanyService.generateUniqueUsername(
        first_name,
        last_name
      );

      const age = await CompanyService.calculateAge(date_of_birth);

      const dob = new Date(date_of_birth);
      const day = String(dob.getDate()).padStart(2, "0");
      const month = String(dob.getMonth() + 1).padStart(2, "0");
      const password = `${first_name.slice(0, 4).toLowerCase()}${day}${month}`;

      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert user
      const [userResult] = await connection.query(
        `INSERT INTO users (
          email, phone, password, username, first_name, last_name,
          gender, date_of_birth, job_title, age, role_id, city
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 3, ?)`,
        [
          email,
          phone,
          hashedPassword,
          username,
          first_name,
          last_name,
          gender,
          date_of_birth,
          job_title,
          age,
          city,
        ]
      );

      // Add subscription record for the new user
      await connection.query(
        `INSERT INTO user_subscriptions (
          user_id, 
          email_notification, 
          sms_notification, 
          workshop_event_reminder, 
          system_updates_announcement
        ) VALUES (?, 1, 1, 1, 1)`,
        [userResult.insertId]
      );

      // Insert company_employee
      await connection.query(
        `INSERT INTO company_employees (
          company_id, user_id, joined_date
        ) VALUES (?, ?, NOW())`,
        [company_id, userResult.insertId]
      );

      // Insert department assignment if provided
      if (department_id) {
        await connection.query(
          `INSERT INTO user_departments (
            user_id, department_id
          ) VALUES (?, ?)`,
          [userResult.insertId, department_id]
        );
      }

      await connection.commit();

      // Send welcome email to the new employee
      try {
        await EmailService.sendEmployeeWelcomeEmail(
          first_name,
          email,
          password, // Add the password parameter
          process.env.DASHBOARD_URL
        );
      } catch (emailError) {
        console.error("Error sending welcome email:", emailError);
      }

      return {
        status: true,
        code: 201,
        message: "Employee created successfully",
        data: {
          user_id: userResult.insertId,
          email,
          username,
          temp_password: password,
          department_id: department_id || null,
        },
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async bulkCreateEmployees(employees, company_id) {
    const connection = await db.getConnection();

    try {
      const results = {
        successful: [],
        failed: [],
      };

      await connection.beginTransaction();

      // Get unique department IDs instead of names
      const departmentIds = [
        ...new Set(
          employees
            .filter((emp) => emp.department_id)
            .map((emp) => emp.department_id)
        ),
      ];

      console.log("Department IDs:", departmentIds);

      // Validate department IDs if any exist
      if (departmentIds.length > 0) {
        const [departments] = await connection.query(
          `SELECT id FROM departments WHERE id IN (?)`,
          [departmentIds]
        );

        // Create department ID validation set
        const validDepartmentIds = new Set(departments.map((dept) => dept.id));

        console.log("Valid department IDs:", validDepartmentIds);
      }

      for (const employee of employees) {
        try {
          // Calculate age based on date_of_birth
          const dob = new Date(
            Math.round((employee.date_of_birth - 25569) * 86400 * 1000)
          );
          const age = Math.floor(
            (new Date() - dob) / (365.25 * 24 * 60 * 60 * 1000)
          );

          const day = String(dob.getDate()).padStart(2, "0");
          const month = String(dob.getMonth() + 1).padStart(2, "0");
          const password = `${employee.first_name
            .slice(0, 4)
            .toLowerCase()}${day}${month}`;
          const hashedPassword = await bcrypt.hash(password, 10);

          // Insert user
          const [userResult] = await connection.query(
            `INSERT INTO users (
              email, phone, password, username, first_name, last_name,
              gender, date_of_birth, job_title, age, role_id, city
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 3, ?)`,
            [
              employee.email,
              employee.phone,
              hashedPassword,
              employee.username,
              employee.first_name,
              employee.last_name,
              employee.gender,
              dob,
              employee.job_title || null,
              age,
              employee.city,
            ]
          );

          // Add subscription record for the new user
          await connection.query(
            `INSERT INTO user_subscriptions (
              user_id, 
              email_notification, 
              sms_notification, 
              workshop_event_reminder, 
              system_updates_announcement
            ) VALUES (?, 1, 1, 1, 1)`,
            [userResult.insertId]
          );

          // Insert company_employee
          await connection.query(
            `INSERT INTO company_employees (
              company_id, user_id, joined_date
            ) VALUES (?, ?, NOW())`,
            [company_id, userResult.insertId]
          );

          // Insert department if provided
          if (employee.department_id) {
            await connection.query(
              `INSERT INTO user_departments (
                user_id, department_id
              ) VALUES (?, ?)`,
              [userResult.insertId, employee.department_id]
            );
          }

          // Send welcome email
          try {
            await EmailService.sendEmployeeWelcomeEmail(
              employee.first_name,
              employee.email,
              password,
              process.env.DASHBOARD_URL
            );
          } catch (emailError) {
            console.error("Error sending welcome email:", emailError);
          }

          results.successful.push({
            email: employee.email,
            temp_password: password,
          });
        } catch (error) {
          results.failed.push({
            email: employee.email,
            error: error.message,
          });
        }
      }

      await connection.commit();
      return {
        status: true,
        code: 201,
        message: "Bulk employee creation completed",
        data: results,
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async getDepartments() {
    try {
      const [departments] = await db.query(
        `SELECT id, department_name 
         FROM departments 
         ORDER BY department_name ASC`
      );

      return {
        status: true,
        code: 200,
        message: "Departments retrieved successfully",
        data: departments,
      };
    } catch (error) {
      throw error;
    }
  }

  // static async assignReward(company_id, user_id, reward_id) {
  //   try {
  //     const query =
  //       "INSERT INTO employee_rewards (company_id, user_id, reward_id) VALUES (?, ?, ?)";
  //     const [result] = await db.execute(query, [
  //       company_id,
  //       user_id,
  //       reward_id,
  //     ]);

  //     return {
  //       status: true,
  //       code: 201,
  //       message: "Reward assigned successfully",
  //       data: {
  //         id: result.insertId,
  //       },
  //     };
  //   } catch (error) {
  //     throw error;
  //   }
  // }

  static async assignReward(company_id, user_id, reward_id, admin_id) {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      // Get employee and admin details
      const [[employee]] = await connection.query(
        `SELECT first_name, email FROM users WHERE user_id = ?`,
        [user_id]
      );

      const [[admin]] = await connection.query(
        `SELECT first_name, last_name FROM users WHERE user_id = ?`,
        [admin_id]
      );

      // Insert reward assignment
      const [result] = await connection.query(
        `INSERT INTO employee_rewards (
          company_id, 
          user_id, 
          reward_id,
          rewarded_by,
          awarded_at
        ) VALUES (?, ?, ?, ?, NOW())`,
        [company_id, user_id, reward_id, admin_id]
      );

      // Get reward details
      const [[reward]] = await connection.query(
        `SELECT title AS name FROM rewards WHERE id = ?`,
        [reward_id]
      );

      await connection.commit();

      // Send email notification to employee
      try {
        await EmailService.sendEmployeeRewardEmail(
          employee.first_name,
          `${admin.first_name} ${admin.last_name}`,
          employee.email
        );

        // Send notification to admin about reward assignment
        await EmailService.sendRewardRedemptionAdminEmail(
          admin.first_name,
          employee.first_name,
          reward.name
        );
      } catch (emailError) {
        console.error("Error sending reward notification email:", emailError);
        // Don't throw error as reward is already assigned
      }

      return {
        status: true,
        code: 201,
        message: "Reward assigned successfully",
        data: {
          id: result.insertId,
          company_id,
          user_id,
          reward_id,
          awarded_by: admin_id,
          awarded_at: new Date(),
        },
      };
    } catch (error) {
      await connection.rollback();
      console.error("Error in assignReward:", error);
      throw new Error(`Failed to assign reward: ${error.message}`);
    } finally {
      connection.release();
    }
  }

  static async getEmployeeRewardHistory(company_id, reward_id = null) {
    try {
      let query = `
        SELECT 
          er.id,
          er.company_id,
          er.user_id,
          er.reward_id,
          er.awarded_at,
          u.first_name,
          u.last_name,
          u.email,
          u.phone,
          d.department_name
        FROM 
          employee_rewards er
        JOIN
          users u ON er.user_id = u.user_id
        JOIN
          rewards r ON er.reward_id = r.id
        LEFT JOIN
          user_departments ud ON u.user_id = ud.user_id
        LEFT JOIN
          departments d ON ud.department_id = d.id
        WHERE 
          er.company_id = ?`;

      const params = [company_id];

      if (reward_id) {
        query += ` AND er.reward_id = ?`;
        params.push(reward_id);
      }

      query += ` ORDER BY er.awarded_at DESC`;

      const [results] = await db.query(query, params);

      return {
        status: true,
        code: 200,
        message: "Employee reward history retrieved successfully",
        data: results,
      };
    } catch (error) {
      throw error;
    }
  }

  static async createFeedback({
    company_id,
    feedback_type,
    feedback_description,
  }) {
    try {
      const [result] = await db.query(
        `INSERT INTO feedback (company_id, feedback_type, feedback_description) 
         VALUES (?, ?, ?)`,
        [company_id, feedback_type, feedback_description]
      );

      return {
        status: true,
        code: 201,
        message: "Feedback stored successfully",
        data: { id: result.insertId },
      };
    } catch (error) {
      throw new Error("Error storing feedback: " + error.message);
    }
  }

  static async updateCompanySubscription({
    company_id,
    email_notification,
    sms_notification,
    workshop_event_reminder,
    system_updates_announcement,
    plan_type,
  }) {
    try {
      if (!company_id) {
        throw new Error("company_id is required");
      }

      // Check if a subscription record exists
      const [existing] = await db.query(
        "SELECT * FROM company_subscriptions WHERE company_id = ?",
        [company_id]
      );
      const recordExists = existing.length > 0;

      if (recordExists) {
        // Build dynamic update query for record update
        const fields = [];
        const values = [];

        if (email_notification !== undefined) {
          fields.push("email_notification = ?");
          values.push(email_notification);
        }
        if (sms_notification !== undefined) {
          fields.push("sms_notification = ?");
          values.push(sms_notification);
        }
        if (workshop_event_reminder !== undefined) {
          fields.push("workshop_event_reminder = ?");
          values.push(workshop_event_reminder);
        }
        if (system_updates_announcement !== undefined) {
          fields.push("system_updates_announcement = ?");
          values.push(system_updates_announcement);
        }
        if (plan_type !== undefined) {
          fields.push("plan_type = ?");
          values.push(plan_type);
        }

        if (fields.length === 0) {
          return {
            status: false,
            code: 400,
            message: "No fields provided to update.",
            data: null,
          };
        }

        const query = `UPDATE company_subscriptions SET ${fields.join(
          ", "
        )} WHERE company_id = ?`;
        values.push(company_id);
        await db.query(query, values);
      } else {
        const emailNotif =
          email_notification !== undefined ? email_notification : 0;
        const smsNotif = sms_notification !== undefined ? sms_notification : 0;
        const workshopRem =
          workshop_event_reminder !== undefined ? workshop_event_reminder : 0;
        const sysUpdates =
          system_updates_announcement !== undefined
            ? system_updates_announcement
            : 0;
        const plan = plan_type !== undefined ? plan_type : "monthly";
        // For renewal_date, use today's date in YYYY-MM-DD format
        const renewal_date = new Date().toISOString().slice(0, 10);

        const insertQuery = `
          INSERT INTO company_subscriptions 
            (company_id, email_notification, sms_notification, workshop_event_reminder, system_updates_announcement, plan_type, renewal_date)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        const insertValues = [
          company_id,
          emailNotif,
          smsNotif,
          workshopRem,
          sysUpdates,
          plan,
          renewal_date,
        ];
        await db.query(insertQuery, insertValues);
      }

      const [subscription] = await db.query(
        "SELECT * FROM company_subscriptions WHERE company_id = ?",
        [company_id]
      );

      return {
        status: true,
        code: 200,
        message: "Company subscription updated successfully.",
        data: subscription[0] || null,
      };
    } catch (error) {
      throw new Error("Error updating company subscription: " + error.message);
    }
  }

  static async getCompanySubscription(company_id) {
    try {
      if (!company_id) {
        throw new Error("company_id is required");
      }
      const [subscription] = await db.query(
        "SELECT * FROM company_subscriptions WHERE company_id = ?",
        [company_id]
      );
      if (!subscription || subscription.length === 0) {
        return {
          status: false,
          code: 404,
          message: "Subscription not found for the provided company_id",
          data: null,
        };
      }
      return {
        status: true,
        code: 200,
        message: "Company subscription retrieved successfully.",
        data: subscription[0],
      };
    } catch (error) {
      throw new Error(
        "Error retrieving company subscription: " + error.message
      );
    }
  }

  static async requestDeactivation({
    company_id,
    company_name,
    deactivation_reason,
    detailed_reason,
  }) {
    try {
      console.log("Submitting deactivation request for company:", company_id);

      // Validate company exists
      const [company] = await db.query(
        "SELECT id FROM companies WHERE id = ?",
        [company_id]
      );

      if (!company || company.length === 0) {
        console.log("Company not found with ID:", company_id);
        return {
          status: false,
          code: 404,
          message: "Company not found with the provided ID",
          data: null,
        };
      }

      // Insert deactivation request
      const [result] = await db.query(
        `INSERT INTO company_deactivation_requests 
          (company_id, deactivation_reason, detailed_reason) 
         VALUES (?, ?, ?)`,
        [company_id, deactivation_reason, detailed_reason]
      );

      console.log("Deactivation request submitted with ID:", result.insertId);

      return {
        status: true,
        code: 201,
        message: "Company deactivation request submitted successfully",
        data: {
          id: result.insertId,
          created_at: new Date(),
        },
      };
    } catch (error) {
      console.error("Error in requestDeactivation:", error);
      throw new Error(
        "Error submitting deactivation request: " + error.message
      );
    }
  }

  static async processDeactivationRequest({ request_id, status, user }) {
    const connection = await db.getConnection();
    try {
      // Check if user is superadmin
      if (!user || user.role_id !== 1) {
        return {
          status: false,
          code: 403,
          message: "Access denied. Only superadmin can process deactivation requests.",
          data: null,
        };
      }

      await connection.beginTransaction();
      console.log(`Processing deactivation request ${request_id} with status: ${status}`);

      // Get the deactivation request
      const [request] = await connection.query(
        "SELECT * FROM company_deactivation_requests WHERE id = ?",
        [request_id]
      );

      if (!request || request.length === 0) {
        console.log("Deactivation request not found:", request_id);
        return {
          status: false,
          code: 404,
          message: "Deactivation request not found",
          data: null,
        };
      }

      // Check if request has already been processed
      if (request[0].status !== "pending") {
        console.log(`Request ${request_id} already processed with status:`, request[0].status);
        return {
          status: false,
          code: 400,
          message: `Deactivation request has already been ${request[0].status}`,
          data: null,
        };
      }

      // Update the request status
      console.log(`Updating request ${request_id} status to ${status}`);
      await connection.query(
        "UPDATE company_deactivation_requests SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [status, request_id]
      );

      // If approved, deactivate the company and its employees
      if (status === "approved") {
        console.log(`Deactivating company ${request[0].company_id}`);

        const [companyDetails] = await connection.query(
          `SELECT c.company_name, u.first_name, u.email 
           FROM companies c 
           JOIN company_employees ce ON c.id = ce.company_id 
           JOIN users u ON ce.user_id = u.user_id 
           WHERE c.id = ? AND ce.is_active = 1`,
          [request[0].company_id]
        );

        // Deactivate the company
        await connection.query(
          "UPDATE companies SET active = 0 WHERE id = ?",
          [request[0].company_id]
        );

        // Deactivate all active employees of the company
        await connection.query(
          "UPDATE company_employees SET is_active = 0 WHERE company_id = ? AND is_active = 1",
          [request[0].company_id]
        );

        // Send deactivation emails to all active employees
        for (const employee of companyDetails) {
          await EmailService.sendAccountDeactivationEmail(
            employee.first_name,
            employee.company_name,
            employee.email
          );
        }

        console.log(`Company ${request[0].company_id} and its employees deactivated successfully`);
      } else {
        console.log(`Request rejected, company ${request[0].company_id} remains active`);
      }

      await connection.commit();
      console.log(`Request ${request_id} processed successfully with status: ${status}`);

      return {
        status: true,
        code: 200,
        message: `Deactivation request ${status}`,
        data: {
          request_id,
          company_id: request[0].company_id,
          status,
        },
      };
    } catch (error) {
      console.error("Error in processDeactivationRequest:", error);
      await connection.rollback();
      throw new Error(`Error processing deactivation request: ${error.message}`);
    } finally {
      connection.release();
    }
  }

  static async getCompanyInvoices(
    company_id,
    { status, page = 1, limit = 10 } = {}
  ) {
    try {
      console.log(
        `Fetching invoices for company_id: ${company_id}, status: ${status}, page: ${page}, limit: ${limit}`
      );

      if (!company_id) {
        throw new Error("company_id is required");
      }

      const offset = (page - 1) * limit;
      let query = `
        SELECT 
          i.*,
          c.company_name
        FROM 
          invoices i
        JOIN
          companies c ON i.company_id = c.id
        WHERE 
          i.company_id = ?
      `;

      const queryParams = [company_id];

      if (status) {
        query += ` AND i.status = ?`;
        queryParams.push(status);
      }

      // Get total count for pagination
      let countQuery = `SELECT COUNT(*) as total FROM invoices WHERE company_id = ?`;
      const countParams = [company_id];

      if (status) {
        countQuery += ` AND status = ?`;
        countParams.push(status);
      }

      const [countResult] = await db.query(countQuery, countParams);
      const total = countResult[0].total;

      // Add pagination to the main query
      query += ` ORDER BY i.issue_date DESC LIMIT ? OFFSET ?`;
      queryParams.push(parseInt(limit), offset);

      const [invoices] = await db.query(query, queryParams);
      console.log(
        `Found ${invoices.length} invoices for company ${company_id}`
      );

      return {
        status: true,
        code: 200,
        message: "Company invoices retrieved successfully",
        data: invoices,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error("Error in getCompanyInvoices:", error);
      throw new Error(`Error retrieving company invoices: ${error.message}`);
    }
  }

  static async getInvoiceById(invoice_id, company_id = null) {
    try {
      console.log(
        `Fetching invoice: ${invoice_id}${
          company_id ? ` for company: ${company_id}` : ""
        }`
      );

      const [invoice] = await db.query(
        `SELECT 
          i.*,
          c.company_name
        FROM 
          invoices i
        JOIN
          companies c ON i.company_id = c.id
        WHERE 
          i.id = ?
          ${company_id ? "AND i.company_id = ?" : ""}`,
        company_id ? [invoice_id, company_id] : [invoice_id]
      );

      if (!invoice || invoice.length === 0) {
        return {
          status: false,
          code: 404,
          message: "Invoice not found",
          data: null,
        };
      }

      console.log(`Invoice found: ${invoice_id}`);

      return {
        status: true,
        code: 200,
        message: "Invoice retrieved successfully",
        data: invoice[0],
      };
    } catch (error) {
      console.error("Error in getInvoiceById:", error);
      throw new Error(`Error retrieving invoice: ${error.message}`);
    }
  }

  static async removeEmployee(company_id, user_ids) {
    const connection = await db.getConnection();
    try {
        const userIdArray = Array.isArray(user_ids) ? user_ids : [user_ids];
        console.log(
            `Attempting to delete ${userIdArray.length} employees from company: ${company_id}`
        );

        if (userIdArray.length === 0) {
            return {
                status: false,
                code: 400,
                message: "No employee IDs provided",
                data: null,
            };
        }

        await connection.beginTransaction();

        const results = {
            successful: [],
            failed: [],
        };

        for (const user_id of userIdArray) {
            try {
                // Check if the employee exists in the company
                const [employee] = await connection.query(
                    `SELECT ce.*, u.email 
                     FROM company_employees ce
                     JOIN users u ON ce.user_id = u.user_id
                     WHERE ce.company_id = ? AND ce.user_id = ?`,
                    [company_id, user_id]
                );

                if (!employee || employee.length === 0) {
                    results.failed.push({
                        user_id,
                        reason: "Employee not found in this company",
                    });
                    continue;
                }

                // Delete from company_employees first (maintain referential integrity)
                await connection.query(
                    "DELETE FROM company_employees WHERE company_id = ? AND user_id = ?",
                    [company_id, user_id]
                );

                // Delete from user_subscriptions
                await connection.query(
                    "DELETE FROM user_subscriptions WHERE user_id = ?",
                    [user_id]
                );

                // Delete from user_departments
                await connection.query(
                    "DELETE FROM user_departments WHERE user_id = ?",
                    [user_id]
                );

                // Finally delete from users table
                await connection.query(
                    "DELETE FROM users WHERE user_id = ?",
                    [user_id]
                );

                results.successful.push({
                    user_id,
                    email: employee[0].email,
                    deleted_at: new Date(),
                });

            } catch (error) {
                console.error(`Error processing employee ${user_id}:`, error);
                results.failed.push({
                    user_id,
                    reason: "Internal error: " + error.message,
                });
            }
        }

        await connection.commit();

        return {
            status: results.successful.length > 0,
            code: results.successful.length > 0 ? 200 : 400,
            message: `Processed ${userIdArray.length} employees: ${results.successful.length} deleted, ${results.failed.length} failed`,
            data: {
                company_id,
                successful: results.successful,
                failed: results.failed,
            },
        };

    } catch (error) {
        await connection.rollback();
        console.error("Error in removeEmployee:", error);
        throw new Error(`Error removing employees: ${error.message}`);
    } finally {
        connection.release();
    }
  }

  static async searchEmployees(company_id, search_term, page = 1, limit = 10) {
    try {
      console.log(
        `Searching employees in company ${company_id} with term: "${search_term}"`
      );

      if (!company_id) {
        throw new Error("company_id is required");
      }

      if (!search_term) {
        throw new Error("search_term is required");
      }

      const offset = (page - 1) * limit;

      // Get total count of matching employees
      const [totalRows] = await db.query(
        `SELECT COUNT(*) as count 
         FROM company_employees ce 
         JOIN users u ON ce.user_id = u.user_id
         WHERE ce.company_id = ? 
         AND ce.is_active = 1
         AND (
           u.first_name LIKE ? 
           OR u.last_name LIKE ? 
           OR u.email LIKE ?
           OR u.phone LIKE ?
         )`,
        [
          company_id,
          `%${search_term}%`,
          `%${search_term}%`,
          `%${search_term}%`,
          `%${search_term}%`,
        ]
      );

      // Get paginated results with only the specific fields
      const [employees] = await db.query(
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
          u.city,
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
         WHERE ce.company_id = ? 
         AND ce.is_active = 1
         AND (
           u.first_name LIKE ? 
           OR u.last_name LIKE ? 
           OR u.email LIKE ?
           OR u.phone LIKE ?
         )
         ORDER BY u.first_name ASC
         LIMIT ? OFFSET ?`,
        [
          company_id,
          `%${search_term}%`,
          `%${search_term}%`,
          `%${search_term}%`,
          `%${search_term}%`,
          limit,
          offset,
        ]
      );

      console.log(
        `Found ${employees.length} employees matching "${search_term}"`
      );

      const totalPages = Math.ceil(totalRows[0].count / limit);

      return {
        status: true,
        code: 200,
        message: "Employee search completed successfully",
        data: employees,
        pagination: {
          total: totalRows[0].count,
          current_page: parseInt(page),
          total_pages: totalPages,
          per_page: parseInt(limit),
        },
      };
    } catch (error) {
      console.error("Error in searchEmployees:", error);
      throw new Error(`Error searching employees: ${error.message}`);
    }
  }

  static async addDepartment(departmentName) {
    try {
      const [result] = await db.query(
        `INSERT INTO departments (department_name) VALUES (?)`,
        [departmentName]
      );

      return {
        status: true,
        code: 201,
        message: "Department added successfully",
        data: {
          id: result.insertId,
          department_name: departmentName,
        },
      };
    } catch (error) {
      throw new Error("Error adding department: " + error.message);
    }
  }

  // static async createCompany({
  //   company_name,
  //   email,
  //   company_size,
  //   department_ids,
  // }) {
  //   const connection = await db.getConnection();
  //   try {
  //     await connection.beginTransaction();

  //     // Insert the company into the `companies` table
  //     const [companyResult] = await connection.query(
  //       `INSERT INTO companies (company_name, email_domain, company_size) VALUES (?, ?, ?)`,
  //       [company_name, email, company_size]
  //     );

  //     const companyId = companyResult.insertId;

  //     // Validate and assign departments
  //     if (department_ids && department_ids.length > 0) {
  //       // Ensure the provided department IDs exist in the `departments` table
  //       const [validDepartments] = await connection.query(
  //         `SELECT id FROM departments WHERE id IN (?)`,
  //         [department_ids]
  //       );

  //       if (validDepartments.length === 0) {
  //         throw new Error("Invalid department IDs provided.");
  //       }

  //       // Insert valid department IDs into `company_departments`
  //       const departmentValues = validDepartments.map((dept) => [
  //         companyId,
  //         dept.id,
  //       ]);
  //       await connection.query(
  //         `INSERT INTO company_departments (company_id, department_id) VALUES ?`,
  //         [departmentValues]
  //       );
  //     }

  //     await connection.commit();

  //     return {
  //       status: true,
  //       code: 201,
  //       message: "Company created successfully with assigned departments",
  //       data: {
  //         id: companyId,
  //         company_name,
  //         email,
  //         company_size,
  //         assigned_departments: department_ids || [],
  //       },
  //     };
  //   } catch (error) {
  //     await connection.rollback();
  //     throw new Error("Error creating company: " + error.message);
  //   } finally {
  //     connection.release();
  //   }
  // }

  static async createCompany({
    company_name,
    company_size,
    department_ids,
    contact_person_info,
  }) {
    console.log("Creating company with data:", {
      company_name,
      company_size,
      department_ids,
      contact_person_info,
    });

    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // First create the contact person user
      const username = await CompanyService.generateUniqueUsername(
        contact_person_info.first_name,
        contact_person_info.last_name
      );

      // Generate a temporary password based on the first 4 characters of the username and append "1234"
      const tempPassword = `${username.slice(0, 4)}1234`;
      const hashedPassword = await bcrypt.hash(tempPassword, 10);

      // Insert the contact person into users table
      const [userResult] = await connection.query(
        `INSERT INTO users (
          email, 
          phone, 
          username,
          password,
          first_name, 
          last_name,
          role_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          contact_person_info.email,
          contact_person_info.phone,
          username,
          hashedPassword,
          contact_person_info.first_name,
          contact_person_info.last_name,
          2, // Assuming role_id 2 is for company contact person
        ]
      );

      const contactPersonId = userResult.insertId;

      // Add subscription record for the new user
      await connection.query(
        `INSERT INTO user_subscriptions (
          user_id, 
          email_notification, 
          sms_notification, 
          workshop_event_reminder, 
          system_updates_announcement
        ) VALUES (?, 1, 1, 1, 1)`,
        [contactPersonId]
      );

      // Insert the company with contact person reference and onboarding status
      const [companyResult] = await connection.query(
        `INSERT INTO companies (
          company_name, 
          company_size,
          contact_person_id,
          onboarding_status
        ) VALUES (?, ?, ?, ?)`,
        [company_name, company_size, contactPersonId, 1] // Set onboarding_status to 1
      );

      const companyId = companyResult.insertId;

      // Add contact person to company_employees table
      await connection.query(
        `INSERT INTO company_employees (
          company_id,
          user_id,
          is_active,
          joined_date
        ) VALUES (?, ?, 1, NOW())`,
        [companyId, contactPersonId]
      );

      // Add company subscription with default values
      await connection.query(
        `INSERT INTO company_subscriptions (
          company_id,
          email_notification,
          sms_notification,
          workshop_event_reminder,
          system_updates_announcement,
          plan_type,
          renewal_date
        ) VALUES (?, 1, 1, 1, 1, 'monthly', DATE_ADD(CURDATE(), INTERVAL 1 MONTH))`,
        [companyId]
      );

      // Assign departments if provided
      if (department_ids && department_ids.length > 0) {
        // Validate department IDs
        const [validDepartments] = await connection.query(
          `SELECT id FROM departments WHERE id IN (?)`,
          [department_ids]
        );

        if (validDepartments.length === 0) {
          throw new Error("Invalid department IDs provided.");
        }

        // Insert department assignments
        const departmentValues = validDepartments.map((dept) => [
          companyId,
          dept.id,
        ]);

        await connection.query(
          `INSERT INTO company_departments (company_id, department_id) VALUES ?`,
          [departmentValues]
        );
      }

      await connection.commit();

      const dashboardLink = process.env.DASHBOARD_URL;
      await EmailService.sendAdminWelcomeEmail(
        contact_person_info.first_name,
        contact_person_info.email,
        tempPassword,
        dashboardLink
      );

      return {
        status: true,
        code: 201,
        message: "Company created successfully",
        data: {
          company: {
            id: companyId,
            company_name,
            company_size,
            onboarding_status: 1,
            assigned_departments: department_ids || [],
          },
          contact_person: {
            id: contactPersonId,
            email: contact_person_info.email,
            username,
            first_name: contact_person_info.first_name,
            last_name: contact_person_info.last_name,
            phone: contact_person_info.phone,
            temp_password: tempPassword,
          },
        },
      };
    } catch (error) {
      await connection.rollback();
      console.error("Error in createCompany:", error);
      throw new Error("Error creating company: " + error.message);
    } finally {
      connection.release();
    }
  }

  static async getCompanyAnalytics(company_id, startDate, endDate) {
    try {
      if (!company_id) {
        throw new Error("company_id is required");
      }

      // Fetch basic analytics data for the company
      const [companyData] = await db.query(
        `
        SELECT 
          c.id as company_id,
          c.company_name,
          c.engagement_score,
          c.psychological_safety_index as psi,
          c.retention_rate,
          c.stress_level,
          COUNT(ce.user_id) as total_employees,
          SUM(CASE WHEN ce.is_active = 1 THEN 1 ELSE 0 END) as active_employees,
          SUM(CASE WHEN ce.is_active = 0 THEN 1 ELSE 0 END) as inactive_employees,
          MAX(ce.joined_date) as last_employee_joined,
          (SELECT COUNT(*) FROM company_departments cd WHERE cd.company_id = c.id) as total_departments
        FROM companies c
        LEFT JOIN company_employees ce ON c.id = ce.company_id
        WHERE c.id = ?
        GROUP BY c.id
        `,
        [company_id]
      );

      if (!companyData || companyData.length === 0) {
        return {
          status: false,
          code: 404,
          message: "Company analytics not found",
          data: null,
        };
      }

      // Fetch count of new users for the company in the given time period
      const [newUsers] = await db.query(
        `
        SELECT COUNT(*) as new_users
        FROM company_employees
        WHERE company_id = ? AND DATE(joined_date) BETWEEN DATE(?) AND DATE(?)
        `,
        [company_id, startDate, endDate]
      );

      // Fetch engagement score and stress level trends for the company
      const [trends] = await db.query(
        `
        SELECT 
          recorded_date as date,
          AVG(engagement_score) as avg_engagement_score,
          AVG(stress_level) as avg_stress_level
        FROM employee_daily_history
        WHERE company_id = ? AND DATE(recorded_date) BETWEEN DATE(?) AND DATE(?)
        GROUP BY recorded_date
        ORDER BY recorded_date ASC
        `,
        [company_id, startDate, endDate]
      );

      return {
        status: true,
        code: 200,
        message: "Company analytics retrieved successfully",
        data: {
          ...companyData[0],
          new_users: newUsers[0]?.new_users || 0,
          trends: trends.map((trend) => ({
            date: trend.date,
            avg_engagement_score: trend.avg_engagement_score,
            avg_stress_level: trend.avg_stress_level,
          })),
        },
      };
    } catch (error) {
      console.error("Error fetching company analytics:", error);
      throw new Error(`Error fetching company analytics: ${error.message}`);
    }
  }

  static async getCompanyList({ page = 1, limit = 20, search = "" }) {
    try {
      const offset = (page - 1) * limit;

      // Add search condition if a search term is provided
      const searchCondition = search ? `WHERE company_name LIKE ?` : "";

      const searchParams = search ? [`%${search}%`] : [];

      // Fetch the total count of companies for pagination
      const [totalRows] = await db.query(
        `SELECT COUNT(*) as count 
         FROM companies 
         ${searchCondition}`,
        searchParams
      );

      const total = totalRows[0].count;

      // Fetch the paginated list of companies
      const [companies] = await db.query(
        `SELECT id, company_name 
         FROM companies 
         ${searchCondition}
         ORDER BY company_name ASC
         LIMIT ? OFFSET ?`,
        [...searchParams, limit, offset]
      );

      const totalPages = Math.ceil(total / limit);

      return {
        status: true,
        code: 200,
        message: "Company list retrieved successfully",
        data: companies,
        pagination: {
          total,
          current_page: page,
          total_pages: totalPages,
          per_page: limit,
        },
      };
    } catch (error) {
      console.error("Error fetching company list:", error);
      throw new Error("Error fetching company list: " + error.message);
    }
  }

  static async getRetentionHistory(company_id, months) {
    try {
      // Verify company exists and is active
      const [company] = await db.query(
        "SELECT id FROM companies WHERE id = ? AND active = 1",
        [company_id]
      );

      if (!company || company.length === 0) {
        return {
          status: false,
          message: "Company not found or inactive",
        };
      }

      const history = await getCompanyRetentionHistory(company_id, months);
      return {
        status: true,
        message: "Retention history retrieved successfully",
        data: history.data,
      };
    } catch (error) {
      console.error("Error in getRetentionHistory:", error);
      throw new Error(`Error retrieving retention history: ${error.message}`);
    }
  }

  static async getCompanyStressTrends(company_id, months = 12) {
    try {
      // Verify company exists
      const [company] = await db.query(
        "SELECT id FROM companies WHERE id = ? AND active = 1",
        [company_id]
      );

      if (!company || company.length === 0) {
        return {
          status: false,
          code: 404,
          message: "Company not found or inactive",
        };
      }

      // Fetch historical stress data
      const [trends] = await db.query(
        `SELECT 
          DATE_FORMAT(month_year, '%Y-%m') as period,
          stress_level,
          engagement_score,
          psychological_safety_index
        FROM company_metrics_history
        WHERE company_id = ?
        AND month_year >= DATE_SUB(CURDATE(), INTERVAL ? MONTH)
        ORDER BY month_year ASC`, // This ensures ascending order by date
        [company_id, months]
      );

      // Get current month's data
      const [currentMetrics] = await db.query(
        `SELECT 
          DATE_FORMAT(CURDATE(), '%Y-%m') as period,
          stress_level,
          engagement_score,
          psychological_safety_index
        FROM companies
        WHERE id = ?`,
        [company_id]
      );

      // Combine historical and current data
      const allTrends = [...trends];
      if (currentMetrics && currentMetrics[0]) {
        // Only add current month if it's not already in the trends
        const currentPeriod = currentMetrics[0].period;
        if (!trends.some((trend) => trend.period === currentPeriod)) {
          allTrends.push(currentMetrics[0]);
        }
      }

      // Sort the combined data to ensure it's in ascending order
      allTrends.sort((a, b) => a.period.localeCompare(b.period));

      // Calculate month-over-month changes
      const trendsWithChanges = allTrends.map((trend, index) => {
        const previousTrend = index > 0 ? allTrends[index - 1] : null;
        return {
          period: trend.period,
          stress_level: trend.stress_level || 0,
          stress_level_change: previousTrend
            ? (trend.stress_level || 0) - (previousTrend.stress_level || 0)
            : 0,
          // engagement_score: trend.engagement_score || 0,
          // engagement_score_change: previousTrend
          //   ? (trend.engagement_score || 0) - (previousTrend.engagement_score || 0)
          //   : 0,
          // psychological_safety_index: trend.psychological_safety_index || 0,
          // psi_change: previousTrend
          //   ? (trend.psychological_safety_index || 0) - (previousTrend.psychological_safety_index || 0)
          //   : 0
        };
      });

      return {
        status: true,
        code: 200,
        message: "Company stress trends retrieved successfully",
        data: {
          company_id,
          trends: trendsWithChanges,
          summary: {
            current_stress_level: currentMetrics[0]?.stress_level || 0,
            average_stress_level: Number(
              (
                trendsWithChanges.reduce((sum, t) => sum + t.stress_level, 0) /
                trendsWithChanges.length
              ).toFixed(2)
            ),
            highest_stress_level: Math.max(
              ...trendsWithChanges.map((t) => t.stress_level)
            ),
            lowest_stress_level: Math.min(
              ...trendsWithChanges.map((t) => t.stress_level)
            ),
          },
        },
      };
    } catch (error) {
      console.error("Error in getCompanyStressTrends:", error);
      throw error;
    }
  }

  static async getDeactivationRequests({ status, page = 1, limit = 10 }) {
    try {
      const offset = (page - 1) * limit;

      let query = `
        SELECT 
          dr.*,
          c.company_name,
          u.email as contact_person_email
        FROM 
          company_deactivation_requests dr
        JOIN 
          companies c ON dr.company_id = c.id
        LEFT JOIN
          users u ON c.contact_person_id = u.user_id
        WHERE 
          dr.status != 'approved' AND dr.status != 'rejected'
      `;

      const queryParams = [];

      if (status) {
        query += ` AND dr.status = ?`;
        queryParams.push(status);
      }

      // Get total count for pagination
      const countQuery = query.replace(
        "dr.*, c.company_name, u.email as contact_person_email",
        "COUNT(*) as total"
      );
      
      const [countResult] = await db.query(countQuery, queryParams);
      const total = countResult && countResult[0] ? countResult[0].total : 0;

      // If no results found, return early with empty data
      if (total === 0) {
        return {
          status: true,
          code: 200,
          message: "No deactivation requests found",
          data: [],
          pagination: {
            total: 0,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: 0
          }
        };
      }

      // Add sorting and pagination
      query += ` ORDER BY dr.created_at DESC LIMIT ? OFFSET ?`;
      queryParams.push(parseInt(limit), offset);

      const [requests] = await db.query(query, queryParams);

      return {
        status: true,
        code: 200,
        message: "Deactivation requests retrieved successfully",
        data: requests || [], // Ensure we always return an array
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error("Error fetching deactivation requests:", error);
      throw new Error(`Error fetching deactivation requests: ${error.message}`);
    }
  }

  static async getDeactivatedCompanies({ page = 1, limit = 10, search = '' }) {
    try {
      const offset = (page - 1) * limit;
      
      let query = `
        SELECT 
          c.*,
          dr.deactivation_reason,
          dr.detailed_reason,
          dr.created_at as deactivation_request_date,
          dr.status as deactivation_status
        FROM 
          companies c
        LEFT JOIN 
          company_deactivation_requests dr ON c.id = dr.company_id
        WHERE 
          c.active = 0
      `;
      
      const queryParams = [];
      
      if (search) {
        query += ` AND (
          c.company_name LIKE ? OR 
          c.email LIKE ? OR
          dr.deactivation_reason LIKE ?
        )`;
        const searchTerm = `%${search}%`;
        queryParams.push(searchTerm, searchTerm, searchTerm);
      }
      
      // Get total count for pagination
      const countQuery = query.replace(
        'c.*, dr.deactivation_reason, dr.detailed_reason, dr.created_at as deactivation_request_date, dr.status as deactivation_status',
        'COUNT(DISTINCT c.id) as total'
      );
      const [countResult] = await db.query(countQuery, queryParams);
      
      // Default to 0 if no results
      const total = countResult && countResult[0] ? countResult[0].total : 0;
      
      // If total is 0, return early with empty data
      if (total === 0) {
        return {
          status: true,
          code: 200,
          message: "No deactivated companies found",
          data: [],
          pagination: {
            total: 0,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: 0
          }
        };
      }
      
      // Add sorting and pagination
      query += ` ORDER BY dr.created_at DESC LIMIT ? OFFSET ?`;
      queryParams.push(parseInt(limit), offset);
      
      const [companies] = await db.query(query, queryParams);
      
      return {
        status: true,
        code: 200,
        message: "Deactivated companies retrieved successfully",
        data: companies || [], // Ensure we always return an array
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error("Error fetching deactivated companies:", error);
      throw new Error(`Error fetching deactivated companies: ${error.message}`);
    }
  }

  static async getFeedback({ 
    feedback_type = null, 
    page = 1, 
    limit = 10,
    start_date = null,
    end_date = null
  }) {
    try {
      const offset = (page - 1) * limit;
      let query = `
        SELECT 
          f.*,
          c.company_name
        FROM feedback f
        JOIN companies c ON f.company_id = c.id
        WHERE 1=1
      `;
      
      const queryParams = [];
      let countQuery = `SELECT COUNT(*) as total FROM feedback f WHERE 1=1`;
      const countParams = [];

      // Add feedback type filter
      if (feedback_type) {
        query += ` AND f.feedback_type = ?`;
        countQuery += ` AND feedback_type = ?`;
        queryParams.push(feedback_type);
        countParams.push(feedback_type);
      }

      // Add date range filter
      if (start_date) {
        query += ` AND DATE(f.created_at) >= ?`;
        countQuery += ` AND DATE(created_at) >= ?`;
        queryParams.push(start_date);
        countParams.push(start_date);
      }

      if (end_date) {
        query += ` AND DATE(f.created_at) <= ?`;
        countQuery += ` AND DATE(created_at) <= ?`;
        queryParams.push(end_date);
        countParams.push(end_date);
      }

      // Add ordering
      query += ` ORDER BY f.created_at DESC`;

      // Add pagination
      query += ` LIMIT ? OFFSET ?`;
      queryParams.push(limit, offset);

      // Execute queries
      const [feedbacks] = await db.query(query, queryParams);
      const [totalRows] = await db.query(countQuery, countParams);

      return {
        status: true,
        code: 200,
        message: "Feedback retrieved successfully",
        data: {
          feedbacks,
          pagination: {
            total: totalRows[0].total,
            currentPage: page,
            totalPages: Math.ceil(totalRows[0].total / limit),
            limit
          }
        }
      };
    } catch (error) {
      console.error("Error in getFeedback:", error);
      throw new Error("Failed to fetch feedback: " + error.message);
    }
  }
}

module.exports = CompanyService;
