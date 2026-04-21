const OpenAI = require("openai");

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";
const DEFAULT_MODEL = process.env.OPENROUTER_MODEL || "openrouter/free";
const DEFAULT_REFERER =
  process.env.OPENROUTER_SITE_URL || "http://localhost:3000";
const DEFAULT_TITLE =
  process.env.OPENROUTER_APP_NAME || "AI Placement Platform";

const client = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: OPENROUTER_BASE_URL,
  defaultHeaders: {
    "HTTP-Referer": DEFAULT_REFERER,
    "X-Title": DEFAULT_TITLE,
  },
});

const FALLBACK_EVALUATION = {
  score: 5,
  strengths: ["Basic attempt made"],
  weaknesses: ["Needs clearer explanation and stronger technical depth"],
  missing_concepts: ["Key concepts were not explained completely"],
  improved_answer:
    "Re-answer with a clear definition, the core concept, and one practical example.",
};

const logOpenRouterError = (label, error) => {
  console.error(`[AI] ${label} failed`, {
    model: DEFAULT_MODEL,
    message: error.message,
    status: error.status || error.code || null,
    details: error.response?.data || error.error || null,
  });
};

const extractMessageText = (response) =>
  response?.choices?.[0]?.message?.content?.trim() || "";

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
  return client.chat.completions.create({
    model: DEFAULT_MODEL,
    temperature: options.temperature ?? 0.4,
    max_tokens: options.maxTokens ?? 300,
    messages,
  });
};

const generateQuestion = async (topic, difficulty = "medium", role = "SDE") => {
  const prompt = `
You are an experienced technical interviewer.

Generate exactly one realistic interview question.

Role: ${role}
Difficulty: ${difficulty}
Topic: ${topic}

Rules:
- Ask only one question
- Keep it interview-ready and concise
- Do not include explanation, hints, or multiple parts unless naturally required
`.trim();

  try {
    const response = await createChatCompletion(
      [{ role: "user", content: prompt }],
      { temperature: 0.7, maxTokens: 180 }
    );

    const question = extractMessageText(response);
    if (!question) {
      throw new Error("Empty question response");
    }

    return question;
  } catch (error) {
    logOpenRouterError("generateQuestion", error);
    return `Explain ${topic} in the context of a ${role} interview at ${difficulty} difficulty.`;
  }
};

const evaluateAnswer = async (question, answer) => {
  try {
    if (!answer || answer.trim().length < 10) {
      return {
        score: 1,
        strengths: [],
        weaknesses: ["Answer is too short to demonstrate understanding"],
        missing_concepts: ["Core explanation of the topic"],
        improved_answer:
          "Start with the main concept, then explain how it works with a simple example.",
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
        strengths: [],
        weaknesses: ["No clear understanding was demonstrated"],
        missing_concepts: ["Fundamental concepts behind the question"],
        improved_answer:
          "Review the topic fundamentals and answer with definition, logic, and one example.",
      };
    }

    const prompt = `
You are a strict technical interviewer.

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
  "improved_answer": "string"
}

Scoring rules:
- 0 to 2: incorrect or largely irrelevant
- 3 to 5: partially correct but incomplete
- 6 to 8: correct with reasonable understanding
- 9 to 10: accurate, complete, and interview-quality

Keep strengths, weaknesses, and missing_concepts concise.
`.trim();

    const response = await createChatCompletion(
      [{ role: "user", content: prompt }],
      { temperature: 0.2, maxTokens: 450 }
    );

    const parsed = parseJsonObject(extractMessageText(response));

    return {
      score: Number(parsed.score) || FALLBACK_EVALUATION.score,
      strengths: Array.isArray(parsed.strengths)
        ? parsed.strengths
        : FALLBACK_EVALUATION.strengths,
      weaknesses: Array.isArray(parsed.weaknesses)
        ? parsed.weaknesses
        : FALLBACK_EVALUATION.weaknesses,
      missing_concepts: Array.isArray(parsed.missing_concepts)
        ? parsed.missing_concepts
        : FALLBACK_EVALUATION.missing_concepts,
      improved_answer:
        typeof parsed.improved_answer === "string" && parsed.improved_answer.trim()
          ? parsed.improved_answer.trim()
          : FALLBACK_EVALUATION.improved_answer,
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
