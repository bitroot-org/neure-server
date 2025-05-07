const XLSX = require("xlsx");
const db = require("../../../config/db");
const ActivityLogService = require("../../services/logs/ActivityLogService");

const {
  registerCompany,
  getCompanyInfo,
  updateCompany,
  getTopPerformingEmployee,
  getCompanyEmployees,
  getQna,
  getAllCompanies,
  getCompanyMetrics,
  createEmployee,
  bulkCreateEmployees,
  getDepartments,
  assignReward,
  getEmployeeRewardHistory,
  createFeedback,
  updateCompanySubscription,
  getCompanySubscription,
  requestDeactivation,
  processDeactivationRequest,
  getCompanyInvoices,
  getInvoiceById,
  removeEmployee,
  searchEmployees,
  addDepartment,
  createCompany,
  getCompanyAnalytics,
  getCompanyList,
  getRetentionHistory,
  getCompanyStressTrends,
  getDeactivationRequests,
  getDeactivatedCompanies,
  getFeedback
} = require("../../services/company/companyService");

// Helper function to validate date format
function isValidDate(dateString) {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;
  
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
}

class CompanyController {
  
  static async registerCompany(req, res) {
    const { companyName, emailDomain } = req.body;

    if (!companyName || !emailDomain) {
      return res.status(400).json({
        status: false,
        code: 400,
        message: "Company name and email domain are required.",
        data: null,
      });
    }

    try {
      const newCompany = await registerCompany(companyName, emailDomain);
      res.status(201).json({
        message: "Company registered successfully!",
        data: newCompany,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        status: false,
        code: 500,
        message: "An error occurred while registering the company.",
        data: null,
      });
    }
  }

  static async getCompanyInfo(req, res) {
    const company_id = req.query.company_id || req.body.company_id;

    if (!company_id) {
      return res.status(400).json({
        status: false,
        code: 400,
        message: "Company ID is required.",
        data: null,
      });
    }

    try {
      const company = await getCompanyInfo(company_id);
      if (!company) {
        return res.status(404).json({
          status: false,
          code: 404,
          message: "Company not found.",
          data: null,
        });
      }
      res.status(200).json(company);
    } catch (error) {
      console.error(error);
      res.status(500).json({
        status: false,
        code: 500,
        message: "An error occurred while fetching company details.",
        data: null,
      });
    }
  }

  static async updateCompany(req, res) {
    try {
      const { company, contact_person, employees } = req.body;

      if (!company || !company.id) {
        return res.status(400).json({
          status: false,
          code: 400,
          message: "Company data is required",
          data: null,
        });
      }

      const result = await updateCompany(company, contact_person, employees);
      res.status(200).json(result);
    } catch (error) {
      console.error(error);
      res.status(500).json({
        status: false,
        code: 500,
        message: "An error occurred while updating company information",
        data: null,
      });
    }
  }

  static async getTopPerformingEmployee(req, res) {
    try {
      const company_id = req.query.company_id;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const search = req.query.search || ''; // Add search parameter
  
      if (!company_id) {
        return res.status(400).json({
          status: false,
          code: 400,
          message: "Company ID is required",
          data: null,
        });
      }
  
      const result = await getTopPerformingEmployee(company_id, page, limit, search);
      res.status(200).json(result);
    } catch (error) {
      console.error(error);
      res.status(500).json({
        status: false,
        code: 500,
        message: "An error occurred while fetching company employees",
        data: null,
      });
    }
  }

  static async getCompanyEmployees(req, res) {
    try {
      const company_id = req.query.company_id;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;

      if (!company_id) {
        return res.status(400).json({
          status: false,
          code: 400,
          message: "Company ID is required",
          data: null,
        });
      }

      const result = await getCompanyEmployees(company_id, page, limit);
      res.status(200).json(result);
    } catch (error) {
      console.error(error);
      res.status(500).json({
        status: false,
        code: 500,
        message: "An error occurred while fetching company employees",
        data: null,
      });
    }
  }

