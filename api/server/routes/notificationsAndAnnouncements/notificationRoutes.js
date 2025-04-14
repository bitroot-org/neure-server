const express = require('express');
const router = express.Router();
const { authorization } = require('../../../auth/tokenValidator.js');
const NotificationController = require('../../controllers/notificationsAndAnnouncements/notificationController.js');

router.post('/create', authorization, NotificationController.createNotification);
router.get('/list', authorization, NotificationController.getNotifications);
router.put('/update', authorization, NotificationController.updateNotification);
router.delete('/delete/:id', authorization, NotificationController.deleteNotification);

module.exports = router;
