const crypto = require("crypto");
const OpenAI = require("openai");

let Groq = null;
try {
  Groq = require("groq-sdk");
} catch (error) {
  Groq = null;
}

const PROVIDER = (process.env.AI_PROVIDER || "groq").toLowerCase();
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.1-8b-instant";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const CACHE_TTL_MS = Number(process.env.AI_CACHE_TTL_MS || 30 * 60 * 1000);
const cache = new Map();

const FALLBACK_EVALUATION = {
  score: 4,
  communication_score: 4,
  technical_score: 4,
  strengths: ["Shows some familiarity with the topic"],
  weaknesses: ["Answer needs more structure, specificity, and technical depth"],
  missing_concepts: ["Core details, tradeoffs, and practical examples"],
  improvement: "Use a clear structure: definition, reasoning, tradeoffs, example, and conclusion.",
  improved_answer: "Start with the core idea, explain how it works, discuss one tradeoff, and finish with a concrete example.",
  follow_up_question: "Can you explain the key tradeoff and support it with a concrete example?",
  difficulty_recommendation: "medium",
};

const COMPANY_SIGNALS = {
  Amazon: "Leadership Principles, ownership, customer obsession, bias for action, and measurable impact",
  Google: "problem solving, clarity, scalable reasoning, data structures, and system tradeoffs",
  Microsoft: "collaboration, product thinking, design clarity, reliability, and growth mindset",
  Flipkart: "customer impact, ownership, frugal execution, marketplace scale, and operational tradeoffs",
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const normalizeText = (value, fallback = "") => {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed || fallback;
};

const stableHash = (value) =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");

const getCached = (key) => {
  const hit = cache.get(key);
  if (!hit || hit.expiresAt < Date.now()) {
    cache.delete(key);
    return null;
  }
  return hit.value;
};

const setCached = (key, value, ttl = CACHE_TTL_MS) => {
  cache.set(key, { value, expiresAt: Date.now() + ttl });
  return value;
};

const getProvider = () => {
  if (PROVIDER === "openai" && OPENAI_API_KEY) {
    return {
      name: "openai",
      model: OPENAI_MODEL,
      client: new OpenAI({ apiKey: OPENAI_API_KEY }),
    };
  }

  if (GROQ_API_KEY) {
    if (Groq) {
      return {
        name: "groq",
        model: GROQ_MODEL,
        client: new Groq({ apiKey: GROQ_API_KEY }),
      };
    }

    return {
      name: "groq-openai-compatible",
      model: GROQ_MODEL,
      client: new OpenAI({
        apiKey: GROQ_API_KEY,
        baseURL: "https://api.groq.com/openai/v1",
      }),
    };
  }

  if (OPENAI_API_KEY) {
    return {
      name: "openai",
      model: OPENAI_MODEL,
      client: new OpenAI({ apiKey: OPENAI_API_KEY }),
    };
  }

  return null;
};

const extractMessageText = (response) =>
  response?.choices?.[0]?.message?.content?.trim() || "";

const logAIError = (label, error, provider) => {
  console.error(`[AI] ${label} failed`, {
    provider: provider?.name || "none",
    model: provider?.model || null,
    message: error.message,
    status: error.status || error.code || null,
  });
};

const toMessages = (system, user, history = []) => [
  { role: "system", content: system },
  ...history
    .filter((item) => item && ["user", "assistant"].includes(item.role))
    .slice(-8)
    .map((item) => ({
      role: item.role,
      content: String(item.content || item.message || "").slice(0, 2000),
    }))
    .filter((item) => item.content.trim()),
  { role: "user", content: user },
];

const createChatCompletion = async (messages, options = {}) => {
  const provider = getProvider();
  if (!provider) {
    throw new Error("No AI provider configured. Set GROQ_API_KEY or OPENAI_API_KEY.");
  }

  try {
    const response = await provider.client.chat.completions.create({
      model: options.model || provider.model,
      messages,
      temperature: options.temperature ?? 0.4,
      max_tokens: options.maxTokens ?? 600,
      response_format: options.json ? { type: "json_object" } : undefined,
    });
    return extractMessageText(response);
  } catch (error) {
    logAIError(options.label || "completion", error, provider);
    throw error;
  }
};

const parseJsonFromText = (content, fallback) => {
  const text = String(content || "").trim();
  if (!text) return fallback;

  try {
    return JSON.parse(text);
  } catch (error) {
    const objectMatch = text.match(/\{[\s\S]*\}/);
    const arrayMatch = text.match(/\[[\s\S]*\]/);
    const match = objectMatch || arrayMatch;
    if (!match) return fallback;
    try {
      return JSON.parse(match[0]);
    } catch (nestedError) {
      return fallback;
    }
  }
};

const generatedFallbackQuestion = (topic, difficulty, role, previousQuestions = []) => {
  const seed = stableHash({ topic, difficulty, role, previousQuestions, time: Math.floor(Date.now() / 60000) });
  const stems = [
    "Walk me through how you would design and implement",
    "Explain the tradeoffs involved in",
    "How would you debug a production issue related to",
    "Describe a realistic optimization strategy for",
  ];
  const stem = stems[parseInt(seed.slice(0, 2), 16) % stems.length];
  return `${stem} ${topic} for a ${role} interview at ${difficulty} difficulty. Include assumptions and tradeoffs.`;
};

const calculateResumeSignals = (resumeText) => {
  const text = normalizeText(resumeText).toLowerCase();
  const words = text.split(/\s+/).filter(Boolean);
  const techKeywords = [
    "javascript", "typescript", "react", "node", "express", "python", "java",
    "sql", "postgres", "mongodb", "aws", "docker", "kubernetes", "redis",
    "machine learning", "nlp", "api", "microservices", "testing", "ci/cd",
    "data structures", "algorithms", "system design",
  ];
  const actionWords = ["built", "designed", "implemented", "optimized", "deployed", "led", "improved", "reduced", "increased", "automated"];
  const metrics = (resumeText.match(/(\d+%|\d+\+|\$\d+|\b\d+\s*(users|requests|ms|seconds|projects|apis|models)\b)/gi) || []).length;
  const foundSkills = techKeywords.filter((keyword) => text.includes(keyword));
  const actionCount = actionWords.filter((word) => text.includes(word)).length;
  const sectionCount = ["experience", "projects", "skills", "education", "summary", "certifications"].filter((section) => text.includes(section)).length;
  const lengthScore = clamp(Math.round((words.length / 450) * 20), 4, 20);
  const keywordScore = clamp(foundSkills.length * 4, 0, 28);
  const metricScore = clamp(metrics * 5, 0, 20);
  const actionScore = clamp(actionCount * 3, 0, 15);
  const structureScore = clamp(sectionCount * 3, 0, 12);
  const readabilityScore = resumeText.length > 250 && resumeText.length < 9000 ? 5 : 2;
  const score = clamp(lengthScore + keywordScore + metricScore + actionScore + structureScore + readabilityScore, 10, 92);

  return {
    score,
    foundSkills,
    missingKeywords: techKeywords.filter((keyword) => !text.includes(keyword)).slice(0, 10),
    metrics,
    actionCount,
    sectionCount,
  };
};

const normalizeEvaluation = (parsed) => ({
  ...FALLBACK_EVALUATION,
  ...parsed,
  score: clamp(Math.round(Number(parsed?.score) || FALLBACK_EVALUATION.score), 1, 10),
  communication_score: clamp(Math.round(Number(parsed?.communication_score || parsed?.communicationScore) || FALLBACK_EVALUATION.communication_score), 1, 10),
  technical_score: clamp(Math.round(Number(parsed?.technical_score || parsed?.technicalScore) || FALLBACK_EVALUATION.technical_score), 1, 10),
  strengths: Array.isArray(parsed?.strengths) ? parsed.strengths.slice(0, 4) : FALLBACK_EVALUATION.strengths,
  weaknesses: Array.isArray(parsed?.weaknesses) ? parsed.weaknesses.slice(0, 4) : FALLBACK_EVALUATION.weaknesses,
  missing_concepts: Array.isArray(parsed?.missing_concepts) ? parsed.missing_concepts.slice(0, 4) : FALLBACK_EVALUATION.missing_concepts,
  difficulty_recommendation: ["easy", "medium", "hard"].includes(String(parsed?.difficulty_recommendation).toLowerCase())
    ? String(parsed.difficulty_recommendation).toLowerCase()
    : "medium",
});

const analyzeResume = async (resumeText) => {
  const signals = calculateResumeSignals(resumeText);
  const prompt = `
Analyze the resume like an ATS plus senior recruiter. Do not invent experience.

Return only valid JSON:
{
  "atsScore": number,
  "skills": ["string"],
  "missingKeywords": ["string"],
  "suggestions": ["string"],
  "scoreBreakdown": {
    "keywordMatch": number,
    "impactMetrics": number,
    "roleRelevance": number,
    "formatClarity": number,
    "projectDepth": number
  }
}

Rules:
- atsScore must be realistic from 0-100.
- Penalize generic resumes with no quantified impact.
- Reward relevant skills, projects, clear sections, action verbs, and measurable outcomes.
- Suggestions must be specific rewrite actions.

Local resume signals:
${JSON.stringify(signals)}

Resume:
${resumeText.slice(0, 12000)}
`.trim();

  try {
    const content = await createChatCompletion(
      toMessages("You are a strict ATS resume analyst. Return JSON only.", prompt),
      { temperature: 0.15, maxTokens: 1100, json: true, label: "analyzeResume" }
    );
    const parsed = parseJsonFromText(content, {});
    const aiScore = Number(parsed.atsScore);
    const blendedScore = Number.isFinite(aiScore)
      ? Math.round(signals.score * 0.55 + clamp(aiScore, 0, 100) * 0.45)
      : signals.score;

    return {
      atsScore: clamp(blendedScore, 0, 100),
      skills: [...new Set([...(signals.foundSkills || []), ...(Array.isArray(parsed.skills) ? parsed.skills : [])])].slice(0, 18),
      missingKeywords: (Array.isArray(parsed.missingKeywords) ? parsed.missingKeywords : signals.missingKeywords).slice(0, 10),
      suggestions: (Array.isArray(parsed.suggestions) ? parsed.suggestions : [
        "Add quantified impact for your strongest projects or internships.",
        "Group technical skills by category so ATS parsers can detect them cleanly.",
        "Rewrite project bullets with action, technology, result, and scale.",
      ]).slice(0, 8),
      scoreBreakdown: parsed.scoreBreakdown || signals,
      rawText: resumeText,
    };
  } catch (error) {
    return {
      atsScore: signals.score,
      skills: signals.foundSkills,
      missingKeywords: signals.missingKeywords,
      suggestions: [
        "Add quantified outcomes such as latency reduced, users served, accuracy improved, or cost saved.",
        "Include role-specific keywords from the target job description.",
        "Make each project bullet show problem, implementation, and measurable result.",
      ],
      scoreBreakdown: signals,
      rawText: resumeText,
      providerFallback: true,
    };
  }
};

const generateQuestion = async (topic, difficulty = "medium", role = "SDE", options = {}) => {
  const safeTopic = normalizeText(topic, "general computer science");
  const safeDifficulty = normalizeText(difficulty, "medium");
  const safeRole = normalizeText(role, "SDE");
  const previousQuestions = Array.isArray(options.previousQuestions) ? options.previousQuestions.slice(-12) : [];
  const avoidList = previousQuestions.length ? `Avoid these prior questions:\n${previousQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n")}` : "";
  const company = normalizeText(options.company, "");
  const round = normalizeText(options.round, "current round");
  const resumeText = normalizeText(options.resumeText, "");
  const customFields = Array.isArray(options.customFields)
    ? options.customFields
        .filter((field) => field?.label || field?.value)
        .map((field) => `${field.label || "Field"}: ${field.value || ""}`)
        .join("\n")
    : "";
  const preferredTopics = Array.isArray(options.preferredTopics) && options.preferredTopics.length
    ? options.preferredTopics.join(", ")
    : "";

  const context =
    options.type === "company"
      ? `Company: ${company || "target company"}\nCompany signals: ${COMPANY_SIGNALS[company] || "role fit, technical depth, and practical judgment"}\nRound: ${round}`
      : options.type === "resume"
        ? `Resume excerpt:\n${resumeText.slice(0, 5000)}`
        : `Topic: ${safeTopic}`;

  const prompt = `
Generate one fresh interview question.

${context}
Role: ${safeRole}
Difficulty: ${safeDifficulty}
Preferred topics: ${preferredTopics || "none supplied"}
Additional candidate/job context:
${customFields || "none supplied"}
${avoidList}

Rules:
- Ask exactly one question.
- Make it realistic and specific.
- Do not repeat wording or intent from prior questions.
- Prefer scenario-based prompts over definitions.
- Return plain text only.
`.trim();

  try {
    const content = await createChatCompletion(
      toMessages("You are a senior technical interviewer.", prompt),
      { temperature: 0.82, maxTokens: 220, label: "generateQuestion" }
    );
    return normalizeText(content, generatedFallbackQuestion(safeTopic, safeDifficulty, safeRole, previousQuestions));
  } catch (error) {
    return generatedFallbackQuestion(safeTopic, safeDifficulty, safeRole, previousQuestions);
  }
};

const evaluateAnswer = async (question, answer, options = {}) => {
  const cleanAnswer = normalizeText(answer);
  const customFields = Array.isArray(options.customFields)
    ? options.customFields
        .filter((field) => field?.label || field?.value)
        .map((field) => `${field.label || "Field"}: ${field.value || ""}`)
        .join("\n")
    : "";
  const preferredTopics = Array.isArray(options.preferredTopics) && options.preferredTopics.length
    ? options.preferredTopics.join(", ")
    : "";
  if (cleanAnswer.length < 20) {
    return normalizeEvaluation({
      score: 1,
      communication_score: 1,
      technical_score: 1,
      weaknesses: ["Answer is too short to evaluate meaningfully"],
      missing_concepts: ["Core explanation, assumptions, and example"],
      improvement: "Give a complete answer with the main idea, reasoning, example, and tradeoff.",
      follow_up_question: "Can you restate your answer with one concrete example and one tradeoff?",
      difficulty_recommendation: "easy",
    });
  }

  const prompt = `
Evaluate this interview answer. Return only valid JSON:
{
  "score": number,
  "communication_score": number,
  "technical_score": number,
  "strengths": ["string"],
  "weaknesses": ["string"],
  "missing_concepts": ["string"],
  "improvement": "string",
  "improved_answer": "string",
  "follow_up_question": "string",
  "difficulty_recommendation": "easy|medium|hard"
}

Context:
Type: ${options.type || "technical"}
Company: ${options.company || "N/A"}
Role: ${options.role || "SDE"}
Round: ${options.round || "N/A"}
Preferred topics: ${preferredTopics || "none supplied"}
Additional candidate/job context:
${customFields || "none supplied"}

Question:
${question}

Candidate answer:
${cleanAnswer}

Scoring:
- 1-2: incorrect, irrelevant, or too shallow.
- 3-5: partial understanding but missing important details.
- 6-8: mostly correct with useful structure and examples.
- 9-10: precise, complete, interview-ready, with tradeoffs.
`.trim();

  try {
    const content = await createChatCompletion(
      toMessages("You are a strict but fair interview evaluator. Return JSON only.", prompt),
      { temperature: 0.15, maxTokens: 900, json: true, label: "evaluateAnswer" }
    );
    return normalizeEvaluation(parseJsonFromText(content, FALLBACK_EVALUATION));
  } catch (error) {
    return FALLBACK_EVALUATION;
  }
};

const generateFollowUp = async (question, answerOrWeaknesses, maybeWeaknesses = []) => {
  const answer = Array.isArray(answerOrWeaknesses) ? "" : normalizeText(answerOrWeaknesses);
  const weaknesses = Array.isArray(answerOrWeaknesses) ? answerOrWeaknesses : maybeWeaknesses;
  const prompt = `
Original question:
${question}

Candidate answer:
${answer || "No answer supplied"}

Weaknesses:
${Array.isArray(weaknesses) ? weaknesses.join(", ") : "Needs depth"}

Ask exactly one follow-up question that targets the weakest point. Return plain text only.
`.trim();

  try {
    return normalizeText(await createChatCompletion(
      toMessages("You are an interviewer asking focused follow-ups.", prompt),
      { temperature: 0.65, maxTokens: 180, label: "generateFollowUp" }
    ), FALLBACK_EVALUATION.follow_up_question);
  } catch (error) {
    return FALLBACK_EVALUATION.follow_up_question;
  }
};

const generateConcept = async (topic) => {
  const safeTopic = normalizeText(topic, "software engineering");
  const cacheKey = `concept:${stableHash({ safeTopic })}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const prompt = `
Create deep learning notes for ${safeTopic}.

Format in markdown with:
1. Short definition
2. Why it matters in interviews
3. Core concepts
4. Step-by-step mental model
5. Practical example
6. Common mistakes
7. Interview-ready answer template
8. Practice prompts

Requirements:
- 900 to 1400 words.
- Use clear headings and bullets.
- Include practical engineering tradeoffs.
- Avoid generic filler.
`.trim();

  try {
    const content = await createChatCompletion(
      toMessages("You are an expert technical tutor for placement preparation.", prompt),
      { temperature: 0.45, maxTokens: 2200, label: "generateConcept" }
    );
    return setCached(cacheKey, content);
  } catch (error) {
    return `# ${safeTopic}\n\nAI notes could not be generated because no LLM provider responded. Configure GROQ_API_KEY or OPENAI_API_KEY and retry.`;
  }
};

