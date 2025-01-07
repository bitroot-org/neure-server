const express = require('express');
const router = express.Router();
const tokenValidator = require('../../auth/tokenValidator.js');
const { authorization } = tokenValidator;


const { registerCompany } = require('../controllers/companyController');


// POST route for company registration
router.post('/registerCompany', authorization, registerCompany);

module.exports = router;
