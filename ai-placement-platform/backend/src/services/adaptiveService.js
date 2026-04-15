const pool = require("../config/db");

// update weak areas
const updateWeakArea = async (userId, topic, score) => {
  if (score >= 6) return;

  const existing = await pool.query(
    "SELECT * FROM weak_areas WHERE user_id=$1 AND topic=$2",
    [userId, topic]
  );

  if (existing.rows.length > 0) {
    await pool.query(
      "UPDATE weak_areas SET score=$1 WHERE user_id=$2 AND topic=$3",
      [score, userId, topic]
    );
  } else {
    await pool.query(
      "INSERT INTO weak_areas (user_id, topic, score) VALUES ($1,$2,$3)",
      [userId, topic, score]
    );
  }
};

module.exports = { updateWeakArea };