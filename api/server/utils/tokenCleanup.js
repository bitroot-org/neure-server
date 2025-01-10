const UserServices = require('../services/user/UserServices');

// Run cleanup daily
setInterval(() => {
  UserServices.cleanupExpiredTokens();
}, 24 * 60 * 60 * 1000);