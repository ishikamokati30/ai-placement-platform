const OpenAI = require("openai");

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const DEFAULT_MODEL = process.env.OPENROUTER_MODEL || "openrouter/free";
const DEFAULT_REFERER =
  process.env.OPENROUTER_SITE_URL || "http://localhost:3000";
const DEFAULT_TITLE =
  process.env.OPENROUTER_APP_NAME || "AI Placement Platform";

const client = new OpenAI({
  apiKey: OPENROUTER_API_KEY || "missing-openrouter-api-key",
  baseURL: OPENROUTER_BASE_URL,
  defaultHeaders: {
    "HTTP-Referer": DEFAULT_REFERER,
    "X-Title": DEFAULT_TITLE,
  },
});

const FALLBACK_EVALUATION = {
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
};

const COMPANY_SIGNALS = {
  Amazon: "Leadership Principles, ownership, customer obsession, and bias for action",
  Google: "problem solving, system thinking, clarity, and scalable reasoning",
  Microsoft: "collaboration, design thinking, product empathy, and growth mindset",
  Flipkart: "customer impact, ownership, frugal execution, and marketplace scale",
};

const logOpenRouterError = (label, error) => {
  console.error(`[AI] ${label} failed`, {
    model: DEFAULT_MODEL,
    message: error.message,
    status: error.status || error.code || null,
    type: error.type || null,
    details: error.response?.data || error.error || null,
  });
};

const normalizeText = (value, fallback) => {
  if (typeof value !== "string") {
    return fallback;
  }

  const trimmed = value.trim();
  return trimmed || fallback;
};

const extractMessageText = (response) =>
  response?.choices?.[0]?.message?.content?.trim() || "";

const getFallbackQuestion = (topic, difficulty, role) =>
  `Can you explain a core concept in ${topic} and how it applies to a real-world scenario?`;

const getCompanyFallbackQuestion = (company, role, roundLabel) =>
  `Tell me about a decision you made under ambiguity and how you handled tradeoffs.`;

const parseJsonObject = (content) => {
  const normalized = Array.isArray(content)
    ? content.map((part) => part?.text || "").join("")
    : String(content || "");

  const match = normalized.match(/\{[\s\S]*\}/);
  if (!match) {
    throw new Error("Model response did not contain a JSON object");
  }

  return JSON.parse(match[0]);
};

const createChatCompletion = async (messages, options = {}) => {
  if (!OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY is not configured");
  }

  return client.chat.completions.create({
    model: DEFAULT_MODEL,
    temperature: options.temperature ?? 0.4,
    max_tokens: options.maxTokens ?? 300,
    messages,
  });
};

const generateQuestion = async (
  topic,
  difficulty = "medium",
  role = "SDE",
  options = {}
) => {
  const safeTopic = normalizeText(topic, "general computer science");
  const safeDifficulty = normalizeText(difficulty, "medium");
  const safeRole = normalizeText(role, "SDE");
  const safeCompany = normalizeText(options.company, "Amazon");
  const roundLabel = normalizeText(options.round, "Round 1: HR / Intro");

  if (options.type === "company") {
    const companySignals =
      COMPANY_SIGNALS[safeCompany] || "company values, role fit, and technical depth";

    const prompt = `
Simulate a real ${safeCompany} interview for a ${safeRole} candidate.

Follow this structure:
1. HR intro question
2. Behavioral question based on company values
3. Technical question
4. Follow-up deep dive

Current round: ${roundLabel}
Company-specific focus: ${companySignals}

Ask ONLY ONE question at a time.
Return only the interview question, with no explanation or bullets.
`.trim();

    try {
      const response = await createChatCompletion(
        [
          { role: "system", content: "You are a technical interviewer." },
          { role: "user", content: prompt }
        ],
        { temperature: 0.72, maxTokens: 180 }
      );

      const question = extractMessageText(response);
      if (!question) {
        throw new Error("Empty company question response");
      }

      return question;
    } catch (error) {
      logOpenRouterError("generateCompanyQuestion", error);
      return getCompanyFallbackQuestion(safeCompany, safeRole, roundLabel);
    }
  }

  const prompt = `Generate a real ${safeDifficulty} level ${safeTopic} interview question for a ${safeRole}.
The question should be clear, concise, and similar to FAANG interviews.
Do NOT include explanations. Only return the question.`.trim();

  try {
    const response = await createChatCompletion(
      [
        { role: "system", content: "You are a technical interviewer." },
        { role: "user", content: prompt }
      ],
      { temperature: 0.7, maxTokens: 180 }
    );

    const question = extractMessageText(response);
    if (!question) {
      throw new Error("Empty question response");
    }

    return question;
  } catch (error) {
    logOpenRouterError("generateQuestion", error);
    return getFallbackQuestion(safeTopic, safeDifficulty, safeRole);
  }
};

