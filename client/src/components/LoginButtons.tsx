import clsx from "clsx";
import { useTheme } from "@/context/ThemeContext";

const baseButton =
  "group relative inline-flex items-center justify-center overflow-hidden rounded-full px-1 py-1 focus:outline-none focus:ring-2 transition-transform duration-200 hover:-translate-y-0.5";
const baseShine =
  "pointer-events-none absolute inset-0 z-[1] -translate-x-full skew-x-12 bg-gradient-to-r from-teal via-white/50 to-transparent opacity-0 transition duration-700 motion-safe:group-hover:translate-x-full motion-safe:group-hover:opacity-60";
const baseInner =
  "relative z-[2] inline-flex items-center gap-1 rounded-full px-4 py-1 text-xs shadow-md font-semibold uppercase tracking-wide";

const API = import.meta.env.VITE_API_BASE || "http://127.0.0.1:5174";

function LoginButton() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const buttonClasses = clsx(
    baseButton,
    isLight ? "focus:ring-slate-300" : "focus:ring-teal/40"
  );
  const borderPill = clsx(
    "pointer-events-none absolute inset-0 z-0 rounded-full border opacity-90 transition duration-200 group-hover:opacity-100",
    isLight
      ? "border-teal-500 bg-gradient-to-r from-teal-200 via-white to-teal-50"
      : "border-teal bg-gradient-to-r from-teal/10 via-white/20 to-teal/40"
  );
  const inner = clsx(
    baseInner,
    isLight
      ? "border border-teal-500 bg-white text-teal-700"
      : "border border-transparent bg-teal-50 text-white"
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
  const { theme } = useTheme();
  const isLight = theme === "light";
  const buttonClasses = clsx(
    baseButton,
    isLight ? "focus:ring-slate-300" : "focus:ring-teal/40"
  );
  const borderPill = clsx(
    "pointer-events-none absolute inset-0 z-0 rounded-full border opacity-90 transition duration-200 group-hover:opacity-100",
    isLight
      ? "border-slate-300 bg-gradient-to-r from-white via-slate-50 to-white"
      : "border-teal bg-gradient-to-r from-teal/10 via-white/20 to-teal/40"
  );
  const inner = clsx(
    baseInner,
    isLight
      ? "border border-slate-200 bg-white text-slate-700"
      : "border border-transparent bg-teal-50 text-white"
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
