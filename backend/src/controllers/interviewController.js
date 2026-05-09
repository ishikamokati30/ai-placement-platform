const interviewService = require("../services/interviewService");
const aiService = require("../services/aiService");
const adaptiveService = require("../services/adaptiveService");

const FALLBACK_FEEDBACK = {
  score: 5,
  communication_score: 5,
  technical_score: 5,
  strengths: ["Basic attempt made"],
  weaknesses: ["Needs clearer explanation and stronger technical depth"],
  missing_concepts: ["Key concepts were not explained completely"],
  improvement:
    "Structure the answer with context, tradeoffs, and a concrete example.",
  improved_answer:
    "Re-answer with a clear definition, the core concept, and one practical example.",
  follow_up_question:
    "Can you explain that concept again with a concrete example?",
  difficulty_recommendation: "medium",
};

const DEFAULT_INTERVIEW_TYPE = "technical";
const DEFAULT_TOPIC = "general computer science";
const DEFAULT_DIFFICULTY = "medium";
const DEFAULT_ROLE = "SDE";

const normalizeText = (value, fallback) => {
  if (typeof value !== "string") {
    return fallback;
  }

  const trimmed = value.trim();
  return trimmed || fallback;
};

const buildFallbackQuestion = (topic, difficulty, role) =>
  `Explain ${topic} in the context of a ${role} interview at ${difficulty} difficulty.`;

const getNumericFeedbackValue = (...values) => {
  for (const value of values) {
    const numberValue = Number(value);
    if (Number.isFinite(numberValue) && numberValue >= 0) {
      return numberValue;
    }
  }

  return null;
};

const normalizeFeedback = (feedback) => {
  if (!feedback || typeof feedback !== "object") {
    return FALLBACK_FEEDBACK;
  }

  let followUpQuestion = FALLBACK_FEEDBACK.follow_up_question;
  if (
    typeof feedback.follow_up_question === "string" &&
    feedback.follow_up_question.trim()
  ) {
    followUpQuestion = feedback.follow_up_question.trim();
  } else if (
    typeof feedback.followUpQuestion === "string" &&
    feedback.followUpQuestion.trim()
  ) {
    followUpQuestion = feedback.followUpQuestion.trim();
  }

  return {
    score:
      getNumericFeedbackValue(feedback.score) ?? FALLBACK_FEEDBACK.score,
    communication_score:
      getNumericFeedbackValue(
        feedback.communication_score,
        feedback.communicationScore
      ) ?? FALLBACK_FEEDBACK.communication_score,
    technical_score:
      getNumericFeedbackValue(
        feedback.technical_score,
        feedback.technicalScore
      ) ?? FALLBACK_FEEDBACK.technical_score,
    strengths: Array.isArray(feedback.strengths)
      ? feedback.strengths
      : FALLBACK_FEEDBACK.strengths,
    weaknesses: Array.isArray(feedback.weaknesses)
      ? feedback.weaknesses
      : FALLBACK_FEEDBACK.weaknesses,
    missing_concepts: Array.isArray(feedback.missing_concepts)
      ? feedback.missing_concepts
      : FALLBACK_FEEDBACK.missing_concepts,
    improvement:
      typeof feedback.improvement === "string" && feedback.improvement.trim()
        ? feedback.improvement.trim()
        : FALLBACK_FEEDBACK.improvement,
    improved_answer:
      typeof feedback.improved_answer === "string" &&
      feedback.improved_answer.trim()
        ? feedback.improved_answer.trim()
        : FALLBACK_FEEDBACK.improved_answer,
    follow_up_question: followUpQuestion,
    difficulty_recommendation:
      typeof feedback.difficulty_recommendation === "string" &&
      feedback.difficulty_recommendation.trim()
        ? feedback.difficulty_recommendation.trim().toLowerCase()
        : FALLBACK_FEEDBACK.difficulty_recommendation,
  };
};

