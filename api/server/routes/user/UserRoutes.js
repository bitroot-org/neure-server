const express = require("express");
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
  deleteTherapist
} = require("../../controllers/user/UserController.js");
const {
  refreshToken,
} = require("../../controllers/user/RefreshTokenController.js");
const { authorization } = require("../../../auth/tokenValidator.js");

const router = express.Router();

router.post("/register", register);
router.get("/getTherapists", authorization, getTherapists);
router.post("/createTherapist", authorization, createTherapist);
router.post("/login", login);
router.post("/logout", authorization, logout);
router.post("/refresh-token", refreshToken);
router.post("/changePassword", authorization, changePassword);
router.get("/getUserDetails", authorization, getUserDetails);
router.put("/updateUserDetails", authorization, updateUserDetails);
router.get("/getUserWorkshops", authorization, getUserWorkshops);
router.get("/getEmployeeRewards", authorization, getEmployeeRewards);
router.post("/claimReward", authorization, claimReward); 
router.get("/getUserSubscription", authorization, getUserSubscription);
router.put("/updateUserSubscription", authorization, updateUserSubscription); 
router.post("/updateStressLevel", authorization, updateUserStressLevel);
router.put("/updateTherapist/:therapistId", authorization, updateTherapist);
router.delete("/deleteTherapist/:therapistId", authorization, deleteTherapist);

module.exports = router;
