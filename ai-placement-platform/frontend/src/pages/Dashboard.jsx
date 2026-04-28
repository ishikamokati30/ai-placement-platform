import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../components/Card";
import MainLayout from "../layouts/MainLayout";

export default function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/dashboard", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <MainLayout>
        <div className="grid gap-5 xl:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-[32px] bg-slate-200" />
          ))}
        </div>
        <div className="mt-8 h-96 animate-pulse rounded-[32px] bg-slate-200" />
      </MainLayout>
    );
  }

  if (!data || data.totalInterviews === 0) {
    return (
      <MainLayout>
        <div className="flex min-h-[60vh] flex-col items-center justify-center rounded-[40px] border-2 border-dashed border-slate-200 bg-white/50 p-12 text-center backdrop-blur-xl">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-violet-100 text-3xl">
            🚀
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">
            Welcome to ElevateAI
          </h2>
          <p className="mt-4 max-w-md text-lg text-slate-500">
            Start your first interview to unlock personalized insights, track your progress, and identify weak areas.
          </p>
          <button
            onClick={() => navigate("/practice")}
            className="mt-10 rounded-full bg-slate-900 px-8 py-4 text-lg font-semibold text-white transition-all hover:scale-105 hover:bg-slate-800"
          >
            Start Your First Interview
          </button>
        </div>
      </MainLayout>
    );
  }

  const stats = [
    {
      title: "Readiness Score",
      value: `${data.readinessScore}/100`,
      detail: data.insights.find(i => i.includes("improved")) || "Keep practicing to improve",
      tone: "from-violet-500/20 via-white/10 to-sky-500/20",
    },
    {
      title: "Global Rank",
      value: `Top ${Math.max(1, 100 - data.readinessScore)}%`,
      detail: "Based on recent performance",
      tone: "from-sky-500/20 via-white/10 to-cyan-400/20",
    },
    {
      title: "Streak",
      value: `${data.streak} days`,
      detail: "Consistency is key!",
      tone: "from-fuchsia-500/20 via-white/10 to-indigo-500/20",
    },
  ];

  const quickActions = [
    {
      title: "Practice Interview",
      description: "Sharpen core concepts with adaptive prompts and realtime feedback.",
      accent: "from-violet-500 to-fuchsia-500",
      path: "/practice",
      payload: {
        type: "technical",
        role: "SDE",
        topic: "DSA fundamentals",
        launchOnLoad: true,
      },
    },
    {
      title: "Company Interview",
      description: "Simulate branded rounds with difficulty tuned to target employers.",
      accent: "from-sky-500 to-cyan-500",
      path: "/company-interview",
    },
    {
      title: "Resume Based Interview",
      description: "Analyze your resume with ATS scoring and start a personalized interview session.",
      accent: "from-indigo-500 to-violet-500",
      path: "/resume",
    },
  ];

  return (
    <MainLayout>
      {/* Stats Section */}
      <section className="grid gap-5 xl:grid-cols-3">
        {stats.map((stat) => (
          <Card
            key={stat.title}
            className={`overflow-hidden bg-gradient-to-br ${stat.tone}`}
          >
            <p className="text-sm font-medium text-slate-600">{stat.title}</p>
            <div className="mt-6 flex items-end justify-between gap-4">
              <div>
                <h3 className="text-3xl font-semibold tracking-tight text-slate-900">
                  {stat.value}
                </h3>
                <p className="mt-2 text-sm text-slate-500">{stat.detail}</p>
              </div>
              <div className="rounded-2xl border border-white/50 bg-white/45 px-3 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 backdrop-blur-xl">
                Live
              </div>
            </div>
          </Card>
        ))}
      </section>

      {/* AI Insights Section */}
      <section className="mt-8">
        <Card className="border-violet-200/50 bg-violet-50/30">
          <p className="text-sm font-medium uppercase tracking-[0.28em] text-violet-500">
            AI Coach Insights
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            {data.insights.map((insight, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 rounded-2xl border border-violet-100 bg-white/60 px-4 py-3 text-sm font-medium text-slate-700 shadow-sm backdrop-blur-sm"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-100 text-xs">
                  ✨
                </span>
                {insight}
              </div>
            ))}
          </div>
        </Card>
      </section>

      {/* Quick Actions */}
      <section id="quick-actions" className="mt-8 scroll-mt-8">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.28em] text-violet-500">
              Quick Actions
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
              Start the next high-signal session
            </h2>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {quickActions.map((action) => (
            <Card key={action.title} className="group relative overflow-hidden">
              <div
                className={`absolute inset-x-6 top-0 h-1 rounded-full bg-gradient-to-r ${action.accent}`}
              />
              <h3 className="mt-6 text-xl font-semibold text-slate-900 transition-transform duration-300 group-hover:translate-x-1">
                {action.title}
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {action.description}
              </p>
              <div className="mt-8 flex items-center justify-between">
                <span className="text-sm font-medium text-slate-500">
                  Launch session
                </span>
                <button
                  type="button"
                  onClick={() =>
                    navigate(action.path, {
                      state: action.payload,
                    })
                  }
                  className="cursor-pointer rounded-full border border-white/60 bg-white/60 px-3 py-1 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-300 group-hover:bg-slate-900 group-hover:text-white"
                >
                  Open
                </button>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Progress and Weak Areas */}
      <section className="mt-8 grid gap-5 xl:grid-cols-[1.6fr_1fr]">
        <Card id="progress">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.28em] text-violet-500">
                Progress
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                Performance Over Time
              </h2>
            </div>
          </div>

          <div className="mt-8 rounded-[28px] border border-white/50 bg-white/35 p-6">
            <div className="flex h-72 items-end justify-between gap-3">
              {data.progress.map((item) => (
                <div key={item.week} className="flex flex-1 flex-col items-center gap-3">
                  <div className="flex h-56 w-full items-end rounded-2xl bg-white/70 p-2 shadow-inner shadow-white/30">
                    <div
                      className="w-full rounded-xl bg-gradient-to-t from-violet-500 via-indigo-400 to-sky-300 shadow-[0_18px_36px_rgba(99,102,241,0.28)] transition-all duration-500 hover:brightness-105"
                      style={{ height: `${item.score}%` }}
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-slate-700">{item.week}</p>
                    <p className="text-xs text-slate-500">{item.score}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card id="weak-areas">
          <p className="text-sm font-medium uppercase tracking-[0.28em] text-violet-500">
            Weak Areas
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
            Topics to reinforce
          </h2>
          <div className="mt-8 space-y-5">
            {data.topicPerformance
              .filter(tp => tp.avgScore < 6)
              .map((area) => (
                <div
                  key={area.topic}
                  className="rounded-[24px] border border-white/50 bg-white/40 p-5"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-base font-semibold text-slate-800">
                        {area.topic}
                      </p>
                      <p className="text-sm text-slate-500">Concept retention</p>
                    </div>
                    <span className="text-sm font-semibold text-slate-700">
                      {Math.round(area.avgScore)}/10
                    </span>
                  </div>
                  <div className="mt-4 h-3 rounded-full bg-slate-200/70">
                    <div
                      className="h-3 rounded-full bg-rose-400 shadow-[0_10px_24px_rgba(244,63,94,0.32)]"
                      style={{ width: `${area.avgScore * 10}%` }}
                    />
                  </div>
                </div>
              ))}
          </div>
        </Card>
      </section>
    </MainLayout>
  );
}
