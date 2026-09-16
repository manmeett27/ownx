const jwt = require("jsonwebtoken");
const pool = require("../config/db");

const JWT_SECRET = process.env.JWT_SECRET || "ownx_jwt_production_secret_key_2026_secured";

/**
 * Authentication Middleware
 * Validates the JWT from Authorization: Bearer <token> header,
 * extracts the authenticated user from the database, and attaches it to req.user.
 */
async function authenticateUser(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Authentication required. Please log in to perform this action.",
        code: "AUTH_REQUIRED"
      });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({
        error: "Authentication token missing.",
        code: "TOKEN_MISSING"
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({
          error: "Your session has expired. Please log in again.",
          code: "TOKEN_EXPIRED"
        });
      }
      return res.status(401).json({
        error: "Invalid authentication token. Please log in again.",
        code: "INVALID_TOKEN"
      });
    }

    const userId = decoded.user_id || decoded.userId;
    if (!userId) {
      return res.status(401).json({
        error: "Invalid token payload.",
        code: "INVALID_PAYLOAD"
      });
    }

    // Look up user in database
    const userResult = await pool.query(
      "SELECT user_id, username, name, bio, profile_pic, location_str, latitude, longitude, created_at FROM users WHERE user_id = $1",
      [userId]
    );

    if (!userResult.rows || userResult.rows.length === 0) {
      return res.status(401).json({
        error: "Authenticated user not found. Your account may have been removed.",
        code: "USER_NOT_FOUND"
      });
    }

    // Attach authenticated user to request
    req.user = userResult.rows[0];
    req.userId = userResult.rows[0].user_id;
    next();
  } catch (err) {
    console.error("Authentication middleware error:", err.message);
    return res.status(500).json({
      error: "Authentication service error. Please try again later.",
      details: err.message
    });
  }
}

/**
 * Optional Authentication Middleware
 * If JWT is present and valid, attaches user to req.user.
 * If not present or invalid, proceeds without failing.
 */
async function optionalAuthenticateUser(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next();
    }

    const token = authHeader.split(" ")[1];
    if (!token) return next();

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return next();
    }

    const userId = decoded.user_id || decoded.userId;
    if (!userId) return next();

    const userResult = await pool.query(
      "SELECT user_id, username, name, bio, profile_pic, location_str, latitude, longitude, created_at FROM users WHERE user_id = $1",
      [userId]
    );

    if (userResult.rows && userResult.rows.length > 0) {
      req.user = userResult.rows[0];
      req.userId = userResult.rows[0].user_id;
    }
    next();
  } catch (err) {
    // Silently continue without authenticated user
    next();
  }
}

module.exports = {
  authenticateUser,
  optionalAuthenticateUser,
  JWT_SECRET
};
