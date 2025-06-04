const express = require("express");
const multer = require("multer");
const {
  register,
  login,
  logout,
  getTherapists,
  createTherapist,
  changePassword,
  getUserDetails,
  updateUserDetails,
  getUserWorkshops,
  getEmployeeRewards,
  claimReward,
  getUserSubscription,
  updateUserSubscription,
  updateUserStressLevel,
  updateTherapist,
  deleteTherapist,
  updateDashboardTourStatus,
  submitPSI,
  updateTermsAcceptance,
  getSuperadmins,
  createSuperadmin,
  updateFirstAssessmentCompleted
} = require("../../controllers/user/UserController.js");
const {
  refreshToken,
} = require("../../controllers/user/RefreshTokenController.js");
const { authorization } = require("../../../auth/tokenValidator.js");

// Configure multer for profile image uploads
const imageUpload = multer({
  dest: "temp/",
  limits: { fieldSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, PNG, GIF and WEBP files are allowed!'));
    }
  }
});

const router = express.Router();

router.post("/register", register);
router.get("/getTherapists", authorization, getTherapists);
router.post("/createTherapist", authorization, createTherapist);
router.post("/login", login);
router.post("/logout", authorization, logout);
router.post("/refresh-token", refreshToken);
router.post("/changePassword", authorization, changePassword);
router.get("/getUserDetails", authorization, getUserDetails);
router.put("/updateUserDetails", authorization, imageUpload.single("file"), updateUserDetails);
router.get("/getUserWorkshops", authorization, getUserWorkshops);
router.get("/getEmployeeRewards", authorization, getEmployeeRewards);
router.post("/claimReward", authorization, claimReward); 
router.get("/getUserSubscription", authorization, getUserSubscription);
router.put("/updateUserSubscription", authorization, updateUserSubscription); 
router.post("/updateStressLevel", authorization, updateUserStressLevel);
router.put("/updateTherapist/:therapistId", authorization, updateTherapist);
router.delete("/deleteTherapist/:therapistId", authorization, deleteTherapist);
router.put("/updateDashboardTourStatus", authorization, updateDashboardTourStatus);
router.post("/submitPSI", authorization, submitPSI);
router.put("/updateTermsAcceptance", authorization, updateTermsAcceptance);
router.get("/getSuperadmins", authorization, getSuperadmins);
router.post("/createSuperadmin", authorization, createSuperadmin);
router.put("/updateFirstAssessmentCompleted", authorization, updateFirstAssessmentCompleted);

module.exports = router;
