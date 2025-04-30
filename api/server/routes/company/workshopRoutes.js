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
  rescheduleWorkshop,
  getWorkshopAttendance,
  getUserWorkshopTickets,
  markAttendance,
  getWorkshopStats
} = require('../../controllers/company/workshopController.js');


router.get('/getWorkshopDetails', authorization, getWorkshopDetails);
router.get('/getWorkshopsByCompanyIdOrUserId', authorization, getWorkshopsByCompanyIdOrUserId);
router.get('/getWorkshopDatesByCompanyIdOrUserId', authorization, getWorkshopDatesByCompanyIdOrUserId);

// Fetch all workshops
router.get('/getAllWorkshops', authorization, getAllWorkshops);

// Update a workshop
router.put('/updateWorkshop', authorization, updateWorkshop);

// Delete a workshop
router.delete('/deleteWorkshop/:id', authorization, deleteWorkshop);

// Create a workshop
router.post('/createWorkshop', authorization, createWorkshop);

router.get('/getAllWorkshopSchedules', authorization, getAllWorkshopSchedules);

router.post('/scheduleWorkshop', authorization, scheduleWorkshop);

router.put('/cancelWorkshopSchedule', authorization, cancelWorkshopSchedule);
router.put('/rescheduleWorkshop', authorization, rescheduleWorkshop);

// New attendance-related routes
router.get('/attendance/:workshopId', authorization, getWorkshopAttendance);
router.get('/tickets/:userId', authorization, getUserWorkshopTickets);
router.post('/mark-attendance', authorization, markAttendance);
router.get('/stats/:workshopId', authorization, getWorkshopStats);

module.exports = router;
