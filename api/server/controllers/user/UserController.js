const UserServices = require("../../services/user/UserServices");
const {
  register,
  login,
  logout,
  getTherapists,
  createTherapist,
  changeUserPassword,
  getUserDetails,
  updateUserDetails,
  getUserWorkshops,
  getEmployeeRewards,
  claimReward,
  updateUserSubscription,
  getUserSubscription,
  updateUserStressLevel,
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

  static async updateTherapist(req, res) {
    try {
      const therapistId = req.params.therapistId;
      const updateData = req.body;
      console.log("Received update data:", updateData);

      if (!therapistId) {
        return res.status(400).json({
          status: false,
          code: 400,
          message: "Therapist ID is required",
          data: null
        });
      }

      const result = await UserServices.updateTherapist(therapistId, updateData);
      return res.status(result.code).json(result);
    } catch (error) {
      console.error("Error in updateTherapist controller:", error);
      return res.status(500).json({
        status: false,
        code: 500,
        message: error.message,
        data: null
      });
    }
  }

  static async deleteTherapist(req, res) {
    try {
      const therapistId = req.params.therapistId;
      console.log("Received therapist ID:", therapistId);

      if (!therapistId) {
        return res.status(400).json({
          status: false,
          code: 400,
          message: "Therapist ID is required",
          data: null
        });
      }

      const result = await UserServices.deleteTherapist(therapistId);
      return res.status(result.code).json(result);
    } catch (error) {
      console.error("Error in deleteTherapist controller:", error);
      return res.status(500).json({
        status: false,
        code: 500,
        message: error.message,
        data: null
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

  static async getUserDetails(req, res) {
    try {
      const user_id = req.query.user_id;
      const company_id = req.query.company_id || null;

      console.log("Received request for user details:", {
        user_id,
        company_id,
      });

      if (!user_id) {
        return res.status(400).json({
          status: false,
          code: 400,
          message: "user_id is required",
          data: null,
        });
      }

      const result = await getUserDetails(user_id, company_id);
      return res.status(result.code).json(result);
    } catch (error) {
      console.error("Error in getUserDetails controller:", error);
      return res.status(500).json({
        status: false,
        code: 500,
        message: "Error retrieving user details",
        data: null,
      });
    }
  }

  static async updateUserDetails(req, res) {
    try {
      const user_id = req.body.user_id;
      const userDetails = req.body;

      console.log("Received request to update user details:", userDetails);

      if (!user_id) {
        return res.status(400).json({
          status: false,
          code: 400,
          message: "user_id is required.",
          data: null,
        });
      }

      const result = await updateUserDetails(user_id, userDetails);
      return res.status(result.code).json(result);
    } catch (error) {
      console.error("Error in updateUserDetails controller:", error);
      return res.status(500).json({
        status: false,
        code: 500,
        message: "Error updating user details.",
        data: null,
      });
    }
  }

  static async getUserWorkshops(req, res) {
    try {
      const user_id = req.query.user_id;

      console.log("Received request to fetch workshops for user_id:", user_id);

      if (!user_id) {
        return res.status(400).json({
          status: false,
          code: 400,
          message: "user_id is required.",
          data: null,
        });
      }

      const result = await getUserWorkshops(user_id);
      return res.status(result.code).json(result);
    } catch (error) {
      console.error("Error in getUserWorkshops controller:", error);
      return res.status(500).json({
        status: false,
        code: 500,
        message: "Error retrieving workshops.",
        data: null,
      });
    }
  }

  static async getEmployeeRewards(req, res) {
    try {
      const user_id = req.query.user_id;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;

      console.log("Received request to fetch rewards for user_id:", user_id);

      if (!user_id) {
        return res.status(400).json({
          status: false,
          code: 400,
          message: "user_id is required.",
          data: null,
        });
      }

      const result = await getEmployeeRewards(user_id, page, limit);
      return res.status(result.code).json(result);
    } catch (error) {
      console.error("Error in getEmployeeRewards controller:", error);
      return res.status(500).json({
        status: false,
        code: 500,
        message: "Error retrieving rewards.",
        data: null,
      });
    }
  }

  static async claimReward(req, res) {
    try {
      const user_id = req.body.user_id;
      const reward_id = req.body.reward_id;

      console.log(
        "Received request to claim reward for user_id:",
        user_id,
        "reward_id:",
        reward_id
      );

      if (!user_id || !reward_id) {
        return res.status(400).json({
          status: false,
          code: 400,
          message: "user_id and reward_id are required.",
          data: null,
        });
      }

      const result = await claimReward(user_id, reward_id);
      return res.status(result.code).json(result);
    } catch (error) {
      console.error("Error in claimReward controller:", error);
      return res.status(500).json({
        status: false,
        code: 500,
        message: "Error claiming reward.",
        data: null,
      });
    }
  }

  static async getUserSubscription(req, res) {
    try {
      const user_id = req.query.user_id;

      console.log(
        "Received request to fetch subscription for user_id:",
        user_id
      );

      if (!user_id) {
        return res.status(400).json({
          status: false,
          code: 400,
          message: "user_id is required.",
          data: null,
        });
      }

      const result = await getUserSubscription(user_id);
      return res.status(result.code).json(result);
    } catch (error) {
      console.error("Error in getUserSubscription controller:", error);
      return res.status(500).json({
        status: false,
        code: 500,
        message: "Error retrieving subscription.",
        data: null,
      });
    }
  }

  static async updateUserSubscription(req, res) {
    try {
      const {
        user_id,
        email_notification,
        sms_notification,
        workshop_event_reminder,
        system_updates_announcement,
      } = req.body;

      console.log(
        "Received request to update subscription for user_id:",
        user_id
      );

      if (!user_id) {
        return res.status(400).json({
          status: false,
          code: 400,
          message: "user_id is required.",
          data: null,
        });
      }

      const result = await updateUserSubscription({
        user_id,
        email_notification,
        sms_notification,
        workshop_event_reminder,
        system_updates_announcement,
      });
      return res.status(result.code).json(result);
    } catch (error) {
      console.error("Error in updateUserSubscription controller:", error);
      return res.status(500).json({
        status: false,
        code: 500,
        message: "Error updating subscription.",
        data: null,
      });
    }
  }

  static async updateUserStressLevel(req, res) {
    try {
      const { user_id, company_id, stress_level, stress_message } = req.body;

      console.log("Received stress level update request:", {
        user_id,
        company_id,
        stress_level,
        stress_message,
      });

      // Validate required fields
      if (!user_id || !company_id || stress_level === undefined) {
        return res.status(400).json({
          status: false,
          code: 400,
          message: "user_id, company_id, and stress_level are required",
          data: null,
        });
      }

      const result = await updateUserStressLevel(
        user_id,
        company_id,
        stress_level,
        stress_message
      );

      return res.status(result.code).json(result);
    } catch (error) {
      console.error("Error in updateUserStressLevel controller:", error);
      return res.status(500).json({
        status: false,
        code: 500,
        message: "Error updating stress level",
        data: null,
      });
    }
  }
}

module.exports = UserController;
