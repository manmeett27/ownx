const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const { optionalAuthenticateUser } = require("../middleware/auth");
const upload = require("../middleware/upload");
const { uploadMediaStream } = require("../config/cloudinary");

// AI Moderation Helper: Calls Python Content Moderation microservice on port 5001
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
    // Content moderator service may be offline or initializing
  }

  // Resilient local fallback heuristic
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
      reason: "Local fallback: Detected inappropriate content",
      matched_keywords: matched
    };
  }
  return { flagged: false };
}

// AI Moderation Helper: Checks images for prohibited categories
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
    // Content moderator service may be offline or initializing
  }

  // Local fallback check
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

// 1. Get all posts with populated author details
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        p.post_id,
        p.user_id,
        p.caption,
        p.image_url,
        p.post_type,
        p.category_id,
        p.interest_id,
        p.location_id,
        p.location_str,
        p.created_at,
        u.username,
        u.name,
        u.profile_pic,
        u.location_str as user_location
      FROM posts p
      LEFT JOIN users u ON p.user_id = u.user_id
      ORDER BY p.created_at DESC
    `);

    // Standardize post response with both top-level and nested author fields
    const posts = (result.rows || []).map((row) => {
      const authorName = row.name || row.username || "Community Member";
      const authorUsername = row.username || `user_${row.user_id || 1}`;
      const authorPic = row.profile_pic || "";
      const authorLocation = row.location_str || row.user_location || "";

      return {
        post_id: row.post_id,
        user_id: row.user_id,
        caption: row.caption || "",
        image_url: row.image_url || null,
        post_type: row.post_type || "text",
        created_at: row.created_at,
        location_str: authorLocation,
        name: authorName,
        username: authorUsername,
        profile_pic: authorPic,
        author: {
          user_id: row.user_id,
          name: authorName,
          username: authorUsername,
          profile_pic: authorPic,
          location_str: authorLocation
        }
      };
    });

    res.json(posts);
  } catch (err) {
    console.error("Error fetching posts:", err.message);
    res.status(500).json({ error: "Failed to retrieve posts" });
  }
});

// GET /api/posts/user/:user_id - Get all posts created by a specific user
router.get("/user/:user_id", async (req, res) => {
  const { user_id } = req.params;
  try {
    const result = await pool.query(`
      SELECT 
        p.post_id,
        p.user_id,
        p.caption,
        p.image_url,
        p.post_type,
        p.category_id,
        p.interest_id,
        p.location_id,
        p.location_str,
        p.created_at,
        u.username,
        u.name,
        u.profile_pic,
        u.location_str as user_location
      FROM posts p
      LEFT JOIN users u ON p.user_id = u.user_id
      WHERE p.user_id = $1
      ORDER BY p.created_at DESC
    `, [user_id]);

    const posts = (result.rows || []).map((row) => {
      const authorName = row.name || row.username || "Community Member";
      const authorUsername = row.username || `user_${row.user_id || 1}`;
      const authorPic = row.profile_pic || "";
      const authorLocation = row.location_str || row.user_location || "";

      return {
        post_id: row.post_id,
        user_id: row.user_id,
        caption: row.caption || "",
        image_url: row.image_url || null,
        post_type: row.post_type || "text",
        created_at: row.created_at,
        location_str: authorLocation,
        name: authorName,
        username: authorUsername,
        profile_pic: authorPic,
        author: {
          user_id: row.user_id,
          name: authorName,
          username: authorUsername,
          profile_pic: authorPic,
          location_str: authorLocation
        }
      };
    });

    res.json(posts);
  } catch (err) {
    console.error("Error fetching user posts:", err.message);
    res.status(500).json({ error: "Failed to retrieve user posts" });
  }
});

// Middleware to handle single file upload with any common field name ('media', 'image', 'file')
const handleMediaUpload = (req, res, next) => {
  upload.any()(req, res, (err) => {
    if (err) {
      console.error("Multer upload error:", err.message);
      return res.status(400).json({ error: err.message });
    }
    if (req.files && req.files.length > 0) {
      req.file = req.files[0];
    }
    next();
  });
};

// 2. Create a new post (Supports JWT auth, multipart file upload, and JSON payload)
router.post("/", optionalAuthenticateUser, handleMediaUpload, async (req, res) => {
  const { caption, location_str, post_type, image_url, media_url, user_id, category_id, interest_id, location_id } = req.body;

  // AI Moderation check on text caption
  if (caption) {
    const textResult = await moderateText(caption);
    if (textResult.flagged) {
      return res.status(400).json({
        error: "Post caption violates content guidelines",
        moderation: textResult
      });
    }
  }

  // AI Moderation check on media
  const mediaToCheck = image_url || media_url || (req.file ? req.file.originalname : null);
  if (mediaToCheck) {
    const imageResult = await moderateImage(mediaToCheck);
    if (imageResult.flagged) {
      return res.status(400).json({
        error: "Uploaded image violates content guidelines",
        moderation: imageResult
      });
    }
  }

  // Resolve author: prefer authenticated JWT user, fallback to body.user_id or default community member
  let author = req.user;
  if (!author && user_id) {
    try {
      const userResult = await pool.query(
        "SELECT user_id, username, name, bio, profile_pic, location_str FROM users WHERE user_id = $1",
        [user_id]
      );
      if (userResult.rows && userResult.rows.length > 0) {
        author = userResult.rows[0];
      }
    } catch (e) {
      console.warn("Author lookup notice:", e.message);
    }
  }

  if (!author) {
    author = {
      user_id: user_id ? Number(user_id) : 1,
      username: "Community Member",
      name: "Community Member",
      profile_pic: "",
      location_str: location_str || ""
    };
  }

  let finalMediaUrl = image_url || media_url || null;
  let finalPostType = post_type || (finalMediaUrl ? (finalMediaUrl.includes(".mp4") ? "video" : "image") : "text");

  try {
    // If a media file was sent via multipart/form-data, process upload
    if (req.file) {
      const isVideo = req.file.mimetype.startsWith("video/");
      finalPostType = isVideo ? "video" : "image";

      const uploadResult = await uploadMediaStream(req.file.buffer, {
        folder: "ownx_posts",
        resource_type: finalPostType
      });

      finalMediaUrl = uploadResult.secure_url || uploadResult.url;
    }

    if (!caption && !finalMediaUrl) {
      return res.status(400).json({ error: "Post must contain either text caption or media attachment." });
    }

    // Insert post into database
    const result = await pool.query(`
      INSERT INTO posts (user_id, caption, image_url, post_type, category_id, interest_id, location_id, location_str)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [
      author.user_id,
      caption || null,
      finalMediaUrl,
      finalPostType,
      category_id || 1,
      interest_id || 1,
      location_id || null,
      location_str || author.location_str || null
    ]);

    const newPost = result.rows[0];

    // Mirror to media table if media attached
    if (finalMediaUrl && newPost.post_id) {
      try {
        await pool.query(
          "INSERT INTO media (post_id, media_url, media_type) VALUES ($1, $2, $3)",
          [newPost.post_id, finalMediaUrl, finalPostType]
        );
      } catch (mErr) {
        console.warn("Media table insert notice:", mErr.message);
      }
    }

    // Return the newly created post fully populated with author information
    const populatedPost = {
      post_id: newPost.post_id,
      user_id: author.user_id,
      caption: newPost.caption || "",
      image_url: newPost.image_url,
      post_type: newPost.post_type,
      created_at: newPost.created_at,
      location_str: newPost.location_str || author.location_str || "",
      name: author.name || author.username,
      username: author.username,
      profile_pic: author.profile_pic || "",
      author: {
        user_id: author.user_id,
        name: author.name || author.username,
        username: author.username,
        profile_pic: author.profile_pic || "",
        location_str: author.location_str || ""
      }
    };

    res.status(201).json(populatedPost);
  } catch (err) {
    console.error("Error creating post:", err.message);
    res.status(err.http_code || 500).json({
      error: err.message || "Failed to create post"
    });
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
    console.error("Error fetching comments:", err.message);
    res.status(500).json({ error: "Failed to retrieve comments" });
  }
});

// 4. Create comment for a post (Supports JWT auth and direct username payload)
router.post("/:post_id/comments", optionalAuthenticateUser, async (req, res) => {
  const { post_id } = req.params;
  const { content, username } = req.body;

  if (!content || !content.trim()) {
    return res.status(400).json({ error: "Comment content cannot be blank" });
  }

  // AI Moderation check for comment content
  const textResult = await moderateText(content.trim());
  if (textResult.flagged) {
    return res.status(400).json({
      error: "Comment violates content guidelines",
      moderation: textResult
    });
  }

  const authorUsername = (req.user && req.user.username) || username || "Anonymous";

  try {
    const result = await pool.query(`
      INSERT INTO comments (post_id, username, content)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [post_id, authorUsername, content.trim()]);
    
    res.status(201).json({
      message: "Comment added successfully",
      comment: result.rows[0]
    });
  } catch (err) {
    console.error("Error adding comment:", err.message);
    if (err.message.includes("Post not found") || err.code === "23503") {
      return res.status(404).json({ error: "Post not found" });
    }
    res.status(500).json({ error: "Failed to add comment" });
  }
});

module.exports = router;
