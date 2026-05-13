const { Pool } = require("pg");

let connectionString = process.env.DATABASE_URL;

if (connectionString && connectionString.startsWith("postgres://")) {
  connectionString = connectionString.replace("postgres://", "postgresql://");
}

const pool = new Pool({
  connectionString: connectionString,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

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
