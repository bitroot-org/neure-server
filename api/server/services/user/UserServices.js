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
      const { email, password } = userData;
      
      // Find user
      const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
      if (users.length === 0) {
        throw new Error('Invalid credentials');
      }

      // Verify password
      const isMatch = await bcrypt.compare(password, users[0].password);
      if (!isMatch) {
        throw new Error('Invalid credentials');
      }

      // Generate token
      const token = jwt.sign(
        { userId: users[0].id, email },
        process.env.JWT_SECRET,
        { expiresIn: '5h' }
      );

      const { password: _, ...userWithoutPassword } = users[0];
      
      return {
        status: true,
        code: 200,
        message: 'Login successful',
        data: {
          token,
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
}

module.exports = UserServices;