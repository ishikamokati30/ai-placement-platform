import { useState } from "react";
import API from "../services/api";

export default function Interview() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [interviewId, setInterviewId] = useState(null);
  const [loading, setLoading] = useState(false);
const [role, setRole] = useState("SDE");
const [type, setType] = useState("technical");
const [topic, setTopic] = useState("");


<div style={{ marginBottom: "20px" }}>
  <label>Role: </label>
  <select onChange={(e) => setRole(e.target.value)}>
    <option value="SDE">SDE</option>
    <option value="Data Analyst">Data Analyst</option>
  </select>

  <br /><br />

  <label>Type: </label>
  <select onChange={(e) => setType(e.target.value)}>
    <option value="technical">Technical</option>
    <option value="hr">HR</option>
  </select>

  <br /><br />

  <label>Topic (optional): </label>
  <input
    placeholder="e.g. DBMS, DSA, OS"
    value={topic}
    onChange={(e) => setTopic(e.target.value)}
  />
</div>

  // 🚀 Start Interview
  const startInterview = async () => {
    try {
      setLoading(true);

      const res = await API.post("/interview/start", {
  type,
  topic,
  difficulty: "medium",
  role,
});

      setQuestion(res.data.question);
      setInterviewId(res.data.interviewId);
      setFeedback(null);
      setAnswer("");
    } catch (err) {
      alert("Failed to start interview");
    } finally {
      setLoading(false);
    }
  };

  // 🧠 Submit Answer
  const submitAnswer = async () => {
    try {
      setLoading(true);

      const res = await API.post("/interview/answer", {
        interviewId,
        question,
        answer,
      });

      setFeedback(res.data);
    } catch (err) {
      alert("Error submitting answer");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "40px" }}>
      <h1>AI Mock Interview</h1>

      <button onClick={startInterview}>
        {loading ? "Starting..." : "Start Interview"}
      </button>

      {question && (
        <>
          <h3>Question:</h3>
          <p>{question}</p>

          <textarea
            rows="6"
            cols="60"
            placeholder="Type your answer..."
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
          />

          <br /><br />

          <button onClick={submitAnswer}>
            {loading ? "Submitting..." : "Submit Answer"}
          </button>
        </>
      )}

      {feedback && (
        <div style={{ marginTop: "20px" }}>
          <h3>Feedback</h3>

          <p><b>Score:</b> {feedback.feedback.score}/10</p>

          <p><b>Strengths:</b></p>
          <ul>
            {feedback.feedback.strengths.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>

          <p><b>Weaknesses:</b></p>
          <ul>
            {feedback.feedback.weaknesses.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>

          <p><b>Missing Concepts:</b></p>
          <ul>
            {feedback.feedback.missing_concepts.map((m, i) => (
              <li key={i}>{m}</li>
            ))}
          </ul>

          <p><b>Improved Answer:</b></p>
          <p>{feedback.feedback.improved_answer}</p>

          {feedback.followUpQuestion && (
            <>
              <h3>Follow-up Question:</h3>
              <p>{feedback.followUpQuestion}</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}