const express = require("express");
const {getSoundscapes, getSoundscapeById} = require("../../controllers/soundscapes/soundscapeController");

const router = express.Router();

router.get("/soundscapes", getSoundscapes);
router.get(
  "/soundscapes/:soundscapeId",
  getSoundscapeById
);

module.exports = router;
