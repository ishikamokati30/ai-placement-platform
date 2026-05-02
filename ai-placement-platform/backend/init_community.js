require("dotenv").config();
const pool = require("./src/config/db");


const initDB = async () => {
  try {
    console.log("Initializing Community Tables...");

    // 1. UserStats Table (Optional if we calculate on the fly, but good for performance)
    // Actually, we can just calculate from interviews table.
    // But for the discussion feed, we definitely need Posts and Comments.

    // 2. Posts Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS posts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        tags TEXT[] DEFAULT '{}',
        upvotes INTEGER DEFAULT 0,
        upvoted_by INTEGER[] DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 3. Comments Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL,
        text TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log("Community Tables created successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Error creating tables:", err);
    process.exit(1);
  }
};

initDB();
