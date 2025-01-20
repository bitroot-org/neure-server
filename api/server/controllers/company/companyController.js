const {
  registerCompany,
  getCompanyById,
  updateCompany,
} = require("../../services/company/companyService");

class CompanyController {
  // Register a new company
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

  // Get company details by ID
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

  // Update company details
  static async updateCompany(req, res) {
    try {
      const { company, contact_person } = req.body;

      if (!company || !company.id) {
        return res.status(400).json({
          status: false,
          code: 400,
          message: "Company data is required.",
          data: null,
        });
      }

      const result = await updateCompany(company, contact_person);
      res.status(200).json(result);
    } catch (error) {
      console.error(error);
      res.status(500).json({
        status: false,
        code: 500,
        message: "An error occurred while updating company information.",
        data: null,
      });
    }
  }
}

module.exports = CompanyController;
