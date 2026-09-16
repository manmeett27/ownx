const pool = require("./config/db");

// Initialize Database Tables if not exists
const initializeDatabase = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS locations (
                location_id SERIAL PRIMARY KEY,
                location_name VARCHAR(100) UNIQUE NOT NULL
            );
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS interests (
                interest_id SERIAL PRIMARY KEY,
                interest_name VARCHAR(100) UNIQUE NOT NULL
            );
        `);

        // Seed default locations and interests if empty
        await pool.query(`
            INSERT INTO locations (location_id, location_name) 
            VALUES (1, 'San Francisco'), (2, 'New York') 
            ON CONFLICT (location_id) DO NOTHING;
        `);

        await pool.query(`
            INSERT INTO interests (interest_id, interest_name) 
            VALUES (1, 'Technology'), (2, 'Food & Health'), (3, 'Travel') 
            ON CONFLICT (interest_id) DO NOTHING;
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                user_id SERIAL PRIMARY KEY,
                username VARCHAR(100) UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                name VARCHAR(150),
                bio TEXT,
                profile_pic TEXT,
                location_str TEXT,
                latitude FLOAT,
                longitude FLOAT,
                location_id INTEGER REFERENCES locations(location_id) ON DELETE SET NULL,
                created_at TIMESTAMP DEFAULT NOW()
            );
        `);

        // Add columns if table already existed without them
        await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR(150);`);
        await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;`);
        await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_pic TEXT;`);
        await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image_url TEXT;`);
        await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS location_str TEXT;`);
        await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS latitude FLOAT;`);
        await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS longitude FLOAT;`);

        // Backfill name and profile_pic for existing users
        await pool.query(`UPDATE users SET name = username WHERE name IS NULL OR name = '';`);
        await pool.query(`UPDATE users SET profile_pic = profile_image_url WHERE (profile_pic IS NULL OR profile_pic = '') AND profile_image_url IS NOT NULL;`);
        await pool.query(`UPDATE users SET profile_image_url = profile_pic WHERE (profile_image_url IS NULL OR profile_image_url = '') AND profile_pic IS NOT NULL;`);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS user_interests (
                user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
                interest_id INTEGER REFERENCES interests(interest_id) ON DELETE CASCADE,
                PRIMARY KEY (user_id, interest_id)
            );
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS user_interest_scores (
                user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
                category_id INTEGER,
                score FLOAT DEFAULT 0.0,
                PRIMARY KEY (user_id, category_id)
            );
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS posts (
                post_id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
                caption TEXT,
                image_url TEXT,
                public_id TEXT,
                post_type VARCHAR(50) DEFAULT 'image',
                category_id INTEGER,
                interest_id INTEGER REFERENCES interests(interest_id) ON DELETE SET NULL,
                location_id INTEGER REFERENCES locations(location_id) ON DELETE SET NULL,
                created_at TIMESTAMP DEFAULT NOW()
            );
        `);

        await pool.query(`ALTER TABLE posts ADD COLUMN IF NOT EXISTS image_url TEXT;`);
        await pool.query(`ALTER TABLE posts ADD COLUMN IF NOT EXISTS public_id TEXT;`);
        await pool.query(`ALTER TABLE posts ADD COLUMN IF NOT EXISTS location_str TEXT;`);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS media (
                media_id SERIAL PRIMARY KEY,
                post_id INTEGER REFERENCES posts(post_id) ON DELETE CASCADE,
                media_url TEXT NOT NULL,
                media_type VARCHAR(50) DEFAULT 'image',
                public_id TEXT
            );
        `);

        // Backfill image_url on posts from existing media records if available
        await pool.query(`
            UPDATE posts p 
            SET image_url = m.media_url 
            FROM media m 
            WHERE p.post_id = m.post_id AND (p.image_url IS NULL OR p.image_url = '');
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS comments (
                comment_id SERIAL PRIMARY KEY,
                post_id INTEGER REFERENCES posts(post_id) ON DELETE CASCADE,
                username VARCHAR(100) DEFAULT 'Anonymous',
                content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT NOW()
            );
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS likes (
                like_id SERIAL PRIMARY KEY,
                post_id INTEGER REFERENCES posts(post_id) ON DELETE CASCADE,
                user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
                created_at TIMESTAMP DEFAULT NOW()
            );
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS shares (
                share_id SERIAL PRIMARY KEY,
                post_id INTEGER REFERENCES posts(post_id) ON DELETE CASCADE,
                user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
                created_at TIMESTAMP DEFAULT NOW()
            );
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS followers (
                follower_id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
                follower_user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
                created_at TIMESTAMP DEFAULT NOW(),
                UNIQUE (user_id, follower_user_id)
            );
        `);

        console.log("OWNX database tables initialized (users, locations, interests, posts, comments, likes, shares, followers)");
    } catch (err) {
        console.error("Error initializing database tables:", err.message);
    }
};

pool.query(
    "SELECT NOW()",
    async (err, result) => {
        if (err) {
            console.log("Database connection test error:", err);
        } else {
            console.log("Connected to Database");
            await initializeDatabase();
        }
    }
);

const express = require("express");
const cors = require("cors");

const userRoutes = require("./routes/users");
const postRoutes = require("./routes/posts");
const followerRoutes = require("./routes/followers");
const uploadRoutes = require("./routes/upload");

const app = express();

app.use(cors());
// Increased body limit to support base64 uploads for images and videos
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/followers", followerRoutes);
app.use("/api/upload", uploadRoutes);

app.get("/", (req, res) => {
    res.json({ message: "OWNX Backend Running", status: "online", version: "2.0.0" });
});

app.listen(5000, () => {
    console.log("OWNX Server running on port 5000");
});