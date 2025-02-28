const express = require('express');
const router = express.Router();
const { authorization } = require("../../../auth/tokenValidator.js");

const {
  createReward,
  getAllRewards,
  getRewardById,
  deleteReward
} = require("../../controllers/company/rewardsController.js");



router.post("/createReward",authorization, createReward);
router.get("/getAllRewards",authorization, getAllRewards);
router.get("/:id",authorization, getRewardById);
router.delete("/:id",authorization, deleteReward);

module.exports = router;