const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const bcrypt = require("bcrypt");

// GET /api/users - Get list of users (excluding password hashes)
router.get("/", async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT user_id, username, location_id, created_at FROM users"
        );
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching users:", err.message);
        res.status(500).json({ error: "Failed to retrieve users" });
    }
});

// GET /api/users/:user_id - Get specific user
router.get("/:user_id", async (req, res) => {
    const { user_id } = req.params;
    try {
        const result = await pool.query(
            "SELECT user_id, username, location_id, created_at FROM users WHERE user_id = $1",
            [user_id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error("Error fetching user:", err.message);
        res.status(500).json({ error: "Failed to retrieve user" });
    }
});

// POST /api/users/register - Register a new user
router.post("/register", async (req, res) => {
    const { username, password, password_hash, location_id } = req.body;
    const rawPassword = password || password_hash;

    if (!username || !rawPassword) {
        return res.status(400).json({ error: "Username and password are required" });
    }

    try {
        // Hash password if not already hashed
        let hashedPassword = rawPassword;
        if (!rawPassword.startsWith("$2b$") && !rawPassword.startsWith("$2a$")) {
            const saltRounds = 10;
            hashedPassword = await bcrypt.hash(rawPassword, saltRounds);
        }

        const result = await pool.query(
            `
            INSERT INTO users (username, password_hash, location_id)
            VALUES ($1, $2, $3)
            RETURNING user_id, username, location_id, created_at
            `,
            [username, hashedPassword, location_id || 1]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error("Error registering user:", err.message);
        if (err.code === "23505" || err.message.includes("already exists")) {
            return res.status(400).json({ error: "Username already taken" });
        }
        res.status(500).json({ error: "Failed to register user" });
    }
});

// POST /api/users/login - Authenticate user
router.post("/login", async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
    }

    try {
        const result = await pool.query(
            "SELECT * FROM users WHERE LOWER(username) = LOWER($1)",
            [username]
        );

        if (!result.rows || result.rows.length === 0) {
            return res.status(401).json({ error: "Invalid username or password" });
        }

        const user = result.rows[0];
        let isValid = false;

        if (user.password_hash && (user.password_hash.startsWith("$2b$") || user.password_hash.startsWith("$2a$"))) {
            isValid = await bcrypt.compare(password, user.password_hash);
        } else {
            isValid = (password === user.password_hash);
        }

        if (!isValid) {
            return res.status(401).json({ error: "Invalid username or password" });
        }

        const { password_hash, ...userProfile } = user;
        res.json({
            message: "Login successful",
            user: userProfile
        });
    } catch (err) {
        console.error("Error logging in:", err.message);
        res.status(500).json({ error: "Failed to log in" });
    }
});

module.exports = router;