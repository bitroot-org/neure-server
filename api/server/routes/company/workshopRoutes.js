const express = require('express');
const router = express.Router();
const { authorization } = require('../../../auth/tokenValidator.js');

const { 
  getWorkshopDetails, 
  getWorkshopsByCompanyId,
  getWorkshopDates 
} = require('../../controllers/company/workshopController.js');


router.get('/getWorkshopDetails', authorization, getWorkshopDetails);
router.get('/getWorkshopsByCompanyId',authorization, getWorkshopsByCompanyId);
router.get('/getWorkshopDates', getWorkshopDates);


module.exports = router;