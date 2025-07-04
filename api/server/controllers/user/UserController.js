const UserServices = require("../../services/user/UserServices");
const { uploadImage } = require("../upload/UploadController");
const ActivityLogService = require("../../services/logs/ActivityLogService");
const db = require('../../../config/db');
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
  updateDashboardTourStatus,
  getSuperadmins
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
      const result = await login(req.body);
      // console.log("Login result:", result);
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
      console.log("Received password change request:", req.body);

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
        console.log("New password does not meet complexity requirements");
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

  static async forgotPassword(req, res) {
    try {
      const { email } = req.body;
      console.log("Received forgot password request for email:", email);

      if (!email) {
        return res.status(400).json({
          status: false,
          code: 400,
          message: "Email is required.",
          data: null,
        });
      }

      const result = await UserServices.requestPasswordReset(email);
      return res.status(result.code).json(result);
    } catch (error) {
      console.error("Error in forgotPassword controller:", error);
      return res.status(500).json({
        status: false,
        code: 500,
        message: "Error processing password reset request.",
        data: null,
      });
    }
  }

  static async resetPassword(req, res) {
    try {
      const { token, new_password } = req.body;
      console.log("received payload", new_password)
      console.log("Received password reset request with token");

      if (!token || !new_password) {
        return res.status(400).json({
          status: false,
          code: 400,
          message: "Reset token and new password are required.",
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

      // More complex password validation
      const passwordRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
      if (!passwordRegex.test(new_password)) {
        console.log("New password does not meet complexity requirements");
        return res.status(400).json({
          status: false,
          code: 400,
          message:
            "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.",
          data: null,
        });
      }

      const result = await UserServices.resetPassword(token, new_password);
      return res.status(result.code).json(result);
    } catch (error) {
      console.error("Error in resetPassword controller:", error);
      return res.status(500).json({
        status: false,
        code: 500,
        message: "Error resetting password.",
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
      let imageUrl = null;

      console.log("Received request to update user details:", userDetails);

      if (!user_id) {
        return res.status(400).json({
          status: false,
          code: 400,
          message: "user_id is required.",
          data: null,
        });
      }

      // Handle image upload if file is present
      if (req.file) {
        req.body.type = 'profile'; // Set type for profile image
        const uploadResult = await uploadImage(req);
        if (!uploadResult.success) {
          return res.status(500).json({
            status: false,
            code: 500,
            message: "Error uploading profile image",
            data: null,
          });
        }
        imageUrl = uploadResult.url;
        userDetails.profile_url = imageUrl; 
        console.log("Image URL added to user details:", imageUrl);
      }

      console.log("Updated user details before sending to service:", userDetails);

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
      const { user_id, company_id, stress_level, stress_message, last_stress_modal_seen_at } = req.body;

      console.log("Received stress level update request:", {
        user_id,
        company_id,
        stress_level,
        stress_message,
        last_stress_modal_seen_at
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
        stress_message,
        last_stress_modal_seen_at
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

  static async updateDashboardTourStatus(req, res) {
    try {
      const { user_id } = req.body;

      if (!user_id) {
        return res.status(400).json({
          status: false,
          code: 400,
          message: "user_id is required",
          data: null,
        });
      }

      const result = await updateDashboardTourStatus(user_id);
      return res.status(result.code).json(result);
    } catch (error) {
      console.error("Error in updateDashboardTourStatus controller:", error);
      return res.status(500).json({
        status: false,
        code: 500,
        message: "Error updating dashboard tour status",
        data: null,
      });
    }
  }

  static async submitPSI(req, res) {
    console.log("Received PSI submission request:", req.body);
    try {
      const { user_id, company_id, psi_score } = req.body;

      // Validate required fields
      if (!user_id || !company_id || psi_score === undefined) {
        return res.status(400).json({
          status: false,
          code: 400,
          message: "user_id, company_id, and psi_score are required",
          data: null,
        });
      }

      // Validate PSI score range (1-5)
      if (psi_score < 1 || psi_score > 5) {
        return res.status(400).json({
          status: false,
          code: 400,
          message: "PSI score must be between 1 and 5",
          data: null,
        });
      }

      const result = await UserServices.submitPSI(user_id, company_id, psi_score);
      return res.status(result.code).json(result);
    } catch (error) {
      console.error("Error in submitPSI controller:", error);
      return res.status(500).json({
        status: false,
        code: 500,
        message: "Error submitting PSI score",
        data: null,
      });
    }
  }

  static async updateTermsAcceptance(req, res) {
    try {
      const { user_id } = req.user; // Get user_id from the authenticated token
      const { accepted_terms } = req.body;

      if (accepted_terms === undefined) {
        return res.status(400).json({
          status: false,
          code: 400,
          message: "accepted_terms field is required",
          data: null,
        });
      }

      const result = await UserServices.updateTermsAcceptance(user_id, accepted_terms);
      return res.status(result.code).json(result);
    } catch (error) {
      console.error("Error in updateTermsAcceptance controller:", error);
      return res.status(500).json({
        status: false,
        code: 500,
        message: "Error updating terms acceptance status",
        data: null,
      });
    }
  }

  static async getSuperadmins(req, res) {
    try {
      // Check if user is authorized (only superadmins can see other superadmins)
      const { role_id } = req.user;
      if (role_id !== 1) {
        return res.status(403).json({
          status: false,
          code: 403,
          message: "Access denied. Only superadmins can view this information",
          data: null,
        });
      }

      const result = await getSuperadmins();
      return res.status(result.code).json(result);
    } catch (error) {
      console.error("Error fetching superadmins:", error);
      return res.status(500).json({
        status: false,
        code: 500,
        message: "An error occurred while fetching superadmins",
        data: null,
      });
    }
  }

  static async createSuperadmin(req, res) {
    try {
      // Check if user is authorized (only superadmins can create other superadmins)
      const { role_id, user_id } = req.user;
      if (role_id !== 1) {
        return res.status(403).json({
          status: false,
          code: 403,
          message: "Access denied. Only superadmins can create new superadmins",
          data: null,
        });
      }

      const superadminData = req.body;

      // Validate required fields
      const requiredFields = [
        "first_name",
        "last_name",
        "email",
        "phone",
        "gender"
      ];

      const missingFields = requiredFields.filter(
        (field) => !superadminData[field]
      );

      if (missingFields.length > 0) {
        return res.status(400).json({
          status: false,
          code: 400,
          message: `Missing required fields: ${missingFields.join(", ")}`,
          data: null,
        });
      }

      const result = await UserServices.createSuperadmin(superadminData);
      
      // Log the superadmin creation
      if (result.status) {
        try {
          // Get user details for the log
          const [userDetails] = await db.query(
            `SELECT first_name, last_name FROM users WHERE user_id = ?`,
            [user_id]
          );
          
          const performedBy = userDetails && userDetails.length > 0 
            ? `${userDetails[0].first_name} ${userDetails[0].last_name}`
            : `User ID: ${user_id}`;
            
          await ActivityLogService.createLog({
            user_id: user_id,
            performed_by: performedBy,
            module_name: 'users',
            action: 'create',
            description: `Superadmin "${superadminData.first_name} ${superadminData.last_name}" (${superadminData.email}) created`
          });
        } catch (logError) {
          console.error("Error creating activity log:", logError);
          // Continue with the response even if logging fails
        }
      }
      
      return res.status(201).json(result);
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        status: false,
        code: 500,
        message: "Error creating superadmin",
        data: null,
      });
    }
  }

  static async updateFirstAssessmentCompleted(req, res) {
    try {
      const { user_id } = req.user; // Get user_id from the authenticated token

      const result = await UserServices.updateFirstAssessmentCompleted(user_id);
      return res.status(result.code).json(result);
    } catch (error) {
      console.error("Error in updateFirstAssessmentCompleted controller:", error);
      return res.status(500).json({
        status: false,
        code: 500,
        message: "Error updating first assessment completion status",
        data: null,
      });
    }
  }

  static async deleteSuperadmin(req, res) {
    try {
      const { superadminId } = req.params;
      const { role_id, user_id } = req.user;
      
      // Only superadmins can delete other superadmins
      if (role_id !== 1) {
        return res.status(403).json({
          status: false,
          code: 403,
          message: "Access denied. Only superadmins can delete superadmins",
          data: null,
        });
      }
      
      if (!superadminId) {
        return res.status(400).json({
          status: false,
          code: 400,
          message: "Superadmin ID is required",
          data: null,
        });
      }
      
      // Prevent self-deletion
      if (superadminId == user_id) {
        return res.status(400).json({
          status: false,
          code: 400,
          message: "You cannot delete your own account",
          data: null,
        });
      }
      
      // Get superadmin details before deletion for logging
      const [superadminDetails] = await db.query(
        `SELECT first_name, last_name, email FROM users WHERE user_id = ? AND role_id = 1`,
        [superadminId]
      );
      
      if (!superadminDetails || superadminDetails.length === 0) {
        return res.status(404).json({
          status: false,
          code: 404,
          message: "Superadmin not found",
          data: null,
        });
      }
      
      const result = await UserServices.deleteSuperadmin(superadminId);
      
      // Log the superadmin deletion
      if (result.status) {
        try {
          // Get user details for the log
          const [userDetails] = await db.query(
            `SELECT first_name, last_name FROM users WHERE user_id = ?`,
            [user_id]
          );
          
          const performedBy = userDetails && userDetails.length > 0 
            ? `${userDetails[0].first_name} ${userDetails[0].last_name}`
            : `User ID: ${user_id}`;
            
          await ActivityLogService.createLog({
            user_id: user_id,
            performed_by: performedBy,
            module_name: 'users',
            action: 'delete',
            description: `Superadmin "${superadminDetails[0].first_name} ${superadminDetails[0].last_name}" (${superadminDetails[0].email}) permanently deleted`
          });
        } catch (logError) {
          console.error("Error creating activity log:", logError);
          // Continue with the response even if logging fails
        }
      }
      
      return res.status(result.code).json(result);
    } catch (error) {
      console.error("Error in deleteSuperadmin controller:", error);
      return res.status(500).json({
        status: false,
        code: 500,
        message: error.message,
        data: null,
      });
    }
  }
}

module.exports = UserController;
