import { useState } from "react";
import { useNavigate } from "react-router-dom";

const topics = ["DSA", "DBMS", "OS", "System Design", "Web Development", "Computer Networks"];
const difficulties = ["Easy", "Medium", "Hard"];

export default function TopicSelector() {
  const navigate = useNavigate();
  const [topic, setTopic] = useState("DSA");
  const [difficulty, setDifficulty] = useState("Medium");

  const handleStart = (mode) => {
    navigate(`/practice/${mode}`, { state: { topic, difficulty } });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f8fafc] px-4 py-12">
      <div className="w-full max-w-2xl overflow-hidden rounded-[32px] border border-white/45 bg-white/35 p-8 shadow-[0_22px_70px_rgba(15,23,42,0.14)] backdrop-blur-2xl lg:p-12">
        <div className="mb-10 text-center">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-violet-600">ElevateAI Practice</span>
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-900 lg:text-5xl">What are we learning today?</h1>
          <p className="mt-4 text-lg text-slate-600">Select a topic and difficulty to start your personalized session.</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-4">
            <label className="block text-sm font-bold uppercase tracking-wider text-slate-500">Choose Topic</label>
            <div className="grid grid-cols-2 gap-3">
              {topics.map((t) => (
                <button
                  key={t}
                  onClick={() => setTopic(t)}
                  className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition-all duration-300 ${
                    topic === t
                      ? "border-violet-600 bg-violet-600 text-white shadow-lg shadow-violet-200"
                      : "border-slate-200 bg-white text-slate-600 hover:border-violet-300 hover:bg-violet-50"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <label className="block text-sm font-bold uppercase tracking-wider text-slate-500">Difficulty Level</label>
            <div className="flex flex-col gap-3">
              {difficulties.map((d) => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={`flex items-center justify-between rounded-2xl border px-6 py-4 transition-all duration-300 ${
                    difficulty === d
                      ? "border-sky-500 bg-sky-500 text-white shadow-lg shadow-sky-200"
                      : "border-slate-200 bg-white text-slate-600 hover:border-sky-300 hover:bg-sky-50"
                  }`}
                >
                  <span className="font-semibold">{d}</span>
                  {difficulty === d && (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <button
            onClick={() => handleStart("learn")}
            className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm border border-slate-100 transition-all hover:shadow-md active:scale-95"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-violet-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="font-bold text-slate-900">Learn</h3>
              <p className="text-xs text-slate-500">AI-powered theory</p>
            </div>
          </button>

          <button
            onClick={() => handleStart("mcq")}
            className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm border border-slate-100 transition-all hover:shadow-md active:scale-95"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-sky-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <h3 className="font-bold text-slate-900">Quiz</h3>
              <p className="text-xs text-slate-500">Topic-based MCQs</p>
            </div>
          </button>

          <button
            onClick={() => handleStart("chat")}
            className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm border border-slate-100 transition-all hover:shadow-md active:scale-95"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2-2h-5l-5 5v-5z" />
                </svg>
              </div>
              <h3 className="font-bold text-slate-900">Chat</h3>
              <p className="text-xs text-slate-500">AI Tutor assistant</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
