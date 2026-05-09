const aiService = require("../services/aiService");
const pool = require("../config/db");
const adaptiveService = require("../services/adaptiveService");
const { FALLBACK_CONCEPTS, FALLBACK_MCQS } = require("../utils/fallbackData");

// 📘 Get Concept Learning Content
const getConcept = async (req, res) => {
  const { topic } = req.body;
  
  // 1. Validate Input
  if (!topic) {
    return res.status(400).json({ message: "Topic is required" });
  }

  try {
    // 2. Try AI Call
    let content = await aiService.generateConcept(topic);
    
    // 3. Fallback if AI fails or returns empty
    if (!content || content.includes("Failed to generate")) {
      console.warn(`[Practice] AI Concept failed for ${topic}, using fallback.`);
      content = FALLBACK_CONCEPTS[topic] || FALLBACK_CONCEPTS.Default;
    }

    res.json({ content });
  } catch (error) {
    console.error("[Practice] getConcept crash avoided:", error);
    // 4. Ultimate Fallback to prevent crash
    res.json({ 
      content: FALLBACK_CONCEPTS[topic] || FALLBACK_CONCEPTS.Default,
      fallback: true 
    });
  }
};

// 🧪 Generate MCQs
const generateMCQs = async (req, res) => {
  const { topic, difficulty } = req.body;
  
  // 1. Validate Input
  if (!topic) {
    return res.status(400).json({ message: "Topic is required" });
  }

  try {
    // 2. Try AI Call
    let mcqs = await aiService.generateMCQs(topic, difficulty || "medium");
    
    // 3. Fallback if AI fails or returns empty array
    if (!Array.isArray(mcqs) || mcqs.length === 0) {
      console.warn(`[Practice] AI MCQs failed for ${topic}, using fallback.`);
      mcqs = FALLBACK_MCQS[topic] || FALLBACK_MCQS.Default;
    }

    // Map keys to match frontend requirement if necessary (answer vs correctAnswer)
    const formattedMcqs = mcqs.map(q => ({
      question: q.question,
      options: q.options,
      answer: q.answer || q.correctAnswer
    }));

    res.json({ questions: formattedMcqs });
  } catch (error) {
    console.error("[Practice] generateMCQs crash avoided:", error);
    // 4. Ultimate Fallback to prevent crash
    const fallback = FALLBACK_MCQS[topic] || FALLBACK_MCQS.Default;
    res.json({ 
      questions: fallback.map(q => ({
        question: q.question,
        options: q.options,
        answer: q.answer || q.correctAnswer
      })),
      fallback: true 
    });
  }
};

// 📊 Evaluate Practice Session
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
    res.json({ response: "I'm having trouble connecting right now, but I'm still learning! Please try again in a moment." });
  }
};

module.exports = {
  getConcept,
  generateMCQs,
  evaluatePractice,
  chat,
};
