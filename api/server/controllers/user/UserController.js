const UserServices = require("../../services/user/UserServices");
const {
  register,
  login,
  logout,
  getTherapists,
  createTherapist,
  changeUserPassword,
} = require("../../services/user/UserServices");

class UserController {
  static async register(req, res) {
    try {
      const result = awaitregister(req.body);
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
      const result = await login(req.body);
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
        throw new Error("No authorization header");
      }

      const token = authHeader.split(" ")[1];
      console.log("Extracted token:", token);

      const result = await logout(token);
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

  static async getTherapists(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const search = req.query.search || "";

      const result = await getTherapists({ page, limit, search });
      return res.status(200).json({
        status: true,
        code: 200,
        message: "Therapists retrieved successfully",
        data: result,
      });
    } catch (error) {
      console.error("Error fetching therapists:", error);
      return res.status(500).json({
        status: false,
        code: 500,
        message: "An error occurred while fetching therapists",
        data: null,
      });
    }
  }

  static async createTherapist(req, res) {
    try {
      const therapistData = req.body;

      // Validate required fields
      const requiredFields = [
        "first_name",
        "last_name",
        "email",
        "username",
        "gender",
        "years_of_experience",
        "specialization",
        "bio",
      ];

      const missingFields = requiredFields.filter(
        (field) => !therapistData[field]
      );

      if (missingFields.length > 0) {
        return res.status(400).json({
          status: false,
          code: 400,
          message: `Missing required fields: ${missingFields.join(", ")}`,
          data: null,
        });
      }

      const result = await createTherapist(therapistData);
      return res.status(201).json(result);
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        status: false,
        code: 500,
        message: "Error creating therapist",
        data: null,
      });
    }
  }

  static async changePassword(req, res) {
    try {
      const { email, old_password, new_password } = req.body;

      console.log("Received password change request for email:", email);

      if (!email || !old_password || !new_password) {
        return res.status(400).json({
          status: false,
          code: 400,
          message: "Email, current password, and new password are required.",
          data: null,
        });
      }

      // Password strength validation
      if (new_password.length < 8) {
        return res.status(400).json({
          status: false,
          code: 400,
          message: "New password must be at least 8 characters long.",
          data: null,
        });
      }

      // More complex password validation (optional)
      const passwordRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
      if (!passwordRegex.test(new_password)) {
        return res.status(400).json({
          status: false,
          code: 400,
          message:
            "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.",
          data: null,
        });
      }

      const result = await changeUserPassword(
        email,
        old_password,
        new_password
      );
      return res.status(result.code).json(result);
    } catch (error) {
      console.error("Error in changePassword controller:", error);
      return res.status(500).json({
        status: false,
        code: 500,
        message: "Error changing password.",
        data: null,
      });
    }
  }
}

module.exports = UserController;
