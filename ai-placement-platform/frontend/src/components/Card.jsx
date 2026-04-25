export default function Card({ children, className = "", id }) {
  return (
    <div
      id={id}
      className={`rounded-2xl border border-white/45 bg-white/38 p-6 shadow-[0_22px_70px_rgba(15,23,42,0.10)] backdrop-blur-2xl transition-all duration-300 hover:-translate-y-1 hover:scale-[1.01] hover:shadow-[0_28px_90px_rgba(99,102,241,0.18)] ${className}`}
    >
      {children}
    </div>
  );
}
