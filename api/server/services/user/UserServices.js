const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../../../config/db");

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
      console.log("Login data:", userData);

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


      let companyData = null;
      if (user.role_id === 2){
        const [companies] = await db.query(
          "SELECT * FROM companies WHERE contact_person_id = ?",
          [user.user_id]
        );

        if (companies.length > 0) {
          companyData = companies[0];
        }
      }

      // Generate tokens
      const accessToken = jwt.sign(
        { userId: users[0].user_id, email },
        process.env.JWT_SECRET,
        { expiresIn: "5h" }
      );

      const refreshToken = jwt.sign(
        { userId: users[0].user_id },
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

      // Generate new access token
      const newAccessToken = jwt.sign(
        { userId: decoded.userId },
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
          t.bio,
          t.specialization
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
}

module.exports = UserServices;
