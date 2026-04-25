import { useNavigate } from "react-router-dom";

export default function Header({ userName }) {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/auth", { replace: true });
  };

  return (
    <header
      id="header"
      className="flex flex-col gap-5 rounded-2xl border border-white/45 bg-white/34 px-6 py-5 shadow-[0_22px_70px_rgba(15,23,42,0.10)] backdrop-blur-2xl sm:flex-row sm:items-center sm:justify-between"
    >
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

      <div className="flex flex-wrap items-center gap-3 self-start sm:self-auto">
        <button
          type="button"
          onClick={() => navigate("/interview")}
          className="rounded-2xl border border-white/60 bg-white/60 px-4 py-3 text-sm font-semibold text-slate-700 shadow-[0_10px_30px_rgba(15,23,42,0.08)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-white"
        >
          New Interview
        </button>
        <div className="flex items-center gap-4 rounded-2xl border border-white/55 bg-white/55 px-4 py-3 shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 via-indigo-500 to-sky-500 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(99,102,241,0.34)]">
            IS
          </div>
          <div>
            <p className="text-base font-semibold text-slate-900">{userName}</p>
            <p className="text-sm text-slate-500">@{userName.toLowerCase()}</p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm font-medium text-slate-600 transition-colors duration-300 hover:border-rose-200 hover:text-rose-600"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
