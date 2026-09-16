const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { authenticateUser, JWT_SECRET } = require("../middleware/auth");
const upload = require("../middleware/upload");
const { uploadMediaStream } = require("../config/cloudinary");

// Helper to generate JWT token
function generateToken(user) {
  return jwt.sign(
    {
      user_id: user.user_id,
      username: user.username
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

// GET /api/users/me - Get current authenticated user profile
router.get("/me", authenticateUser, async (req, res) => {
  try {
    res.json({
      user: req.user
    });
  } catch (err) {
    console.error("Error retrieving current user:", err.message);
    res.status(500).json({ error: "Failed to fetch user profile" });
  }
});

// GET /api/users - Get list of users (excluding password hashes)
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT user_id, username, name, bio, profile_pic, location_str, latitude, longitude, created_at 
      FROM users
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching users:", err.message);
    res.status(500).json({ error: "Failed to retrieve users" });
  }
});

// GET /api/users/:user_id - Get specific user profile
router.get("/:user_id", async (req, res) => {
  const { user_id } = req.params;
  try {
    const result = await pool.query(`
      SELECT user_id, username, name, bio, profile_pic, location_str, latitude, longitude, created_at 
      FROM users 
      WHERE user_id = $1
    `, [user_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error fetching user:", err.message);
    res.status(500).json({ error: "Failed to retrieve user" });
  }
});

// POST /api/users/register - Register a new user and generate JWT token
router.post("/register", async (req, res) => {
  const { username, password, password_hash, name, bio, location_str, latitude, longitude } = req.body;
  const rawPassword = password || password_hash;

  if (!username || !rawPassword) {
    return res.status(400).json({ error: "Username and password are required" });
  }

  const trimmedUsername = String(username).trim();
  if (trimmedUsername.length < 3) {
    return res.status(400).json({ error: "Username must be at least 3 characters long." });
  }

  try {
    // Check if user already exists (case-insensitive)
    const existing = await pool.query(
      "SELECT user_id FROM users WHERE LOWER(username) = LOWER($1)",
      [trimmedUsername]
    );

    if (existing.rows && existing.rows.length > 0) {
      return res.status(400).json({ error: "Username already taken. Please choose a different username." });
    }

    // Hash password if not already hashed
    let hashedPassword = rawPassword;
    if (!rawPassword.startsWith("$2b$") && !rawPassword.startsWith("$2a$")) {
      const saltRounds = 10;
      hashedPassword = await bcrypt.hash(rawPassword, saltRounds);
    }

    const result = await pool.query(`
      INSERT INTO users (username, password_hash, name, bio, location_str, latitude, longitude)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING user_id, username, name, bio, profile_pic, location_str, latitude, longitude, created_at
    `, [
      trimmedUsername, 
      hashedPassword, 
      name ? String(name).trim() : trimmedUsername, 
      bio || "", 
      location_str || "", 
      latitude || null, 
      longitude || null
    ]);

    const newUser = result.rows[0];
    const token = generateToken(newUser);

    res.status(201).json({
      message: "Registration successful",
      token,
      user: newUser
    });
  } catch (err) {
    console.error("Error registering user:", err.message);
    if (
      err.code === "23505" ||
      (err.message && (
        err.message.includes("unique constraint") ||
        err.message.includes("duplicate key") ||
        err.message.includes("already exists")
      ))
    ) {
      return res.status(400).json({ error: "Username already taken. Please choose a different username." });
    }
    res.status(500).json({ error: "Failed to register user: " + (err.message || "Unknown server error") });
  }
});

// POST /api/users/login - Authenticate user and return JWT token
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }

  const trimmedUsername = String(username).trim();

  try {
    const result = await pool.query(
      "SELECT * FROM users WHERE LOWER(username) = LOWER($1)",
      [trimmedUsername]
    );

    if (!result.rows || result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const user = result.rows[0];
    let isValid = false;

    const storedHash = user.password_hash || user.encrypted_password;
    if (storedHash && (storedHash.startsWith("$2b$") || storedHash.startsWith("$2a$"))) {
      isValid = await bcrypt.compare(password, storedHash);
    } else if (storedHash) {
      isValid = (password === storedHash);
    }

    if (!isValid) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const { password_hash, encrypted_password, ...userProfile } = user;
    const token = generateToken(userProfile);

    res.json({
      message: "Login successful",
      token,
      user: userProfile
    });
  } catch (err) {
    console.error("Error logging in:", err.message);
    res.status(500).json({ error: "Failed to log in: " + (err.message || "Unknown server error") });
  }
});

