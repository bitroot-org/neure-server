const XLSX = require("xlsx");

const {
  registerCompany,
  getCompanyById,
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
  getInvoiceById
} = require("../../services/company/companyService");

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

  static async getCompanyById(req, res) {
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
      const company = await getCompanyById(company_id);
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

      if (!company_id) {
        return res.status(400).json({
          status: false,
          code: 400,
          message: "Company ID is required",
          data: null,
        });
      }

      const result = await getTopPerformingEmployee(company_id, page, limit);
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
      const { company_id, user_id, reward_id } = req.body;
      console.log(req.body);

      if (!company_id || !user_id || !reward_id) {
        return res.status(400).json({
          status: false,
          code: 400,
          message: "company_id, user_id, and reward_id are required.",
          data: null,
        });
      }

      const id = await assignReward(company_id, user_id, reward_id);

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
      
      const result = await requestDeactivation({
        company_id,
        deactivation_reason,
        detailed_reason,
      });
      
      return res.status(result.code).json(result);
    } catch (error) {
      console.error("Error in requestDeactivation controller:", error);
      return res.status(500).json({
        status: false,
        code: 500,
        message: "Error submitting deactivation request.",
        data: null,
      });
    }
  }

  static async processDeactivationRequest(req, res) {
    try {
      const { request_id, status } = req.body;
      
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
      
      const result = await processDeactivationRequest({
        request_id,
        status
      });
      
      return res.status(result.code).json(result);
    } catch (error) {
      console.error("Error in processDeactivationRequest controller:", error);
      return res.status(500).json({
        status: false,
        code: 500,
        message: "Error processing deactivation request.",
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
}

module.exports = CompanyController;
