const interviewService = require("../services/interviewService");
const aiService = require("../services/aiService");

// 🚀 Start Interview
const startInterview = async (req, res) => {
  try {
    const { type, topic, difficulty, role } = req.body;

    const interview = await interviewService.createInterview(
      req.user.id,
      type,
      topic
    );

    const question = await aiService.generateQuestion(
      topic,
      difficulty,
      role
    );

    res.json({
      interviewId: interview.id,
      question,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error starting interview" });
  }
};

// 🧠 Submit Answer
const submitAnswer = async (req, res) => {
  try {
    const { interviewId, question, answer } = req.body;

    const feedback = await aiService.evaluateAnswer(question, answer);

    await interviewService.saveResponse(
      interviewId,
      question,
      answer,
      feedback
    );

    res.json({
      feedback,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error evaluating answer" });
  }
};

module.exports = {
  startInterview,
  submitAnswer,
};