// PUT /api/users/profile/photo - Upload profile photo to Cloudinary and update user record
router.put("/profile/photo", authenticateUser, (req, res, next) => {
  upload.any()(req, res, (err) => {
    if (err) {
      console.error("Multer profile photo upload error:", err.message);
      return res.status(400).json({ error: err.message });
    }
    if (req.files && req.files.length > 0) {
      req.file = req.files.find(f => f.fieldname === "photo" || f.fieldname === "image" || f.fieldname === "file") || req.files[0];
    }
    next();
  });
}, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No photo file provided." });
    }

    // Upload directly to Cloudinary using upload_stream
    const uploadResult = await uploadMediaStream(req.file.buffer, {
      folder: "ownx_profiles",
      transformation: [
        { width: 500, height: 500, crop: "fill", gravity: "face" }
      ]
    });

    const photoUrl = uploadResult.secure_url || uploadResult.url;

    // Update database record for authenticated user across both profile columns
    const result = await pool.query(
      "UPDATE users SET profile_pic = $1, profile_image_url = $1 WHERE user_id = $2 RETURNING user_id, username, name, bio, profile_pic, profile_image_url, location_str, latitude, longitude, created_at",
      [photoUrl, req.user.user_id]
    );

    res.json({
      message: "Profile photo updated successfully",
      profile_pic: photoUrl,
      provider: uploadResult.provider || "local",
      user: result.rows[0]
    });
  } catch (err) {
    console.error("Profile photo upload error:", err.message);
    res.status(err.http_code || 500).json({
      error: err.message || "Failed to upload profile photo to Cloudinary."
    });
  }
});

// PUT /api/users/:user_id - Update user profile information
router.put("/:user_id", authenticateUser, async (req, res) => {
  const { user_id } = req.params;
  const { name, username, bio, profile_pic, location_str, latitude, longitude } = req.body;

  // Ensure user is updating their own profile
  if (Number(req.user.user_id) !== Number(user_id)) {
    return res.status(403).json({ error: "You are not authorized to edit another user's profile." });
  }

  try {
    const currentResult = await pool.query("SELECT * FROM users WHERE user_id = $1", [user_id]);
    if (currentResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    const current = currentResult.rows[0];

    const updatedName = name !== undefined ? name : (current.name || "");
    const updatedUsername = username !== undefined ? username : current.username;
    const updatedBio = bio !== undefined ? bio : (current.bio || "");
    const updatedProfilePic = profile_pic !== undefined ? profile_pic : (current.profile_pic || "");
    const updatedLocationStr = location_str !== undefined ? location_str : (current.location_str || "");
    const updatedLatitude = latitude !== undefined ? latitude : current.latitude;
    const updatedLongitude = longitude !== undefined ? longitude : current.longitude;

    const result = await pool.query(`
      UPDATE users 
      SET name = $1, username = $2, bio = $3, profile_pic = $4, location_str = $5, latitude = $6, longitude = $7
      WHERE user_id = $8
      RETURNING user_id, username, name, bio, profile_pic, location_str, latitude, longitude, created_at
    `, [
      updatedName,
      updatedUsername,
      updatedBio,
      updatedProfilePic,
      updatedLocationStr,
      updatedLatitude,
      updatedLongitude,
      user_id
    ]);

    res.json({
      message: "Profile updated successfully",
      user: result.rows[0]
    });
  } catch (err) {
    console.error("Error updating user profile:", err.message);
    if (err.code === "23505") {
      return res.status(400).json({ error: "Username already taken by another user." });
    }
    res.status(500).json({ error: "Failed to update profile", details: err.message });
  }
});

module.exports = router;