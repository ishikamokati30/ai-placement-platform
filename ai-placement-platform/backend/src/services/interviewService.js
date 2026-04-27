const pool = require("../config/db");

// create interview
const createInterview = async (userId, type, topic, metadata = {}) => {
  const company = metadata.company || null;
  const role = metadata.role || null;

  if (company || role) {
    try {
      const result = await pool.query(
        `INSERT INTO interviews (user_id, type, topic, company, role)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [userId, type, topic, company, role]
      );
      return result.rows[0];
    } catch (error) {
      if (error.code !== "42703") {
        throw error;
      }

      console.warn(
        "[InterviewService] company/role columns missing; storing metadata in topic"
      );
    }
  }

  const storedTopic =
    type === "company" && company
      ? `${company} ${role || ""}`.trim()
      : topic;

  const result = await pool.query(
    `INSERT INTO interviews (user_id, type, topic)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [userId, type, storedTopic]
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
const updateInterviewScore = async (interviewId, score) => {
  try {
    const result = await pool.query(
      `UPDATE interviews 
       SET score = $1 
       WHERE id = $2 
       RETURNING *`,
      [score, interviewId]
    );

    console.log("Score Updated:", result.rows[0]);

    return result.rows[0];
  } catch (err) {
    console.error("Error updating score:", err.message);
    throw err;
  }
};
const getInterviewById = async (id) => {
  const result = await pool.query(
    "SELECT * FROM interviews WHERE id = $1",
    [id]
  );
  return result.rows[0];
};

module.exports = {
  createInterview,
  saveResponse,
  updateInterviewScore,
  getInterviewById, 
};
