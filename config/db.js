const { Pool } = require("pg");
require("dotenv").config();

// In-Memory Database Emulator for PostgreSQL
class MockDbPool {
  constructor() {
    this.users = [
      { user_id: 1, username: "Alice", password_hash: "pass1" },
      { user_id: 2, username: "Bob", password_hash: "pass2" }
    ];
    this.posts = [
      {
        post_id: 1,
        user_id: 1,
        caption: "Welcome to OWNX - a next generation social platform!",
        image_url: "media/images/healthy_food.png",
        post_type: "image",
        category_id: 1,
        interest_id: 1,
        location_id: 1,
        created_at: new Date()
      }
    ];
    this.comments = [
      {
        comment_id: 1,
        post_id: 1,
        username: "Bob",
        content: "Awesome platform! Keep it up.",
        created_at: new Date()
      }
    ];
  }

  async query(sqlText, params = []) {
    // Normalize space and newlines
    const normalized = sqlText.replace(/\s+/g, " ").trim();

    // 1. SELECT NOW()
    if (normalized.includes("SELECT NOW()")) {
      return { rows: [{ now: new Date() }] };
    }

    // 2. CREATE TABLE
    if (normalized.includes("CREATE TABLE")) {
      // Stub creation
      return { rows: [] };
    }

    // 3. SELECT * FROM users
    if (normalized.startsWith("SELECT * FROM users")) {
      return { rows: this.users };
    }

    // 4. INSERT INTO users
    if (normalized.startsWith("INSERT INTO users")) {
      const [username, hash] = params;
      const newUser = {
        user_id: this.users.length + 1,
        username: username || "anonymous",
        password_hash: hash || ""
      };
      this.users.push(newUser);
      return { rows: [newUser] };
    }

    // 5. SELECT p.*, u.username FROM posts p LEFT JOIN users u
    if (normalized.includes("SELECT p.*, u.username FROM posts p")) {
      const joinedPosts = this.posts.map(p => {
        const u = this.users.find(user => user.user_id === p.user_id);
        return {
          ...p,
          username: u ? u.username : "Anonymous"
        };
      });
      // Sort by created_at DESC
      joinedPosts.sort((a, b) => b.created_at - a.created_at);
      return { rows: joinedPosts };
    }

    // 6. INSERT INTO posts
    if (normalized.startsWith("INSERT INTO posts")) {
      const [user_id, caption, image_url, post_type, category_id, interest_id, location_id] = params;
      const newPost = {
        post_id: this.posts.length + 1,
        user_id: user_id || null,
        caption: caption || null,
        image_url: image_url || null,
        post_type: post_type || "image",
        category_id: category_id || null,
        interest_id: interest_id || null,
        location_id: location_id || null,
        created_at: new Date()
      };
      this.posts.push(newPost);
      return { rows: [newPost] };
    }

    // 7. SELECT * FROM comments WHERE post_id = $1
    if (normalized.startsWith("SELECT * FROM comments")) {
      const [post_id] = params;
      const matched = this.comments.filter(c => c.post_id === Number(post_id));
      matched.sort((a, b) => a.created_at - b.created_at);
      return { rows: matched };
    }

    // 8. INSERT INTO comments
    if (normalized.startsWith("INSERT INTO comments")) {
      const [post_id, username, content] = params;
      const newComment = {
        comment_id: this.comments.length + 1,
        post_id: Number(post_id),
        username: username || "Anonymous",
        content: content || "",
        created_at: new Date()
      };
      this.comments.push(newComment);
      return { rows: [newComment] };
    }

    return { rows: [] };
  }
}

const pool = new MockDbPool();
module.exports = pool;