import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../../components/Card";
import MainLayout from "../../layouts/MainLayout";
import API, { getApiErrorMessage } from "../../services/api";

const popularCompanies = ["Amazon", "Google", "Microsoft", "Flipkart", "TCS", "Infosys", "Wipro", "Accenture", "Meta", "Netflix"];
const popularRoles = ["SDE", "SDE Intern", "Frontend Engineer", "Backend Engineer", "Full Stack Developer", "Data Analyst", "ML Engineer", "DevOps Engineer"];
const customFieldLabels = ["Job Description", "Tech Stack", "Experience Level", "Preferred Topics", "Resume Link", "Notes"];

const rounds = [
  { title: "Round 1: HR / Intro", shortName: "HR / Intro" },
  { title: "Round 2: Behavioral", shortName: "Behavioral" },
  { title: "Round 3: Technical", shortName: "Technical" },
  { title: "Round 4: Follow-up Deep Dive", shortName: "Deep Dive" },
];

const companySignals = {
  Amazon: "Leadership principles, ownership, and bias for action",
  Google: "Problem solving, system thinking, and scalable reasoning",
  Microsoft: "Collaboration, design thinking, and product empathy",
  Flipkart: "Customer impact, ownership, and marketplace scale",
};

const HISTORY_KEY = "companyInterviewRecentSearches";

const toList = (value) => (Array.isArray(value) && value.length ? value : []);

const getScore = (feedback, snakeKey, camelKey) =>
  Number(feedback?.[snakeKey] ?? feedback?.[camelKey] ?? 0);

