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
            VALUES (1, 'Lucknow'), (2, 'Delhi') 
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
                location_id INTEGER REFERENCES locations(location_id) ON DELETE SET NULL,
                created_at TIMESTAMP DEFAULT NOW()
            );
        `);

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
                post_type VARCHAR(50) DEFAULT 'image',
                category_id INTEGER,
                interest_id INTEGER REFERENCES interests(interest_id) ON DELETE SET NULL,
                location_id INTEGER REFERENCES locations(location_id) ON DELETE SET NULL,
                created_at TIMESTAMP DEFAULT NOW()
            );
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

        console.log("Supabase database tables and seed values initialized (users, locations, interests, posts, comments, likes, shares, followers)");
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
            console.log("Connected to Supabase PostgreSQL Database");
            await initializeDatabase();
        }
    }
);

const express = require("express");
const cors = require("cors");

const userRoutes = require("./routes/users");
const postRoutes = require("./routes/posts");
const followerRoutes = require("./routes/followers");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/followers", followerRoutes);

app.get("/", (req, res) => {
    res.json({ message: "OWNX Backend Running", status: "online" });
});

app.listen(5000, () => {
    console.log("OWNX Server running on port 5000");
});