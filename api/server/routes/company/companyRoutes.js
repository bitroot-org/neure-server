const express = require('express');
const router = express.Router();
const tokenValidator = require('../../../auth/tokenValidator.js');
const { authorization } = tokenValidator;


const { registerCompany, getCompanyById, updateCompany } = require('../../controllers/company/companyController.js');


// POST route for company registration
router.post('/registerCompany', authorization, registerCompany);
router.get('/getCompanyInfo', authorization, getCompanyById);
router.put('/updateCompany', authorization, updateCompany);

module.exports = router;
