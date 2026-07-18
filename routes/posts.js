const express = require("express");
const router = express.Router();
const pool = require("../config/db");

// Helper function to call the Python Content Moderation AI Service
async function moderateText(text) {
    if (!text) return { flagged: false };
    try {
        const response = await fetch("http://127.0.0.1:5001/moderate/text", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text })
        });
        if (response.ok) {
            return await response.json();
        }
    } catch (err) {
        console.error("Moderation API text connection error:", err.message);
    }
    
    // Node.js fallback check if python API is offline
    const localBadWords = ["idiot", "moron", "loser", "shut up", "fuck", "porn", "kill", "murder", "scam"];
    const textLower = text.toLowerCase();
    const matched = [];
    for (const word of localBadWords) {
        if (textLower.includes(word)) {
            matched.push({ word, category: "harassment/inappropriate" });
        }
    }
    if (matched.length > 0) {
        return {
            flagged: true,
            reason: `Local fallback: Detected inappropriate content`,
            matched_keywords: matched
        };
    }
    return { flagged: false };
}

async function moderateImage(imagePath) {
    if (!imagePath) return { flagged: false };
    try {
        const response = await fetch("http://127.0.0.1:5001/moderate/image", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: `image_path=${encodeURIComponent(imagePath)}`
        });
        if (response.ok) {
            return await response.json();
        }
    } catch (err) {
        console.error("Moderation API image connection error:", err.message);
    }
    
    // Node.js fallback filename heuristic check if python API is offline
    const filename = imagePath.toLowerCase();
    const badPrefixes = ["alchol", "drugs", "sexual", "smoking", "violence", "weapons"];
    for (const prefix of badPrefixes) {
        if (filename.includes(prefix)) {
            return {
                flagged: true,
                reason: `Local fallback: Detected inappropriate image (${prefix})`,
                details: { category: prefix }
            };
        }
    }
    return { flagged: false };
}

// 1. Get all posts
router.get("/", async (req, res) => {
    try {
        // Fetch posts and join with user info
        const result = await pool.query(`
            SELECT p.*, u.username 
            FROM posts p
            LEFT JOIN users u ON p.user_id = u.user_id
            ORDER BY p.created_at DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to retrieve posts" });
    }
});

// 2. Create a new post
router.post("/", async (req, res) => {
    const { user_id, caption, image_url, post_type, category_id, interest_id, location_id } = req.body;

    // AI Moderation Checks
    if (caption) {
        const textResult = await moderateText(caption);
        if (textResult.flagged) {
            return res.status(400).json({
                error: "Post caption violates content guidelines",
                moderation: textResult
            });
        }
    }

    if (image_url) {
        const imageResult = await moderateImage(image_url);
        if (imageResult.flagged) {
            return res.status(400).json({
                error: "Uploaded image violates content guidelines",
                moderation: imageResult
            });
        }
    }

    try {
        const result = await pool.query(`
            INSERT INTO posts (user_id, caption, image_url, post_type, category_id, interest_id, location_id)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `, [
            user_id || null, 
            caption || null, 
            image_url || null, 
            post_type || "image", 
            category_id || null, 
            interest_id || null, 
            location_id || null
        ]);
        
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to create post" });
    }
});

// 3. Get comments for a post
router.get("/:post_id/comments", async (req, res) => {
    const { post_id } = req.params;
    try {
        const result = await pool.query(`
            SELECT * FROM comments 
            WHERE post_id = $1 
            ORDER BY created_at ASC
        `, [post_id]);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to retrieve comments" });
    }
});

// 4. Create comment for a post
router.post("/:post_id/comments", async (req, res) => {
    const { post_id } = req.params;
    const { username, content } = req.body;

    if (!content) {
        return res.status(400).json({ error: "Comment content is required" });
    }

    // AI Moderation check for comment content
    const textResult = await moderateText(content);
    if (textResult.flagged) {
        return res.status(400).json({
            error: "Comment violates content guidelines",
            moderation: textResult
        });
    }

    try {
        const result = await pool.query(`
            INSERT INTO comments (post_id, username, content)
            VALUES ($1, $2, $3)
            RETURNING *
        `, [post_id, username || "Anonymous", content]);
        
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to add comment" });
    }
});

module.exports = router;