const normalizeMcqs = (items) =>
  (Array.isArray(items) ? items : [])
    .filter((item) => item && typeof item.question === "string" && Array.isArray(item.options))
    .map((item) => {
      const options = item.options.map(String).slice(0, 4);
      const correctAnswer = normalizeText(item.correctAnswer || item.answer, options[0]);
      return {
        question: item.question.trim(),
        options,
        correctAnswer: options.includes(correctAnswer) ? correctAnswer : options[0],
        answer: options.includes(correctAnswer) ? correctAnswer : options[0],
        explanation: normalizeText(item.explanation, "Review the concept behind this question."),
      };
    })
    .filter((item) => item.options.length === 4);

const generateMCQs = async (topic, difficulty = "medium", options = {}) => {
  const safeTopic = normalizeText(topic, "software engineering");
  const safeDifficulty = normalizeText(difficulty, "medium");
  const seed = crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
  const cacheKey = options.cache !== false
    ? `mcq:${stableHash({ safeTopic, safeDifficulty, day: new Date().toISOString().slice(0, 10) })}`
    : null;
  const cached = cacheKey ? getCached(cacheKey) : null;
  if (cached) return cached;

  const prompt = `
Generate 10 fresh MCQs for placement preparation.

Topic: ${safeTopic}
Difficulty: ${safeDifficulty}
Uniqueness seed: ${seed}

Return only valid JSON:
{
  "questions": [
    {
      "question": "string",
      "options": ["string", "string", "string", "string"],
      "correctAnswer": "exact option text",
      "explanation": "string"
    }
  ]
}

Rules:
- Questions must be non-repeating and cover different subtopics.
- Mix conceptual, debugging, scenario, and output-prediction questions.
- Wrong options must be plausible.
- Explanations must be concise but useful.
`.trim();

  try {
    const content = await createChatCompletion(
      toMessages("You are an expert examiner. Return JSON only.", prompt),
      { temperature: 0.9, maxTokens: 2600, json: true, label: "generateMCQs" }
    );
    const parsed = parseJsonFromText(content, {});
    const mcqs = normalizeMcqs(parsed.questions || parsed);
    if (mcqs.length < 5) throw new Error("Model returned too few valid MCQs");
    return cacheKey ? setCached(cacheKey, mcqs) : mcqs;
  } catch (error) {
    return [];
  }
};

