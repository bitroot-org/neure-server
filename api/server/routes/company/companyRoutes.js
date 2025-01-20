const express = require('express');
const router = express.Router();
const tokenValidator = require('../../../auth/tokenValidator.js');
const { authorization } = tokenValidator;



const { registerCompany, getCompanyById, updateCompany, getTopPerformingEmployee, getCompanyEmployees ,getQna} = require('../../controllers/company/companyController.js');



router.post('/registerCompany', authorization, registerCompany);
router.get('/getCompanyInfo', authorization, getCompanyById);
router.put('/updateCompanyInfo', authorization, updateCompany);
router.get('/getTopPerformingEmployee', authorization, getTopPerformingEmployee);
router.get('/getCompanyEmployees', authorization, getCompanyEmployees);
router.post('/getQna', authorization, getQna);

module.exports = router;
