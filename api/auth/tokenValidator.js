const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET; 
// const JWT_EXPIRATION = process.env.JWT_EXPIRATION || "4h";

const authorization = (req, res, next) => {
  // Extract token from the Authorization header
  const authHeader = req.headers["authorization"];

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).send({
      success: false,
      message: "Access Denied! Token not provided or invalid format.",
    });
  }

  const token = authHeader.split(" ")[1]; // Extract the token after "Bearer"

  // Verify the JWT token
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      console.error("Error verifying token:", err);
      return res.status(403).send({
        success: false,
        message: "Invalid or expired token!",
      });
    }

    // Attach decoded user information to the request
    req.user = decoded;
    console.log("Token verified successfully!", decoded);

    next();
  });
};

module.exports = { authorization };