const generateInterviewQuestions = async (topic, difficulty = "medium", role = "SDE", count = 10, options = {}) => {
  const questions = [];
  for (let i = 0; i < count; i += 1) {
    const question = await generateQuestion(topic, difficulty, role, {
      ...options,
      previousQuestions: [...(options.previousQuestions || []), ...questions],
    });
    if (!questions.some((existing) => existing.toLowerCase() === question.toLowerCase())) {
      questions.push(question);
    }
  }
  return questions;
};

const generateChatResponse = async (message, topic, history = []) => {
  const safeTopic = normalizeText(topic, "placement preparation");
  const prompt = `
Student question:
${message}

Answer as a helpful AI placement tutor for ${safeTopic}.
Use examples, correct misconceptions, and end with one useful next practice step.
Keep the answer focused and practical.
`.trim();

  try {
    return normalizeText(await createChatCompletion(
      toMessages(`You are an expert tutor for ${safeTopic}. Never claim you cannot connect unless the API actually fails.`, prompt, history),
      { temperature: 0.65, maxTokens: 900, label: "generateChatResponse" }
    ), "I could not generate an answer from the AI provider. Please check the backend AI key configuration.");
  } catch (error) {
    return "I could not reach the AI provider. Please check GROQ_API_KEY or OPENAI_API_KEY in the backend environment and restart the server.";
  }
};

