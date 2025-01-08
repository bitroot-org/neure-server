const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../../../config/db');
const dotenv = require('dotenv');

dotenv.config();

class UserController {
  // User registration
  static async register(req, res) {
    try {
      const { username, email, password } = req.body;
      console.log(req.body);

      // Check if user already exists
      const [existingUsers] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
      if (existingUsers.length > 0) {
        return res.status(400).json({ msg: 'User already exists' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create new user
      const [result] = await db.query(
        'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
        [username, email, hashedPassword]
      );

      // Generate JWT token
      const token = jwt.sign(
        { id: result.insertId }, 
        process.env.JWT_SECRET, 
        { expiresIn: '1h' }
      );

      res.status(201).json({ token });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }

  // User login
  static async login(req, res) {
    try {
      const { email, password } = req.body;

      // Check if user exists
      const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
      if (users.length === 0) {
        return res.status(400).json({ msg: 'Invalid credentials' });
      }

      const user = users[0];

      // Check password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ msg: 'Invalid credentials' });
      }

      // Generate JWT token
      const token = jwt.sign(
        { id: user.id }, 
        process.env.JWT_SECRET, 
        { expiresIn: '1h' }
      );

      res.json({ token });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
}

module.exports = UserController;