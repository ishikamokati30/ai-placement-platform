const interviewService = require("../services/interviewService");
const aiService = require("../services/aiService");
const adaptiveService = require("../services/adaptiveService");
const dashboardService = require("../services/dashboardService");
const updateInterviewScore = require("../services/interviewService").updateInterviewScore;

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

    // 1️⃣ Evaluate answer
    const feedback = await aiService.evaluateAnswer(question, answer);
    // 2️⃣ Save response
    await interviewService.saveResponse(
      interviewId,
      question,
      answer,
      feedback
    );
     await interviewService.updateInterviewScore(
  interviewId,
  feedback.score
    );


    // 3️⃣ Extract topic dynamically (IMPORTANT FIX)
    const topic = question.toLowerCase().includes("dbms")
      ? "DBMS"
      : "General";

    // 4️⃣ Update weak areas
    await adaptiveService.updateWeakArea(
      req.user.id,
      topic,
      feedback.score
    );

    // 5️⃣ Generate follow-up if weak
    let followUp = null;

    if (feedback.score < 6) {
      followUp = await aiService.generateQuestion(
        topic,
        "easy",
        "SDE"
      );
    }

    // 6️⃣ Send everything together
    res.json({
      feedback,
      followUpQuestion: followUp,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error evaluating answer" });
  }
  console.log("📌 Interview ID:", interviewId);
console.log("📌 Score to update:", feedback.score);
};

module.exports = {
  startInterview,
  submitAnswer,
};