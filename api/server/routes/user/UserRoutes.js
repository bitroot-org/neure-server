const express = require('express');
const { register, login, logout } = require('../../controllers/user/UserController.js');
const { refreshToken } = require('../../controllers/user/RefreshTokenController.js');
const { authorization } = require('../../../auth/tokenValidator.js');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', authorization, logout);
router.post('/refresh-token', refreshToken);

module.exports = router;
