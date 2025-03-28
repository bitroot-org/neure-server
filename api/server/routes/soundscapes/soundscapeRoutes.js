const express = require("express");
const multer = require("multer");
const { authorization } = require("../../../auth/tokenValidator");
const {
  getSoundscapes,
  getSoundscapeById,
  createSoundscape,
  deleteSoundscape
} = require("../../controllers/soundscapes/soundscapeController");

const router = express.Router();

// Multer configuration for handling form-data
const upload = multer({
  dest: "temp/",
  limits: { fieldSize: 50 * 1024 * 1024 }, // 50 MB limit
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "audio/mpeg",
      "audio/wav",
      "audio/mp4",
      "audio/mp3",
    ];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Unsupported file type!"));
    }
  },
});

router.get("/getSoundscapes", authorization, getSoundscapes);
router.get("/soundscapes/:soundscapeId", getSoundscapeById);
router.post(
  "/createSoundscape",
  authorization,
  upload.fields([
    { name: "coverImage", maxCount: 1 },
    { name: "audio", maxCount: 1 },
  ]),
  createSoundscape
);

router.delete("/deleteSoundscape", authorization, deleteSoundscape);

module.exports = router;