const generateSetupSuggestions = async ({
  company = "",
  role = "",
  interviewType = "technical",
  customFields = [],
  preferredTopics = [],
} = {}) => {
  const prompt = `
Suggest interview setup improvements for a candidate.

Company: ${company || "not specified"}
Role: ${role || "not specified"}
Interview type: ${interviewType}
Preferred topics: ${preferredTopics.join(", ") || "none"}
Custom fields:
${customFields.map((field) => `${field.label}: ${field.value}`).join("\n") || "none"}

Return only valid JSON:
{
  "topics": ["string"],
  "customFields": [{"label": "string", "value": "string"}],
  "tips": ["string"]
}

Rules:
- Keep topics relevant to the company and role if supplied.
- Include practical tech stack, experience level, or job description suggestions when useful.
- Do not restrict suggestions to famous companies.
`.trim();

  try {
    const content = await createChatCompletion(
      toMessages("You help configure personalized interview practice. Return JSON only.", prompt),
      { temperature: 0.55, maxTokens: 800, json: true, label: "generateSetupSuggestions" }
    );
    const parsed = parseJsonFromText(content, {});
    return {
      topics: Array.isArray(parsed.topics) ? parsed.topics.slice(0, 8) : [],
      customFields: Array.isArray(parsed.customFields)
        ? parsed.customFields
            .map((field) => ({
              label: normalizeText(field.label, ""),
              value: normalizeText(field.value, ""),
            }))
            .filter((field) => field.label || field.value)
            .slice(0, 6)
        : [],
      tips: Array.isArray(parsed.tips) ? parsed.tips.slice(0, 5) : [],
    };
  } catch (error) {
    const roleTopic = role ? `${role} fundamentals` : "Role fundamentals";
    return {
      topics: [roleTopic, "Problem solving", "System design", "Communication"],
      customFields: [],
      tips: ["Add a job description or tech stack to generate more targeted questions."],
      providerFallback: true,
    };
  }
};

const getAIStatus = () => {
  const provider = getProvider();
  return {
    configured: Boolean(provider),
    provider: provider?.name || null,
    model: provider?.model || null,
    cacheSize: cache.size,
    groqSdkInstalled: Boolean(Groq),
  };
};

module.exports = {
  generateQuestion,
  evaluateAnswer,
  generateFollowUp,
  analyzeResume,
  generateConcept,
  generateMCQs,
  generateInterviewQuestions,
  generateChatResponse,
  generateSetupSuggestions,
  getAIStatus,
};
