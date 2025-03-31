const express = require("express");
const { authorization } = require("../../../auth/tokenValidator");
const { getDashboardMetrics } = require("../../controllers/dashboard/dashboardController");

const router = express.Router();

router.get("/metrics", authorization, getDashboardMetrics);

module.exports = router;