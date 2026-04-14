const OpenAI = require("openai");

const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

// 🎯 Generate Question
const generateQuestion = async (topic, difficulty, role) => {
  try {
    const prompt = `Generate a ${difficulty} level interview question on ${topic} for a ${role} candidate. Keep it realistic and commonly asked.`;

    const response = await client.chat.completions.create({
      model: "mistralai/mistral-7b-instruct", // free model
      messages: [{ role: "user", content: prompt }],
    });

    return response.choices[0].message.content.trim();
  } catch (err) {
    console.error("AI Question Error:", err.message);

    // 🔁 fallback (important for stability)
    return `Explain ${topic} concepts for ${role} (${difficulty}).`;
  }
};

// 🧠 Evaluate Answer
const evaluateAnswer = async (question, answer) => {
  try {
    const prompt = `
Evaluate this interview answer.

Question: ${question}
Answer: ${answer}

Return STRICT JSON:
{
  "score": number,
  "strengths": [],
  "weaknesses": [],
  "missing_concepts": [],
  "improved_answer": ""
}
`;

    const response = await client.chat.completions.create({
      model: "mistralai/mistral-7b-instruct",
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.choices[0].message.content;

    // 🧠 Safe JSON parsing
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Invalid JSON from AI");

    return JSON.parse(jsonMatch[0]);
  } catch (err) {
    console.error("AI Evaluation Error:", err.message);

    // 🔁 fallback response (VERY IMPORTANT)
    return {
      score: 5,
      strengths: ["Basic understanding"],
      weaknesses: ["Lacks depth"],
      missing_concepts: ["Key details missing"],
      improved_answer: "Try to structure your answer with definitions, examples, and key points.",
    };
  }
};

module.exports = {
  generateQuestion,
  evaluateAnswer,
};