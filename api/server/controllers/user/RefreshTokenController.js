const UserServices = require('../../services/user/UserServices');

class RefreshTokenController {
  static async refreshToken(req, res) {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          status: false,
          code: 401,
          message: 'Invalid authorization header format',
          data: null
        });
      }

      const refreshToken = authHeader.split(' ')[1];
      const result = await UserServices.refreshToken(refreshToken);
      return res.status(result.code).json(result);
    } catch (error) {
      return res.status(401).json({
        status: false,
        code: 401,
        message: error.message,
        data: null
      });
    }
  }
}

module.exports = RefreshTokenController;