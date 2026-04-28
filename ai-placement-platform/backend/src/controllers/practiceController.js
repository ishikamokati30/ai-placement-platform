const aiService = require("../services/aiService");
const pool = require("../config/db");
const adaptiveService = require("../services/adaptiveService");

// 📘 Get Concept Learning Content
const getConcept = async (req, res) => {
  const { topic } = req.body;
  if (!topic) {
    return res.status(400).json({ message: "Topic is required" });
  }

  try {
    const content = await aiService.generateConcept(topic);
    res.json({ content });
  } catch (error) {
    console.error("[Practice] getConcept error:", error);
    res.status(500).json({ message: "Error generating concept material" });
  }
};

// 🧪 Generate MCQs
const generateMCQs = async (req, res) => {
  const { topic, difficulty } = req.body;
  if (!topic) {
    return res.status(400).json({ message: "Topic is required" });
  }

  try {
    const mcqs = await aiService.generateMCQs(topic, difficulty || "medium");
    res.json({ mcqs });
  } catch (error) {
    console.error("[Practice] generateMCQs error:", error);
    res.status(500).json({ message: "Error generating MCQs" });
  }
};

// 📊 Evaluate Practice Session
const evaluatePractice = async (req, res) => {
  const { topic, answers, userId: bodyUserId } = req.body;
  const userId = req.user?.id || req.user?.userId || bodyUserId;

  if (!answers || !Array.isArray(answers)) {
    return res.status(400).json({ message: "Answers array is required" });
  }

  try {
    let score = 0;
    const results = answers.map((ans) => {
      const isCorrect = ans.selectedAnswer === ans.correctAnswer;
      if (isCorrect) score++;
      return {
        question: ans.question,
        correct: isCorrect,
        correctAnswer: ans.correctAnswer,
        explanation: ans.explanation,
      };
    });

    const finalScore = Math.round((score / answers.length) * 10);
    const weakAreas = finalScore < 6 ? [topic] : [];

    // Save to database
    // We'll reuse the interviews table but with type 'practice'
    // or just update the weak areas if score is low
    if (userId) {
      try {
        await pool.query(
          `INSERT INTO interviews (user_id, type, topic, score)
           VALUES ($1, $2, $3, $4)`,
          [userId, 'practice', topic, finalScore]
        );

        if (finalScore < 6) {
          await adaptiveService.updateWeakArea(userId, topic, finalScore);
        }
      } catch (dbError) {
        console.error("[Practice] Database save error:", dbError);
      }
    }

    res.json({
      score: finalScore,
      totalQuestions: answers.length,
      correctCount: score,
      results,
      weakAreas,
    });
  } catch (error) {
    console.error("[Practice] evaluatePractice error:", error);
    res.status(500).json({ message: "Error evaluating practice" });
  }
};

// 💬 AI Chatbot
const chat = async (req, res) => {
  const { message, topic, history } = req.body;
  if (!message || !topic) {
    return res.status(400).json({ message: "Message and topic are required" });
  }

  try {
    const response = await aiService.generateChatResponse(message, topic, history || []);
    res.json({ response });
  } catch (error) {
    console.error("[Practice] Chat error:", error);
    res.status(500).json({ message: "Error in AI Chatbot" });
  }
};

module.exports = {
  getConcept,
  generateMCQs,
  evaluatePractice,
  chat,
};
