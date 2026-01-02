import clsx from "clsx";

const baseButton =
  "group relative inline-flex items-center justify-center overflow-hidden rounded-full px-1 py-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/50 transition-transform duration-200 hover:-translate-y-0.5";
const baseShine =
  "pointer-events-none absolute inset-0 z-[1] -translate-x-full skew-x-12 bg-gradient-to-r from-emerald-200/40 via-white/40 to-transparent opacity-0 transition duration-700 motion-safe:group-hover:translate-x-full motion-safe:group-hover:opacity-80";
const baseInner =
  "relative z-[2] inline-flex items-center gap-1 rounded-full px-2 md:px-4 py-1 text-xs shadow-md font-semibold uppercase tracking-[0.2em]";

const API = import.meta.env.VITE_API_BASE || "http://127.0.0.1:5174";

function LoginButton() {
  const buttonClasses = clsx(baseButton);
  const borderPill = clsx(
    "pointer-events-none absolute inset-0 z-0 rounded-full border opacity-90 transition duration-200 group-hover:opacity-100",
    "border-white/20 bg-gradient-to-r from-emerald-400/20 via-white/10 to-amber-400/20"
  );
  const inner = clsx(
    baseInner,
    "border border-transparent bg-emerald-300/90 text-slate-900 shadow-[0_12px_30px_rgba(16,185,129,0.35)] text-center"
  );

  return (
    <a href={`${API}/auth/login`} className={buttonClasses}>
      <span className={borderPill} />
      <span aria-hidden="true" className={baseShine} />
      <span className={inner}>Login to Spotify</span>
    </a>
  );
}

function LogoutButton() {
  const buttonClasses = clsx(baseButton);
  const borderPill = clsx(
    "pointer-events-none absolute inset-0 z-0 rounded-full border opacity-90 transition duration-200 group-hover:opacity-100",
    "border-white/20 bg-gradient-to-r from-white/5 via-white/10 to-white/5"
  );
  const inner = clsx(
    baseInner,
    "border border-white/10 bg-white/10 text-white/80 shadow-[0_12px_30px_rgba(15,23,42,0.4)]"
  );

  async function logout() {
    try {
      await fetch(`${API}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } finally {
      location.reload();
    }
  }

  return (
    <button onClick={logout} type="button" className={buttonClasses}>
      <span className={borderPill} />
      <span aria-hidden="true" className={baseShine} />
      <span className={inner}>Logout</span>
    </button>
  );
}

export { LoginButton, LogoutButton };