export default function CompanyInterview() {
  const navigate = useNavigate();

  const [step, setStep] = useState("setup");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [customFields, setCustomFields] = useState([]);
  const [newFieldLabel, setNewFieldLabel] = useState("Job Description");
  const [topicInput, setTopicInput] = useState("");
  const [preferredTopics, setPreferredTopics] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [setupSuggestions, setSetupSuggestions] = useState(null);
  const [suggestionLoading, setSuggestionLoading] = useState(false);
  const [currentRound, setCurrentRound] = useState(0);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [followUpQuestion, setFollowUpQuestion] = useState("");
  const [interviewId, setInterviewId] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [askedFollowUp, setAskedFollowUp] = useState(false);
  const [scoreHistory, setScoreHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const activeRound = rounds[currentRound];
  const customContext = useMemo(
    () => customFields.filter((field) => field.label.trim() || field.value.trim()),
    [customFields]
  );

  useEffect(() => {
    try {
      setRecentSearches(JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"));
    } catch {
      setRecentSearches([]);
    }
  }, []);

  const saveRecentSearch = (nextCompany, nextRole) => {
    const entry = {
      company: nextCompany.trim(),
      role: nextRole.trim(),
      createdAt: new Date().toISOString(),
    };
    if (!entry.company && !entry.role) return;

    const next = [
      entry,
      ...recentSearches.filter(
        (item) =>
          item.company?.toLowerCase() !== entry.company.toLowerCase() ||
          item.role?.toLowerCase() !== entry.role.toLowerCase()
      ),
    ].slice(0, 6);

    setRecentSearches(next);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
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

  const addTopic = (value = topicInput) => {
    const cleanTopic = value.trim();
    if (!cleanTopic || preferredTopics.includes(cleanTopic)) return;
    setPreferredTopics((previous) => [...previous, cleanTopic].slice(0, 12));
    setTopicInput("");
  };

  const removeTopic = (topic) => {
    setPreferredTopics((previous) => previous.filter((item) => item !== topic));
  };

  const fetchSetupSuggestions = async () => {
    setSuggestionLoading(true);
    setErrorMessage("");

    try {
      const res = await API.post("/interview/setup-suggestions", {
        type: "company",
        companyName: company,
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
  const normalizedFeedback = useMemo(() => {
    if (!feedback) return null;

    return {
      score: getScore(feedback, "score", "score"),
      communicationScore: getScore(
        feedback,
        "communication_score",
        "communicationScore"
      ),
      technicalScore: getScore(feedback, "technical_score", "technicalScore"),
      strengths: toList(feedback.strengths),
      weaknesses: toList(feedback.weaknesses),
      improvement:
        feedback.improvement ||
        feedback.improved_answer ||
        feedback.improvedAnswer ||
        "Make the answer more structured, specific, and tied to the company context.",
    };
  }, [feedback]);

  const summary = useMemo(() => {
    if (!scoreHistory.length) {
      return {
        overall: 0,
        technical: 0,
        communication: 0,
        selected: false,
      };
    }

    const average = (key) => {
      const total = scoreHistory.reduce(
        (sum, item) => sum + Number(item[key] || 0),
        0
      );
      return Math.round((total / scoreHistory.length) * 10) / 10;
    };

    const overall = average("score");
    const technical = average("technicalScore");
    const communication = average("communicationScore");

    return {
      overall,
      technical,
      communication,
      selected: overall >= 7 && technical >= 6 && communication >= 6,
    };
  }, [scoreHistory]);

  const startCompanyInterview = async () => {
    if (!company.trim() || !role.trim()) {
      setErrorMessage("Company and role are required.");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const res = await API.post("/interview/start", {
        type: "company",
        companyName: company,
        company,
        role,
        customFields: customContext,
        preferredTopics,
        currentRound: rounds[0].title,
      });

      saveRecentSearch(company, role);
      setInterviewId(res.data.interviewId);
      setQuestion(res.data.question || "");
      setAnswer("");
      setFeedback(null);
      setFollowUpQuestion("");
      setCurrentRound(0);
      setQuestionIndex(0);
      setAskedFollowUp(false);
      setScoreHistory([]);
      setStep("interview");
    } catch (err) {
      const message = getApiErrorMessage(err);
      console.error("Start company interview failed:", {
        message,
        status: err.response?.status,
        data: err.response?.data,
      });
      setErrorMessage(message || "Failed to start company interview.");
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async () => {
    if (!interviewId || !question || !answer.trim()) {
      setErrorMessage("Enter an answer before submitting.");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const res = await API.post("/interview/submit", {
        type: "company",
        interviewId,
        companyName: company,
        company,
        role,
        customFields: customContext,
        preferredTopics,
        currentRound: activeRound.title,
        question,
        answer,
      });

      const nextFeedback = res.data.feedback || {};
      const communicationScore = getScore(
        nextFeedback,
        "communication_score",
        "communicationScore"
      );
      const technicalScore = getScore(
        nextFeedback,
        "technical_score",
        "technicalScore"
      );

      setFeedback(nextFeedback);
      setFollowUpQuestion(res.data.followUpQuestion || "");
      setScoreHistory((previous) => [
        ...previous,
        {
          score: Number(nextFeedback.score || 0),
          communicationScore,
          technicalScore,
        },
      ]);
      setStep("feedback");
    } catch (err) {
      const message = getApiErrorMessage(err);
      console.error("Submit company answer failed:", {
        message,
        status: err.response?.status,
        data: err.response?.data,
      });
      setErrorMessage(message || "Error evaluating answer.");
    } finally {
      setLoading(false);
    }
  };

  const generateRoundQuestion = async (nextRound) => {
    setLoading(true);
    setErrorMessage("");

    try {
      const res = await API.post("/interview/start", {
        type: "company",
        interviewId,
        companyName: company,
        company,
        role,
        customFields: customContext,
        preferredTopics,
        currentRound: rounds[nextRound].title,
      });

      setQuestion(res.data.question || "");
      setAnswer("");
      setFeedback(null);
      setFollowUpQuestion("");
      setAskedFollowUp(false);
      setQuestionIndex((current) => current + 1);
      setStep("interview");
    } catch (err) {
      const message = getApiErrorMessage(err);
      console.error("Generate company round failed:", {
        message,
        status: err.response?.status,
        data: err.response?.data,
      });
      setErrorMessage(message || "Failed to generate next round.");
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    if (followUpQuestion && !askedFollowUp) {
      setQuestion(followUpQuestion);
      setAnswer("");
      setFeedback(null);
      setFollowUpQuestion("");
      setAskedFollowUp(true);
      setQuestionIndex((current) => current + 1);
      setStep("interview");
      return;
    }

    const nextRound = currentRound + 1;
    if (nextRound >= rounds.length) {
      setStep("completed");
      return;
    }

    setCurrentRound(nextRound);
    await generateRoundQuestion(nextRound);
  };

  return (
    <MainLayout userName="Ishika">
      <div className="mx-auto max-w-6xl">
        {errorMessage ? (
          <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            {errorMessage}
          </div>
        ) : null}

        {step === "setup" ? (
          <Card className="overflow-hidden">
            <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.28em] text-violet-500">
                  Company simulator
                </p>
                <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
                  Real company interview practice
                </h1>
                <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600">
                  Run a structured four-round interview with company-specific
                  expectations, feedback, and selection signal.
                </p>
              </div>

              <div className="grid gap-4 rounded-2xl border border-white/50 bg-white/40 p-5">
                <label className="grid gap-2 text-sm font-semibold text-slate-700">
                  Company
                  <input
                    value={company}
                    onChange={(event) => setCompany(event.target.value)}
                    list="company-suggestions"
                    placeholder="Type any company name"
                    className="h-12 rounded-xl border border-slate-200 bg-white/80 px-3 text-slate-900 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                  />
                  <datalist id="company-suggestions">
                    {popularCompanies.map((item) => (
                      <option key={item} value={item} />
                    ))}
                  </datalist>
                </label>

                <label className="grid gap-2 text-sm font-semibold text-slate-700">
                  Role
                  <input
                    value={role}
                    onChange={(event) => setRole(event.target.value)}
                    list="role-suggestions"
                    placeholder="Type any role, e.g. SDE Intern"
                    className="h-12 rounded-xl border border-slate-200 bg-white/80 px-3 text-slate-900 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                  />
                  <datalist id="role-suggestions">
                    {popularRoles.map((item) => (
                      <option key={item} value={item} />
                    ))}
                  </datalist>
                </label>

                <div className="grid gap-2">
                  <label className="text-sm font-semibold text-slate-700">
                    Preferred Topics
                  </label>
                  <div className="flex gap-2">
                    <input
                      value={topicInput}
                      onChange={(event) => setTopicInput(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          addTopic();
                        }
                      }}
                      placeholder="Add DSA, React, SQL..."
                      className="h-11 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white/80 px-3 text-sm text-slate-900 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                    />
                    <button
                      type="button"
                      onClick={() => addTopic()}
                      className="h-11 rounded-xl border border-violet-200 bg-violet-50 px-4 text-sm font-semibold text-violet-700 transition hover:bg-violet-100"
                    >
                      Add
                    </button>
                  </div>
                  {preferredTopics.length ? (
                    <div className="flex flex-wrap gap-2">
                      {preferredTopics.map((topicItem) => (
                        <button
                          key={topicItem}
                          type="button"
                          onClick={() => removeTopic(topicItem)}
                          className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white"
                        >
                          {topicItem} ×
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="grid gap-3">
                  <div className="flex flex-wrap items-end gap-2">
                    <label className="grid flex-1 gap-2 text-sm font-semibold text-slate-700">
                      Custom Field
                      <input
                        value={newFieldLabel}
                        onChange={(event) => setNewFieldLabel(event.target.value)}
                        list="custom-field-suggestions"
                        placeholder="Job Description, Tech Stack, Notes..."
                        className="h-11 rounded-xl border border-slate-200 bg-white/80 px-3 text-slate-900 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                      />
                      <datalist id="custom-field-suggestions">
                        {customFieldLabels.map((item) => (
                          <option key={item} value={item} />
                        ))}
                      </datalist>
                    </label>
                    <button
                      type="button"
                      onClick={() => addCustomField()}
                      className="h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      + Add Custom Field
                    </button>
                  </div>

                  {customFields.map((field) => (
                    <div key={field.id} className="grid gap-2 rounded-2xl border border-white/60 bg-white/55 p-3">
                      <div className="flex gap-2">
                        <input
                          value={field.label}
                          onChange={(event) => updateCustomField(field.id, "label", event.target.value)}
                          className="h-10 w-44 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => removeCustomField(field.id)}
                          className="ml-auto h-10 rounded-xl px-3 text-sm font-semibold text-rose-600 hover:bg-rose-50"
                        >
                          Remove
                        </button>
                      </div>
                      <textarea
                        value={field.value}
                        onChange={(event) => updateCustomField(field.id, "value", event.target.value)}
                        rows="3"
                        placeholder={`Enter ${field.label || "field"} details`}
                        className="resize-y rounded-xl border border-slate-200 bg-white/90 p-3 text-sm text-slate-900 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                      />
                    </div>
                  ))}
                </div>

                {recentSearches.length ? (
                  <div className="grid gap-2">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Recent</p>
                    <div className="flex flex-wrap gap-2">
                      {recentSearches.map((item) => (
                        <button
                          key={`${item.company}-${item.role}-${item.createdAt}`}
                          type="button"
                          onClick={() => {
                            setCompany(item.company || "");
                            setRole(item.role || "");
                          }}
                          className="rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-violet-200 hover:text-violet-700"
                        >
                          {item.company || "Company"} · {item.role || "Role"}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                <button
                  type="button"
                  onClick={fetchSetupSuggestions}
                  disabled={suggestionLoading}
                  className="h-11 rounded-xl border border-sky-200 bg-sky-50 px-4 text-sm font-semibold text-sky-700 transition hover:bg-sky-100"
                >
                  {suggestionLoading ? "Generating Suggestions..." : "Get AI Suggestions"}
                </button>

                {setupSuggestions ? (
                  <div className="grid gap-3 rounded-2xl border border-sky-100 bg-sky-50/60 p-4 text-sm text-slate-700">
                    {setupSuggestions.topics?.length ? (
                      <div>
                        <p className="font-semibold text-slate-900">Suggested topics</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {setupSuggestions.topics.map((item) => (
                            <button
                              key={item}
                              type="button"
                              onClick={() => addTopic(item)}
                              className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-sky-700"
                            >
                              + {item}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    {setupSuggestions.customFields?.length ? (
                      <div>
                        <p className="font-semibold text-slate-900">Suggested fields</p>
                        <div className="mt-2 grid gap-2">
                          {setupSuggestions.customFields.map((field) => (
                            <button
                              key={`${field.label}-${field.value}`}
                              type="button"
                              onClick={() => addCustomField(field.label, field.value)}
                              className="rounded-xl bg-white px-3 py-2 text-left text-xs font-semibold text-slate-700"
                            >
                              + {field.label}: {field.value}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    {setupSuggestions.tips?.length ? (
                      <ul className="grid gap-1 pl-5 text-xs leading-5">
                        {setupSuggestions.tips.map((tip) => (
                          <li key={tip}>{tip}</li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                ) : null}

                <button
                  type="button"
                  onClick={startCompanyInterview}
                  disabled={loading || !company.trim() || !role.trim()}
                  className="mt-2 h-12 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white shadow-[0_18px_42px_rgba(15,23,42,0.22)] transition hover:-translate-y-0.5 hover:bg-violet-700"
                >
                  {loading ? "Starting..." : "Start Company Interview"}
                </button>
              </div>
            </div>
          </Card>
        ) : null}

        {step === "interview" ? (
          <div className="grid gap-5">
            <Card>
              <div className="flex flex-wrap items-start justify-between gap-5">
                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.28em] text-violet-500">
                    {company} Interview - {role}
                  </p>
                  <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                    {activeRound.title}
                  </h1>
                  <p className="mt-3 text-sm text-slate-500">
                    {companySignals[company] || "Custom company context generated from your setup details"}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/60 bg-white/55 px-4 py-3 text-sm font-semibold text-slate-700">
                  Question {questionIndex + 1}
                </div>
              </div>

              <div className="mt-7 grid gap-3 md:grid-cols-4">
                {rounds.map((round, index) => (
                  <div
                    key={round.title}
                    className={`rounded-2xl border px-4 py-3 text-sm transition ${
                      index === currentRound
                        ? "border-violet-300 bg-violet-50 text-violet-800 shadow-sm"
                        : index < currentRound
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-white/60 bg-white/45 text-slate-500"
                    }`}
                  >
                    <p className="font-semibold">{round.shortName}</p>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
                Question
              </p>
              <h2 className="mt-3 text-2xl font-semibold leading-9 text-slate-950">
                {question}
              </h2>
            </Card>

            <Card>
              <label className="grid gap-3 text-sm font-semibold text-slate-700">
                Candidate answer
                <textarea
                  value={answer}
                  onChange={(event) => setAnswer(event.target.value)}
                  rows="9"
                  placeholder="Answer like you are speaking to the interviewer..."
                  className="min-h-56 resize-y rounded-2xl border border-slate-200 bg-white/80 p-4 text-base font-normal leading-7 text-slate-900 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                />
              </label>

              <button
                type="button"
                onClick={submitAnswer}
                disabled={loading || !answer.trim()}
                className="mt-5 h-12 rounded-xl bg-violet-600 px-6 text-sm font-semibold text-white shadow-[0_18px_42px_rgba(124,58,237,0.28)] transition hover:-translate-y-0.5 hover:bg-violet-700"
              >
                {loading ? "Evaluating..." : "Submit Answer"}
              </button>
            </Card>
          </div>
        ) : null}

        {step === "feedback" && normalizedFeedback ? (
          <div className="grid gap-5">
            <Card>
              <div className="flex flex-wrap items-center justify-between gap-5">
                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.28em] text-violet-500">
                    {company} interviewer feedback
                  </p>
                  <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                    {activeRound.title}
                  </h1>
                </div>
                <div className="grid h-24 w-24 place-items-center rounded-2xl bg-slate-950 text-white">
                  <strong className="text-3xl leading-none">
                    {normalizedFeedback.score}
                  </strong>
                  <span className="text-xs font-semibold text-slate-300">/10</span>
                </div>
              </div>
            </Card>

            <div className="grid gap-5 lg:grid-cols-3">
              <ScoreCard
                label="Overall"
                value={normalizedFeedback.score}
                tone="from-violet-500 to-fuchsia-500"
              />
              <ScoreCard
                label="Technical"
                value={normalizedFeedback.technicalScore}
                tone="from-sky-500 to-cyan-500"
              />
              <ScoreCard
                label="Communication"
                value={normalizedFeedback.communicationScore}
                tone="from-emerald-500 to-teal-500"
              />
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <FeedbackList title="Strengths" items={normalizedFeedback.strengths} />
              <FeedbackList title="Weaknesses" items={normalizedFeedback.weaknesses} />
            </div>

            <Card>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
                Improvement
              </p>
              <p className="mt-3 text-sm leading-7 text-slate-700">
                {normalizedFeedback.improvement}
              </p>
            </Card>

            {followUpQuestion && !askedFollowUp ? (
              <Card>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Follow-up question
                </p>
                <p className="mt-3 text-lg font-semibold leading-8 text-slate-950">
                  {followUpQuestion}
                </p>
              </Card>
            ) : null}

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleNext}
                disabled={loading}
                className="h-12 rounded-xl bg-slate-950 px-6 text-sm font-semibold text-white shadow-[0_18px_42px_rgba(15,23,42,0.22)] transition hover:-translate-y-0.5 hover:bg-violet-700"
              >
                {loading
                  ? "Loading..."
                  : followUpQuestion && !askedFollowUp
                  ? "Answer Follow-up"
                  : currentRound === rounds.length - 1
                  ? "Complete Interview"
                  : "Next Round"}
              </button>

              <button
                type="button"
                onClick={() => setStep("completed")}
                className="h-12 rounded-xl border border-white/60 bg-white/65 px-6 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-white"
              >
                End Interview
              </button>
            </div>
          </div>
        ) : null}

        {step === "completed" ? (
          <Card>
            <p className="text-sm font-medium uppercase tracking-[0.28em] text-violet-500">
              Final decision
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
              {company} Interview Complete
            </h1>

            <div className="mt-8 grid gap-5 lg:grid-cols-4">
              <ScoreCard
                label="Overall Score"
                value={summary.overall}
                tone="from-violet-500 to-fuchsia-500"
              />
              <ScoreCard
                label="Technical Score"
                value={summary.technical}
                tone="from-sky-500 to-cyan-500"
              />
              <ScoreCard
                label="Communication"
                value={summary.communication}
                tone="from-emerald-500 to-teal-500"
              />
              <div
                className={`rounded-2xl border p-5 ${
                  summary.selected
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border-amber-200 bg-amber-50 text-amber-800"
                }`}
              >
                <p className="text-sm font-semibold">Would you be selected?</p>
                <strong className="mt-4 block text-3xl">
                  {summary.selected ? "Yes" : "No"}
                </strong>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => {
                  setStep("setup");
                  setQuestion("");
                  setAnswer("");
                  setFeedback(null);
                  setInterviewId(null);
                }}
                className="h-12 rounded-xl bg-violet-600 px-6 text-sm font-semibold text-white shadow-[0_18px_42px_rgba(124,58,237,0.28)] transition hover:-translate-y-0.5 hover:bg-violet-700"
              >
                Start New Company Interview
              </button>
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className="h-12 rounded-xl border border-white/60 bg-white/65 px-6 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-white"
              >
                Go to Dashboard
              </button>
            </div>
          </Card>
        ) : null}
      </div>
    </MainLayout>
  );
}

function ScoreCard({ label, value, tone }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/50 bg-white/45 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
      <div className={`h-1 rounded-full bg-gradient-to-r ${tone}`} />
      <p className="mt-5 text-sm font-semibold text-slate-500">{label}</p>
      <strong className="mt-3 block text-3xl text-slate-950">{value || 0}/10</strong>
    </div>
  );
}

function FeedbackList({ title, items }) {
  return (
    <Card>
      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
        {title}
      </p>
      {items.length ? (
        <ul className="mt-4 grid gap-3 pl-5 text-sm leading-6 text-slate-700">
          {items.map((item, index) => (
            <li key={`${title}-${index}`}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm leading-6 text-slate-600">
          No specific points provided.
        </p>
      )}
    </Card>
  );
}
