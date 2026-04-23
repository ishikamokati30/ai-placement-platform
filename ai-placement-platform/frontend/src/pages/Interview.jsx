import { useState } from "react";
import API, { getApiErrorMessage } from "../services/api";
import Navbar from "../components/Navbar";

export default function Interview() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [interviewId, setInterviewId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [role, setRole] = useState("SDE");
  const [type, setType] = useState("technical");
  const [topic, setTopic] = useState("");

  const startInterview = async () => {
    setLoading(true);
    setErrorMessage("");

    try {
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
      const message = getApiErrorMessage(err);
      console.error("Start interview failed:", {
        message,
        status: err.response?.status,
        data: err.response?.data,
      });
      setErrorMessage(message || "Failed to start interview.");
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async () => {
    if (!interviewId || !question || !answer.trim()) {
      setErrorMessage("Start an interview and enter an answer first.");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const res = await API.post("/interview/answer", {
        interviewId,
        question,
        answer,
      });

      setFeedback(res.data);
    } catch (err) {
      const message = getApiErrorMessage(err);
      console.error("Submit answer failed:", {
        message,
        status: err.response?.status,
        data: err.response?.data,
      });
      setErrorMessage(message || "Error submitting answer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      <Navbar />
      <main style={{ padding: "40px", maxWidth: "900px", margin: "0 auto" }}>
        <h1>AI Mock Interview</h1>

        <section style={styles.controls}>
          <label style={styles.label}>
            Role
            <select
              style={styles.input}
              value={role}
              onChange={(event) => setRole(event.target.value)}
            >
              <option value="SDE">SDE</option>
              <option value="Data Analyst">Data Analyst</option>
            </select>
          </label>

          <label style={styles.label}>
            Type
            <select
              style={styles.input}
              value={type}
              onChange={(event) => setType(event.target.value)}
            >
              <option value="technical">Technical</option>
              <option value="hr">HR</option>
            </select>
          </label>

          <label style={styles.label}>
            Topic
            <input
              style={styles.input}
              placeholder="e.g. DBMS, DSA, OS"
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
            />
          </label>
        </section>

        {errorMessage ? <p style={styles.error}>{errorMessage}</p> : null}

        <button style={styles.primaryButton} onClick={startInterview} disabled={loading}>
          {loading ? "Working..." : "Start Interview"}
        </button>

        {question ? (
          <section style={styles.section}>
            <h2>Question</h2>
            <p>{question}</p>

            <textarea
              style={styles.textarea}
              rows="6"
              placeholder="Type your answer..."
              value={answer}
              onChange={(event) => setAnswer(event.target.value)}
            />

            <button style={styles.primaryButton} onClick={submitAnswer} disabled={loading}>
              {loading ? "Working..." : "Submit Answer"}
            </button>
          </section>
        ) : null}

        {feedback?.feedback ? (
          <section style={styles.section}>
            <h2>Feedback</h2>

            <p>
              <b>Score:</b> {feedback.feedback.score}/10
            </p>

            <h3>Strengths</h3>
            <ul>
              {feedback.feedback.strengths.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>

            <h3>Weaknesses</h3>
            <ul>
              {feedback.feedback.weaknesses.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>

            <h3>Missing Concepts</h3>
            <ul>
              {feedback.feedback.missing_concepts.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>

            <h3>Improved Answer</h3>
            <p>{feedback.feedback.improved_answer}</p>

            {feedback.followUpQuestion ? (
              <>
                <h3>Follow-up Question</h3>
                <p>{feedback.followUpQuestion}</p>
              </>
            ) : null}
          </section>
        ) : null}
      </main>
    </div>
  );
}

const styles = {
  controls: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "16px",
    margin: "20px 0",
  },
  label: {
    display: "grid",
    gap: "6px",
    fontWeight: 600,
  },
  input: {
    height: "40px",
    border: "1px solid #cbd5e1",
    borderRadius: "6px",
    padding: "0 10px",
  },
  textarea: {
    width: "100%",
    border: "1px solid #cbd5e1",
    borderRadius: "6px",
    padding: "12px",
    boxSizing: "border-box",
    resize: "vertical",
  },
  section: {
    marginTop: "24px",
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    padding: "20px",
  },
  primaryButton: {
    marginTop: "12px",
    padding: "10px 18px",
    background: "#2563eb",
    color: "#ffffff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
  error: {
    color: "#b91c1c",
    background: "#fee2e2",
    border: "1px solid #fecaca",
    borderRadius: "6px",
    padding: "10px",
  },
};
