const express = require("express");
const multer = require("multer");
const MediaController = require("../../controllers/upload/UploadController.js");
const { uploadImage, deleteImage, uploadSound, deleteSound, uploadGalleryFile, deleteGalleryFile } = MediaController;
const tokenValidator = require("../../../auth/tokenValidator.js");
const { authorization } = tokenValidator;
const router = express.Router();

// Multer configurations
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

const soundUpload = multer({
  dest: "temp/",
  limits: { fieldSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ['audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/aac'];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only MP3, M4A, WAV and AAC files are allowed!'));
    }
  }
});

const galleryUpload = multer({
  dest: "temp/",
  limits: { fieldSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      // Images
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      // Videos
      'video/mp4', 'video/webm', 'video/quicktime',
      // Documents
      'application/pdf',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type!'));
    }
  }
});

// Image upload routes
router.post(
  "/icon",
  imageUpload.single("file"),
  authorization,
  uploadImage
);

router.post(
  "/article",
  imageUpload.single("file"),
  authorization,
  uploadImage
);

router.post(
  "/workshop",
  imageUpload.single("file"),
  authorization,
  uploadImage
);

router.post(
  "/profile",
  imageUpload.single("file"),
  authorization,
  uploadImage
);

// Sound upload routes
router.post(
  "/sound",
  soundUpload.single("file"),
  authorization,
  uploadSound
);

// Gallery routes
router.post(
  "/gallery",
  galleryUpload.single("file"),
  authorization,
  uploadGalleryFile
);

// Delete routes
router.post("/galleryDeleteFile", authorization, deleteGalleryFile);
router.post("/deleteImage", authorization, deleteImage);
router.post("/deleteSound", authorization, deleteSound);


module.exports = router;