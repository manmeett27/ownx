const express = require("express");
const router = express.Router();
const pool = require("../config/db");

// POST /api/followers/follow - Follow a user
router.post("/follow", async (req, res) => {
    const { user_id, follower_user_id } = req.body;

    if (!user_id || !follower_user_id) {
        return res.status(400).json({ error: "Both user_id and follower_user_id are required" });
    }

    if (Number(user_id) === Number(follower_user_id)) {
        return res.status(400).json({ error: "Users cannot follow themselves" });
    }

    try {
        const result = await pool.query(
            `
            INSERT INTO followers (user_id, follower_user_id)
            VALUES ($1, $2)
            RETURNING *
            `,
            [user_id, follower_user_id]
        );
        res.status(201).json({ message: "Successfully followed user", follower: result.rows[0] });
    } catch (err) {
        console.error("Error following user:", err.message);
        res.status(500).json({ error: "Failed to follow user" });
    }
});

// POST /api/followers/unfollow - Unfollow a user
router.post("/unfollow", async (req, res) => {
    const { user_id, follower_user_id } = req.body;

    if (!user_id || !follower_user_id) {
        return res.status(400).json({ error: "Both user_id and follower_user_id are required" });
    }

    try {
        await pool.query(
            `
            DELETE FROM followers
            WHERE user_id = $1 AND follower_user_id = $2
            `,
            [user_id, follower_user_id]
        );
        res.json({ message: "Successfully unfollowed user" });
    } catch (err) {
        console.error("Error unfollowing user:", err.message);
        res.status(500).json({ error: "Failed to unfollow user" });
    }
});

// GET /api/followers/:user_id - Get followers of a specific user
router.get("/:user_id", async (req, res) => {
    const { user_id } = req.params;
    try {
        const result = await pool.query(
            `
            SELECT f.*, u.username
            FROM followers f
            JOIN users u ON f.follower_user_id = u.user_id
            WHERE f.user_id = $1
            `,
            [user_id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching followers:", err.message);
        res.status(500).json({ error: "Failed to retrieve followers" });
    }
});

// GET /api/followers/:user_id/following - Get users followed by a specific user
router.get("/:user_id/following", async (req, res) => {
    const { user_id } = req.params;
    try {
        const result = await pool.query(
            `
            SELECT f.*, u.username
            FROM followers f
            JOIN users u ON f.user_id = u.user_id
            WHERE f.follower_user_id = $1
            `,
            [user_id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching following:", err.message);
        res.status(500).json({ error: "Failed to retrieve following users" });
    }
});

module.exports = router;
