const express = require("express");
const router = express.Router();
const tokenValidator = require("../../../auth/tokenValidator.js");
const { authorization } = tokenValidator;
const multer = require("multer");
const upload = multer({ dest: "uploads/" });

const {
  registerCompany,
  getCompanyById,
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
  getInvoiceById
} = require("../../controllers/company/companyController.js");
const { validate } = require("node-cron");

router.post("/registerCompany", authorization, registerCompany);
router.get("/getCompanyInfo", authorization, getCompanyById);
router.get("/getAllCompanies", authorization, getAllCompanies);
router.put("/updateCompanyInfo", authorization, updateCompany);
router.get(
  "/getTopPerformingEmployee",
  authorization,
  getTopPerformingEmployee
);
router.get("/getCompanyEmployees", authorization, getCompanyEmployees);
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
router.post("/assignReward",authorization, assignReward);
router.get("/getEmployeeRewardHistory", authorization, getEmployeeRewardHistory);
router.post("/createFeedback", authorization, createFeedback);
router.put("/updateCompanySubscription", authorization, updateCompanySubscription);
router.get("/getCompanySubscription", authorization, getCompanySubscription);
router.post("/requestDeactivation", authorization, requestDeactivation);
router.post("/processDeactivationRequest", authorization, processDeactivationRequest);
router.get("/getCompanyInvoices", authorization, getCompanyInvoices);
router.get("/getInvoiceById", authorization, getInvoiceById);


module.exports = router;
