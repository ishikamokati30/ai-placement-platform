import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import API from "../../services/api";

export default function MCQTest() {
  const location = useLocation();
  const navigate = useNavigate();
  const { topic, difficulty } = location.state || { topic: "DSA", difficulty: "Medium" };

  const [loading, setLoading] = useState(true);
  const [mcqs, setMcqs] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [userAnswers, setUserAnswers] = useState([]);
  const [showResult, setShowResult] = useState(false);
  const [evaluation, setEvaluation] = useState(null);

  useEffect(() => {
    const fetchMCQs = async () => {
      try {
        const res = await API.post("/practice/mcq", { topic, difficulty });
        setMcqs(res.data.mcqs);
      } catch (err) {
        console.error("Failed to fetch MCQs:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMCQs();
  }, [topic, difficulty]);

  const handleNext = () => {
    const currentQ = mcqs[currentIndex];
    const answerData = {
      ...currentQ,
      selectedAnswer
    };
    
    const newAnswers = [...userAnswers, answerData];
    setUserAnswers(newAnswers);

    if (currentIndex < mcqs.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
    } else {
      evaluateTest(newAnswers);
    }
  };

  const evaluateTest = async (answers) => {
    setLoading(true);
    try {
      const res = await API.post("/practice/evaluate", { topic, answers });
      setEvaluation(res.data);
      setShowResult(true);
    } catch (err) {
      console.error("Evaluation failed:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !showResult) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center space-y-6 bg-[#f8fafc]">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-sky-500 border-t-transparent shadow-xl shadow-sky-100"></div>
        <div className="text-center">
          <h3 className="text-xl font-bold text-slate-900">Preparing your Quiz</h3>
          <p className="text-slate-500">AI is selecting the best questions for you...</p>
        </div>
      </div>
    );
  }

  if (showResult && evaluation) {
    return (
      <div className="min-h-screen bg-[#f8fafc] px-4 py-12">
        <div className="mx-auto max-w-3xl overflow-hidden rounded-[32px] border border-white/45 bg-white/35 p-8 shadow-[0_22px_70px_rgba(15,23,42,0.14)] backdrop-blur-2xl lg:p-12">
          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-sky-600">Quiz Completed</span>
            <h1 className="mt-2 text-4xl font-bold text-slate-900">Your Results</h1>
            
            <div className="mt-8 flex justify-center">
              <div className="relative flex h-40 w-40 items-center justify-center rounded-full bg-slate-900 text-white shadow-2xl shadow-slate-200">
                <div className="text-center">
                  <div className="text-5xl font-bold">{evaluation.score}</div>
                  <div className="text-xs font-medium uppercase tracking-widest text-slate-400">Score / 10</div>
                </div>
              </div>
            </div>

            <p className="mt-6 text-lg text-slate-600 font-medium">
              You got {evaluation.correctCount} out of {evaluation.totalQuestions} correct!
            </p>
          </div>

          <div className="mt-12 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 uppercase tracking-wider mb-6">Review</h3>
            {evaluation.results.map((res, i) => (
              <div key={i} className={`rounded-2xl border p-6 ${res.correct ? "border-emerald-100 bg-emerald-50/50" : "border-rose-100 bg-rose-50/50"}`}>
                <div className="flex items-start gap-4">
                  <div className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${res.correct ? "bg-emerald-500" : "bg-rose-500"}`}>
                    {res.correct ? "✓" : "✕"}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{res.question}</p>
                    {!res.correct && (
                      <p className="mt-2 text-sm text-rose-600 font-medium">Correct: {res.correctAnswer}</p>
                    )}
                    <p className="mt-3 text-sm text-slate-600 italic">"{res.explanation}"</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate("/practice")}
              className="rounded-2xl border border-slate-200 bg-white px-8 py-4 font-bold text-slate-600 hover:bg-slate-50 transition-all"
            >
              Try Another Topic
            </button>
            <button
              onClick={() => navigate("/practice/learn", { state: location.state })}
              className="rounded-2xl bg-sky-500 px-8 py-4 font-bold text-white shadow-lg shadow-sky-100 hover:bg-sky-600 transition-all"
            >
              Revise Theory
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentQ = mcqs[currentIndex];

  return (
    <div className="min-h-screen bg-[#f8fafc] px-4 py-12">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/practice")}
              className="rounded-full bg-white p-2 text-slate-400 hover:text-slate-600 shadow-sm transition-all"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h2 className="text-xl font-bold text-slate-900">{topic}</h2>
              <p className="text-xs font-bold text-sky-600 uppercase tracking-widest">{difficulty} Level</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-sm font-bold text-slate-400">Question {currentIndex + 1} / {mcqs.length}</span>
            <div className="mt-2 h-2 w-32 overflow-hidden rounded-full bg-slate-200">
              <div 
                className="h-full bg-sky-500 transition-all duration-500" 
                style={{ width: `${((currentIndex + 1) / mcqs.length) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-[32px] border border-white/45 bg-white/35 p-8 shadow-[0_22px_70px_rgba(15,23,42,0.14)] backdrop-blur-2xl lg:p-12">
          <h1 className="text-2xl font-bold leading-tight text-slate-900 lg:text-3xl">
            {currentQ?.question}
          </h1>

          <div className="mt-10 space-y-4">
            {currentQ?.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => setSelectedAnswer(opt)}
                className={`flex w-full items-center justify-between rounded-2xl border p-6 text-left transition-all duration-300 ${
                  selectedAnswer === opt
                    ? "border-sky-500 bg-sky-500 text-white shadow-xl shadow-sky-100 ring-4 ring-sky-100"
                    : "border-slate-100 bg-white/50 text-slate-600 hover:border-sky-200 hover:bg-white"
                }`}
              >
                <span className="font-semibold">{opt}</span>
                <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center ${selectedAnswer === opt ? "border-white" : "border-slate-200"}`}>
                  {selectedAnswer === opt && <div className="h-2 w-2 rounded-full bg-white" />}
                </div>
              </button>
            ))}
          </div>

          <div className="mt-12 flex justify-end">
            <button
              onClick={handleNext}
              disabled={!selectedAnswer}
              className={`group flex items-center gap-2 rounded-2xl px-10 py-4 font-bold transition-all ${
                selectedAnswer
                  ? "bg-slate-900 text-white shadow-2xl shadow-slate-300 active:scale-95"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed"
              }`}
            >
              {currentIndex === mcqs.length - 1 ? "Finish Quiz" : "Next Question"}
              <svg className="h-5 w-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
