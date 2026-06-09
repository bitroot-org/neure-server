const express = require("express");
const multer = require("multer");
const { authorization } = require("../../../auth/tokenValidator.js");
const {
  getGalleryItems,
  getGalleryItemById,
  getMediaCounts,
  uploadGalleryItem,
  updateGalleryItem,
  deleteGalleryItem,
  assignToCompany
} = require("../../controllers/gallery/galleryController");
const CatalogueResourceController = require("../../controllers/gallery/catalogueResourceController");

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

router.delete("/deleteGalleryItem/:itemId", authorization, deleteGalleryItem);

router.post("/assignToCompany", authorization, assignToCompany);

// ── Therapist Catalogue Resources (superadmin only) ──────────────────────────
const catalogueUpload = multer({
  dest: 'temp/',
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [
      'application/pdf',
      'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/mp4',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    cb(null, allowed.includes(file.mimetype));
  }
});

router.get('/getCatalogueResources',      authorization, CatalogueResourceController.getCatalogueResources);
router.post('/uploadCatalogueResource',   authorization, catalogueUpload.single('file'), CatalogueResourceController.uploadCatalogueResource);
router.post('/deleteCatalogueResource',   authorization, CatalogueResourceController.deleteCatalogueResource);

module.exports = router;
