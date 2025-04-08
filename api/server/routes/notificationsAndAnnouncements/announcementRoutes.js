const express = require("express");
const router = express.Router();
const { authorization } = require("../../../auth/tokenValidator");
const AnnouncementController = require("../../controllers/notificationsAndAnnouncements/announcementController");

// Create a new announcement
router.post("/create", authorization, AnnouncementController.createAnnouncement);

// Get announcements
router.get("/list", authorization, AnnouncementController.getAnnouncements);

// Update an announcement
router.put("/update", authorization, AnnouncementController.updateAnnouncement);

// Delete an announcement
router.delete("/delete/:id", authorization, AnnouncementController.deleteAnnouncement);

module.exports = router;