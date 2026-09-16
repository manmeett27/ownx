const { Pool } = require("pg");
require("dotenv").config();

// In-Memory Database Emulator for PostgreSQL with Full Table & Query Support
class MockDbPool {
  constructor() {
    this.isMock = true;
    this.users = [
      {
        user_id: 1,
        username: "Alice",
        name: "Alice Spatial",
        bio: "Exploring creative tech, 3D web experiences, and community design.",
        profile_pic: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80",
        location_str: "San Francisco, CA",
        latitude: 37.7749,
        longitude: -122.4194,
        password_hash: "$2b$10$wT5H...hash1",
        location_id: 1,
        created_at: new Date()
      },
      {
        user_id: 2,
        username: "Bob",
        name: "Bob Reynolds",
        bio: "Creative technologist and open-source enthusiast.",
        profile_pic: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80",
        location_str: "New York, NY",
        latitude: 40.7128,
        longitude: -74.0060,
        password_hash: "$2b$10$wT5H...hash2",
        location_id: 2,
        created_at: new Date()
      }
    ];
    this.locations = [
      { location_id: 1, location_name: "San Francisco" },
      { location_id: 2, location_name: "New York" }
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
        caption: "Welcome to OWNX - a next-generation social network and collaborative workspace!",
        image_url: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=1200&q=80",
        post_type: "image",
        category_id: 1,
        interest_id: 1,
        location_id: 1,
        location_str: "San Francisco, CA",
        created_at: new Date(Date.now() - 3600000)
      },
      {
        post_id: 2,
        user_id: 2,
        caption: "Experimenting with spatial web animations, responsive design tokens, and real-time media feeds.",
        image_url: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80",
        post_type: "image",
        category_id: 2,
        interest_id: 2,
        location_id: 2,
        location_str: "New York, NY",
        created_at: new Date(Date.now() - 7200000)
      }
    ];
    this.comments = [
      {
        comment_id: 1,
        post_id: 1,
        username: "Bob",
        content: "Love the clean teal aesthetic and the smooth 3D visuals!",
        created_at: new Date(Date.now() - 1800000)
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

    // 2. CREATE TABLE / ALTER TABLE
    if (normalized.startsWith("CREATE TABLE") || normalized.startsWith("ALTER TABLE")) {
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
      const sanitized = matched.map(({ password_hash, ...u }) => u);
      return { rows: sanitized };
    }

    // UPDATE users SET profile_pic = $1 WHERE user_id = $2
    if (normalized.includes("UPDATE users SET profile_pic = $1 WHERE user_id = $2")) {
      const [profile_pic, user_id] = params;
      const user = this.users.find(u => u.user_id === Number(user_id));
      if (!user) throw new Error("User not found");
      user.profile_pic = profile_pic;
      const { password_hash, ...sanitized } = user;
      return { rows: [sanitized] };
    }

    // UPDATE users SET name = $1, username = $2, bio = $3, profile_pic = $4, location_str = $5, latitude = $6, longitude = $7 WHERE user_id = $8
    if (normalized.startsWith("UPDATE users SET")) {
      const [name, username, bio, profile_pic, location_str, latitude, longitude, user_id] = params;
      const user = this.users.find(u => u.user_id === Number(user_id));
      if (!user) {
        throw new Error("User not found");
      }
      if (name !== undefined) user.name = name;
      if (username !== undefined) user.username = username;
      if (bio !== undefined) user.bio = bio;
      if (profile_pic !== undefined) user.profile_pic = profile_pic;
      if (location_str !== undefined) user.location_str = location_str;
      if (latitude !== undefined) user.latitude = latitude;
      if (longitude !== undefined) user.longitude = longitude;
      const { password_hash, ...sanitized } = user;
      return { rows: [sanitized] };
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
      const name = params[2] || username;
      const bio = params[3] || "";
      const location_str = params[4] || "";
      const latitude = params[5] || null;
      const longitude = params[6] || null;

      const existing = this.users.find(u => u.username.toLowerCase() === username.toLowerCase());
      if (existing) {
        const err = new Error("Username already exists");
        err.code = "23505";
        throw err;
      }
      const newUser = {
        user_id: this.users.length + 1,
        username,
        name,
        bio,
        profile_pic: "",
        location_str,
        latitude,
        longitude,
        password_hash: hash,
        location_id: 1,
        created_at: new Date()
      };
      this.users.push(newUser);
      const { password_hash, ...result } = newUser;
      return { rows: [result] };
    }

    // SELECT posts joined with user details
    if (normalized.includes("FROM posts p") || normalized.includes("SELECT p.*")) {
      const joinedPosts = this.posts.map(p => {
        const u = this.users.find(user => user.user_id === p.user_id);
        const authorName = u ? (u.name || u.username) : "Community Member";
        const authorUsername = u ? u.username : `user_${p.user_id || 1}`;
        const authorPic = u ? (u.profile_pic || "") : "";
        const authorLocation = u ? (u.location_str || "") : "";

        return {
          ...p,
          username: authorUsername,
          name: authorName,
          profile_pic: authorPic,
          location_str: p.location_str || authorLocation,
          author: {
            user_id: p.user_id,
            username: authorUsername,
            name: authorName,
            profile_pic: authorPic
          }
        };
      });
      joinedPosts.sort((a, b) => b.created_at - a.created_at);
      return { rows: joinedPosts };
    }

    // INSERT INTO posts
    if (normalized.startsWith("INSERT INTO posts")) {
      const [user_id, caption, image_url, post_type, category_id, interest_id, location_id, location_str] = params;
      const newPost = {
        post_id: this.posts.length + 1,
        user_id: user_id ? Number(user_id) : null,
        caption: caption || null,
        image_url: image_url || null,
        post_type: post_type || "image",
        category_id: category_id ? Number(category_id) : 1,
        interest_id: interest_id ? Number(interest_id) : 1,
        location_id: location_id ? Number(location_id) : null,
        location_str: location_str || "",
        created_at: new Date()
      };
      this.posts.unshift(newPost);
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
      port: process.env.DB_PORT || 10203,
      database: process.env.DB_NAME || "ownX",
      user: process.env.DB_USER || "postgres",
      password: process.env.DB_PASSWORD || process.env.DB_PASS || "010203",
      connectionTimeoutMillis: 5000,
      ssl: isRemoteDb ? { rejectUnauthorized: false } : false
    });

    dbPool = {
      isMock: false,
      realPool: pgPool,
      // No MockDbPool fallback — real errors must surface so the API returns honest responses.
      // Silent fallback was causing register to appear to work (against mock) but login to
      // always fail (mock has different fake users with non-bcrypt passwords).
      async query(sqlText, params) {
        return pgPool.query(sqlText, params);
      }
    };
  } catch (e) {
    console.warn("[DB Strategy] Failed to initialize PostgreSQL pool. Falling back to MockDbPool.", e.message);
    dbPool = new MockDbPool();
  }
}

module.exports = dbPool;