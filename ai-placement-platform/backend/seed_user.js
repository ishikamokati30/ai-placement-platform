require("dotenv").config();
const pool = require("./src/config/db");
const bcrypt = require("bcryptjs");

const seedUser = async () => {
  try {
    const email = "test@gmail.com";
    const password = "password123";
    const name = "Test User";

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      "INSERT INTO users (name, email, password) VALUES ($1, $2, $3) ON CONFLICT (email) DO UPDATE SET password = $3 RETURNING *",
      [name, email, hashedPassword]
    );

    console.log("✅ Seed User Ready:", result.rows[0].email);
    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
  }
};

seedUser();
