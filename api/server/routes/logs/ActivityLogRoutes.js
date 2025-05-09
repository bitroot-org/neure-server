const express = require('express');
const { authorization } = require('../../../auth/tokenValidator');
const {
  createLog,
  getLogs,
  getActivitySummary
} = require('../../controllers/logs/ActivityLogController');

const router = express.Router();

// Create activity log
router.post('/create', authorization, createLog);

// Get activity logs with filtering and pagination
router.get('/list', authorization, getLogs);

// Get activity summary by module
router.get('/summary', authorization, getActivitySummary);

module.exports = router;