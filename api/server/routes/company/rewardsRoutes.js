const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authorization } = require("../../../auth/tokenValidator.js");

const {
  createReward,
  getAllRewards,
  getRewardById,
  updateReward,
  deleteReward
} = require("../../controllers/company/rewardsController.js");

// Configure multer for icon uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

router.post("/createReward", authorization, upload.single('icon'), createReward);
router.get("/getAllRewards", authorization, getAllRewards);
router.get("/:id", authorization, getRewardById);
router.put("/:id", authorization, upload.single('icon'), updateReward);
router.delete("/:id", authorization, deleteReward);

module.exports = router;
