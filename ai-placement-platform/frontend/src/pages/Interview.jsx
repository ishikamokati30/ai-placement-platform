import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import API, { getApiErrorMessage } from "../services/api";
import Navbar from "../components/Navbar";

const DEFAULT_TOTAL_QUESTIONS = 5;

const roles = ["SDE", "Frontend Engineer", "Backend Engineer", "Data Analyst"];
const difficulties = ["Easy", "Medium", "Hard"];

const getFeedbackValue = (source, snakeKey, camelKey, fallback) =>
  source?.[snakeKey] ?? source?.[camelKey] ?? fallback;

const toList = (value) => (Array.isArray(value) && value.length ? value : []);

export default function Interview() {
  const location = useLocation();
  const navigate = useNavigate();
  const hasAutoStarted = useRef(false);

  const [step, setStep] = useState("setup");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [followUpQuestion, setFollowUpQuestion] = useState("");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [totalQuestions] = useState(DEFAULT_TOTAL_QUESTIONS);
  const [loading, setLoading] = useState(false);
  const [interviewId, setInterviewId] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [scores, setScores] = useState([]);
  const [weakAreas, setWeakAreas] = useState([]);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [role, setRole] = useState(location.state?.role || "SDE");
  const [type, setType] = useState(location.state?.type || "technical");
  const [topic, setTopic] = useState(location.state?.topic || "");
  const [difficulty, setDifficulty] = useState("Medium");

  const averageScore = useMemo(() => {
    if (!scores.length) return 0;
    const total = scores.reduce((sum, score) => sum + Number(score || 0), 0);
    return Math.round((total / scores.length) * 10) / 10;
  }, [scores]);

  const formattedTime = useMemo(() => {
    const minutes = String(Math.floor(elapsedSeconds / 60)).padStart(2, "0");
    const seconds = String(elapsedSeconds % 60).padStart(2, "0");
    return `${minutes}:${seconds}`;
  }, [elapsedSeconds]);

  const normalizedFeedback = useMemo(() => {
    if (!feedback) return null;

    return {
      score: Number(feedback.score || 0),
      strengths: toList(feedback.strengths),
      weaknesses: toList(feedback.weaknesses),
      missingConcepts: toList(
        getFeedbackValue(feedback, "missing_concepts", "missingConcepts", [])
      ),
      improvedAnswer: getFeedbackValue(
        feedback,
        "improved_answer",
        "improvedAnswer",
        ""
      ),
    };
  }, [feedback]);

  const startInterview = async ({ preserveProgress = false } = {}) => {
    setLoading(true);
    setErrorMessage("");

    try {
      const res = await API.post("/interview/start", {
        interviewId: preserveProgress ? interviewId : undefined,
        type,
        topic,
        difficulty: difficulty.toLowerCase(),
        role,
      });

      setInterviewId(res.data.interviewId);
      setQuestion(res.data.question || "");
      setAnswer("");
      setFeedback(null);
      setFollowUpQuestion("");
      setElapsedSeconds(0);

      if (!preserveProgress) {
        setScores([]);
        setWeakAreas([]);
        setCurrentQuestionIndex(0);
      }

      setStep("interview");
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
      const res = await API.post("/interview/submit", {
        interviewId,
        question,
        answer,
      });

      const nextFeedback = res.data.feedback || {};
      const nextFollowUp = res.data.followUpQuestion || "";
      const score = Number(nextFeedback.score || 0);
      const weaknesses = toList(nextFeedback.weaknesses);
      const missingConcepts = toList(
        getFeedbackValue(nextFeedback, "missing_concepts", "missingConcepts", [])
      );

      setFeedback(nextFeedback);
      setFollowUpQuestion(nextFollowUp);
      setScores((previous) => [...previous, score]);
      setWeakAreas((previous) => [
        ...previous,
        ...weaknesses,
        ...missingConcepts,
      ]);
      setStep("feedback");
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

  const goToNextQuestion = async () => {
    const nextIndex = currentQuestionIndex + 1;

    if (nextIndex >= totalQuestions) {
      setStep("completed");
      return;
    }

    setCurrentQuestionIndex(nextIndex);
    setAnswer("");
    setFeedback(null);
    setElapsedSeconds(0);

    if (followUpQuestion) {
      setQuestion(followUpQuestion);
      setFollowUpQuestion("");
      setStep("interview");
      return;
    }

    await startInterview({ preserveProgress: true });
  };

  const endInterview = () => {
    setStep("completed");
  };

  useEffect(() => {
    if (!location.state) return;

    if (location.state.role) setRole(location.state.role);
    if (location.state.type) setType(location.state.type);
    if (location.state.topic) setTopic(location.state.topic);
  }, [location.state]);

  useEffect(() => {
    if (step !== "interview") return undefined;

    const timer = window.setInterval(() => {
      setElapsedSeconds((current) => current + 1);
    }, 1000);

    return () => window.clearInterval(timer);
  }, [step, question]);

  useEffect(() => {
    if (!location.state?.launchOnLoad || hasAutoStarted.current) return;

    hasAutoStarted.current = true;
    startInterview();
  }, [location.state, role, type, topic, difficulty]);

  const uniqueWeakAreas = [...new Set(weakAreas)].slice(0, 5);

  return (
    <div style={styles.page}>
      <Navbar />
      <main style={styles.main}>
        {errorMessage ? <p style={styles.error}>{errorMessage}</p> : null}

        <div style={styles.transition}>
          {step === "setup" ? (
            <section style={styles.heroCard}>
              <div>
                <p style={styles.eyebrow}>ElevateAI practice mode</p>
                <h1 style={styles.title}>Practice Interview</h1>
                <p style={styles.subtitle}>
                  Configure a focused session and answer one realistic question
                  at a time.
                </p>
              </div>

              <div style={styles.setupGrid}>
                <label style={styles.label}>
                  Role
                  <select
                    style={styles.input}
                    value={role}
                    onChange={(event) => setRole(event.target.value)}
                  >
                    {roles.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
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

                <label style={styles.label}>
                  Difficulty
                  <select
                    style={styles.input}
                    value={difficulty}
                    onChange={(event) => setDifficulty(event.target.value)}
                  >
                    {difficulties.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <button
                style={styles.primaryButton}
                onClick={() => startInterview()}
                disabled={loading}
              >
                {loading ? "Starting..." : "Start Interview"}
              </button>
            </section>
          ) : null}

          {step === "interview" ? (
            <section style={styles.stack}>
              <header style={styles.interviewHeader}>
                <div>
                  <p style={styles.eyebrow}>Practice Interview</p>
                  <h1 style={styles.compactTitle}>Question session</h1>
                </div>
                <div style={styles.headerStats}>
                  <span style={styles.statPill}>
                    Question {currentQuestionIndex + 1} / {totalQuestions}
                  </span>
                  <span style={styles.statPill}>{formattedTime}</span>
                </div>
              </header>

              <article style={styles.card}>
                <p style={styles.cardLabel}>Question</p>
                <h2 style={styles.question}>{question}</h2>
              </article>

              <article style={styles.card}>
                <label style={styles.label}>
                  Your answer
                  <textarea
                    style={styles.textarea}
                    rows="9"
                    placeholder="Explain your approach..."
                    value={answer}
                    onChange={(event) => setAnswer(event.target.value)}
                  />
                </label>
                <button
                  style={styles.primaryButton}
                  onClick={submitAnswer}
                  disabled={loading || !answer.trim()}
                >
                  {loading ? "Evaluating..." : "Submit Answer"}
                </button>
              </article>
            </section>
          ) : null}

          {step === "feedback" && normalizedFeedback ? (
            <section style={styles.stack}>
              <header style={styles.interviewHeader}>
                <div>
                  <p style={styles.eyebrow}>Interviewer feedback</p>
                  <h1 style={styles.compactTitle}>
                    Question {currentQuestionIndex + 1} review
                  </h1>
                </div>
                <div style={styles.scoreBadge}>
                  <strong style={styles.scoreValue}>{normalizedFeedback.score}</strong>
                  <span style={styles.scoreSuffix}>/10</span>
                </div>
              </header>

              <div style={styles.feedbackGrid}>
                <FeedbackList title="Strengths" items={normalizedFeedback.strengths} />
                <FeedbackList title="Weaknesses" items={normalizedFeedback.weaknesses} />
                <FeedbackList
                  title="Missing Concepts"
                  items={normalizedFeedback.missingConcepts}
                />
              </div>

              <article style={styles.card}>
                <p style={styles.cardLabel}>Improved Answer</p>
                <p style={styles.bodyText}>
                  {normalizedFeedback.improvedAnswer ||
                    "Add a clearer structure, cover the key concepts, and support the answer with an example."}
                </p>
              </article>

              {followUpQuestion ? (
                <article style={styles.card}>
                  <p style={styles.cardLabel}>Follow-up Question</p>
                  <p style={styles.bodyText}>{followUpQuestion}</p>
                </article>
              ) : null}

              <div style={styles.actions}>
                <button style={styles.primaryButton} onClick={goToNextQuestion}>
                  Next Question
                </button>
                <button style={styles.secondaryButton} onClick={endInterview}>
                  End Interview
                </button>
              </div>
            </section>
          ) : null}

          {step === "completed" ? (
            <section style={styles.heroCard}>
              <p style={styles.eyebrow}>Session summary</p>
              <h1 style={styles.title}>Interview Completed 🎉</h1>

              <div style={styles.summaryGrid}>
                <div style={styles.summaryMetric}>
                  <span>Average Score</span>
                  <strong>{averageScore || 0}/10</strong>
                </div>
                <div style={styles.summaryMetric}>
                  <span>Answered</span>
                  <strong>
                    {scores.length}/{totalQuestions}
                  </strong>
                </div>
              </div>

              <article style={styles.card}>
                <p style={styles.cardLabel}>Key Weak Areas</p>
                {uniqueWeakAreas.length ? (
                  <ul style={styles.list}>
                    {uniqueWeakAreas.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p style={styles.bodyText}>
                    No major weak areas were detected in this session.
                  </p>
                )}
              </article>

              <button
                style={styles.primaryButton}
                onClick={() => navigate("/dashboard")}
              >
                Go to Dashboard
              </button>
            </section>
          ) : null}
        </div>
      </main>
    </div>
  );
}

function FeedbackList({ title, items }) {
  return (
    <article style={styles.card}>
      <p style={styles.cardLabel}>{title}</p>
      {items.length ? (
        <ul style={styles.list}>
          {items.map((item, index) => (
            <li key={`${title}-${index}`}>{item}</li>
          ))}
        </ul>
      ) : (
        <p style={styles.bodyText}>No specific points provided.</p>
      )}
    </article>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    color: "#172033",
    background:
      "radial-gradient(circle at top left, rgba(37, 99, 235, 0.14), transparent 34%), linear-gradient(135deg, #f8fafc 0%, #eef2f7 100%)",
  },
  main: {
    width: "min(1040px, calc(100% - 32px))",
    margin: "0 auto",
    padding: "40px 0 56px",
  },
  transition: {
    animation: "fadeIn 220ms ease",
  },
  heroCard: {
    display: "grid",
    gap: "26px",
    padding: "32px",
    border: "1px solid rgba(148, 163, 184, 0.36)",
    borderRadius: "8px",
    background: "rgba(255, 255, 255, 0.78)",
    boxShadow: "0 24px 70px rgba(15, 23, 42, 0.10)",
    backdropFilter: "blur(18px)",
  },
  setupGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
    gap: "18px",
  },
  stack: {
    display: "grid",
    gap: "18px",
  },
  interviewHeader: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "18px",
    padding: "24px",
    border: "1px solid rgba(148, 163, 184, 0.34)",
    borderRadius: "8px",
    background: "rgba(255, 255, 255, 0.74)",
    boxShadow: "0 18px 55px rgba(15, 23, 42, 0.08)",
    backdropFilter: "blur(16px)",
  },
  headerStats: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "flex-end",
    gap: "10px",
  },
  statPill: {
    minWidth: "108px",
    padding: "10px 12px",
    border: "1px solid #d8e0ea",
    borderRadius: "8px",
    background: "#ffffff",
    color: "#334155",
    fontSize: "14px",
    fontWeight: 700,
    textAlign: "center",
  },
  card: {
    padding: "22px",
    border: "1px solid rgba(148, 163, 184, 0.34)",
    borderRadius: "8px",
    background: "rgba(255, 255, 255, 0.82)",
    boxShadow: "0 16px 44px rgba(15, 23, 42, 0.07)",
    backdropFilter: "blur(14px)",
  },
  title: {
    margin: 0,
    fontSize: "42px",
    lineHeight: 1.08,
    letterSpacing: 0,
    color: "#0f172a",
  },
  compactTitle: {
    margin: "4px 0 0",
    fontSize: "28px",
    lineHeight: 1.16,
    letterSpacing: 0,
    color: "#0f172a",
  },
  subtitle: {
    maxWidth: "620px",
    margin: "12px 0 0",
    color: "#526173",
    fontSize: "16px",
    lineHeight: 1.6,
  },
  eyebrow: {
    margin: 0,
    color: "#2563eb",
    fontSize: "13px",
    fontWeight: 800,
    letterSpacing: 0,
    textTransform: "uppercase",
  },
  cardLabel: {
    margin: "0 0 10px",
    color: "#64748b",
    fontSize: "13px",
    fontWeight: 800,
    letterSpacing: 0,
    textTransform: "uppercase",
  },
  question: {
    margin: 0,
    fontSize: "24px",
    lineHeight: 1.45,
    letterSpacing: 0,
    color: "#111827",
  },
  bodyText: {
    margin: 0,
    color: "#334155",
    fontSize: "15px",
    lineHeight: 1.65,
  },
  label: {
    display: "grid",
    gap: "8px",
    color: "#1f2937",
    fontWeight: 700,
  },
  input: {
    width: "100%",
    minHeight: "44px",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    padding: "0 12px",
    background: "#ffffff",
    color: "#111827",
    boxSizing: "border-box",
    outlineColor: "#2563eb",
  },
  textarea: {
    width: "100%",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    padding: "14px",
    background: "#ffffff",
    color: "#111827",
    font: "inherit",
    lineHeight: 1.55,
    boxSizing: "border-box",
    resize: "vertical",
    outlineColor: "#2563eb",
  },
  primaryButton: {
    width: "fit-content",
    minWidth: "154px",
    minHeight: "44px",
    padding: "11px 18px",
    background: "#2563eb",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    fontWeight: 800,
    cursor: "pointer",
    boxShadow: "0 12px 28px rgba(37, 99, 235, 0.25)",
  },
  secondaryButton: {
    width: "fit-content",
    minWidth: "140px",
    minHeight: "44px",
    padding: "11px 18px",
    background: "#ffffff",
    color: "#334155",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    fontWeight: 800,
    cursor: "pointer",
  },
  feedbackGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "18px",
  },
  list: {
    display: "grid",
    gap: "9px",
    margin: 0,
    paddingLeft: "18px",
    color: "#334155",
    lineHeight: 1.55,
  },
  scoreBadge: {
    display: "grid",
    placeItems: "center",
    width: "92px",
    height: "92px",
    borderRadius: "8px",
    background: "#0f172a",
    color: "#ffffff",
  },
  scoreValue: {
    fontSize: "34px",
    lineHeight: 1,
  },
  scoreSuffix: {
    fontSize: "13px",
    fontWeight: 800,
    color: "#cbd5e1",
  },
  actions: {
    display: "flex",
    flexWrap: "wrap",
    gap: "12px",
  },
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "16px",
  },
  summaryMetric: {
    display: "grid",
    gap: "8px",
    padding: "20px",
    border: "1px solid rgba(148, 163, 184, 0.34)",
    borderRadius: "8px",
    background: "#ffffff",
  },
  error: {
    margin: "0 0 18px",
    color: "#991b1b",
    background: "#fee2e2",
    border: "1px solid #fecaca",
    borderRadius: "8px",
    padding: "12px",
    fontWeight: 700,
  },
};
