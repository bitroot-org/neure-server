const express = require('express');
const router = express.Router();
const { authorization } = require('../../../auth/tokenValidator.js');

const {
    getNotificationAndAnnouncements
} = require('../../controllers/notifications/notificationController.js');


router.get('/getNotificationAndAnnouncements', authorization, getNotificationAndAnnouncements);


module.exports = router;