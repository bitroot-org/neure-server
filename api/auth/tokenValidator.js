const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const db = require("../../api/config/db");

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

const authorization = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];

    if (!authHeader || !authHeader.startsWith("Bearer ") || authHeader.split(" ")[1] === "") {
      return res.status(401).json({
        success: false,
        message: "Access Denied! Token not provided or invalid format.",
      });
    }

    const token = authHeader.split(" ")[1];

    // Check if token is blacklisted
    const [blacklistedToken] = await db.query(
      "SELECT * FROM blacklisted_tokens WHERE token = ?",
      [token]
    );

    if (blacklistedToken.length > 0) {
      return res.status(401).json({
        success: false,
        message: "Token has been invalidated",
      });
    }

    // Verify the token
    jwt.verify(token, JWT_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(403).json({
          success: false,
          message: "Invalid or expired token!",
        });
      }

      const { user_id, role_id } = decoded;

      // Check if the user exists and has the correct role_id
      const [user] = await db.query(
        "SELECT role_id FROM users WHERE user_id = ? AND role_id = ?",
        [user_id, role_id]
      );

      if (!user || user.length === 0) {
        return res.status(403).json({
          success: false,
          message: "Access Denied! User does not exist or role is invalid.",
        });
      }

      // Attach user details to the request
      req.user = decoded;
      req.token = token;
      next();
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error validating token",
    });
  }
};

module.exports = { authorization };