const aiService = require("../services/aiService");
const pool = require("../config/db");
const adaptiveService = require("../services/adaptiveService");

const getConcept = async (req, res) => {
  const { topic } = req.body;
  
  if (!topic) {
    return res.status(400).json({ message: "Topic is required" });
  }

  try {
    const content = await aiService.generateConcept(topic);

    if (!content) {
      return res.status(502).json({
        message: "AI provider did not return learning content.",
      });
    }

    res.json({ content });
  } catch (error) {
    console.error("[Practice] getConcept error:", error);
    res.status(502).json({
      message: "Unable to generate learning notes from the AI provider.",
      error: error.message,
    });
  }
};

const generateMCQs = async (req, res) => {
  const { topic, difficulty } = req.body;
  
  if (!topic) {
    return res.status(400).json({ message: "Topic is required" });
  }

  try {
    const mcqs = await aiService.generateMCQs(topic, difficulty || "medium", {
      cache: req.body.cache !== false,
    });

    if (!Array.isArray(mcqs) || mcqs.length === 0) {
      return res.status(502).json({
        message: "AI provider did not return quiz questions. Check provider configuration and retry.",
      });
    }

    const formattedMcqs = mcqs.map(q => ({
      question: q.question,
      options: q.options,
      answer: q.answer || q.correctAnswer,
      correctAnswer: q.correctAnswer || q.answer,
      explanation: q.explanation,
    }));

    res.json({ questions: formattedMcqs });
  } catch (error) {
    console.error("[Practice] generateMCQs error:", error);
    res.status(502).json({
      message: "Unable to generate quiz questions from the AI provider.",
      error: error.message,
    });
  }
};

const evaluatePractice = async (req, res) => {
  try {
    const { topic, answers, userId: bodyUserId } = req.body;
    const userId = req.user?.id || req.user?.userId || bodyUserId;

    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ message: "Answers array is required" });
    }

    let score = 0;
    const results = answers.map((ans) => {
      const isCorrect = ans.selectedAnswer === ans.answer || ans.selectedAnswer === ans.correctAnswer;
      if (isCorrect) score++;
      return {
        question: ans.question,
        correct: isCorrect,
        correctAnswer: ans.answer || ans.correctAnswer,
        explanation: ans.explanation || "No explanation available.",
      };
    });

    const finalScore = Math.round((score / answers.length) * 10) || 0;
    const weakAreas = finalScore < 6 ? [topic] : [];
    
    if (userId) {
      pool.query(
        `INSERT INTO interviews (user_id, type, topic, score) VALUES ($1, $2, $3, $4)`,
        [userId, 'practice', topic, finalScore]
      ).catch(err => console.error("[Practice] DB Save Error:", err));

      if (finalScore < 6) {
        adaptiveService.updateWeakArea(userId, topic, finalScore).catch(err => console.error("[Practice] Adaptive Update Error:", err));
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
    res.status(500).json({ message: "Error evaluating practice", error: error.message });
  }
};

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
    res.status(502).json({
      message: "Unable to generate a chat response from the AI provider.",
      error: error.message,
    });
  }
};

const aiStatus = (req, res) => {
  res.json(aiService.getAIStatus());
};

module.exports = {
  getConcept,
  generateMCQs,
  evaluatePractice,
  chat,
  aiStatus,
};
