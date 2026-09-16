const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const { authenticateUser } = require("../middleware/auth");
const upload = require("../middleware/upload");
const { uploadMediaStream } = require("../config/cloudinary");

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

// Middleware to handle single file upload with any common field name ('media', 'image', 'file')
const handleMediaUpload = (req, res, next) => {
  upload.any()(req, res, (err) => {
    if (err) {
      console.error("Multer upload error:", err.message);
      return res.status(400).json({ error: err.message });
    }
    // If files were uploaded, pick the first one and attach to req.file
    if (req.files && req.files.length > 0) {
      req.file = req.files[0];
    }
    next();
  });
};

// 2. Create a new post (PROTECTED: Author derived strictly from JWT)
router.post("/", authenticateUser, handleMediaUpload, async (req, res) => {
  const { caption, location_str, post_type } = req.body;
  const authUser = req.user; // Authenticated user verified by JWT

  let finalMediaUrl = null;
  let finalPostType = post_type || "text";

  try {
    // If a media file was sent via multipart/form-data, upload to Cloudinary
    if (req.file) {
      const isVideo = req.file.mimetype.startsWith("video/");
      finalPostType = isVideo ? "video" : "image";

      const uploadResult = await uploadMediaStream(req.file.buffer, {
        folder: "ownx_posts",
        resource_type: finalPostType
      });

      finalMediaUrl = uploadResult.secure_url;
    }

    if (!caption && !finalMediaUrl) {
      return res.status(400).json({ error: "Post must contain either text caption or media attachment." });
    }

    // Insert post into database with authenticated user ID
    const result = await pool.query(`
      INSERT INTO posts (user_id, caption, image_url, post_type, category_id, interest_id, location_id, location_str)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [
      authUser.user_id, // AUTHOR ALWAYS COMES FROM AUTHENTICATED USER
      caption || null,
      finalMediaUrl,
      finalPostType,
      1,
      1,
      null,
      location_str || authUser.location_str || null
    ]);

    const newPost = result.rows[0];

    // Return the newly created post fully populated with author information
    const populatedPost = {
      post_id: newPost.post_id,
      user_id: authUser.user_id,
      caption: newPost.caption || "",
      image_url: newPost.image_url,
      post_type: newPost.post_type,
      created_at: newPost.created_at,
      location_str: newPost.location_str || authUser.location_str || "",
      name: authUser.name || authUser.username,
      username: authUser.username,
      profile_pic: authUser.profile_pic || "",
      author: {
        user_id: authUser.user_id,
        name: authUser.name || authUser.username,
        username: authUser.username,
        profile_pic: authUser.profile_pic || "",
        location_str: authUser.location_str || ""
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

// 4. Create comment for a post (PROTECTED)
router.post("/:post_id/comments", authenticateUser, async (req, res) => {
  const { post_id } = req.params;
  const { content } = req.body;
  const authUser = req.user;

  if (!content || !content.trim()) {
    return res.status(400).json({ error: "Comment content cannot be blank" });
  }

  try {
    const result = await pool.query(`
      INSERT INTO comments (post_id, username, content)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [post_id, authUser.username || "Anonymous", content.trim()]);
    
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
