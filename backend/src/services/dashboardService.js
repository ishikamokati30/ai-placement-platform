const pool = require("../config/db");

// 📊 Get all interviews for data aggregation
const getAllInterviews = async (userId) => {
  const result = await pool.query(
    `SELECT score, topic, created_at
     FROM interviews
     WHERE user_id = $1
     ORDER BY created_at ASC`,
    [userId]
  );
  return result.rows;
};

module.exports = {
  getAllInterviews,
};