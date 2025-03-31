const express = require("express");
const { authorization } = require("../../../auth/tokenValidator");
const { getAnalytics } = require("../../controllers/analytics/analyticsController");

const router = express.Router();

router.get("/trends", authorization, getAnalytics);

module.exports = router;