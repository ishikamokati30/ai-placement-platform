import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import API from "../../services/api";
import ReactMarkdown from "react-markdown";

export default function ConceptLearning() {
  const location = useLocation();
  const navigate = useNavigate();
  const { topic } = location.state || { topic: "DSA" };

  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");

  useEffect(() => {
    const fetchConcept = async () => {
      try {
        const res = await API.post("/practice/concept", { topic });
        setContent(res.data.content);
      } catch (err) {
        console.error("Failed to fetch concept:", err);
        setContent("Failed to load content. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchConcept();
  }, [topic]);

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-12">
      <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 px-6 py-4 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/practice")}
              className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 transition-colors"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div>
              <h2 className="text-xl font-bold text-slate-900">{topic}</h2>
              <p className="text-xs font-semibold text-violet-600 uppercase tracking-wider">Concept Learning</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate("/practice/mcq", { state: location.state })}
              className="rounded-xl bg-sky-500 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-sky-100 hover:bg-sky-600 transition-all"
            >
              Take Quiz
            </button>
          </div>
        </div>
      </div>

      <main className="mx-auto mt-8 max-w-4xl px-6">
        {loading ? (
          <div className="flex h-64 flex-col items-center justify-center space-y-4">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-violet-600 border-t-transparent"></div>
            <p className="font-medium text-slate-500 animate-pulse">AI is generating your study material...</p>
          </div>
        ) : (
          <div className="rounded-[32px] border border-white/45 bg-white/35 p-8 shadow-[0_22px_70px_rgba(15,23,42,0.14)] backdrop-blur-2xl lg:p-12">
            <article className="prose prose-slate prose-headings:text-slate-900 prose-strong:text-violet-600 max-w-none">
              <ReactMarkdown>{content}</ReactMarkdown>
            </article>
            
            <div className="mt-12 flex justify-between border-t border-slate-100 pt-8">
              <button
                onClick={() => navigate("/practice")}
                className="text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors"
              >
                ← Back to Topics
              </button>
              <button
                onClick={() => navigate("/practice/chat", { state: location.state })}
                className="flex items-center gap-2 text-sm font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
              >
                Ask AI Assistant →
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
