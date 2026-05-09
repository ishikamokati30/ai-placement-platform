const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Required for Render PostgreSQL
  },
});

// Test connection immediately
pool.query("SELECT NOW()", (err, res) => {
  if (err) {
    console.error("❌ PostgreSQL Connection Error:", err.message);
  } else {
    console.log("✅ PostgreSQL Connected successfully");
  }
});

pool.on("error", (err) => {
  console.error("❌ Unexpected error on idle database client", err);
});

module.exports = pool;