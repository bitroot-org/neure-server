const companyService = require("../../services/company/companyService");

const registerCompany = async (req, res) => {
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
    const newCompany = await companyService.registerCompany(
      companyName,
      emailDomain
    );
    res
      .status(201)
      .json({ message: "Company registered successfully!", data: newCompany });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: false,
      code: 500,
      message: "An error occurred while registering the company.",
      data: null,
    });
  }
};

const getCompanyById = async (req, res) => {

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
    const company = await companyService.getCompanyById(company_id);
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
};

const updateCompany = async (req, res) => {
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

    const result = await companyService.updateCompany(company, contact_person);
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
};

const getCompanyEmployees = async (req, res) => {
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

    const result = await companyService.getCompanyEmployees(company_id, page, limit);
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
};

module.exports = { registerCompany, getCompanyById, updateCompany, getCompanyEmployees };
