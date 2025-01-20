const {
  registerCompany,
  getCompanyById,
  updateCompany,
  getTopPerformingEmployee,
  getCompanyEmployees,
  getQna
} = require ('../../services/company/companyService');

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
      const { company, contact_person } = req.body;

      if (!company || !company.id) {
        return res.status(400).json({
          status: false,
          code: 400,
          message: "Company data is required",
          data: null
        });
      }

      const result = await updateCompany(company, contact_person);
      res.status(200).json(result);
    } catch (error) {
      console.error(error);
      res.status(500).json({
        status: false,
        code: 500,
        message: "An error occurred while updating company information",
        data: null
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
          data: null
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
        data: null
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
          data: null
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
        data: null
      });
    }
  }

  static async getQna(req, res) {
    try {
      const qnaData = await getQna();
      return res.status(200).json({ data: qnaData });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Error fetching Q&A', error: error.message });
    }
  }

}

module.exports = CompanyController;
