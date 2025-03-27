const express = require("express");
const multer = require("multer");
const { authorization } = require("../../../auth/tokenValidator.js");
const {
  getGalleryItems,
  getGalleryItemById,
  getMediaCounts,
  uploadGalleryItem,
  updateGalleryItem,
} = require("../../controllers/gallery/galleryController");

const router = express.Router();

// Multer configuration for file uploads
const galleryUpload = multer({
  dest: "temp/",
  limits: { fieldSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "video/mp4",
      "video/webm",
      "application/pdf",
      "application/msword", // .doc
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
      "application/vnd.ms-powerpoint", // .ppt
      "application/vnd.openxmlformats-officedocument.presentationml.presentation", // .pptx
    ];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Unsupported file type!"));
    }
  },
});

router.get("/getGalleryItems", authorization, getGalleryItems);
router.get("/getGalleryItems/:itemId", authorization, getGalleryItemById);
router.get("/getMediaCounts", authorization, getMediaCounts);
router.post(
  "/uploadGalleryItem",
  authorization,
  galleryUpload.single("file"),
  uploadGalleryItem
);
router.put(
  "/updateGalleryItem",
  authorization,
  galleryUpload.single("file"),
  updateGalleryItem
);

module.exports = router;
