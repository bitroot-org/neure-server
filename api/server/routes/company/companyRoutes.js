const express = require('express');
const router = express.Router();
const tokenValidator = require('../../../auth/tokenValidator.js');
const { authorization } = tokenValidator;


const { registerCompany, getCompanyById, updateCompany, getCompanyEmployees } = require('../../controllers/company/companyController.js');


// POST route for company registration
router.post('/registerCompany', authorization, registerCompany);
router.get('/getCompanyInfo', authorization, getCompanyById);
router.put('/updateCompanyInfo', authorization, updateCompany);
router.get('/getCompanyEmployees', authorization, getCompanyEmployees);

module.exports = router;
