const express = require('express');
const router = express.Router();
const { authorization } = require('../../../auth/tokenValidator.js');

const { 
  getWorkshopDetails, 
  getWorkshopsByCompanyIdOrUserId,
  getWorkshopDatesByCompanyIdOrUserId,
  getAllWorkshops,
  updateWorkshop,
  deleteWorkshop,
  createWorkshop,
  getAllWorkshopSchedules,
  scheduleWorkshop,
  cancelWorkshopSchedule,
  rescheduleWorkshop
} = require('../../controllers/company/workshopController.js');


router.get('/getWorkshopDetails', authorization, getWorkshopDetails);
router.get('/getWorkshopsByCompanyIdOrUserId', authorization, getWorkshopsByCompanyIdOrUserId);
router.get('/getWorkshopDatesByCompanyIdOrUserId', authorization, getWorkshopDatesByCompanyIdOrUserId);

// Fetch all workshops
router.get('/getAllWorkshops', authorization, getAllWorkshops);

// Update a workshop
router.put('/updateWorkshop', authorization, updateWorkshop);

// Delete a workshop
router.delete('/deleteWorkshop', authorization, deleteWorkshop);

// Create a workshop
router.post('/createWorkshop', authorization, createWorkshop);

router.get('/getAllWorkshopSchedules', authorization, getAllWorkshopSchedules);

router.post('/scheduleWorkshop', authorization, scheduleWorkshop);

router.put('/cancelWorkshopSchedule', authorization, cancelWorkshopSchedule);
router.put('/rescheduleWorkshop', authorization, rescheduleWorkshop);

module.exports = router;