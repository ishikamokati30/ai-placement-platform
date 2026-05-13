import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import API from "../../services/api";

export default function AIChat() {
  const location = useLocation();
  const navigate = useNavigate();
  const { topic } = location.state || { topic: "DSA" };

  const [messages, setMessages] = useState([
    { role: "assistant", content: `Hi! I'm your ElevateAI tutor. I'm here to help you master **${topic}**. Ask me anything!` }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const history = messages.slice(-4);
      const res = await API.post("/practice/chat", { message: input, topic, history });
      setMessages((prev) => [...prev, { role: "assistant", content: res.data.response }]);
    } catch (err) {
      console.error("Chat error:", err);
      setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, I encountered an error. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen flex-col bg-[#f8fafc]">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white/80 px-6 py-4 backdrop-blur-md">
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
            <h2 className="text-xl font-bold text-slate-900">{topic} Assistant</h2>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500"></span>
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Online</span>
            </div>
          </div>
        </div>
        <button
          onClick={() => navigate("/practice/mcq", { state: location.state })}
          className="hidden sm:block rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all"
        >
          Take a Quiz
        </button>
      </header>

      <main 
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-8 scroll-smooth"
      >
        <div className="mx-auto max-w-3xl space-y-6">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-3xl px-6 py-4 shadow-sm transition-all duration-300 ${
                  msg.role === "user"
                    ? "bg-slate-900 text-white"
                    : "bg-white border border-slate-100 text-slate-700"
                }`}
              >
                <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="rounded-3xl bg-white border border-slate-100 px-6 py-4 shadow-sm">
                <div className="flex gap-1.5">
                  <div className="h-2 w-2 animate-bounce rounded-full bg-slate-300"></div>
                  <div className="h-2 w-2 animate-bounce rounded-full bg-slate-300 [animation-delay:0.2s]"></div>
                  <div className="h-2 w-2 animate-bounce rounded-full bg-slate-300 [animation-delay:0.4s]"></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white p-4 lg:p-6">
        <form 
          onSubmit={handleSend}
          className="mx-auto max-w-3xl relative"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Ask about ${topic}...`}
            className="w-full rounded-[24px] border border-slate-200 bg-slate-50 px-6 py-4 pr-16 text-slate-900 shadow-inner focus:border-emerald-500 focus:bg-white focus:outline-none transition-all"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className={`absolute right-2 top-2 h-12 w-12 rounded-full flex items-center justify-center transition-all ${
              input.trim() && !loading
                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-100 hover:scale-105"
                : "bg-slate-200 text-slate-400"
            }`}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>
        <p className="mt-3 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
          Powered by ElevateAI Tutor Engine
        </p>
      </footer>
    </div>
  );
}
