require("dotenv").config();
const pool = require("./src/config/db");

const setupDB = async () => {
  try {
    console.log("🚀 Starting Database Setup...");

    console.log("Creating 'users' table...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log("Creating 'interviews' table...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS interviews (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        topic VARCHAR(255),
        company VARCHAR(255),
        role VARCHAR(255),
        custom_fields JSONB DEFAULT '[]'::jsonb,
        score INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      ALTER TABLE interviews
      ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '[]'::jsonb
    `);

    console.log("Creating 'responses' table...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS responses (
        id SERIAL PRIMARY KEY,
        interview_id INTEGER REFERENCES interviews(id) ON DELETE CASCADE,
        question TEXT NOT NULL,
        answer TEXT,
        feedback TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log("Creating 'posts' table...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS posts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        tags TEXT[] DEFAULT '{}',
        upvotes INTEGER DEFAULT 0,
        upvoted_by INTEGER[] DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log("Creating 'comments' table...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        text TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log("✅ Database Setup Completed Successfully!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Database Setup Failed:", err);
    process.exit(1);
  }
};

setupDB();
