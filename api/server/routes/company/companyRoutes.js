const express = require('express');
const router = express.Router();
const tokenValidator = require('../../../auth/tokenValidator.js');
const { authorization } = tokenValidator;



const { registerCompany, getCompanyById, updateCompany, getTopPerformingEmployee, getCompanyEmployees ,getQna, getAllCompanies} = require('../../controllers/company/companyController.js');



router.post('/registerCompany', authorization, registerCompany);
router.get('/getCompanyInfo', authorization, getCompanyById);
router.get('/getAllCompanies', authorization, getAllCompanies);
router.put('/updateCompanyInfo', authorization, updateCompany);
router.get('/getTopPerformingEmployee', authorization, getTopPerformingEmployee);
router.get('/getCompanyEmployees', authorization, getCompanyEmployees);
router.get('/getQna', authorization, getQna);

module.exports = router;
