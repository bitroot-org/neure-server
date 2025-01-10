const express = require('express');
const router = express.Router();
const { authorization } = require('../../../auth/tokenValidator.js');

const { getWorkshopDetails } = require('../../controllers/company/workshopController.js');


router.post('/getWorkshopDetails', authorization, getWorkshopDetails);

module.exports = router;