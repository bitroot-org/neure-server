const express = require("express");
const { authorization } = require("../../../auth/tokenValidator.js");
const {
  getGalleryItems,
  getGalleryItemById,
  getMediaCounts
} = require("../../controllers/gallery/galleryController");

const router = express.Router();

router.get("/getGalleryItems", authorization, getGalleryItems);
router.get("/getGalleryItems/:itemId", authorization, getGalleryItemById);
router.get("/getMediaCounts", authorization, getMediaCounts);


module.exports = router;