const evaluateAnswer = async (question, answer, options = {}) => {
  try {
    const safeCompany = normalizeText(options.company, "the company");
    const safeRole = normalizeText(options.role, "SDE");
    const roundLabel = normalizeText(options.round, "the current round");

    if (!answer || answer.trim().length < 10) {
      return {
        score: 1,
        communication_score: 1,
        technical_score: options.type === "company" ? 1 : 0,
        strengths: [],
        weaknesses: ["Answer is too short to demonstrate understanding"],
        missing_concepts: ["Core explanation of the topic"],
        improvement:
          "Give a complete answer with situation, action, reasoning, and result.",
        improved_answer:
          "Start with the main concept, then explain how it works with a simple example.",
        follow_up_question:
          "Can you explain the core idea first, then walk through a simple example?",
      };
    }

    const normalizedAnswer = answer.toLowerCase();
    if (
      normalizedAnswer.includes("don't know") ||
      normalizedAnswer.includes("dont know") ||
      normalizedAnswer.includes("not sure")
    ) {
      return {
        score: 1,
        communication_score: 1,
        technical_score: options.type === "company" ? 1 : 0,
        strengths: [],
        weaknesses: ["No clear understanding was demonstrated"],
        missing_concepts: ["Fundamental concepts behind the question"],
        improvement:
          "Start with what you know, clarify assumptions, and reason through the problem.",
        improved_answer:
          "Review the topic fundamentals and answer with definition, logic, and one example.",
        follow_up_question:
          "Which fundamental concept would you start with if you had to answer this again?",
      };
    }

    const prompt =
      options.type === "company"
        ? `
Evaluate answer like a ${safeCompany} interviewer.

Company: ${safeCompany}
Role: ${safeRole}
Round: ${roundLabel}

Question:
${question}

Candidate Answer:
${answer}

Return only valid JSON in this exact shape:
{
  "score": number,
  "communication_score": number,
  "technical_score": number,
  "strengths": ["string"],
  "weaknesses": ["string"],
  "improvement": "string",
  "follow_up_question": "string"
}

Scoring rules:
- score, communication_score, and technical_score must be 1 to 10
- Judge communication for structure, specificity, and interviewer clarity
- Judge technical_score for technical correctness where relevant; for HR rounds, score role reasoning and depth
- Include company-specific expectations in the feedback
- Give one realistic follow-up question
`.trim()
        : `
You are a strict technical interviewer. Evaluate the answer like a real interviewer.

Question:
${question}

Candidate Answer:
${answer}

Evaluate the answer and return only valid JSON in this exact shape:
{
  "score": number,
  "strengths": ["string"],
  "weaknesses": ["string"],
  "missing_concepts": ["string"],
  "improved_answer": "string",
  "follow_up_question": "string"
}

Scoring rules:
- 0 to 2: incorrect or largely irrelevant
- 3 to 5: partially correct but incomplete
- 6 to 8: correct with reasonable understanding
- 9 to 10: accurate, complete, and interview-quality

Give a realistic follow-up question that tests the weakest part of the answer.
Keep strengths, weaknesses, and missing_concepts concise.
`.trim();

    const response = await createChatCompletion(
      [{ role: "user", content: prompt }],
      { temperature: 0.2, maxTokens: 450 }
    );

    const parsed = parseJsonObject(extractMessageText(response));

    return {
      score: Number(parsed.score) || FALLBACK_EVALUATION.score,
      communication_score:
        Number(parsed.communication_score) ||
        Number(parsed.communicationScore) ||
        FALLBACK_EVALUATION.communication_score,
      technical_score:
        Number(parsed.technical_score) ||
        Number(parsed.technicalScore) ||
        FALLBACK_EVALUATION.technical_score,
      strengths: Array.isArray(parsed.strengths)
        ? parsed.strengths
        : FALLBACK_EVALUATION.strengths,
      weaknesses: Array.isArray(parsed.weaknesses)
        ? parsed.weaknesses
        : FALLBACK_EVALUATION.weaknesses,
      missing_concepts: Array.isArray(parsed.missing_concepts)
        ? parsed.missing_concepts
        : FALLBACK_EVALUATION.missing_concepts,
      improvement:
        typeof parsed.improvement === "string" && parsed.improvement.trim()
          ? parsed.improvement.trim()
          : FALLBACK_EVALUATION.improvement,
      improved_answer:
        typeof parsed.improved_answer === "string" && parsed.improved_answer.trim()
          ? parsed.improved_answer.trim()
          : FALLBACK_EVALUATION.improved_answer,
      follow_up_question:
        typeof parsed.follow_up_question === "string" &&
        parsed.follow_up_question.trim()
          ? parsed.follow_up_question.trim()
          : FALLBACK_EVALUATION.follow_up_question,
    };
  } catch (error) {
    logOpenRouterError("evaluateAnswer", error);
    return FALLBACK_EVALUATION;
  }
};

const generateFollowUp = async (
  question,
  answerOrWeaknesses,
  maybeWeaknesses = []
) => {
  const usesLegacySignature = Array.isArray(answerOrWeaknesses);
  const answer = usesLegacySignature
    ? "No candidate answer provided."
    : String(answerOrWeaknesses || "").trim() || "No candidate answer provided.";
  const weaknesses = usesLegacySignature
    ? answerOrWeaknesses
    : maybeWeaknesses;
  const weaknessList =
    Array.isArray(weaknesses) && weaknesses.length > 0
      ? weaknesses.join(", ")
      : "Needs deeper conceptual clarity";

  const prompt = `
You are an interviewer asking a follow-up question.

Original Question:
${question}

Candidate Answer:
${answer}

Observed Weaknesses:
${weaknessList}

Ask exactly one follow-up question that targets the weakness.
- Make it realistic
- Keep it concise
- Do not add explanation or bullet points
`.trim();

  try {
    const response = await createChatCompletion(
      [{ role: "user", content: prompt }],
      { temperature: 0.6, maxTokens: 180 }
    );

    const followUp = extractMessageText(response);
    if (!followUp) {
      throw new Error("Empty follow-up response");
    }

    return followUp;
  } catch (error) {
    logOpenRouterError("generateFollowUp", error);
    return "Can you explain that concept again with a concrete example?";
  }
};

module.exports = {
  generateQuestion,
  evaluateAnswer,
  generateFollowUp,
};
