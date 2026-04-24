export default function Header({ userName }) {
  return (
    <header className="flex flex-col gap-5 rounded-2xl border border-white/45 bg-white/34 px-6 py-5 shadow-[0_22px_70px_rgba(15,23,42,0.10)] backdrop-blur-2xl sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.28em] text-violet-500">
          ElevateAI
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
          Good Morning, {userName}
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Your interview system is warming up with fresh recommendations.
        </p>
      </div>

      <div className="flex items-center gap-4 self-start rounded-2xl border border-white/55 bg-white/55 px-4 py-3 shadow-[0_10px_30px_rgba(15,23,42,0.08)] sm:self-auto">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 via-indigo-500 to-sky-500 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(99,102,241,0.34)]">
          IS
        </div>
        <div>
          <p className="text-base font-semibold text-slate-900">{userName}</p>
          <p className="text-sm text-slate-500">@{userName.toLowerCase()}</p>
        </div>
      </div>
    </header>
  );
}
