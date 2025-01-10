const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const db = require("../../api/config/db");

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

const authorization = async (req, res, next) => {

  console.log("Hello from tokenValidator");
  try {
    const authHeader = req.headers["authorization"];

    if (!authHeader || !authHeader.startsWith("Bearer ")  || authHeader.split(" ")[1] === "") {
      return res.status(401).json({
        success: false,
        message: "Access Denied! Token not provided or invalid format.",
      });
    }

    const token = authHeader.split(" ")[1];

    // Check if token is blacklisted
    const [blacklistedToken] = await db.query(
      'SELECT * FROM blacklisted_tokens WHERE token = ?',
      [token]
    );

    if (blacklistedToken.length > 0) {
      return res.status(401).json({
        success: false,
        message: "Token has been invalidated",
      });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(403).json({
          success: false,
          message: "Invalid or expired token!",
        });
      }

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
