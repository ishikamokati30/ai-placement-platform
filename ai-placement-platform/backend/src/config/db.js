const { Pool } = require("pg");

let connectionString = process.env.DATABASE_URL;

// Ensure correct format: postgresql:// (some platforms provide postgres://)
if (connectionString && connectionString.startsWith("postgres://")) {
  connectionString = connectionString.replace("postgres://", "postgresql://");
}

const pool = new Pool({
  connectionString: connectionString,
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