import Card from "../components/Card";
import MainLayout from "../layouts/MainLayout";

const stats = [
  {
    title: "Readiness Score",
    value: "82/100",
    detail: "+6 points this week",
    tone: "from-violet-500/20 via-white/10 to-sky-500/20",
  },
  {
    title: "Global Rank",
    value: "Top 20%",
    detail: "Above 14,200 learners",
    tone: "from-sky-500/20 via-white/10 to-cyan-400/20",
  },
  {
    title: "Streak",
    value: "5 days",
    detail: "2 sessions until next milestone",
    tone: "from-fuchsia-500/20 via-white/10 to-indigo-500/20",
  },
];

const quickActions = [
  {
    title: "Practice Interview",
    description: "Sharpen core concepts with adaptive prompts and realtime feedback.",
    accent: "from-violet-500 to-fuchsia-500",
  },
  {
    title: "Company Interview",
    description: "Simulate branded rounds with difficulty tuned to target employers.",
    accent: "from-sky-500 to-cyan-500",
  },
  {
    title: "Resume Based Interview",
    description: "Generate personalized questions directly from your achievements.",
    accent: "from-indigo-500 to-violet-500",
  },
];

const progressBars = [
  { label: "Week 1", value: 42 },
  { label: "Week 2", value: 58 },
  { label: "Week 3", value: 71 },
  { label: "Week 4", value: 82 },
  { label: "Week 5", value: 76 },
  { label: "Week 6", value: 89 },
];

const weakAreas = [
  { topic: "DBMS", score: "4/10", progress: 40, color: "bg-rose-400" },
  { topic: "OS", score: "6/10", progress: 60, color: "bg-amber-400" },
  { topic: "DSA", score: "5/10", progress: 50, color: "bg-sky-400" },
];

export default function Dashboard() {
  return (
    <MainLayout userName="Ishika">
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

      <section className="mt-8">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.28em] text-violet-500">
              Quick Actions
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
              Start the next high-signal session
            </h2>
          </div>
          <p className="max-w-md text-sm text-slate-500">
            Move from preparation to precision with focused interview flows.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {quickActions.map((action) => (
            <Card key={action.title} className="group relative overflow-hidden">
              <div
                className={`absolute inset-x-6 top-0 h-1 rounded-full bg-gradient-to-r ${action.accent}`}
              />
              <div className="rounded-2xl border border-white/40 bg-white/30 p-1">
                <div className="inline-flex rounded-full border border-white/50 bg-white/55 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Guided flow
                </div>
              </div>
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
                <span className="rounded-full border border-white/60 bg-white/60 px-3 py-1 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-300 group-hover:bg-slate-900 group-hover:text-white">
                  Open
                </span>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="mt-8 grid gap-5 xl:grid-cols-[1.6fr_1fr]">
        <Card>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.28em] text-violet-500">
                Progress
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                Progress Over Time
              </h2>
            </div>
            <div className="rounded-full border border-white/60 bg-white/55 px-4 py-2 text-sm font-medium text-slate-600">
              Last 6 weeks
            </div>
          </div>

          <div className="mt-8 rounded-[28px] border border-white/50 bg-white/35 p-6">
            <div className="flex h-72 items-end justify-between gap-3">
              {progressBars.map((item) => (
                <div key={item.label} className="flex flex-1 flex-col items-center gap-3">
                  <div className="flex h-56 w-full items-end rounded-2xl bg-white/70 p-2 shadow-inner shadow-white/30">
                    <div
                      className="w-full rounded-xl bg-gradient-to-t from-violet-500 via-indigo-400 to-sky-300 shadow-[0_18px_36px_rgba(99,102,241,0.28)] transition-all duration-500 hover:brightness-105"
                      style={{ height: `${item.value}%` }}
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-slate-700">{item.label}</p>
                    <p className="text-xs text-slate-500">{item.value}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card>
          <p className="text-sm font-medium uppercase tracking-[0.28em] text-violet-500">
            Weak Areas
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
            Topics to reinforce
          </h2>
          <div className="mt-8 space-y-5">
            {weakAreas.map((area) => (
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
                    {area.score}
                  </span>
                </div>
                <div className="mt-4 h-3 rounded-full bg-slate-200/70">
                  <div
                    className={`${area.color} h-3 rounded-full shadow-[0_10px_24px_rgba(148,163,184,0.32)]`}
                    style={{ width: `${area.progress}%` }}
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