// 🚀 Start Interview
const startInterview = async (req, res) => {
  const body = req.body && typeof req.body === "object" ? req.body : {};
  const userId = req.user?.id || req.user?.userId;

  console.log("[Interview] startInterview request", {
    userId: userId || null,
    body,
  });

  if (!userId) {
    console.error("[Interview] startInterview missing authenticated user", {
      decodedUser: req.user || null,
    });
    return res.status(401).json({ message: "Unauthorized" });
  }

  const type = normalizeText(body.type, DEFAULT_INTERVIEW_TYPE);
  const finalTopic = normalizeText(body.topic, DEFAULT_TOPIC);
  const difficulty = normalizeText(body.difficulty, DEFAULT_DIFFICULTY);
  const role = normalizeText(body.role, DEFAULT_ROLE);
  const company = normalizeText(body.company, "");
  const round = normalizeText(body.currentRound || body.round, "");
  const resumeText = body.resumeText || "";
  const storedTopic =
    type === "company" && company ? `${company} ${role}` : finalTopic;

  try {
    let interview;
    if (body.interviewId) {
      interview = await interviewService.getInterviewById(body.interviewId);

      if (!interview) {
        return res.status(404).json({ message: "Interview not found" });
      }

      if (String(interview.user_id) !== String(userId)) {
        return res.status(403).json({ message: "Forbidden" });
      }
    } else {
      try {
        interview = await interviewService.createInterview(
          userId,
          type,
          storedTopic,
          { company, role }
        );
      } catch (error) {
        console.error("[Interview] createInterview failed", {
          userId,
          type,
          topic: finalTopic,
          message: error.message,
          code: error.code || null,
          detail: error.detail || null,
        });
        throw error;
      }
    }

    let question;
    try {
      question = await aiService.generateQuestion(
        storedTopic,
        difficulty,
        role,
        {
          type,
          company,
          round,
          resumeText,
        }
      );
    } catch (error) {
      console.error("[Interview] generateQuestion crashed unexpectedly", {
        interviewId: interview.id,
        userId,
        message: error.message,
      });
      question = buildFallbackQuestion(storedTopic, difficulty, role);
    }

    if (typeof question !== "string" || !question.trim()) {
      console.error("[Interview] generateQuestion returned invalid question", {
        interviewId: interview.id,
        userId,
        questionType: typeof question,
      });
      question = buildFallbackQuestion(storedTopic, difficulty, role);
    }

    console.log("[Interview] startInterview completed", {
      interviewId: interview.id,
      userId,
      usedFallbackQuestion: question.startsWith("Ask a "),
    });

    res.json({
      interviewId: interview.id,
      question: question.trim(),
    });
  } catch (err) {
    console.error("[Interview] startInterview fatal", {
      userId,
      message: err.message,
      stack: err.stack,
    });
    res.status(500).json({ message: "Error starting interview" });
  }
};

// 🧠 Submit Answer
const submitAnswer = async (req, res) => {
  try {
    const {
      interviewId,
      question,
      answer,
      type,
      company,
      role,
      currentRound,
      round,
    } = req.body;
    const userId = req.user?.id || req.user?.userId;

    if (!interviewId || !question || !answer) {
      return res.status(400).json({
        message: "interviewId, question and answer required",
      });
    }

    if (!userId) {
      console.error("[Interview] submitAnswer missing req.user.id");
      return res.status(401).json({ message: "Unauthorized" });
    }

    console.log("[Interview] submitAnswer started", {
      interviewId,
      userId,
      questionLength: question.length,
      answerLength: answer.length,
    });

    let feedback;
    try {
      feedback = normalizeFeedback(
        await aiService.evaluateAnswer(question, answer, {
          type,
          company,
          role,
          round: currentRound || round,
          resumeText: req.body.resumeText || "",
        })
      );
    } catch (error) {
      console.error("[Interview] evaluateAnswer crashed", {
        interviewId,
        userId,
        message: error.message,
      });
      feedback = FALLBACK_FEEDBACK;
    }

    console.log("[Interview] feedback ready", {
      interviewId,
      score: feedback.score,
      weaknessesCount: feedback.weaknesses.length,
    });

    let savedResponse;
    try {
      savedResponse = await interviewService.saveResponse(
        interviewId,
        question,
        answer,
        feedback
      );
    } catch (error) {
      console.error("[Interview] saveResponse failed", {
        interviewId,
        userId,
        message: error.message,
      });
      throw error;
    }

    try {
      await interviewService.updateInterviewScore(interviewId, feedback.score);
    } catch (error) {
      console.error("[Interview] updateInterviewScore failed", {
        interviewId,
        userId,
        score: feedback.score,
        message: error.message,
      });
      throw error;
    }

    let interview;
    try {
      interview = await interviewService.getInterviewById(interviewId);
    } catch (error) {
      console.error("[Interview] getInterviewById failed", {
        interviewId,
        userId,
        message: error.message,
      });
      throw error;
    }

    if (!interview) {
      console.error("[Interview] interview not found", {
        interviewId,
        userId,
      });
      return res.status(404).json({ message: "Interview not found" });
    }

    const topic = interview.topic || company || "general computer science";

    try {
      await adaptiveService.updateWeakArea(userId, topic, feedback.score);
    } catch (error) {
      console.error("[Interview] updateWeakArea failed", {
        interviewId,
        userId,
        topic,
        score: feedback.score,
        message: error.message,
      });
    }

    let followUp = feedback.follow_up_question || null;
    if (!followUp && feedback.score < 6) {
      try {
        followUp = await aiService.generateFollowUp(
          question,
          answer,
          feedback.weaknesses
        );
      } catch (error) {
        console.error("[Interview] generateFollowUp failed", {
          interviewId,
          userId,
          message: error.message,
        });
        followUp = null;
      }
    }

    console.log("[Interview] submitAnswer completed", {
      interviewId,
      userId,
      responseId: savedResponse?.id || null,
      score: feedback.score,
      hasFollowUp: Boolean(followUp),
    });

    res.json({
      feedback,
      followUpQuestion: followUp,
      difficultyRecommendation: feedback.difficulty_recommendation,
    });
  } catch (err) {
    console.error("[Interview] submitAnswer fatal", {
      message: err.message,
      stack: err.stack,
    });
    res.status(500).json({ message: "Error evaluating answer" });
  }
};

module.exports = {
  startInterview,
  submitAnswer,
};
