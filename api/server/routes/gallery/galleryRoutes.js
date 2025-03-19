const express = require("express");
const { authorization } = require("../../../auth/tokenValidator.js");
const {
  getGalleryItems,
  getGalleryItemById,
} = require("../../controllers/gallery/galleryController");

const router = express.Router();

// Get gallery items by type (image, video, document)
router.get("/getGalleryItems", authorization, getGalleryItems);

// Get specific gallery item by ID
router.get("/getGalleryItems/:itemId", authorization, getGalleryItemById);

module.exports = router;
