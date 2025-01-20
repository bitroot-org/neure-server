const UserServices = require("../../services/user/UserServices");

class UserController {
  static async register(req, res) {
    try {
      const result = await UserServices.register(req.body);
      return res.status(result.code).json(result);
    } catch (error) {
      return res.status(400).json({
        status: false,
        code: 400,
        message: error.message,
        data: null,
      });
    }
  }

  static async login(req, res) {
    try {
      console.log("Login request:", req.body);
      const result = await UserServices.login(req.body);
      return res.status(result.code).json(result);
    } catch (error) {
      return res.status(401).json({
        status: false,
        code: 401,
        message: error.message,
        data: null,
      });
    }
  }

  static async logout(req, res) {
    try {
      // Token format: "Bearer <token>"
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        throw new Error('No authorization header');
      }

      const token = authHeader.split(' ')[1]; 
      console.log("Extracted token:", token);

      const result = await UserServices.logout(token);
      return res.status(result.code).json(result);
    } catch (error) {
      console.error("Logout error:", error.message);
      return res.status(400).json({
        status: false,
        code: 400,
        message: error.message,
        data: null,
      });
    }
  }
}

module.exports = UserController;
