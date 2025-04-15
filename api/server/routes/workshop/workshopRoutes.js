const express = require('express');
const router = express.Router();
const { authorization } = require("../../../auth/tokenValidator.js");
const { getWorkshopPdfUrl } = require('../../controllers/workshop/workshopController');

// ... other routes ...

router.get('/pdf/:workshopId/:employeeId', authorization, getWorkshopPdfUrl);

module.exports = router;