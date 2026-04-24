const navItems = [
  { label: "Dashboard", active: true, icon: DashboardIcon },
  { label: "Practice", icon: PracticeIcon },
  { label: "Interview", icon: InterviewIcon },
  { label: "Resources", icon: ResourceIcon },
  { label: "Community", icon: CommunityIcon },
  { label: "Profile", icon: ProfileIcon },
];

export default function Sidebar() {
  return (
    <aside className="fixed inset-y-5 left-5 z-20 hidden w-24 rounded-[32px] border border-white/45 bg-white/35 px-4 py-6 shadow-[0_22px_70px_rgba(15,23,42,0.14)] backdrop-blur-2xl lg:flex lg:flex-col lg:items-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-sky-500 text-lg font-semibold tracking-tight text-white shadow-[0_16px_40px_rgba(109,40,217,0.35)]">
        EA
      </div>

      <nav className="mt-10 flex w-full flex-1 flex-col items-center gap-3">
        {navItems.map((item) => {
          const Icon = item.icon;

          return (
            <button
              key={item.label}
              type="button"
              className={`group flex w-full flex-col items-center gap-2 rounded-2xl px-2 py-3 text-center transition-all duration-300 ${
                item.active
                  ? "bg-slate-900 text-white shadow-[0_18px_40px_rgba(15,23,42,0.24)]"
                  : "text-slate-500 hover:bg-white/55 hover:text-slate-900"
              }`}
            >
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-2xl transition-colors ${
                  item.active
                    ? "bg-white/14"
                    : "bg-white/45 group-hover:bg-slate-900/8"
                }`}
              >
                <Icon className="h-5 w-5" />
              </span>
              <span className="text-[11px] font-medium tracking-[0.18em] uppercase">
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

function IconBase({ children, className = "h-5 w-5" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

function DashboardIcon({ className }) {
  return (
    <IconBase className={className}>
      <path d="M4 13h7V4H4zM13 20h7v-9h-7zM13 11h7V4h-7zM4 20h7v-5H4z" />
    </IconBase>
  );
}

function PracticeIcon({ className }) {
  return (
    <IconBase className={className}>
      <path d="M12 3l7 4v10l-7 4-7-4V7l7-4z" />
      <path d="M12 9v6M9 12h6" />
    </IconBase>
  );
}

function InterviewIcon({ className }) {
  return (
    <IconBase className={className}>
      <path d="M7 10h10M7 14h6" />
      <path d="M5 5h14v14H8l-3 3V5z" />
    </IconBase>
  );
}

function ResourceIcon({ className }) {
  return (
    <IconBase className={className}>
      <path d="M6 4h9a3 3 0 013 3v13H9a3 3 0 00-3 3V4z" />
      <path d="M6 4v16a3 3 0 013-3h9" />
    </IconBase>
  );
}

function CommunityIcon({ className }) {
  return (
    <IconBase className={className}>
      <path d="M16 11a3 3 0 100-6 3 3 0 000 6zM8 13a3 3 0 100-6 3 3 0 000 6z" />
      <path d="M2 20a6 6 0 0112 0M14 20a6 6 0 016-5.2" />
    </IconBase>
  );
}

function ProfileIcon({ className }) {
  return (
    <IconBase className={className}>
      <path d="M12 12a4 4 0 100-8 4 4 0 000 8z" />
      <path d="M4 20a8 8 0 0116 0" />
    </IconBase>
  );
}
