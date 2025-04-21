const express = require('express');
const { authorization } = require('../../../auth/tokenValidator');
const ResourceTrackingController = require('../../controllers/tracking/resourceTrackingController');

const router = express.Router();

router.post('/trackResourceView', authorization, ResourceTrackingController.trackResourceView);
router.get('/user-history', authorization, ResourceTrackingController.getUserResourceHistory);

module.exports = router;