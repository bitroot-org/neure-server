const express = require("express");
const router = express.Router();
const tokenValidator = require("../../../auth/tokenValidator.js");
const { authorization } = tokenValidator;
const multer = require("multer");
const upload = multer({ dest: "uploads/" });
const { generateWellbeingReport } = require('../../controllers/company/reportController');

const {
  registerCompany,
  getCompanyInfo,
  updateCompany,
  getTopPerformingEmployee,
  getCompanyEmployees,
  getQna,
  getAllCompanies,
  getCompanyMetrics,
  createEmployee,
  bulkCreateEmployees,
  getDepartments,
  assignReward,
  getEmployeeRewardHistory,
  createFeedback,
  updateCompanySubscription,
  getCompanySubscription,
  requestDeactivation,
  processDeactivationRequest,
  getCompanyInvoices,
  getInvoiceById,
  removeEmployee,
  searchEmployees,
  addDepartment,
  createCompany,
  getCompanyAnalytics,
  getCompanyList,
  getRetentionHistory,
  getCompanyStressTrends,
  getDeactivationRequests,
  getDeactivatedCompanies,
  getFeedback,
} = require("../../controllers/company/companyController.js");
const { validate } = require("node-cron");

router.post("/registerCompany", authorization, registerCompany);
router.get("/getAllCompanies", authorization, getAllCompanies);
router.put("/updateCompanyInfo", authorization, updateCompany);
router.get(
  "/getTopPerformingEmployee",
  authorization,
  getTopPerformingEmployee
);
router.get("/getCompanyEmployees", authorization, getCompanyEmployees);
router.get("/getCompanyInfo", authorization, getCompanyInfo);
router.get("/getQna", authorization, getQna);
router.get("/getCompanyMetrics", authorization, getCompanyMetrics);
router.post("/createEmployee", authorization, createEmployee);
router.post(
  "/bulkCreateEmployees",
  authorization,
  upload.single("file"),
  bulkCreateEmployees
);
router.get("/getDepartments", authorization, getDepartments);
router.post("/assignReward", authorization, assignReward);
router.get(
  "/getEmployeeRewardHistory",
  authorization,
  getEmployeeRewardHistory
);
router.post("/createFeedback", authorization, createFeedback);
router.get("/getFeedback", authorization, getFeedback);

router.put(
  "/updateCompanySubscription",
  authorization,
  updateCompanySubscription
);
router.get("/getCompanySubscription", authorization, getCompanySubscription);
router.post("/requestDeactivation", authorization, requestDeactivation);
router.post(
  "/processDeactivationRequest",
  authorization,
  processDeactivationRequest
);
router.get("/getCompanyInvoices", authorization, getCompanyInvoices);
router.get("/getInvoiceById", authorization, getInvoiceById);
router.delete("/removeEmployee", authorization, removeEmployee);
router.get("/searchEmployees", authorization, searchEmployees);

router.post("/addDepartment", authorization, addDepartment);
router.post("/createCompany", authorization, createCompany);
router.get("/analytics", authorization, getCompanyAnalytics);
router.get("/getCompanyList", authorization, getCompanyList);
router.get(
  "/retention-history/:company_id",
  authorization,
  getRetentionHistory
);

router.get("/stress-trends/:company_id", authorization, getCompanyStressTrends);

router.get("/deactivationRequests", authorization, getDeactivationRequests);

router.get("/deactivatedCompanies", authorization, getDeactivatedCompanies);

router.get('/reports/wellbeing/:company_id', authorization, generateWellbeingReport);

module.exports = router;
