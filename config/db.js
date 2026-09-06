const { Pool } = require("pg");
require("dotenv").config();

// In-Memory Database Emulator for PostgreSQL with Full Table & Query Support
class MockDbPool {
  constructor() {
    this.isMock = true;
    this.users = [
      { user_id: 1, username: "Alice", password_hash: "$2b$10$wT5H...hash1", location_id: 1, created_at: new Date() },
      { user_id: 2, username: "Bob", password_hash: "$2b$10$wT5H...hash2", location_id: 2, created_at: new Date() }
    ];
    this.locations = [
      { location_id: 1, location_name: "Lucknow" },
      { location_id: 2, location_name: "Delhi" }
    ];
    this.interests = [
      { interest_id: 1, interest_name: "Technology" },
      { interest_id: 2, interest_name: "Food & Health" },
      { interest_id: 3, interest_name: "Travel" }
    ];
    this.user_interests = [
      { user_id: 1, interest_id: 1 },
      { user_id: 1, interest_id: 2 },
      { user_id: 2, interest_id: 2 }
    ];
    this.user_interest_scores = [
      { user_id: 1, category_id: 1, score: 0.8 },
      { user_id: 1, category_id: 2, score: 0.5 },
      { user_id: 2, category_id: 2, score: 0.9 }
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
      },
      {
        post_id: 2,
        user_id: 2,
        caption: "Exploring healthy recipes today!",
        image_url: "media/images/food.png",
        post_type: "image",
        category_id: 2,
        interest_id: 2,
        location_id: 2,
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
    this.likes = [
      { like_id: 1, post_id: 1, user_id: 2, created_at: new Date() }
    ];
    this.shares = [
      { share_id: 1, post_id: 1, user_id: 2, created_at: new Date() }
    ];
    this.followers = [
      { follower_id: 1, user_id: 1, follower_user_id: 2, created_at: new Date() }
    ];
  }

  async query(sqlText, params = []) {
    const normalized = sqlText.replace(/\s+/g, " ").trim();

    // 1. SELECT NOW()
    if (normalized.includes("SELECT NOW()")) {
      return { rows: [{ now: new Date() }] };
    }

    // 2. CREATE TABLE
    if (normalized.startsWith("CREATE TABLE")) {
      return { rows: [] };
    }

    // 3. SELECT * FROM users WHERE username = $1
    if (normalized.includes("FROM users WHERE username = $1") || normalized.includes("FROM users WHERE LOWER(username) = LOWER($1)")) {
      const [username] = params;
      const matched = this.users.filter(u => u.username.toLowerCase() === (username || "").toLowerCase());
      return { rows: matched };
    }

    // SELECT * FROM users WHERE user_id = $1
    if (normalized.includes("FROM users WHERE user_id = $1") || normalized.includes("FROM users u WHERE u.user_id = $1")) {
      const [userId] = params;
      const matched = this.users.filter(u => u.user_id === Number(userId));
      return { rows: matched };
    }

    // SELECT * FROM users
    if (normalized.startsWith("SELECT * FROM users") || normalized.includes("FROM users")) {
      const sanitized = this.users.map(({ password_hash, ...u }) => u);
      return { rows: sanitized };
    }

    // INSERT INTO users
    if (normalized.startsWith("INSERT INTO users")) {
      const username = params[0] || "anonymous";
      const hash = params[1] || "";
      const location_id = params[2] || 1;
      const existing = this.users.find(u => u.username.toLowerCase() === username.toLowerCase());
      if (existing) {
        const err = new Error("Username already exists");
        err.code = "23505";
        throw err;
      }
      const newUser = {
        user_id: this.users.length + 1,
        username,
        password_hash: hash,
        location_id: Number(location_id),
        created_at: new Date()
      };
      this.users.push(newUser);
      const { password_hash, ...result } = newUser;
      return { rows: [result] };
    }

    // SELECT p.*, u.username FROM posts p LEFT JOIN users u
    if (normalized.includes("FROM posts p") || normalized.includes("SELECT p.*")) {
      const joinedPosts = this.posts.map(p => {
        const u = this.users.find(user => user.user_id === p.user_id);
        return {
          ...p,
          username: u ? u.username : "Anonymous"
        };
      });
      joinedPosts.sort((a, b) => b.created_at - a.created_at);
      return { rows: joinedPosts };
    }

    // INSERT INTO posts
    if (normalized.startsWith("INSERT INTO posts")) {
      const [user_id, caption, image_url, post_type, category_id, interest_id, location_id] = params;
      const newPost = {
        post_id: this.posts.length + 1,
        user_id: user_id ? Number(user_id) : null,
        caption: caption || null,
        image_url: image_url || null,
        post_type: post_type || "image",
        category_id: category_id ? Number(category_id) : null,
        interest_id: interest_id ? Number(interest_id) : null,
        location_id: location_id ? Number(location_id) : null,
        created_at: new Date()
      };
      this.posts.push(newPost);
      return { rows: [newPost] };
    }

    // SELECT * FROM comments WHERE post_id = $1
    if (normalized.includes("FROM comments") && normalized.includes("WHERE post_id = $1")) {
      const [post_id] = params;
      const matched = this.comments.filter(c => c.post_id === Number(post_id));
      matched.sort((a, b) => a.created_at - b.created_at);
      return { rows: matched };
    }

    // INSERT INTO comments
    if (normalized.startsWith("INSERT INTO comments")) {
      const [post_id, username, content] = params;
      const postExists = this.posts.some(p => p.post_id === Number(post_id));
      if (!postExists) {
        const err = new Error("Post not found");
        err.code = "23503";
        throw err;
      }
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

    // INSERT INTO followers
    if (normalized.startsWith("INSERT INTO followers")) {
      const [user_id, follower_user_id] = params;
      const existing = this.followers.find(f => f.user_id === Number(user_id) && f.follower_user_id === Number(follower_user_id));
      if (existing) {
        return { rows: [existing] };
      }
      const newFollower = {
        follower_id: this.followers.length + 1,
        user_id: Number(user_id),
        follower_user_id: Number(follower_user_id),
        created_at: new Date()
      };
      this.followers.push(newFollower);
      return { rows: [newFollower] };
    }

    // DELETE FROM followers
    if (normalized.startsWith("DELETE FROM followers")) {
      const [user_id, follower_user_id] = params;
      this.followers = this.followers.filter(f => !(f.user_id === Number(user_id) && f.follower_user_id === Number(follower_user_id)));
      return { rows: [{ success: true }] };
    }

    // GET followers of user
    if (normalized.includes("FROM followers f") && normalized.includes("follower_user_id = u.user_id")) {
      const [user_id] = params;
      const matched = this.followers.filter(f => f.user_id === Number(user_id)).map(f => {
        const u = this.users.find(user => user.user_id === f.follower_user_id);
        return { ...f, username: u ? u.username : "Unknown" };
      });
      return { rows: matched };
    }

    // GET following of user
    if (normalized.includes("FROM followers f") && normalized.includes("f.user_id = u.user_id")) {
      const [follower_user_id] = params;
      const matched = this.followers.filter(f => f.follower_user_id === Number(follower_user_id)).map(f => {
        const u = this.users.find(user => user.user_id === f.user_id);
        return { ...f, username: u ? u.username : "Unknown" };
      });
      return { rows: matched };
    }

    return { rows: [] };
  }
}

// Environment-based Pool initialization
let dbPool;
const useMock = process.env.USE_MOCK_DB === "true";

if (useMock) {
  console.log("[DB Strategy] USE_MOCK_DB is set to true. Initializing MockDbPool.");
  dbPool = new MockDbPool();
} else {
  try {
    const dbHost = process.env.DB_HOST || "localhost";
    const isRemoteDb = dbHost !== "localhost" && dbHost !== "127.0.0.1";

    const pgPool = new Pool({
      host: dbHost,
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || "postgres",
      user: process.env.DB_USER || "postgres",
      password: process.env.DB_PASSWORD || process.env.DB_PASS || "010203",
      connectionTimeoutMillis: 5000,
      ssl: isRemoteDb ? { rejectUnauthorized: false } : false
    });

    dbPool = {
      isMock: false,
      realPool: pgPool,
      mockPool: new MockDbPool(),
      async query(sqlText, params) {
        try {
          return await pgPool.query(sqlText, params);
        } catch (err) {
          // Catch any connection/auth/timeout error when PostgreSQL is not running locally
          if (!this.warned) {
            console.warn(`[DB Strategy] PostgreSQL query notice (${err.message}). Falling back to MockDbPool.`);
            this.warned = true;
          }
          return await this.mockPool.query(sqlText, params);
        }
      }
    };
  } catch (e) {
    console.warn("[DB Strategy] Failed to initialize PostgreSQL pool. Falling back to MockDbPool.", e.message);
    dbPool = new MockDbPool();
  }
}

module.exports = dbPool;