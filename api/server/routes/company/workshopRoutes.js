const express = require('express');
const router = express.Router();
const { authorization } = require('../../../auth/tokenValidator.js');

const { 
  getWorkshopDetails, 
  getWorkshopsByCompanyIdOrUserId,
  getWorkshopDatesByCompanyIdOrUserId 
} = require('../../controllers/company/workshopController.js');


router.get('/getWorkshopDetails', authorization, getWorkshopDetails);
router.get('/getWorkshopsByCompanyIdOrUserId', authorization, getWorkshopsByCompanyIdOrUserId);
router.get('/getWorkshopDatesByCompanyIdOrUserId', authorization, getWorkshopDatesByCompanyIdOrUserId);


module.exports = router;