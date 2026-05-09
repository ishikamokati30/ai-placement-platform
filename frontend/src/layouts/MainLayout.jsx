import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";

export default function MainLayout({ children }) {
  const location = useLocation();

  useEffect(() => {
    const targetId = location.state?.scrollTo;

    if (!targetId) {
      return;
    }

    const element = document.getElementById(targetId);
    element?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [location]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(196,181,253,0.75),_transparent_32%),radial-gradient(circle_at_top_right,_rgba(191,219,254,0.75),_transparent_28%),linear-gradient(180deg,_#f8fbff_0%,_#eef2ff_48%,_#f7f9fc_100%)] text-slate-900">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[12%] top-16 h-64 w-64 rounded-full bg-violet-300/25 blur-3xl" />
        <div className="absolute bottom-0 right-[10%] h-72 w-72 rounded-full bg-sky-300/25 blur-3xl" />
      </div>

      <Sidebar />

      <main className="relative min-h-screen px-4 pb-10 pt-5 lg:ml-36 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Header />
          <div className="mt-8">{children}</div>
        </div>
      </main>
    </div>
  );
}
