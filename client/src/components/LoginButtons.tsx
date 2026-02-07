import clsx from "clsx";
import { useEffect, useRef, useState } from "react";

const baseButton =
  "group relative inline-flex items-center justify-center overflow-hidden rounded-full px-1 py-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/50 transition-transform duration-200 hover:-translate-y-0.5";
const baseShine =
  "pointer-events-none absolute inset-0 z-[1] -translate-x-full skew-x-12 bg-gradient-to-r from-emerald-200/40 via-white/40 to-transparent opacity-0 transition duration-700 motion-safe:group-hover:translate-x-full motion-safe:group-hover:opacity-80";
const baseInner =
  "relative z-[2] inline-flex items-center gap-1 rounded-full px-2 md:px-4 py-1 text-xs shadow-md font-semibold uppercase tracking-[0.2em]";

const API = import.meta.env.VITE_API_BASE || "http://127.0.0.1:5174";

function LoginButton({ betaSubmit = false }: { betaSubmit?: boolean }) {
  const [showBetaRequest, setShowBetaRequest] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const dialogRef = useRef<HTMLDivElement | null>(null);

  const buttonClasses = clsx(baseButton);
  const borderPill = clsx(
    "pointer-events-none absolute inset-0 z-0 rounded-full border opacity-90 transition duration-200 group-hover:opacity-100",
    "border-white/20 bg-gradient-to-r from-emerald-400/20 via-white/10 to-amber-400/20",
  );
  const inner = clsx(
    baseInner,
    "border border-transparent bg-emerald-300/90 text-slate-900 shadow-[0_12px_30px_rgba(16,185,129,0.35)] text-center",
  );

  const requestHref = (() => {
    const to = "tracy.falba12@gmail.com";
    const subject = "Beta access request";
    const bodyLines = [
      "Request access to beta version",
      "",
      `Full Name: ${fullName || "(not provided)"}`,
      `Email for Spotify Account: ${email || "(not provided)"}`,
    ];
    const body = bodyLines.join("\n");
    return `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(body)}`;
  })();

  useEffect(() => {
    if (!showBetaRequest) return;
    dialogRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowBetaRequest(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showBetaRequest]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    window.location.href = requestHref;
    setShowBetaRequest(false);
  }

  return (
    <div className="flex items-center gap-2">
      {betaSubmit ? (
        <div className="group relative inline-flex items-center">
          <span className="inline-flex h-5 w-5 font-cursive items-center justify-center rounded-full border border-white/15 bg-white/5 text-[12px] font-semibold text-white/70">
            i
          </span>
          <div className="pointer-events-none absolute right-full top-1/2 z-10 mr-3 w-72 -translate-y-1/2 rounded-lg border border-white/10 bg-[#0a0f16] px-3 py-2 text-[14px] text-white/80 opacity-0 shadow-[0_14px_30px_rgba(15,23,42,0.45)] transition-opacity duration-200 group-hover:opacity-100">
            <div className="flex items-center gap-2">
              <span>Login required for full playback access. Request access to beta version.</span>
              <button
                type="button"
                className="pointer-events-auto inline-flex h-6 w-6 items-center justify-center rounded-full border border-white/20 text-[12px] text-white/70 hover:bg-white/10"
                onClick={() => setShowBetaRequest(true)}
                aria-label="Open beta request form"
              >
                →
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <a href={`${API}/auth/login`} className={buttonClasses}>
        <span className={borderPill} />
        <span aria-hidden="true" className={baseShine} />
        <span className={inner}>Login to Spotify</span>
      </a>

      {showBetaRequest && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 px-4"
          onClick={() => setShowBetaRequest(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0a0f16] p-5 shadow-[0_20px_50px_rgba(15,23,42,0.55)]"
            onClick={(e) => e.stopPropagation()}
            ref={dialogRef}
            tabIndex={-1}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-[15px] font-semibold text-white">
                Request Access
              </h3>
              <button
                type="button"
                className="rounded-full px-2 py-1 text-[14px] text-white/70 hover:bg-white/10"
                onClick={() => setShowBetaRequest(false)}
              >
                ✕
              </button>
            </div>
            <form className="space-y-3" onSubmit={handleSubmit}>
              <label className="block text-[14px] text-white/70">
                Full Name
                <input
                  className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-[15px] text-white focus:outline-none focus:ring-2 focus:ring-emerald-300/60"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your name"
                />
              </label>
              <label className="block text-[14px] text-white/70">
                Email for Spotify Account
                <input
                  type="email"
                  className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-[15px] text-white focus:outline-none focus:ring-2 focus:ring-emerald-300/60"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </label>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBetaRequest(false)}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[14px] text-white/70 hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full border border-transparent bg-emerald-300/90 px-3 py-1 text-[14px] font-semibold text-slate-900 shadow-[0_12px_25px_-18px_rgba(16,185,129,0.7)]"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function LogoutButton() {
  const buttonClasses = clsx(baseButton);
  const borderPill = clsx(
    "pointer-events-none absolute inset-0 z-0 rounded-full border opacity-90 transition duration-200 group-hover:opacity-100",
    "border-white/20 bg-gradient-to-r from-white/5 via-white/10 to-white/5",
  );
  const inner = clsx(
    baseInner,
    "border border-white/10 bg-white/10 text-white/80 shadow-[0_12px_30px_rgba(15,23,42,0.4)]",
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
