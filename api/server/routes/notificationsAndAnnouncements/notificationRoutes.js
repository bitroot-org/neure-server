const express = require('express');
const router = express.Router();
const { authorization } = require('../../../auth/tokenValidator.js');
const NotificationController = require('../../controllers/notificationsAndAnnouncements/notificationController.js');

router.post('/create', authorization, NotificationController.createNotification);
router.get('/list', authorization, NotificationController.getNotifications);
router.put('/update', authorization, NotificationController.updateNotification);
router.delete('/delete/:id', authorization, NotificationController.deleteNotification);

// Add new routes for read status
router.post('/mark-read', authorization, NotificationController.markAsRead);
router.post('/mark-all-read', authorization, NotificationController.markAllAsRead);

module.exports = router;
