const db = require("../../../config/db");
const bcrypt = require("bcrypt");

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
        LEFT JOIN users u ON c.contact_person_id = u.user_id
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
    console.log("companyData", companyData);
    console.log("contactPersonData", contactPersonData);
    try {
      if (companyData && companyData.id) {
        if (companyData.services_interested) {
          companyData.services_interested = JSON.stringify(
            companyData.services_interested
          );
        }

        const companyKeys = Object.keys(companyData).filter(
          (key) => key !== "id"
        );

        const companySetQuery = companyKeys
          .map((key) => {
            if (typeof companyData[key] === "string") {
              return `${key} = ?`;
            } else if (Array.isArray(companyData[key])) {
              return `${key} = ?`;
            } else {
              return `${key} = ?`;
            }
          })
          .join(", ");

        const companyValues = companyKeys.map((key) => companyData[key]);
        companyValues.push(companyData.id);

        await db.query(
          `UPDATE companies SET ${companySetQuery} WHERE id = ?`,
          companyValues
        );
      }

      if (contactPersonData && contactPersonData.id) {
        const contactPersonKeys = Object.keys(contactPersonData).filter(
          (key) => key !== "id"
        );
        const contactSetQuery = contactPersonKeys
          .map((key) => `${key} = ?`)
          .join(", ");
        const contactValues = contactPersonKeys.map(
          (key) => contactPersonData[key]
        );
        contactValues.push(contactPersonData.user_id);

        await db.query(
          `UPDATE users SET ${contactSetQuery} WHERE user_id = ?`,
          contactValues
        );
      }

      return {
        status: true,
        code: 200,
        message: "Company and contact person information updated successfully",
        data: { company: companyData, contact_person: contactPersonData },
      };
    } catch (error) {
      throw error;
    }
  }

  static async getTopPerformingEmployee(company_id, page = 1, limit = 10) {
    try {
      console.log("company_id", company_id);
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

  static async getAllCompanies({ page = 1, limit = 10, search = "" }) {
    try {
      const offset = (page - 1) * limit;

      const searchCondition = search
        ? `WHERE company_name LIKE ? OR email_domain LIKE ? OR industry LIKE ?`
        : "";

      const searchParams = search
        ? [`%${search}%`, `%${search}%`, `%${search}%`]
        : [];

      // Get total count
      const [totalRows] = await db.query(
        `SELECT COUNT(*) as count 
       FROM companies ${searchCondition}`,
        searchParams
      );

      // Get paginated results
      const [companies] = await db.query(
        `SELECT 
        *
       FROM companies
       ${searchCondition}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
        [...searchParams, limit, offset]
      );

      const totalPages = Math.ceil(totalRows[0].count / limit);

      return {
        companies,
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

  static async getCompanyMetrics(company_id) {
    try {
      // Get employee counts and latest joined date
      const [metrics] = await db.query(
        `SELECT 
          c.id as company_id,
          c.company_name,
          COUNT(*) as total_employees,
          SUM(CASE WHEN ce.is_active = 1 THEN 1 ELSE 0 END) as active_employees,
          SUM(CASE WHEN ce.is_active = 0 THEN 1 ELSE 0 END) as inactive_employees,
          MAX(ce.joined_date) as last_employee_joined
        FROM companies c
        LEFT JOIN company_employees ce ON c.id = ce.company_id
        LEFT JOIN users u ON ce.user_id = u.user_id
        WHERE c.id = ?
        GROUP BY c.id`,
        [company_id]
      );

      return {
        status: true,
        code: 200,
        message: "Company metrics retrieved successfully",
        data: {
          metrics: {
            companyId: metrics[0].company_id,
            companyName: metrics[0].company_name,
            total_employees: metrics[0].total_employees || 0,
            active_employees: metrics[0].active_employees || 0,
            inactive_employees: metrics[0].inactive_employees || 0,
            last_employee_joined: metrics[0].last_employee_joined,
          },
        },
      };
    } catch (error) {
      throw error;
    }
  }

  static async createEmployee(employeeData) {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      const {
        company_id,
        email,
        phone,
        username,
        first_name,
        last_name,
        gender,
        date_of_birth,
        job_title,
        age,
        department_id,
      } = employeeData;

      const password = Math.random().toString(36).slice(-8);
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert user
      const [userResult] = await connection.query(
        `INSERT INTO users (
          email, phone, password, username, first_name, last_name,
          gender, date_of_birth, job_title, age, role_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 3)`,
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
        ]
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

      return {
        status: true,
        code: 201,
        message: "Employee created successfully",
        data: {
          user_id: userResult.insertId,
          email,
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

      // Get unique department names
      const departmentNames = [
        ...new Set(
          employees.filter((emp) => emp.department).map((emp) => emp.department)
        ),
      ];

      // Fetch department IDs
      const [departments] = await connection.query(
        `SELECT id, department_name 
         FROM departments 
         WHERE department_name IN (?)`,
        [departmentNames]
      );

      // Create department name to ID mapping
      const departmentMap = departments.reduce((acc, dept) => {
        acc[dept.department_name] = dept.id;
        return acc;
      }, {});

      for (const employee of employees) {
        try {
          const password = Math.random().toString(36).slice(-8);
          const hashedPassword = await bcrypt.hash(password, 10);

          // Insert user
          const [userResult] = await connection.query(
            `INSERT INTO users (
              email, phone, password, username, first_name, last_name,
              gender, date_of_birth, job_title, age, role_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 3)`,
            [
              employee.email,
              employee.phone,
              hashedPassword,
              employee.username,
              employee.first_name,
              employee.last_name,
              employee.gender,
              employee.date_of_birth,
              employee.job_title,
              employee.age,
            ]
          );

          // Insert company_employee
          await connection.query(
            `INSERT INTO company_employees (
              company_id, user_id, joined_date
            ) VALUES (?, ?, NOW())`,
            [company_id, userResult.insertId]
          );

          // Insert department if provided
          if (employee.department && departmentMap[employee.department]) {
            await connection.query(
              `INSERT INTO user_departments (
                user_id, department_id
              ) VALUES (?, ?)`,
              [userResult.insertId, departmentMap[employee.department]]
            );
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

  static async assignReward(company_id, user_id, reward_id) {
    try {
      const query =
        "INSERT INTO employee_rewards (company_id, user_id, reward_id) VALUES (?, ?, ?)";
      const [result] = await db.execute(query, [
        company_id,
        user_id,
        reward_id,
      ]);

      return {
        status: true,
        code: 201,
        message: "Reward assigned successfully",
        data: {
          id: result.insertId,
        },
      };
    } catch (error) {
      throw error;
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

  static async processDeactivationRequest({ request_id, status }) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      console.log(
        `Processing deactivation request ${request_id} with status: ${status}`
      );

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
        console.log(
          `Request ${request_id} already processed with status:`,
          request[0].status
        );
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

      // If approved, deactivate the company
      if (status === "approved") {
        console.log(`Deactivating company ${request[0].company_id}`);
        await connection.query("UPDATE companies SET active = 0 WHERE id = ?", [
          request[0].company_id,
        ]);
        console.log(
          `Company ${request[0].company_id} deactivated successfully`
        );
      } else {
        console.log(
          `Request rejected, company ${request[0].company_id} remains active`
        );
      }

      await connection.commit();
      console.log(
        `Request ${request_id} processed successfully with status: ${status}`
      );

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
      throw new Error(
        `Error processing deactivation request: ${error.message}`
      );
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
}

module.exports = CompanyService;
