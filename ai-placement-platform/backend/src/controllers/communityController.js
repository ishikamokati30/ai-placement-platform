const pool = require("../config/db");

// 📊 Leaderboard
const getLeaderboard = async (req, res) => {
  try {
    // XP Calculation Logic:
    // xp = (avgInterviewScore * 10) + (practiceScore * 5) + (streak * 2)
    // We'll calculate this by grouping interviews by user
    
    const query = `
      WITH UserMetrics AS (
        SELECT 
          u.id as user_id,
          u.name,
          AVG(CASE WHEN i.type = 'interview' THEN i.score ELSE NULL END) as avg_interview_score,
          AVG(CASE WHEN i.type = 'practice' THEN i.score ELSE NULL END) as avg_practice_score,
          COUNT(i.id) as interviews_given,
          COUNT(DISTINCT i.created_at::date) as active_days
        FROM users u
        LEFT JOIN interviews i ON u.id = i.user_id
        GROUP BY u.id, u.name
      ),
      UserStats AS (
        SELECT 
          user_id,
          name,
          COALESCE(avg_interview_score, 0) as avg_interview_score,
          COALESCE(avg_practice_score, 0) as avg_practice_score,
          interviews_given,
          COALESCE(active_days, 0) as streak
        FROM UserMetrics
      )
      SELECT 
        user_id as "userId",
        name,
        ROUND((avg_interview_score * 10) + (avg_practice_score * 5) + (streak * 2)) as xp,
        interviews_given as "interviewsGiven",
        streak
      FROM UserStats
      ORDER BY xp DESC
    `;


    const result = await pool.query(query);
    
    // Add rank and percentile
    const totalUsers = result.rows.length;
    const leaderboard = result.rows.map((row, index) => ({
      ...row,
      rank: index + 1,
      percentile: totalUsers > 1 ? Math.round(((totalUsers - (index + 1)) / (totalUsers - 1)) * 100) : 100
    }));

    res.json(leaderboard);
  } catch (err) {
    console.error("Leaderboard Error:", err);
    res.status(500).json({ message: "Unable to load leaderboard" });
  }
};

// 💬 Posts
const getPosts = async (req, res) => {
  try {
    const query = `
      SELECT 
        p.id,
        p.content,
        p.tags,
        p.upvotes,
        p.upvoted_by as "upvotedBy",
        p.created_at as "createdAt",
        u.name as "username",
        (
          SELECT COALESCE(JSON_AGG(JSON_BUILD_OBJECT(
            'id', c.id,
            'text', c.text,
            'createdAt', c.created_at,
            'username', cu.name
          ) ORDER BY c.created_at ASC), '[]'::json)
          FROM comments c
          JOIN users cu ON c.user_id = cu.id
          WHERE c.post_id = p.id
        ) as comments
      FROM posts p
      JOIN users u ON p.user_id = u.id
      ORDER BY p.created_at DESC
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error("Get Posts Error:", err);
    res.status(500).json({ message: "Unable to load posts" });
  }
};

const createPost = async (req, res) => {
  try {
    const { content, tags } = req.body;
    const userId = req.user.id;

    if (!content) {
      return res.status(400).json({ message: "Content is required" });
    }

    const result = await pool.query(
      `INSERT INTO posts (user_id, content, tags) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [userId, content, tags || []]
    );

    // Fetch the new post with username
    const postQuery = `
      SELECT p.*, u.name as username, '[]'::json as comments
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.id = $1
    `;
    const fullPost = await pool.query(postQuery, [result.rows[0].id]);

    res.status(201).json(fullPost.rows[0]);
  } catch (err) {
    console.error("Create Post Error:", err);
    res.status(500).json({ message: "Error creating post" });
  }
};

const addComment = async (req, res) => {
  try {
    const { postId, text } = req.body;
    const userId = req.user.id;

    if (!postId || !text) {
      return res.status(400).json({ message: "Post ID and text are required" });
    }

    const result = await pool.query(
      `INSERT INTO comments (post_id, user_id, text) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [postId, userId, text]
    );

    // Fetch with username
    const commentQuery = `
      SELECT c.*, u.name as username
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = $1
    `;
    const fullComment = await pool.query(commentQuery, [result.rows[0].id]);

    res.status(201).json(fullComment.rows[0]);
  } catch (err) {
    console.error("Add Comment Error:", err);
    res.status(500).json({ message: "Error adding comment" });
  }
};

const upvotePost = async (req, res) => {
  try {
    const { postId } = req.body;
    const userId = req.user.id;

    // Check if already upvoted
    const checkQuery = `SELECT upvoted_by FROM posts WHERE id = $1`;
    const checkResult = await pool.query(checkQuery, [postId]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: "Post not found" });
    }

    const upvotedBy = checkResult.rows[0].upvoted_by || [];
    const hasUpvoted = upvotedBy.includes(userId);

    let updateQuery;
    if (hasUpvoted) {
      // Remove upvote
      updateQuery = `
        UPDATE posts 
        SET upvotes = upvotes - 1, 
            upvoted_by = ARRAY_REMOVE(upvoted_by, $1) 
        WHERE id = $2 
        RETURNING upvotes, upvoted_by
      `;
    } else {
      // Add upvote
      updateQuery = `
        UPDATE posts 
        SET upvotes = upvotes + 1, 
            upvoted_by = ARRAY_APPEND(upvoted_by, $1) 
        WHERE id = $2 
        RETURNING upvotes, upvoted_by
      `;
    }

    const result = await pool.query(updateQuery, [userId, postId]);
    res.json({ 
      upvotes: result.rows[0].upvotes, 
      upvotedBy: result.rows[0].upvoted_by,
      hasUpvoted: !hasUpvoted 
    });
  } catch (err) {
    console.error("Upvote Error:", err);
    res.status(500).json({ message: "Error updating upvote" });
  }
};

module.exports = {
  getLeaderboard,
  getPosts,
  createPost,
  addComment,
  upvotePost
};
