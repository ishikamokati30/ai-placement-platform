const pool = require("../config/db");

// 📊 Get user average score
const getUserStats = async (userId) => {
  const result = await pool.query(
    `SELECT AVG(score) as avg_score
     FROM interviews
     WHERE user_id = $1`,
    [userId]
  );

  return result.rows[0];
};

// 📈 Get all interview scores
const getProgress = async (userId) => {
  const result = await pool.query(
    `SELECT score, created_at
     FROM interviews
     WHERE user_id = $1
     ORDER BY created_at ASC`,
    [userId]
  );

  return result.rows;
};

module.exports = {
  getUserStats,
  getProgress,
};