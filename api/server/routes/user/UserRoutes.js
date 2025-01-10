const express = require('express');
const { register, login, logout } = require('../../controllers/user/UserController.js');
const { authorization } = require('../../../auth/tokenValidator.js');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout',authorization, logout);

module.exports = router;
