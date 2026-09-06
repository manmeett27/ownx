const pool = require("./config/db");
const bcrypt = require("bcrypt");

async function seedDatabase() {
    console.log("==================================================");
    console.log("SEEDING SUPABASE DATABASE WITH RICH DEMO DATA");
    console.log("==================================================");

    try {
        // 1. Locations
        await pool.query(`
            INSERT INTO locations (location_id, location_name) VALUES 
            (1, 'Lucknow'),
            (2, 'Delhi'),
            (3, 'Mumbai'),
            (4, 'Bangalore')
            ON CONFLICT (location_id) DO UPDATE SET location_name = EXCLUDED.location_name;
        `);

        // 2. Interests
        await pool.query(`
            INSERT INTO interests (interest_id, interest_name) VALUES 
            (1, 'Technology'),
            (2, 'Food & Health'),
            (3, 'Travel'),
            (4, 'Gaming'),
            (5, 'Fitness')
            ON CONFLICT (interest_id) DO UPDATE SET interest_name = EXCLUDED.interest_name;
        `);

        // 3. Users with bcrypt hashed passwords
        const hash = await bcrypt.hash("password123", 10);
        
        const users = [
            { username: "Alice", location_id: 1 },
            { username: "Bob", location_id: 2 },
            { username: "Charlie", location_id: 1 },
            { username: "David", location_id: 3 },
            { username: "Emma", location_id: 4 }
        ];

        for (const u of users) {
            await pool.query(`
                INSERT INTO users (username, password_hash, location_id)
                VALUES ($1, $2, $3)
                ON CONFLICT (username) DO NOTHING;
            `, [u.username, hash, u.location_id]);
        }

        // Fetch inserted user IDs map
        const userRes = await pool.query("SELECT user_id, username FROM users");
        const userMap = {};
        userRes.rows.forEach(r => userMap[r.username] = r.user_id);

        const aliceId = userMap["Alice"] || 1;
        const bobId = userMap["Bob"] || 2;
        const charlieId = userMap["Charlie"] || 3;
        const davidId = userMap["David"] || 4;
        const emmaId = userMap["Emma"] || 5;

        // 4. User Interests
        await pool.query(`
            INSERT INTO user_interests (user_id, interest_id) VALUES
            (${aliceId}, 1), (${aliceId}, 2),
            (${bobId}, 2), (${bobId}, 3),
            (${charlieId}, 1), (${charlieId}, 4),
            (${davidId}, 3), (${davidId}, 5),
            (${emmaId}, 1), (${emmaId}, 5)
            ON CONFLICT DO NOTHING;
        `);

        // 5. User Interest Scores
        await pool.query(`
            INSERT INTO user_interest_scores (user_id, category_id, score) VALUES
            (${aliceId}, 1, 0.95), (${aliceId}, 2, 0.70),
            (${bobId}, 2, 0.85), (${bobId}, 3, 0.90),
            (${charlieId}, 1, 0.90), (${charlieId}, 4, 0.80),
            (${davidId}, 3, 0.95), (${davidId}, 5, 0.85),
            (${emmaId}, 1, 0.88), (${emmaId}, 5, 0.92)
            ON CONFLICT (user_id, category_id) DO UPDATE SET score = EXCLUDED.score;
        `);

        // 6. Posts
        const posts = [
            {
                user_id: aliceId,
                caption: "🚀 Just launched our new AI microservices architecture! Powered by Node.js and FastAPI.",
                image_url: "media/images/healthy_food.png",
                post_type: "image",
                category_id: 1,
                interest_id: 1,
                location_id: 1
            },
            {
                user_id: bobId,
                caption: "🥗 Exploring organic vegan salad spots in Delhi! Health is wealth.",
                image_url: "media/images/food.png",
                post_type: "image",
                category_id: 2,
                interest_id: 2,
                location_id: 2
            },
            {
                user_id: charlieId,
                caption: "🎮 Late night gaming session! Anyone up for some multiplayer strategy games?",
                image_url: "media/images/healthy_food.png",
                post_type: "image",
                category_id: 4,
                interest_id: 4,
                location_id: 1
            },
            {
                user_id: davidId,
                caption: "🏖️ Sunset views from Marine Drive, Mumbai! Loving this sea breeze.",
                image_url: "media/images/food.png",
                post_type: "image",
                category_id: 3,
                interest_id: 3,
                location_id: 3
            },
            {
                user_id: emmaId,
                caption: "🏋️‍♀️ Morning 5km run completed in Bangalore. Consistency is key!",
                image_url: "media/images/healthy_food.png",
                post_type: "image",
                category_id: 5,
                interest_id: 5,
                location_id: 4
            }
        ];

        for (const p of posts) {
            await pool.query(`
                INSERT INTO posts (user_id, caption, image_url, post_type, category_id, interest_id, location_id)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
            `, [p.user_id, p.caption, p.image_url, p.post_type, p.category_id, p.interest_id, p.location_id]);
        }

        // Fetch Post IDs
        const postRes = await pool.query("SELECT post_id FROM posts ORDER BY post_id ASC LIMIT 5");
        const postIds = postRes.rows.map(r => r.post_id);

        if (postIds.length >= 2) {
            // 7. Comments
            await pool.query(`
                INSERT INTO comments (post_id, username, content) VALUES
                (${postIds[0]}, 'Bob', 'This AI architecture looks top notch!'),
                (${postIds[0]}, 'Charlie', 'Great work Alice! Would love to see the benchmarks.'),
                (${postIds[1]}, 'Alice', 'That salad bowl looks delicious Bob!'),
                (${postIds[1]}, 'David', 'Share the restaurant location please!'),
                (${postIds[2]}, 'Emma', 'Count me in for the next gaming stream!')
            `);

            // 8. Likes
            await pool.query(`
                INSERT INTO likes (post_id, user_id) VALUES
                (${postIds[0]}, ${bobId}),
                (${postIds[0]}, ${charlieId}),
                (${postIds[0]}, ${davidId}),
                (${postIds[1]}, ${aliceId}),
                (${postIds[1]}, ${emmaId})
                ON CONFLICT DO NOTHING;
            `);

            // 9. Shares
            await pool.query(`
                INSERT INTO shares (post_id, user_id) VALUES
                (${postIds[0]}, ${bobId}),
                (${postIds[1]}, ${aliceId})
                ON CONFLICT DO NOTHING;
            `);
        }

        // 10. Followers
        await pool.query(`
            INSERT INTO followers (user_id, follower_user_id) VALUES
            (${aliceId}, ${bobId}),
            (${aliceId}, ${charlieId}),
            (${bobId}, ${aliceId}),
            (${charlieId}, ${emmaId}),
            (${davidId}, ${aliceId})
            ON CONFLICT DO NOTHING;
        `);

        console.log("==================================================");
        console.log("SUCCESSFULLY SEEDED SUPABASE WITH RICH DEMO DATA!");
        console.log("==================================================");
        process.exit(0);
    } catch (err) {
        console.error("Seeding Error:", err.message);
        process.exit(1);
    }
}

seedDatabase();
