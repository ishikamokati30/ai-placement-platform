import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import API, { getApiErrorMessage } from "../services/api";
import Navbar from "../components/Navbar";

const DEFAULT_TOTAL_QUESTIONS = 5;

const popularRoles = ["SDE", "SDE Intern", "Frontend Engineer", "Backend Engineer", "Full Stack Developer", "Data Analyst", "ML Engineer", "DevOps Engineer"];
const difficulties = ["Easy", "Medium", "Hard"];
const customFieldLabels = ["Job Description", "Tech Stack", "Experience Level", "Preferred Topics", "Resume Link", "Notes"];
const HISTORY_KEY = "practiceInterviewRecentSearches";

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
  const [topicInput, setTopicInput] = useState("");
  const [preferredTopics, setPreferredTopics] = useState(location.state?.topic ? [location.state.topic] : []);
  const [customFields, setCustomFields] = useState([]);
  const [newFieldLabel, setNewFieldLabel] = useState("Job Description");
  const [recentSearches, setRecentSearches] = useState([]);
  const [setupSuggestions, setSetupSuggestions] = useState(null);
  const [suggestionLoading, setSuggestionLoading] = useState(false);

  const customContext = useMemo(
    () => customFields.filter((field) => field.label.trim() || field.value.trim()),
    [customFields]
  );

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
    if (!role.trim()) {
      setErrorMessage("Role is required.");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const res = await API.post("/interview/start", {
        interviewId: preserveProgress ? interviewId : undefined,
        type,
        topic: preferredTopics.length ? preferredTopics.join(", ") : topic,
        difficulty: difficulty.toLowerCase(),
        role,
        customFields: customContext,
        preferredTopics,
      });

      if (!preserveProgress) {
        saveRecentSearch(role, preferredTopics.length ? preferredTopics.join(", ") : topic);
      }
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
        type,
        role,
        customFields: customContext,
        preferredTopics,
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
    if (location.state.topic) {
      setTopic(location.state.topic);
      setPreferredTopics((previous) =>
        previous.includes(location.state.topic) ? previous : [location.state.topic, ...previous]
      );
    }
  }, [location.state]);

  useEffect(() => {
    try {
      setRecentSearches(JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"));
    } catch {
      setRecentSearches([]);
    }
  }, []);

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

  const saveRecentSearch = (nextRole, nextTopic) => {
    const entry = {
      role: nextRole.trim(),
      topic: nextTopic.trim(),
      createdAt: new Date().toISOString(),
    };
    if (!entry.role && !entry.topic) return;

    const next = [
      entry,
      ...recentSearches.filter(
        (item) =>
          item.role?.toLowerCase() !== entry.role.toLowerCase() ||
          item.topic?.toLowerCase() !== entry.topic.toLowerCase()
      ),
    ].slice(0, 6);

    setRecentSearches(next);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  };

  const addTopic = (value = topicInput) => {
    const cleanTopic = value.trim();
    if (!cleanTopic || preferredTopics.includes(cleanTopic)) return;
    setPreferredTopics((previous) => [...previous, cleanTopic].slice(0, 12));
    setTopic(cleanTopic);
    setTopicInput("");
  };

  const removeTopic = (item) => {
    const next = preferredTopics.filter((topicItem) => topicItem !== item);
    setPreferredTopics(next);
    setTopic(next[0] || "");
  };

  const addCustomField = (label = newFieldLabel, value = "") => {
    const cleanLabel = label.trim() || "Custom Field";
    setCustomFields((previous) => [
      ...previous,
      { id: `${Date.now()}-${previous.length}`, label: cleanLabel, value },
    ]);
  };

  const updateCustomField = (id, key, value) => {
    setCustomFields((previous) =>
      previous.map((field) => (field.id === id ? { ...field, [key]: value } : field))
    );
  };

  const removeCustomField = (id) => {
    setCustomFields((previous) => previous.filter((field) => field.id !== id));
  };

  const fetchSetupSuggestions = async () => {
    setSuggestionLoading(true);
    setErrorMessage("");

    try {
      const res = await API.post("/interview/setup-suggestions", {
        type,
        role,
        customFields: customContext,
        preferredTopics,
      });
      setSetupSuggestions(res.data);
    } catch (err) {
      setErrorMessage(getApiErrorMessage(err));
    } finally {
      setSuggestionLoading(false);
    }
  };

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
                  <input
                    style={styles.input}
                    value={role}
                    onChange={(event) => setRole(event.target.value)}
                    list="practice-role-suggestions"
                    placeholder="Type any role, e.g. Backend Intern"
                  />
                  <datalist id="practice-role-suggestions">
                    {popularRoles.map((item) => (
                      <option key={item} value={item} />
                    ))}
                  </datalist>
                </label>

                <label style={styles.label}>
                  Topic
                  <input
                    style={styles.input}
                    placeholder="Type a topic and press Add"
                    value={topicInput}
                    onChange={(event) => setTopicInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        addTopic();
                      }
                    }}
                  />
                </label>

                <button
                  type="button"
                  style={styles.inlineButton}
                  onClick={() => addTopic()}
                >
                  Add Topic
                </button>

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

              {preferredTopics.length ? (
                <div style={styles.chipRow}>
                  {preferredTopics.map((item) => (
                    <button
                      key={item}
                      type="button"
                      style={styles.darkChip}
                      onClick={() => removeTopic(item)}
                    >
                      {item} ×
                    </button>
                  ))}
                </div>
              ) : null}

              <div style={styles.customPanel}>
                <div style={styles.customFieldHeader}>
                  <label style={styles.label}>
                    Custom Field
                    <input
                      style={styles.input}
                      value={newFieldLabel}
                      onChange={(event) => setNewFieldLabel(event.target.value)}
                      list="practice-custom-field-suggestions"
                      placeholder="Job Description, Tech Stack, Notes..."
                    />
                    <datalist id="practice-custom-field-suggestions">
                      {customFieldLabels.map((item) => (
                        <option key={item} value={item} />
                      ))}
                    </datalist>
                  </label>
                  <button
                    type="button"
                    style={styles.secondaryButton}
                    onClick={() => addCustomField()}
                  >
                    + Add Custom Field
                  </button>
                </div>

                {customFields.map((field) => (
                  <div key={field.id} style={styles.customFieldCard}>
                    <div style={styles.customFieldTop}>
                      <input
                        style={styles.smallInput}
                        value={field.label}
                        onChange={(event) => updateCustomField(field.id, "label", event.target.value)}
                      />
                      <button
                        type="button"
                        style={styles.removeButton}
                        onClick={() => removeCustomField(field.id)}
                      >
                        Remove
                      </button>
                    </div>
                    <textarea
                      style={styles.smallTextarea}
                      rows="3"
                      value={field.value}
                      onChange={(event) => updateCustomField(field.id, "value", event.target.value)}
                      placeholder={`Enter ${field.label || "field"} details`}
                    />
                  </div>
                ))}
              </div>

              {recentSearches.length ? (
                <div>
                  <p style={styles.cardLabel}>Recent Practice Setups</p>
                  <div style={styles.chipRow}>
                    {recentSearches.map((item) => (
                      <button
                        key={`${item.role}-${item.topic}-${item.createdAt}`}
                        type="button"
                        style={styles.lightChip}
                        onClick={() => {
                          setRole(item.role || "");
                          setTopic(item.topic || "");
                          setPreferredTopics(item.topic ? item.topic.split(",").map((value) => value.trim()).filter(Boolean) : []);
                        }}
                      >
                        {item.role || "Role"} · {item.topic || "Topic"}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              <button
                type="button"
                style={styles.suggestionButton}
                onClick={fetchSetupSuggestions}
                disabled={suggestionLoading}
              >
                {suggestionLoading ? "Generating Suggestions..." : "Get AI Suggestions"}
              </button>

              {setupSuggestions ? (
                <article style={styles.suggestionPanel}>
                  {setupSuggestions.topics?.length ? (
                    <div>
                      <p style={styles.cardLabel}>Suggested Topics</p>
                      <div style={styles.chipRow}>
                        {setupSuggestions.topics.map((item) => (
                          <button
                            key={item}
                            type="button"
                            style={styles.lightChip}
                            onClick={() => addTopic(item)}
                          >
                            + {item}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  {setupSuggestions.customFields?.length ? (
                    <div>
                      <p style={styles.cardLabel}>Suggested Fields</p>
                      <div style={styles.suggestionList}>
                        {setupSuggestions.customFields.map((field) => (
                          <button
                            key={`${field.label}-${field.value}`}
                            type="button"
                            style={styles.suggestionItem}
                            onClick={() => addCustomField(field.label, field.value)}
                          >
                            + {field.label}: {field.value}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  {setupSuggestions.tips?.length ? (
                    <ul style={styles.list}>
                      {setupSuggestions.tips.map((tip) => (
                        <li key={tip}>{tip}</li>
                      ))}
                    </ul>
                  ) : null}
                </article>
              ) : null}

              <button
                style={styles.primaryButton}
                onClick={() => startInterview()}
                disabled={loading || !role.trim()}
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
  smallInput: {
    minHeight: "40px",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    padding: "0 12px",
    background: "#ffffff",
    color: "#111827",
    boxSizing: "border-box",
    outlineColor: "#2563eb",
    fontWeight: 700,
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
  smallTextarea: {
    width: "100%",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    padding: "12px",
    background: "#ffffff",
    color: "#111827",
    font: "inherit",
    lineHeight: 1.5,
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
  inlineButton: {
    alignSelf: "end",
    minHeight: "44px",
    padding: "11px 16px",
    background: "#eef2ff",
    color: "#3730a3",
    border: "1px solid #c7d2fe",
    borderRadius: "8px",
    fontWeight: 800,
    cursor: "pointer",
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
  suggestionButton: {
    width: "fit-content",
    minHeight: "44px",
    padding: "11px 18px",
    background: "#ecfeff",
    color: "#0e7490",
    border: "1px solid #a5f3fc",
    borderRadius: "8px",
    fontWeight: 800,
    cursor: "pointer",
  },
  chipRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
  },
  darkChip: {
    border: "none",
    borderRadius: "999px",
    background: "#0f172a",
    color: "#ffffff",
    padding: "7px 12px",
    fontWeight: 800,
    cursor: "pointer",
  },
  lightChip: {
    border: "1px solid #dbeafe",
    borderRadius: "999px",
    background: "#ffffff",
    color: "#2563eb",
    padding: "7px 12px",
    fontWeight: 800,
    cursor: "pointer",
  },
  customPanel: {
    display: "grid",
    gap: "14px",
    padding: "18px",
    border: "1px solid rgba(148, 163, 184, 0.28)",
    borderRadius: "8px",
    background: "rgba(255, 255, 255, 0.58)",
  },
  customFieldHeader: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) auto",
    gap: "12px",
    alignItems: "end",
  },
  customFieldCard: {
    display: "grid",
    gap: "10px",
    padding: "12px",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    background: "rgba(255, 255, 255, 0.72)",
  },
  customFieldTop: {
    display: "flex",
    gap: "10px",
    alignItems: "center",
  },
  removeButton: {
    minHeight: "40px",
    marginLeft: "auto",
    padding: "8px 12px",
    border: "none",
    borderRadius: "8px",
    background: "#fff1f2",
    color: "#be123c",
    fontWeight: 800,
    cursor: "pointer",
  },
  suggestionPanel: {
    display: "grid",
    gap: "16px",
    padding: "18px",
    border: "1px solid #bae6fd",
    borderRadius: "8px",
    background: "#f0f9ff",
  },
  suggestionList: {
    display: "grid",
    gap: "8px",
  },
  suggestionItem: {
    border: "1px solid #dbeafe",
    borderRadius: "8px",
    background: "#ffffff",
    color: "#334155",
    padding: "10px 12px",
    textAlign: "left",
    fontWeight: 700,
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
