const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../../../config/db");
const {
  updateCompanyStressLevel,
} = require("../../utils/stressLevelCalculator");
const { updateCompanyPSI } = require("../../utils/psiCalculator");
const NotificationService = require("../notificationsAndAnnouncements/notificationService");
const EmailService = require("../email/emailService");

function calculateAge(dateOfBirth) {
  const dob = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

class UserServices {
  static async register(userData) {
    try {
      const { username, email, password, role_id } = userData;

      // Check existing user
      const [existingUsers] = await db.query(
        "SELECT * FROM users WHERE email = ?",
        [email]
      );
      if (existingUsers.length > 0) {
        throw new Error("User already exists");
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const [result] = await db.query(
        "INSERT INTO users (username, email, password, role_id) VALUES (?, ?, ?, ?)",
        [username, email, hashedPassword, role_id]
      );

      // Generate token
      const token = jwt.sign(
        { userId: result.insertId, email },
        process.env.JWT_SECRET,
        { expiresIn: "5h" }
      );

      return {
        status: true,
        code: 201,
        message: "Registration successful",
        data: {
          token,
          user: {
            id: result.insertId,
            username,
            email,
            role_id,
          },
        },
      };
    } catch (error) {
      throw new Error("Error registering user: " + error.message);
    }
  }

  static async login(userData) {
    try {
      // Validate JWT secrets first
      if (!process.env.JWT_SECRET || !process.env.REFRESH_TOKEN_SECRET) {
        throw new Error("JWT configuration missing");
      }

      const { email, password, role_id } = userData;

      // Find user
      const [users] = await db.query(
        "SELECT * FROM users WHERE email = ? AND role_id = ?",
        [email, role_id]
      );

      if (users.length === 0) {
        throw new Error("Invalid credentials");
      }

      const user = users[0];

      // Verify password
      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        throw new Error("Invalid credentials");
      }

      // For role_id 2 (company admin) and 3 (employee), check if they are active
      if (user.role_id === 2 || user.role_id === 3) {
        const [activeStatus] = await db.query(
          `SELECT ce.is_active 
           FROM company_employees ce 
           WHERE ce.user_id = ?`,
          [user.user_id]
        );

        if (!activeStatus.length || activeStatus[0].is_active !== 1) {
          throw new Error("Account is inactive. Please contact administrator.");
        }
      }

      await db.query("UPDATE users SET last_login = NOW() WHERE user_id = ?", [
        user.user_id,
      ]);

      let companyData = null;

      // Handle role_id = 1 (Super Admin)
      if (user.role_id === 1) {
        companyData = {
          id: null,
          onboarding_status: null,
        };
      } else if (user.role_id === 2 || user.role_id === 3) {
        // For role_id 2 (company admin), check companies table
        if (user.role_id === 2) {
          const [companies] = await db.query(
            "SELECT * FROM companies WHERE contact_person_id = ?",
            [user.user_id]
          );
          if (companies.length > 0) {
            companyData = companies[0];
          }
        }
        // For role_id 3 (employee), check company_employees table
        else if (user.role_id === 3) {
          const [companyResult] = await db.query(
            `SELECT 
              c.id,
              c.onboarding_status
             FROM company_employees ce
             JOIN companies c ON ce.company_id = c.id
             WHERE ce.user_id = ? AND ce.is_active = 1`,
            [user.user_id]
          );

          // Then get stress level data
          const [stressData] = await db.query(
            `SELECT 
              stress_level,
              stress_message
             FROM company_employees
             WHERE user_id = ? AND is_active = 1`,
            [user.user_id]
          );

          if (companyResult.length > 0) {
            companyData = {
              id: companyResult[0].id,
              onboarding_status: companyResult[0].onboarding_status,
            };
          }

          // Add stress data to the response
          if (stressData.length > 0) {
            user.stress_level = stressData[0].stress_level;
            user.stress_message = stressData[0].stress_message;
          }
        }
      }

      // Generate tokens
      const accessToken = jwt.sign(
        { user_id: users[0].user_id, email, role_id: user.role_id },
        process.env.JWT_SECRET,
        { expiresIn: "5h" }
      );

      const refreshToken = jwt.sign(
        { user_id: users[0].user_id, role_id: user.role_id },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: "7d" }
      );

      // Store refresh token
      await db.query(
        "INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)",
        [
          users[0].user_id,
          refreshToken,
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        ]
      );

      const decoded = jwt.decode(accessToken);
      const loginTime = new Date().toISOString();
      const { password: _, ...userWithoutPassword } = users[0];

      return {
        status: true,
        code: 200,
        message: "Login successful",
        data: {
          accessToken,
          refreshToken,
          loginAt: loginTime,
          expiresAt: new Date(decoded.exp * 1000).toISOString(),
          user: userWithoutPassword,
          companyId: companyData?.id,
          companyOnboarded: companyData?.onboarding_status,
        },
      };
    } catch (error) {
      throw new Error("Error logging in: " + error.message);
    }
  }

  static async logout(token) {
    try {
      // Get token expiration
      const decoded = jwt.decode(token);
      const expiresAt = new Date(decoded.exp * 1000);

      // Add to blacklist
      await db.query(
        "INSERT INTO blacklisted_tokens (token, expires_at) VALUES (?, ?)",
        [token, expiresAt]
      );

      return {
        status: true,
        code: 200,
        message: "Logged out successfully",
        data: null,
      };
    } catch (error) {
      throw new Error("Error logging out: " + error.message);
    }
  }

  static async cleanupExpiredTokens() {
    try {
      await db.query("DELETE FROM blacklisted_tokens WHERE expires_at < NOW()");
    } catch (error) {
      console.error("Token cleanup failed:", error);
    }
  }

  // static async refreshToken(token) {
  //   try {
  //     const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);

  //     // Check if refresh token exists and is valid
  //     const [tokens] = await db.query(
  //       "SELECT * FROM refresh_tokens WHERE token = ? AND expires_at > NOW()",
  //       [token]
  //     );

  //     if (tokens.length === 0) {
  //       throw new Error("Invalid refresh token");
  //     }

  //     // Generate new access token
  //     const newAccessToken = jwt.sign(
  //       { userId: decoded.userId },
  //       process.env.JWT_SECRET,
  //       { expiresIn: "5h" }
  //     );

  //     return {
  //       status: true,
  //       code: 200,
  //       message: "Token refreshed successfully",
  //       data: {
  //         accessToken: newAccessToken,
  //         expiresAt: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(),
  //       },
  //     };
  //   } catch (error) {
  //     throw new Error("Error refreshing token: " + error.message);
  //   }
  // }

  static async refreshToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);

      // Check if refresh token exists and is valid
      const [tokens] = await db.query(
        "SELECT * FROM refresh_tokens WHERE token = ? AND expires_at > NOW()",
        [token]
      );

      if (tokens.length === 0) {
        throw new Error("Invalid refresh token");
      }

      // Get user information to include in the new token
      const [user] = await db.query(
        "SELECT email, role_id FROM users WHERE user_id = ?",
        [decoded.user_id]
      );

      if (user.length === 0) {
        throw new Error("User not found");
      }

      // Generate new access token with consistent payload
      const newAccessToken = jwt.sign(
        {
          user_id: decoded.user_id,
          email: user[0].email,
          role_id: user[0].role_id,
        },
        process.env.JWT_SECRET,
        { expiresIn: "5h" }
      );

      return {
        status: true,
        code: 200,
        message: "Token refreshed successfully",
        data: {
          accessToken: newAccessToken,
          expiresAt: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(),
        },
      };
    } catch (error) {
      throw new Error("Error refreshing token: " + error.message);
    }
  }

  static async getTherapists({ page = 1, limit = 10, search = "" }) {
    try {
      const offset = (page - 1) * limit;

      // Build search condition
      const searchCondition = search
        ? `AND (u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ? OR t.specialization LIKE ?)`
        : "";
      const searchParams = search
        ? [`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`]
        : [];

      // Get total count
      const [totalRows] = await db.query(
        `SELECT COUNT(*) as count 
         FROM users u 
         JOIN therapists t ON u.user_id = t.user_id 
         WHERE u.is_active = 1 AND t.is_active = 1 ${searchCondition}`,
        searchParams
      );

      // Get therapist data
      const [therapists] = await db.query(
        `SELECT 
          u.user_id,
          u.email,
          u.phone,
          u.username,
          u.first_name,
          u.last_name,
          u.gender,
          u.job_title,
          u.profile_url,
          t.bio,
          t.specialization,
          t.years_of_experience,
          t.designation,
          t.qualification
         FROM users u
         JOIN therapists t ON u.user_id = t.user_id
         WHERE u.is_active = 1 AND t.is_active = 1 
         ${searchCondition}
         ORDER BY u.created_at DESC
         LIMIT ? OFFSET ?`,
        [...searchParams, limit, offset]
      );

      return {
        therapists,
        pagination: {
          total: totalRows[0].count,
          current_page: page,
          total_pages: Math.ceil(totalRows[0].count / limit),
          per_page: limit,
        },
      };
    } catch (error) {
      throw new Error("Error fetching therapists: " + error.message);
    }
  }

  static async createTherapist(therapistData) {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      const {
        email,
        username,
        first_name,
        last_name,
        phone,
        gender,
        years_of_experience,
        specialization,
        bio,
        date_of_birth,
      } = therapistData;

      // Calculate age if date_of_birth provided
      const age = date_of_birth ? calculateAge(date_of_birth) : null;

      // Generate random password
      const password = Math.random().toString(36).slice(-8);
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user with age and dob
      const [userResult] = await connection.query(
        `INSERT INTO users (
          email, password, username, first_name, last_name,
          gender, user_type, role_id, date_of_birth, age, phone
        ) VALUES (?, ?, ?, ?, ?, ?, 'neure', 2, ?, ?, ?)`,
        [
          email,
          hashedPassword,
          username,
          first_name,
          last_name,
          gender,
          date_of_birth,
          age,
          phone,
        ]
      );

      // Add this after user creation
      await connection.query(
        `INSERT INTO user_subscriptions (
          user_id, 
          email_notification, 
          sms_notification, 
          workshop_event_reminder, 
          system_updates_announcement
        ) VALUES (?, 1, 1, 1, 1)`, // Default all notifications to true for new users
        [userResult.insertId]
      );

      // Create therapist profile
      await connection.query(
        `INSERT INTO therapists (
          user_id, bio, specialization, years_of_experience
        ) VALUES (?, ?, ?, ?)`,
        [userResult.insertId, bio, specialization, years_of_experience]
      );

      await connection.commit();

      return {
        status: true,
        code: 201,
        message: "Therapist created successfully",
        data: {
          user_id: userResult.insertId,
          email,
          temp_password: password,
          age,
        },
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async updateTherapist(therapistId, updateData) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const {
        email,
        username,
        first_name,
        last_name,
        phone,
        gender,
        years_of_experience,
        specialization,
        bio,
        date_of_birth,
      } = updateData;

      // Calculate age if date_of_birth provided
      const age = date_of_birth ? calculateAge(date_of_birth) : null;

      // Update user table
      const userUpdateFields = [];
      const userUpdateValues = [];

      if (email) {
        userUpdateFields.push("email = ?");
        userUpdateValues.push(email);
      }
      if (username) {
        userUpdateFields.push("username = ?");
        userUpdateValues.push(username);
      }
      if (first_name) {
        userUpdateFields.push("first_name = ?");
        userUpdateValues.push(first_name);
      }
      if (last_name) {
        userUpdateFields.push("last_name = ?");
        userUpdateValues.push(last_name);
      }
      if (phone) {
        userUpdateFields.push("phone = ?");
        userUpdateValues.push(phone);
      }
      if (gender) {
        userUpdateFields.push("gender = ?");
        userUpdateValues.push(gender);
      }
      if (date_of_birth) {
        userUpdateFields.push("date_of_birth = ?", "age = ?");
        userUpdateValues.push(date_of_birth, age);
      }

      if (userUpdateFields.length > 0) {
        userUpdateValues.push(therapistId);
        await connection.query(
          `UPDATE users SET ${userUpdateFields.join(", ")} WHERE user_id = ?`,
          userUpdateValues
        );
      }

      // Update therapist table
      const therapistUpdateFields = [];
      const therapistUpdateValues = [];

      if (bio) {
        therapistUpdateFields.push("bio = ?");
        therapistUpdateValues.push(bio);
      }
      if (specialization) {
        therapistUpdateFields.push("specialization = ?");
        therapistUpdateValues.push(specialization);
      }
      if (years_of_experience) {
        therapistUpdateFields.push("years_of_experience = ?");
        therapistUpdateValues.push(years_of_experience);
      }

      if (therapistUpdateFields.length > 0) {
        therapistUpdateValues.push(therapistId);
        await connection.query(
          `UPDATE therapists SET ${therapistUpdateFields.join(
            ", "
          )} WHERE user_id = ?`,
          therapistUpdateValues
        );
      }

      await connection.commit();

      return {
        status: true,
        code: 200,
        message: "Therapist updated successfully",
        data: { therapistId },
      };
    } catch (error) {
      await connection.rollback();
      throw new Error(`Error updating therapist: ${error.message}`);
    } finally {
      connection.release();
    }
  }

  static async deleteTherapist(therapistId) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Check if therapist exists
      const [therapist] = await connection.query(
        `SELECT t.*, u.email 
         FROM therapists t 
         JOIN users u ON t.user_id = u.user_id 
         WHERE t.user_id = ? AND t.is_active = 1`,
        [therapistId]
      );

      console.log("Therapist data:", therapist);

      if (!therapist || therapist.length === 0) {
        throw new Error("Therapist not found or already inactive");
      }

      // Soft delete in therapists table
      await connection.query(
        "UPDATE therapists SET is_active = 0 WHERE user_id = ?",
        [therapistId]
      );

      // Soft delete in users table
      await connection.query(
        "UPDATE users SET is_active = 0 WHERE user_id = ?",
        [therapistId]
      );

      await connection.commit();

      return {
        status: true,
        code: 200,
        message: "Therapist deleted successfully",
        data: {
          therapistId,
          email: therapist[0].email,
        },
      };
    } catch (error) {
      await connection.rollback();
      throw new Error(`Error deleting therapist: ${error.message}`);
    } finally {
      connection.release();
    }
  }

  static async changeUserPassword(email, old_password, new_password) {
    try {
      console.log("Attempting to change password for email:", email);

      // Check if user exists and get their current password hash
      const [user] = await db.query(
        "SELECT user_id, password FROM users WHERE email = ?",
        [email]
      );

      if (!user || user.length === 0) {
        console.log("User not found for email:", email);
        return {
          status: false,
          code: 404,
          message: "User not found with the provided email address",
          data: null,
        };
      }

      // Verify old password
      console.log("Verifying old password");
      const passwordMatch = await bcrypt.compare(
        old_password,
        user[0].password
      );

      if (!passwordMatch) {
        console.log("Old password verification failed");
        return {
          status: false,
          code: 401,
          message: "Current password is incorrect",
          data: null,
        };
      }

      // Check if new password is the same as old password
      const sameAsOld = await bcrypt.compare(new_password, user[0].password);
      if (sameAsOld) {
        console.log("New password cannot be the same as the old password");
        return {
          status: false,
          code: 400,
          message: "New password cannot be the same as your current password",
          data: null,
        };
      }

      console.log("Old password verified, hashing new password");
      // Hash the new password
      const hashedPassword = await bcrypt.hash(new_password, 10);

      // Update the password
      console.log("Updating password for user_id:", user[0].user_id);
      await db.query("UPDATE users SET password = ? WHERE user_id = ?", [
        hashedPassword,
        user[0].user_id,
      ]);

      // Create notification using NotificationService
      await NotificationService.createNotification({
        title: "Password Changed Successfully",
        content: `Your password was changed successfully on ${new Date().toLocaleString()}. If you didn't perform this action, please contact support immediately.`,
        type: "ACCOUNT_UPDATE",
        user_id: user[0].user_id,
        priority: "HIGH",
      });

      console.log("Password change successful");
      return {
        status: true,
        code: 200,
        message: "Password has been changed successfully",
        data: null,
      };
    } catch (error) {
      console.error("Error in changeUserPassword:", error);
      throw new Error("Error changing password: " + error.message);
    }
  }

  static async getUserDetails(user_id, company_id = null) {
    try {
      console.log(
        `Fetching user details for user_id: ${user_id}${
          company_id ? `, company_id: ${company_id}` : ""
        }`
      );

      // Build base query for user details
      let query = `
        SELECT 
          u.*,
          d.id AS department_id,
          d.department_name,
          ud.assigned_date AS department_assigned_date
        FROM 
          users u
        LEFT JOIN 
          user_departments ud ON u.user_id = ud.user_id
        LEFT JOIN 
          departments d ON ud.department_id = d.id
        WHERE 
          u.user_id = ? AND u.is_active = 1
      `;

      const queryParams = [user_id];

      // If company_id is provided, verify user belongs to that company
      if (company_id) {
        query = `
          SELECT 
            u.*,
            ce.employee_code,
            ce.joined_date,
            ce.company_id,
            d.id AS department_id,
            d.department_name,
            ud.assigned_date AS department_assigned_date,
            c.company_name
          FROM 
            users u
          JOIN 
            company_employees ce ON u.user_id = ce.user_id
          JOIN 
            companies c ON ce.company_id = c.id
          LEFT JOIN 
            user_departments ud ON u.user_id = ud.user_id
          LEFT JOIN 
            departments d ON ud.department_id = d.id
          WHERE 
            u.user_id = ? AND ce.company_id = ? AND ce.is_active = 1 AND u.is_active = 1
        `;
        queryParams.push(company_id);
      }

      const [users] = await db.query(query, queryParams);

      if (!users || users.length === 0) {
        console.log(
          `User not found: ${user_id}${
            company_id ? ` in company: ${company_id}` : ""
          }`
        );
        return {
          status: false,
          code: 404,
          message: company_id
            ? "User not found or is not active in the specified company"
            : "User not found or is not active",
          data: null,
        };
      }

      console.log(`User details found for user_id: ${user_id}`);

      // Get the user data (all fields from users table are included)
      const userData = users[0];

      // Add department as a nested object if available
      if (userData.department_id) {
        userData.department = {
          id: userData.department_id,
          name: userData.department_name,
          assigned_date: userData.department_assigned_date,
        };

        // Remove the flat department fields
        delete userData.department_id;
        delete userData.department_name;
        delete userData.department_assigned_date;
      }

      // Add company as a nested object if available
      if (userData.company_id) {
        userData.company = {
          id: userData.company_id,
          name: userData.company_name,
          employee_code: userData.employee_code,
          joined_date: userData.joined_date,
        };

        // Remove the flat company fields
        delete userData.company_name;
        delete userData.employee_code;
        delete userData.joined_date;
      }

      return {
        status: true,
        code: 200,
        message: "User details retrieved successfully",
        data: userData,
      };
    } catch (error) {
      console.error("Error in getUserDetails:", error);
      throw new Error(`Error retrieving user details: ${error.message}`);
    }
  }

  static async updateUserDetails(user_id, userDetails) {
    try {
      // console.log(`Updating user details for user_id: ${user_id}`);

      // Check if the user exists
      const [existingUser] = await db.query(
        "SELECT * FROM users WHERE user_id = ?",
        [user_id]
      );

      if (!existingUser || existingUser.length === 0) {
        console.log(`User not found: ${user_id}`);
        return {
          status: false,
          code: 404,
          message: "User not found",
          data: null,
        };
      }

      // Build dynamic query based on provided fields
      const fields = [];
      const values = [];

      if (userDetails.first_name !== undefined) {
        fields.push("first_name = ?");
        values.push(userDetails.first_name);
      }
      if (userDetails.last_name !== undefined) {
        fields.push("last_name = ?");
        values.push(userDetails.last_name);
      }
      if (userDetails.email !== undefined) {
        fields.push("email = ?");
        values.push(userDetails.email);
      }
      if (userDetails.phone !== undefined) {
        fields.push("phone = ?");
        values.push(userDetails.phone);
      }
      if (userDetails.gender !== undefined) {
        fields.push("gender = ?");
        values.push(userDetails.gender);
      }
      if (userDetails.date_of_birth !== undefined) {
        fields.push("date_of_birth = ?");
        values.push(userDetails.date_of_birth);
      }
      if (userDetails.city !== undefined) {
        fields.push("city = ?");
        values.push(userDetails.city);
      }
      if (userDetails.accepted_terms !== undefined) {
        fields.push("accepted_terms = ?");
        values.push(userDetails.accepted_terms);
      }
      if (userDetails.profile_url !== undefined) {
        fields.push("profile_url = ?");
        values.push(userDetails.profile_url);
      }

      if (fields.length === 0) {
        return {
          status: false,
          code: 400,
          message: "No fields provided to update.",
          data: null,
        };
      }

      values.push(user_id);

      const query = `UPDATE users SET ${fields.join(", ")} WHERE user_id = ?`;
      await db.query(query, values);

      // Update department if provided
      if (userDetails.department_id !== undefined) {
        await db.query(
          `UPDATE user_departments SET department_id = ? WHERE user_id = ?`,
          [userDetails.department_id, user_id]
        );
      }

      // Create notification after successful update
      const updatedFieldNames = fields.map((field) => field.split(" = ")[0]);
      await NotificationService.createNotification({
        title: "Profile Update",
        content: `Your profile information has been updated. Updated fields: ${updatedFieldNames.join(
          ", "
        )}`,
        type: "PROFILE_UPDATE",
        user_id: user_id,
        priority: "MEDIUM",
      });

      // console.log(`User details updated for user_id: ${user_id}`);
      return {
        status: true,
        code: 200,
        message: "User details updated successfully",
        data: null,
      };
    } catch (error) {
      console.error("Error in updateUserDetails:", error);
      throw new Error(`Error updating user details: ${error.message}`);
    }
  }

  static async getUserWorkshops(user_id) {
    try {
      console.log(`Fetching workshops for user_id: ${user_id}`);

      // Check if the user exists
      const [existingUser] = await db.query(
        "SELECT * FROM users WHERE user_id = ?",
        [user_id]
      );

      if (!existingUser || existingUser.length === 0) {
        console.log(`User not found: ${user_id}`);
        return {
          status: false,
          code: 404,
          message: "User not found",
          data: null,
        };
      }

      // Fetch workshop assignments
      const [workshops] = await db.query(
        `SELECT 
          wa.id,
          wa.workshop_id,
          w.title,
          w.description,
          wa.assigned_at,
          wa.status,
          wa.completed_at
        FROM 
          workshop_assignments wa
        JOIN 
          workshops w ON wa.workshop_id = w.id
        WHERE 
          wa.user_id = ?`,
        [user_id]
      );

      console.log(
        `Found ${workshops.length} workshops for user_id: ${user_id}`
      );
      return {
        status: true,
        code: 200,
        message: "Workshops retrieved successfully",
        data: workshops,
      };
    } catch (error) {
      console.error("Error in getUserWorkshops:", error);
      throw new Error(`Error retrieving workshops: ${error.message}`);
    }
  }

  static async getEmployeeRewards(user_id, page = 1, limit = 10) {
    try {
      // console.log(`Fetching rewards for user_id: ${user_id}`);

      // Check if the user exists
      const [existingUser] = await db.query(
        "SELECT * FROM users WHERE user_id = ?",
        [user_id]
      );

      if (!existingUser || existingUser.length === 0) {
        console.log(`User not found: ${user_id}`);
        return {
          status: false,
          code: 404,
          message: "User not found",
          data: null,
        };
      }

      const offset = (page - 1) * limit;

      const [totalRows] = await db.query(
        `SELECT COUNT(*) as count 
         FROM employee_rewards 
         WHERE user_id = ?`,
        [user_id]
      );

      // Fetch rewards assigned to the user with pagination
      const [rewards] = await db.query(
        `SELECT 
          er.*,
          r.*
        FROM 
          employee_rewards er
        JOIN 
          rewards r ON er.reward_id = r.id
        WHERE 
          er.user_id = ?
        LIMIT ? OFFSET ?`,
        [user_id, limit, offset]
      );

      const totalPages = Math.ceil(totalRows[0].count / limit);

      console.log(`Found ${rewards.length} rewards for user_id: ${user_id}`);
      return {
        status: true,
        code: 200,
        message: "Rewards retrieved successfully",
        data: rewards,
        pagination: {
          total: totalRows[0].count,
          current_page: page,
          total_pages: totalPages,
          per_page: limit,
        },
      };
    } catch (error) {
      console.error("Error in getEmployeeRewards:", error);
      throw new Error(`Error retrieving rewards: ${error.message}`);
    }
  }

  // static async claimReward(user_id, reward_id) {
  //   try {
  //     console.log(
  //       `Claiming reward for user_id: ${user_id}, reward_id: ${reward_id}`
  //     );

  //     // Check if the reward is assigned to the user and not already claimed
  //     const [reward] = await db.query(
  //       `SELECT * FROM employee_rewards
  //        WHERE user_id = ? AND reward_id = ? AND claimed_status = 0`,
  //       [user_id, reward_id]
  //     );

  //     if (!reward || reward.length === 0) {
  //       console.log(
  //         `Reward not found or already claimed for user_id: ${user_id}, reward_id: ${reward_id}`
  //       );
  //       return {
  //         status: false,
  //         code: 404,
  //         message: "Reward not found or already claimed",
  //         data: null,
  //       };
  //     }

  //     await db.query(
  //       `UPDATE employee_rewards
  //        SET claimed_status = 1, claimed_at = NOW()
  //        WHERE id = ?`,
  //       [reward[0].id]
  //     );

  //     console.log(
  //       `Reward claimed successfully for user_id: ${user_id}, reward_id: ${reward_id}`
  //     );
  //     return {
  //       status: true,
  //       code: 200,
  //       message: "Reward claimed successfully",
  //       data: null,
  //     };
  //   } catch (error) {
  //     console.error("Error in claimReward:", error);
  //     throw new Error(`Error claiming reward: ${error.message}`);
  //   }
  // }

  static async claimReward(user_id, reward_id) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Get reward details including admin info and reward name
      const [reward] = await connection.query(
        `SELECT 
          er.id,
          er.company_id,
          r.title AS reward_name,
          u1.first_name AS employee_name,
          u2.first_name AS admin_name,
          u2.user_id AS admin_id,
          u2.email AS admin_email,
          c.contact_person_id,
          u3.first_name AS contact_person_name,
          u3.email AS contact_person_email
        FROM employee_rewards er
        JOIN rewards r ON er.reward_id = r.id
        JOIN users u1 ON er.user_id = u1.user_id
        JOIN users u2 ON er.rewarded_by = u2.user_id
        JOIN companies c ON er.company_id = c.id
        JOIN users u3 ON c.contact_person_id = u3.user_id
        WHERE er.user_id = ? AND er.reward_id = ? AND er.claimed_status = 0`,
        [user_id, reward_id]
      );

      if (!reward || reward.length === 0) {
        return {
          status: false,
          code: 404,
          message: "Reward not found or already claimed",
          data: null,
        };
      }

      // Update reward status
      await connection.query(
        `UPDATE employee_rewards 
         SET claimed_status = 1, claimed_at = NOW() 
         WHERE id = ?`,
        [reward[0].id]
      );
      
      // Create notification for the employee who claimed the reward
      await NotificationService.createNotification({
        title: "Reward Claimed Successfully",
        content: `You have successfully claimed the reward "${reward[0].reward_name}".`,
        type: "REWARD_CLAIMED_CONFIRMATION",
        company_id: reward[0].company_id,
        user_id: user_id,
        priority: "HIGH",
        metadata: JSON.stringify({
          reward_id: reward_id,
          reward_name: reward[0].reward_name,
          claimed_date: new Date().toISOString(),
        }),
      });

      // Create notification for the admin who assigned the reward
      await NotificationService.createNotification({
        title: "Reward Claimed Notification",
        content: `${reward[0].employee_name} has claimed the reward "${reward[0].reward_name}" that you assigned to them.`,
        type: "REWARD_CLAIMED",
        company_id: reward[0].company_id,
        user_id: reward[0].admin_id,
        priority: "MEDIUM",
        metadata: JSON.stringify({
          reward_id: reward_id,
          employee_id: user_id,
          employee_name: reward[0].employee_name,
          reward_name: reward[0].reward_name,
          redemption_date: new Date().toISOString(),
        }),
      });

      await connection.commit();

      // Send email notification to employee instead of admin
      const EmailService = require("../email/emailService");
      await EmailService.sendRewardClaimConfirmationEmail(
        reward[0].employee_name,
        reward[0].reward_name,
        reward[0].email // Employee's email
      );

      return {
        status: true,
        code: 200,
        message: "Reward claimed successfully",
        data: null,
      };
    } catch (error) {
      await connection.rollback();
      console.error("Error in claimReward:", error);
      throw new Error(`Error claiming reward: ${error.message}`);
    } finally {
      connection.release();
    }
  }

  static async getUserSubscription(user_id) {
    try {
      if (!user_id) {
        throw new Error("user_id is required");
      }
      const [subscription] = await db.query(
        "SELECT * FROM user_subscriptions WHERE user_id = ?",
        [user_id]
      );
      if (!subscription || subscription.length === 0) {
        return {
          status: false,
          code: 404,
          message: "Subscription not found for the provided user_id",
          data: null,
        };
      }
      return {
        status: true,
        code: 200,
        message: "User subscription retrieved successfully.",
        data: subscription[0],
      };
    } catch (error) {
      throw new Error("Error retrieving user subscription: " + error.message);
    }
  }

  static async updateUserSubscription({
    user_id,
    email_notification,
    sms_notification,
    workshop_event_reminder,
    system_updates_announcement,
  }) {
    try {
      if (!user_id) {
        throw new Error("user_id is required");
      }

      // Check if a subscription record exists
      const [existing] = await db.query(
        "SELECT * FROM user_subscriptions WHERE user_id = ?",
        [user_id]
      );
      const recordExists = existing.length > 0;

      if (recordExists) {
        // Build dynamic update query for record update
        const fields = [];
        const values = [];

        if (email_notification !== undefined) {
          fields.push("email_notification = ?");
          values.push(email_notification);
        }
        if (sms_notification !== undefined) {
          fields.push("sms_notification = ?");
          values.push(sms_notification);
        }
        if (workshop_event_reminder !== undefined) {
          fields.push("workshop_event_reminder = ?");
          values.push(workshop_event_reminder);
        }
        if (system_updates_announcement !== undefined) {
          fields.push("system_updates_announcement = ?");
          values.push(system_updates_announcement);
        }

        if (fields.length === 0) {
          return {
            status: false,
            code: 400,
            message: "No fields provided to update.",
            data: null,
          };
        }

        const query = `UPDATE user_subscriptions SET ${fields.join(
          ", "
        )} WHERE user_id = ?`;
        values.push(user_id);
        await db.query(query, values);
      } else {
        const emailNotif =
          email_notification !== undefined ? email_notification : 0;
        const smsNotif = sms_notification !== undefined ? sms_notification : 0;
        const workshopRem =
          workshop_event_reminder !== undefined ? workshop_event_reminder : 0;
        const sysUpdates =
          system_updates_announcement !== undefined
            ? system_updates_announcement
            : 0;

        const insertQuery = `
          INSERT INTO user_subscriptions 
            (user_id, email_notification, sms_notification, workshop_event_reminder, system_updates_announcement)
          VALUES (?, ?, ?, ?, ?)
        `;
        const insertValues = [
          user_id,
          emailNotif,
          smsNotif,
          workshopRem,
          sysUpdates,
        ];
        await db.query(insertQuery, insertValues);
      }

      const [subscription] = await db.query(
        "SELECT * FROM user_subscriptions WHERE user_id = ?",
        [user_id]
      );

      return {
        status: true,
        code: 200,
        message: "User subscription updated successfully.",
        data: subscription[0] || null,
      };
    } catch (error) {
      throw new Error("Error updating user subscription: " + error.message);
    }
  }

  static async updateUserStressLevel(
    user_id,
    company_id,
    stress_level,
    stress_message,
    last_stress_modal_seen_at
  ) {
    const connection = await db.getConnection();
    try {
      // Validate stress level is between 0 and 100
      if (stress_level < 0 || stress_level > 100) {
        return {
          status: false,
          code: 400,
          message: "Stress level must be between 0 and 100",
          data: null,
        };
      }

      await connection.beginTransaction();

      // Check if employee exists in company
      const [employee] = await connection.query(
        `SELECT * FROM company_employees 
         WHERE user_id = ? AND company_id = ? AND is_active = 1`,
        [user_id, company_id]
      );

      if (!employee || employee.length === 0) {
        await connection.rollback();
        return {
          status: false,
          code: 404,
          message: "Employee not found or not active in this company",
          data: null,
        };
      }

      // Update stress level and message in company_employees
      await connection.query(
        `UPDATE company_employees 
         SET stress_level = ?, 
             stress_message = ?,
             stress_bar_updated = 1,
             last_activity_date = NOW()
         WHERE user_id = ? AND company_id = ?`,
        [stress_level, stress_message, user_id, company_id]
      );

      // Update last_stress_modal_seen_at in users table
      await connection.query(
        `UPDATE users 
         SET last_stress_modal_seen_at = ? 
         WHERE user_id = ?`,
        [last_stress_modal_seen_at || new Date(), user_id]
      );

      await connection.commit();

      // Update company average stress level
      await updateCompanyStressLevel(company_id);

      return {
        status: true,
        code: 200,
        message: "Stress level updated successfully",
        data: {
          user_id,
          company_id,
          stress_level,
          stress_message,
          last_stress_modal_seen_at,
        },
      };
    } catch (error) {
      await connection.rollback();
      console.error("Error updating stress level:", error);
      throw new Error(`Error updating stress level: ${error.message}`);
    } finally {
      connection.release();
    }
  }

  static async updateDashboardTourStatus(user_id) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Check if user exists
      const [user] = await connection.query(
        "SELECT * FROM users WHERE user_id = ?",
        [user_id]
      );

      if (!user || user.length === 0) {
        await connection.rollback();
        return {
          status: false,
          code: 404,
          message: "User not found",
          data: null,
        };
      }

      // Update has_seen_dashboard_tour status
      await connection.query(
        "UPDATE users SET has_seen_dashboard_tour = 1 WHERE user_id = ?",
        [user_id]
      );

      await connection.commit();

      return {
        status: true,
        code: 200,
        message: "Dashboard tour status updated successfully",
        data: {
          user_id,
          has_seen_dashboard_tour: true,
        },
      };
    } catch (error) {
      await connection.rollback();
      console.error("Error updating dashboard tour status:", error);
      throw new Error(`Error updating dashboard tour status: ${error.message}`);
    } finally {
      connection.release();
    }
  }

  static async submitPSI(user_id, company_id, psi_score) {
    const connection = await db.getConnection();
    try {
      console.log("Submitting PSI score for user:", user_id);
      console.log("PSI score:", psi_score);
      console.log("Company ID:", company_id);
      await connection.beginTransaction();

      // Check if employee exists and is active
      const [employee] = await connection.query(
        `SELECT * FROM company_employees 
         WHERE user_id = ? AND company_id = ? AND is_active = 1`,
        [user_id, company_id]
      );

      if (!employee || employee.length === 0) {
        await connection.rollback();
        return {
          status: false,
          code: 404,
          message: "Employee not found or not active in this company",
          data: null,
        };
      }

      // Update employee's PSI score
      await connection.query(
        `UPDATE company_employees 
         SET 
           psi = ?,
           last_activity_date = NOW()
         WHERE user_id = ? AND company_id = ?`,
        [psi_score, user_id, company_id]
      );

      await connection.commit();

      // Update company's overall PSI
      // const psiUpdateResult = await updateCompanyPSI(company_id);

      return {
        status: true,
        code: 200,
        message: "PSI score submitted successfully",
        data: {
          user_id,
          company_id,
          psi_score,
          // company_psi: psiUpdateResult.psi
        },
      };
    } catch (error) {
      await connection.rollback();
      console.error("Error submitting PSI score:", error);
      throw new Error(`Error submitting PSI score: ${error.message}`);
    } finally {
      connection.release();
    }
  }

  static async updateTermsAcceptance(user_id, accepted_terms) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Check if user exists
      const [user] = await connection.query(
        "SELECT * FROM users WHERE user_id = ?",
        [user_id]
      );

      if (!user || user.length === 0) {
        await connection.rollback();
        return {
          status: false,
          code: 404,
          message: "User not found",
          data: null,
        };
      }

      // Update accepted_terms status and add timestamp
      await connection.query(
        `UPDATE users 
         SET 
           accepted_terms = ?
         WHERE user_id = ?`,
        [accepted_terms, user_id]
      );

      await connection.commit();

      return {
        status: true,
        code: 200,
        message: "Terms acceptance status updated successfully",
        data: {
          user_id,
          accepted_terms,
        },
      };
    } catch (error) {
      await connection.rollback();
      throw new Error("Error updating terms acceptance: " + error.message);
    } finally {
      connection.release();
    }
  }

  static async getSuperadmins() {
    try {
      const [users] = await db.query(
        "SELECT user_id, username, email, phone, first_name, last_name, profile_url FROM users WHERE role_id = 1"
      );

      return {
        status: true,
        code: 200,
        message: "Superadmins retrieved successfully",
        data: users,
      };
    } catch (error) {
      console.error("Error retrieving superadmins:", error);
      throw new Error("Failed to retrieve superadmins: " + error.message);
    }
  }

  static async createSuperadmin(userData) {
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      const { first_name, last_name, email, gender, phone = null } = userData;

      // Check if email already exists
      const [existingUser] = await connection.query(
        "SELECT * FROM users WHERE email = ?",
        [email]
      );

      if (existingUser.length > 0) {
        await connection.rollback();
        return {
          status: false,
          code: 409,
          message: "Email already exists",
          data: null,
        };
      }

      // Generate a temporary password
      const tempPassword = `${first_name.slice(0, 4)}1234`;
      const hashedPassword = await bcrypt.hash(tempPassword, 10);

      // Insert user with role_id = 1 (superadmin)
      const [userResult] = await connection.query(
        `INSERT INTO users (
          email, phone, password, first_name, last_name,
          gender, role_id
        ) VALUES (?, ?, ?, ?, ?, ?, 1)`,
        [email, phone, hashedPassword, first_name, last_name, gender]
      );

      // Add subscription record for the new user
      await connection.query(
        `INSERT INTO user_subscriptions (
          user_id, 
          email_notification, 
          sms_notification, 
          workshop_event_reminder, 
          system_updates_announcement
        ) VALUES (?, 1, 1, 1, 1)`,
        [userResult.insertId]
      );

      await connection.commit();

      // Send welcome email to the new superadmin using the new template
      try {
        await EmailService.sendSuperAdminWelcomeEmail(
          first_name,
          email, // Using email as username for superadmins
          tempPassword,
          email
        );
      } catch (emailError) {
        console.error("Error sending welcome email:", emailError);
        // Continue execution even if email fails
      }

      return {
        status: true,
        code: 201,
        message: "Superadmin created successfully",
        data: {
          user_id: userResult.insertId,
          email,
          temp_password: tempPassword,
        },
      };
    } catch (error) {
      await connection.rollback();
      throw new Error("Error creating superadmin: " + error.message);
    } finally {
      connection.release();
    }
  }
}

module.exports = UserServices;