  static async getQna(req, res) {
    try {
      const result = await getQna();
      return res.status(200).json({
        status: true,
        code: 200,
        message: "Q&A data retrieved successfully",
        data: result,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        status: false,
        code: 500,
        message: "An error occurred while fetching Q&A data",
        data: null,
      });
    }
  }

  static async getAllCompanies(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const search = req.query.search || "";

      const result = await getAllCompanies({ page, limit, search });

      return res.status(200).json({
        status: true,
        code: 200,
        message: "Companies retrieved successfully",
        data: result,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        status: false,
        code: 500,
        message: "An error occurred while fetching companies",
        data: null,
      });
    }
  }

  static async getCompanyMetrics(req, res) {
    try {
      const { company_id } = req.query;

      if (!company_id) {
        return res.status(400).json({
          status: false,
          code: 400,
          message: "Company ID is required",
          data: null,
        });
      }

      const result = await getCompanyMetrics(company_id);
      return res.status(200).json(result);
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        status: false,
        code: 500,
        message: "Error fetching company metrics",
        data: null,
      });
    }
  }

  static async createEmployee(req, res) {
    try {
      // Check user role
      const { role_id } = req.user;
      
      if (role_id !== 1 && role_id !== 2) {
        return res.status(403).json({
          status: false,
          code: 403,
          message: "Access denied. Only Super Admin and Company Admin can create employees",
          data: null,
        });
      }

      const employeeData = req.body;

      if (!employeeData.company_id) {
        return res.status(400).json({
          status: false,
          code: 400,
          message: "Company ID is required",
          data: null,
        });
      }

      const result = await createEmployee(employeeData);
      return res.status(201).json(result);
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        status: false,
        code: 500,
        message: "Error creating employee",
        data: null,
      });
    }
  }

  static async bulkCreateEmployees(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          status: false,
          code: 400,
          message: "File is required",
          data: null,
        });
      }


      const workbook = XLSX.readFile(req.file.path);
      const sheetName = workbook.SheetNames[0];
      const employees = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

      console.log("Received employees data:", employees);
      const result = await bulkCreateEmployees(employees, req.body.company_id);
      return res.status(201).json(result);
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        status: false,
        code: 500,
        message: "Error creating employees",
        data: null,
      });
    }
  }

  static async getDepartments(req, res) {
    try {
      const result = await getDepartments();
      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({
        status: false,
        code: 500,
        message: "Error fetching departments",
        data: null,
      });
    }
  }

  static async assignReward(req, res) {
    try {
      const { company_id, user_id, reward_id , admin_id} = req.body;
      console.log(req.body);

      if (!company_id || !user_id || !reward_id || !admin_id) {
        return res.status(400).json({
          status: false,
          code: 400,
          message: "company_id, user_id, admin_id and reward_id are required.",
          data: null,
        });
      }

      const id = await assignReward(company_id, user_id, reward_id, admin_id);

      return res.status(201).json({
        status: true,
        code: 201,
        message: "Reward assigned successfully",
        data: { id },
      });
    } catch (error) {
      console.error("Error assigning reward:", error);
      return res.status(500).json({
        status: false,
        code: 500,
        message: "An error occurred while assigning reward",
        data: null,
      });
    }
  }

  static async getEmployeeRewardHistory(req, res) {
    try {
      const { company_id, reward_id } = req.query;
      console;

      if (!company_id) {
        return res.status(400).json({
          status: false,
          code: 400,
          message: "Company ID is required",
          data: null,
        });
      }

      const result = await getEmployeeRewardHistory(
        company_id,
        reward_id || null
      );
      return res.status(200).json(result);
    } catch (error) {
      console.error("Error fetching reward history:", error);
      return res.status(500).json({
        status: false,
        code: 500,
        message: "An error occurred while fetching reward history",
        data: null,
      });
    }
  }

  static async createFeedback(req, res) {
    try {
      const { company_id, feedback_type, feedback_description } = req.body;

      if (!company_id || !feedback_type || !feedback_description) {
        return res.status(400).json({
          status: false,
          code: 400,
          message:
            "company_id, feedback_type and feedback_description are required.",
          data: null,
        });
      }

      const result = await createFeedback({
        company_id,
        feedback_type,
        feedback_description,
      });

      return res.status(201).json(result);
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        status: false,
        code: 500,
        message: "Error storing feedback",
        data: null,
      });
    }
  }

  static async updateCompanySubscription(req, res) {
    try {
      const {
        company_id,
        email_notification,
        sms_notification,
        workshop_event_reminder,
        system_updates_announcement,
        plan_type,
      } = req.body;
      if (!company_id) {
        return res.status(400).json({
          status: false,
          code: 400,
          message: "company_id is required.",
          data: null,
        });
      }
      const result = await updateCompanySubscription({
        company_id,
        email_notification,
        sms_notification,
        workshop_event_reminder,
        system_updates_announcement,
        plan_type,
      });
      return res.status(result.code).json(result);
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        status: false,
        code: 500,
        message: "Error updating company subscription.",
        data: null,
      });
    }
  }

  static async getCompanySubscription(req, res) {
    try {
      const company_id = req.query.company_id;
      if (!company_id) {
        return res.status(400).json({
          status: false,
          code: 400,
          message: "company_id is required.",
          data: null,
        });
      }
      const result = await getCompanySubscription(company_id);
      return res.status(result.code).json(result);
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        status: false,
        code: 500,
        message: "Error retrieving company subscription.",
        data: null,
      });
    }
  }

  static async requestDeactivation(req, res) {
    try {
      const { company_id, deactivation_reason, detailed_reason } = req.body;
      const user = req.user;
      
      console.log("Received deactivation request:", { 
        company_id,  
        deactivation_reason 
      });
      
      if (!company_id || !deactivation_reason || !detailed_reason) {
        return res.status(400).json({
          status: false,
          code: 400,
          message: "company_id, deactivation_reason, and detailed_reason are required.",
          data: null,
        });
      }
      
      // Get company name for logging
      const [companyDetails] = await db.query(
        "SELECT company_name FROM companies WHERE id = ?",
        [company_id]
      );
      
      const result = await requestDeactivation({
        company_id,
        deactivation_reason,
        detailed_reason,
      });
      
      // Log the deactivation request with user-friendly description
      if (result.status && companyDetails.length > 0) {
        await ActivityLogService.createLog({
          user_id: user?.user_id,
          performed_by: 'admin',
          module_name: 'companies',
          action: 'deactivation_request',
          description: `Deactivation requested for company "${companyDetails[0].company_name}". Reason: ${deactivation_reason}`
        });
      }
      
      return res.status(result.code).json(result);
    } catch (error) {
      console.error("Error in requestDeactivation:", error);
      return res.status(500).json({
        status: false,
        code: 500,
        message: "Error submitting deactivation request: " + error.message,
        data: null,
      });
    }
  }

  static async processDeactivationRequest(req, res) {
    try {
      const { role_id } = req.user;
      if (role_id !== 1) {
        return res.status(403).json({
          status: false,
          code: 403,
          message: "Access denied. Only superadmins can create articles",
          data: null,
        });
      }
      
      const { request_id, status } = req.body;
      const user = req.user;
      
      console.log("Received request to process deactivation:", { request_id, status });
      
      if (!request_id || !status) {
        return res.status(400).json({
          status: false,
          code: 400,
          message: "request_id and status are required.",
          data: null,
        });
      }
      
      if (status !== 'approved' && status !== 'rejected') {
        return res.status(400).json({
          status: false,
          code: 400,
          message: "status must be either 'approved' or 'rejected'.",
          data: null,
        });
      }
      
      // Get request details for logging
      const [requestDetails] = await db.query(`
        SELECT dr.*, c.company_name 
        FROM company_deactivation_requests dr
        JOIN companies c ON dr.company_id = c.id
        WHERE dr.id = ?
      `, [request_id]);
      
      const result = await processDeactivationRequest({
        request_id,
        status,
        user: req.user // Pass the user object from the request
      });
      
      // Log the deactivation request processing with user-friendly description
      if (result.status && requestDetails.length > 0) {
        const action = status === 'approved' ? 'deactivation_approved' : 'deactivation_rejected';
        await ActivityLogService.createLog({
          user_id: user?.user_id,
          performed_by: 'admin',
          module_name: 'companies',
          action: action,
          description: `Deactivation request for company "${requestDetails[0].company_name}" was ${status}${status === 'approved' ? '. Company has been deactivated.' : ''}`
        });
      }
      
      return res.status(result.code).json(result);
    } catch (error) {
      console.error("Error in processDeactivationRequest:", error);
      return res.status(500).json({
        status: false,
        code: 500,
        message: "Error processing deactivation request: " + error.message,
        data: null,
      });
    }
  }

  static async getCompanyInvoices(req, res) {
    try {
      const company_id = req.query.company_id;
      const status = req.query.status; // Optional filter by status
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      
      console.log("Received request to get company invoices:", { company_id, status, page, limit });
      
      if (!company_id) {
        return res.status(400).json({
          status: false,
          code: 400,
          message: "company_id is required.",
          data: null,
        });
      }
      
      const result = await getCompanyInvoices(company_id, { status, page, limit });
      return res.status(result.code).json(result);
    } catch (error) {
      console.error("Error in getCompanyInvoices controller:", error);
      return res.status(500).json({
        status: false,
        code: 500,
        message: "Error retrieving company invoices.",
        data: null,
      });
    }
  }
  
  static async getInvoiceById(req, res) {
    try {
      const { invoice_id, company_id } = req.query;
      
      console.log("Received request to get invoice by ID:", { invoice_id, company_id });
      
      if (!invoice_id) {
        return res.status(400).json({
          status: false,
          code: 400,
          message: "invoice_id is required.",
          data: null,
        });
      }
      
      // If company_id is provided, it ensures the invoice belongs to that company
      const result = await getInvoiceById(invoice_id, company_id);
      return res.status(result.code).json(result);
    } catch (error) {
      console.error("Error in getInvoiceById controller:", error);
      return res.status(500).json({
        status: false,
        code: 500,
        message: "Error retrieving invoice.",
        data: null,
      });
    }
  }

  static async removeEmployee(req, res) {
    try {
      // Check user role
      const { role_id } = req.user;
      
      if (role_id !== 1 && role_id !== 2) {
        return res.status(403).json({
          status: false,
          code: 403,
          message: "Access denied. Only Super Admin and Company Admin can remove employees",
          data: null,
        });
      }

      const { company_id, user_id, user_ids } = req.body;
      
      // Handle both single user_id and array of user_ids
      const employeeIds = user_ids ? user_ids : (user_id ? [user_id] : []);
      
      console.log("Received request to remove employees:", { 
        company_id, 
        employee_count: employeeIds.length 
      });
      
      if (!company_id) {
        return res.status(400).json({
          status: false,
          code: 400,
          message: "company_id is required.",
          data: null,
        });
      }
      
      if (employeeIds.length === 0) {
        return res.status(400).json({
          status: false,
          code: 400,
          message: "At least one user_id is required.",
          data: null,
        });
      }
      
      const result = await removeEmployee(company_id, employeeIds);
      return res.status(result.code).json(result);
    } catch (error) {
      console.error("Error in removeEmployee controller:", error);
      return res.status(500).json({
        status: false,
        code: 500,
        message: "Error removing employee(s).",
        data: null,
      });
    }
  }

  static async searchEmployees(req, res) {
    try {
      const { company_id, search_term } = req.query;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      
      console.log("Received employee search request:", { 
        company_id, 
        search_term,
        page,
        limit
      });
      
      if (!company_id) {
        return res.status(400).json({
          status: false,
          code: 400,
          message: "company_id is required.",
          data: null,
        });
      }
      
      if (!search_term) {
        return res.status(400).json({
          status: false,
          code: 400,
          message: "search_term is required.",
          data: null,
        });
      }
      
      const result = await searchEmployees(company_id, search_term, page, limit);
      return res.status(result.code).json(result);
    } catch (error) {
      console.error("Error in searchEmployees controller:", error);
      return res.status(500).json({
        status: false,
        code: 500,
        message: "Error searching employees.",
        data: null,
      });
    }
  }
  
  static async addDepartment(req, res) {
    try {
      const { role_id } = req.user; // Assuming `req.user` contains the authenticated user's details
      const { department_name } = req.body;
  
      if (role_id !== 1) {
        return res.status(403).json({
          status: false,
          code: 403,
          message: "Access denied. Only users with role_id = 1 can add departments.",
          data: null,
        });
      }
  
      if (!department_name) {
        return res.status(400).json({
          status: false,
          code: 400,
          message: "Department name is required.",
          data: null,
        });
      }
  
      const result = await addDepartment(department_name);
      return res.status(result.code).json(result);
    } catch (error) {
      console.error("Error adding department:", error);
      return res.status(500).json({
        status: false,
        code: 500,
        message: "Error adding department",
        data: null,
      });
    }
  }

  static async createCompany(req, res) {
    try {
      const { user_id, role_id } = req.user;

      const { company_name, email, company_size, department_ids, contact_person_info } = req.body;
  
      // Check if the user exists and has the correct role_id in the database
      const [user] = await db.query(
        `SELECT role_id FROM users WHERE user_id = ? AND role_id = ?`,
        [user_id, 1] 
      );

      if (!user || user.length === 0 || user[0].role_id !== 1) {
        return res.status(403).json({
          status: false,
          code: 403,
          message: "Access denied. Only admins (role_id = 1) can create companies.",
          data: null,
        });
      }
  
      // Validate the required fields
      if (!company_name || !company_size || !contact_person_info) {
        return res.status(400).json({
          status: false,
          code: 400,
          message: "company_name, contact_person_info, and company_size are required.",
          data: null,
        });
      }
  
      // Validate department_ids (must be an array if provided)
      if (department_ids && !Array.isArray(department_ids)) {
        return res.status(400).json({
          status: false,
          code: 400,
          message: "department_ids must be an array.",
          data: null,
        });
      }
  
      // Call the service to create the company
      const result = await createCompany({
        company_name,
        company_size,
        department_ids,
        contact_person_info
      });
  
      // Log the company creation with user-friendly description
      if (result.status) {
        await ActivityLogService.createLog({
          user_id: user_id,
          performed_by: 'admin',
          module_name: 'companies',
          action: 'create',
          description: `Company "${company_name}" created. Contact person: ${contact_person_info.first_name} ${contact_person_info.last_name} (${contact_person_info.email})`
        });
      }

      return res.status(result.code).json(result);
    } catch (error) {
      console.error("Error creating company:", error);
      return res.status(500).json({
        status: false,
        code: 500,
        message: "An error occurred while creating the company.",
        data: null,
      });
    }
  }

  static async getCompanyAnalytics(req, res) {
    try {
      const { company_id, startDate, endDate } = req.query;
      console.log("Received request to get company analytics:", req.query);
  
      // Validate company_id
      if (!company_id) {
        return res.status(400).json({
          status: false,
          code: 400,
          message: "company_id is required",
          data: null,
        });
      }
  
      // Set default date range to the last 7 days if dates are not provided
      const today = new Date();
      const defaultEndDate = today.toISOString().split("T")[0]; // Today's date in YYYY-MM-DD format
      const defaultStartDate = new Date(today);
      defaultStartDate.setDate(today.getDate() - 7); // 7 days ago
      const formattedStartDate = defaultStartDate.toISOString().split("T")[0];
  
      const finalStartDate = startDate || formattedStartDate;
      const finalEndDate = endDate || defaultEndDate;
  
      console.log("Using date range:", { startDate: finalStartDate, endDate: finalEndDate });
  
      const result = await getCompanyAnalytics(
        company_id,
        finalStartDate,
        finalEndDate
      );
  
      return res.status(result.code).json(result);
    } catch (error) {
      console.error("Error fetching company analytics:", error);
      return res.status(500).json({
        status: false,
        code: 500,
        message: "Error fetching company analytics",
        data: null,
      });
    }
  }

  static async getCompanyList(req, res) {
    try {
      const { page = 1, limit = 20, search = "" } = req.query;
  
      const result = await getCompanyList({
        page: parseInt(page),
        limit: parseInt(limit),
        search,
      });
  
      return res.status(result.code).json(result);
    } catch (error) {
      console.error("Error fetching company list:", error);
      return res.status(500).json({
        status: false,
        code: 500,
        message: "Error fetching company list",
        data: null,
      });
    }
  }

  static async getRetentionHistory(req, res) {
    try {
      const { company_id } = req.params;
      const months = parseInt(req.query.months) || 12;

      const result = await getRetentionHistory(company_id, months);
      return res.status(result.status ? 200 : 400).json(result);
    } catch (error) {
      console.error("Error in getRetentionHistory controller:", error);
      return res.status(500).json({
        status: false,
        message: "Error fetching retention history",
        error: error.message
      });
    }
  }

  static async getCompanyStressTrends(req, res) {
    try {
      const { company_id } = req.params;
      const months = parseInt(req.query.months) || 12;

      const result = await getCompanyStressTrends(company_id, months);
      return res.status(result.status ? 200 : 404).json(result);
    } catch (error) {
      console.error("Error in getCompanyStressTrends controller:", error);
      return res.status(500).json({
        status: false,
        message: "Error fetching company stress trends",
        error: error.message
      });
    }
  }

  static async getDeactivationRequests(req, res) {
    try {
      const { status, page = 1, limit = 10 } = req.query;
      
      // Check if user is superadmin
      if (!req.user || req.user.role_id !== 1) {
        return res.status(403).json({
          status: false,
          code: 403,
          message: "Access denied. Only superadmin can view deactivation requests.",
          data: null,
        });
      }
      
      const result = await getDeactivationRequests({
        status,
        page: parseInt(page),
        limit: parseInt(limit)
      });
      
      return res.status(result.code).json(result);
    } catch (error) {
      console.error("Error in getDeactivationRequests controller:", error);
      return res.status(500).json({
        status: false,
        code: 500,
        message: error.message,
        data: null
      });
    }
  }

  static async getDeactivatedCompanies(req, res) {
    try {
      const { page = 1, limit = 10, search = '' } = req.query;
      
      // Check if user is superadmin
      if (!req.user || req.user.role_id !== 1) {
        return res.status(403).json({
          status: false,
          code: 403,
          message: "Access denied. Only superadmin can view deactivated companies.",
          data: null,
        });
      }
      
      const result = await getDeactivatedCompanies({
        page: parseInt(page),
        limit: parseInt(limit),
        search
      });
      
      return res.status(result.code).json(result);
    } catch (error) {
      console.error("Error in getDeactivatedCompanies controller:", error);
      return res.status(500).json({
        status: false,
        code: 500,
        message: error.message,
        data: null
      });
    }
  }

  static async getFeedback(req, res) {
    try {
      const { 
        feedback_type, 
        page = 1, 
        limit = 10,
        start_date,
        end_date 
      } = req.query;

      // Validate feedback_type if provided
      if (feedback_type && !['bug', 'suggestion', 'other'].includes(feedback_type)) {
        return res.status(400).json({
          status: false,
          code: 400,
          message: "Invalid feedback type. Must be one of: bug, suggestion, other",
          data: null
        });
      }

      // Validate dates if provided
      if ((start_date && !isValidDate(start_date)) || (end_date && !isValidDate(end_date))) {
        return res.status(400).json({
          status: false,
          code: 400,
          message: "Invalid date format. Use YYYY-MM-DD",
          data: null
        });
      }

      const result = await getFeedback({
        feedback_type,
        page: parseInt(page),
        limit: parseInt(limit),
        start_date,
        end_date
      });

      return res.status(200).json(result);
    } catch (error) {
      console.error("Error in getFeedback controller:", error);
      return res.status(500).json({
        status: false,
        code: 500,
        message: "Error retrieving feedback",
        data: null
      });
    }
  }
  
}

module.exports = CompanyController;
