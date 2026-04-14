const pool = require("../config/db");

// create interview
const createInterview = async (userId, type, topic) => {
  const result = await pool.query(
    `INSERT INTO interviews (user_id, type, topic)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [userId, type, topic]
  );
  return result.rows[0];
};

// save response
const saveResponse = async (interviewId, question, answer, feedback) => {
  const result = await pool.query(
    `INSERT INTO responses (interview_id, question, answer, feedback)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [interviewId, question, answer, feedback]
  );
  return result.rows[0];
};

module.exports = {
  createInterview,
  saveResponse,
};