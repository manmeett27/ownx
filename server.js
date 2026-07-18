const pool = require("./config/db");

// Initialize Database Tables if not exists
const initializeDatabase = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS posts (
                post_id SERIAL PRIMARY KEY,
                user_id INTEGER,
                caption TEXT,
                image_url TEXT,
                post_type VARCHAR(50) DEFAULT 'image',
                category_id INTEGER,
                interest_id INTEGER,
                location_id INTEGER,
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
        console.log("Database tables initialized (posts, comments)");
    } catch (err) {
        console.error("Error initializing database tables:", err.message);
    }
};

pool.query(
    "SELECT NOW()",
    async (err,result)=>{
        if(err){
            console.log(err);
        }
        else{
            console.log("Database Connected");
            await initializeDatabase();
        }
    }
);

const express = require("express");
const cors = require("cors");

const userRoutes = require("./routes/users");
const postRoutes = require("./routes/posts");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);

app.get("/", (req, res) => {
    res.send("Backend Running");
});

app.listen(5000, () => {
    console.log("Server running on port 5000");
});