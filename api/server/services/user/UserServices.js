const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../../../config/db');

class UserServices {
  static async register(userData) {
    try {
      const { username, email, password, role_id } = userData;

      // Check existing user
      const [existingUsers] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
      if (existingUsers.length > 0) {
        throw new Error('User already exists');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const [result] = await db.query(
        'INSERT INTO users (username, email, password, role_id) VALUES (?, ?, ?, ?)',
        [username, email, hashedPassword, role_id]
      );

      // Generate token
      const token = jwt.sign(
        { userId: result.insertId, email },
        process.env.JWT_SECRET,
        { expiresIn: '5h' }
      );

      return {
        status: true,
        code: 201,
        message: 'Registration successful',
        data: {
          token,
          user: {
            id: result.insertId,
            username,
            email,
            role_id
          }
        }
      };
    } catch (error) {
      throw new Error('Error registering user: ' + error.message);
    }
  }

  static async login(userData) {
    try {
      console.log("Login data:", userData);
      // Validate JWT secrets first
      if (!process.env.JWT_SECRET || !process.env.REFRESH_TOKEN_SECRET) {
        throw new Error('JWT configuration missing');
      }

      const { email, password } = userData;

      // Find user
      const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
      if (users.length === 0) {
        throw new Error('Invalid credentials');
      }
      console.log("User found:", users[0]);

      // Verify password
      const isMatch = await bcrypt.compare(password, users[0].password);
      if (!isMatch) {
        throw new Error('Invalid credentials');
      }

      // Generate tokens
      const accessToken = jwt.sign(
        { userId: users[0].user_id, email },
        process.env.JWT_SECRET,
        { expiresIn: '5h' }
      );

      const refreshToken = jwt.sign(
        { userId: users[0].user_id },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: '7d' }
      );

      // Store refresh token
      await db.query(
        'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
        [users[0].user_id, refreshToken, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)]
      );

      const decoded = jwt.decode(accessToken);
      const loginTime = new Date().toISOString();
      const { password: _, ...userWithoutPassword } = users[0];

      return {
        status: true,
        code: 200,
        message: 'Login successful',
        data: {
          accessToken,
          refreshToken,
          loginAt: loginTime,
          expiresAt: new Date(decoded.exp * 1000).toISOString(),
          user: userWithoutPassword
        }
      };
    } catch (error) {
      throw new Error('Error logging in: ' + error.message);
    }
  }

  static async logout(token) {
    try {
      // Get token expiration
      const decoded = jwt.decode(token);
      const expiresAt = new Date(decoded.exp * 1000);

      // Add to blacklist
      await db.query(
        'INSERT INTO blacklisted_tokens (token, expires_at) VALUES (?, ?)',
        [token, expiresAt]
      );

      return {
        status: true,
        code: 200,
        message: 'Logged out successfully',
        data: null
      };
    } catch (error) {
      throw new Error('Error logging out: ' + error.message);
    }
  }

  static async cleanupExpiredTokens() {
    try {
      await db.query('DELETE FROM blacklisted_tokens WHERE expires_at < NOW()');
    } catch (error) {
      console.error('Token cleanup failed:', error);
    }
  }

  static async refreshToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);

      // Check if refresh token exists and is valid
      const [tokens] = await db.query(
        'SELECT * FROM refresh_tokens WHERE token = ? AND expires_at > NOW()',
        [token]
      );

      if (tokens.length === 0) {
        throw new Error('Invalid refresh token');
      }

      // Generate new access token
      const newAccessToken = jwt.sign(
        { userId: decoded.userId },
        process.env.JWT_SECRET,
        { expiresIn: '5h' }
      );

      return {
        status: true,
        code: 200,
        message: 'Token refreshed successfully',
        data: {
          accessToken: newAccessToken,
          expiresAt: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString()
        }
      };
    } catch (error) {
      throw new Error('Error refreshing token: ' + error.message);
    }
  }

}

module.exports = UserServices;