 const buttonClasses = "group relative inline-flex items-center justify-center overflow-hidden rounded-full px-1 py-1 focus:outline-none focus:ring-2 focus:ring-teal/40 transition-transform duration-200 hover:-translate-y-0.5"
const borderPillClasses = "pointer-events-none absolute inset-0 z-0 rounded-full border border-teal bg-gradient-to-r from-teal/10 via-white/20 to-teal/40 opacity-90 transition duration-200 group-hover:opacity-100";
const shineClasses = "pointer-events-none absolute inset-0 z-[1] -translate-x-full skew-x-12 bg-gradient-to-r from-teal via-white/50 to-transparent opacity-0 transition duration-700 motion-safe:group-hover:translate-x-full motion-safe:group-hover:opacity-60";
const innerPillClasses = "relative z-[2] border-teal inline-flex items-center gap-1 rounded-full bg-teal-50 px-4 py-1 text-xs shadow-md font-semibold uppercase tracking-wide text-white";
 
const API = import.meta.env.VITE_API_BASE;

function LoginButton() {
  return (
    <a
      href={`${API}/auth/login`}
      className={buttonClasses}
    >
      {/* Gradient border pill (teal) */}
      <span className={borderPillClasses} />

      {/* Shine sweep */}
      <span
        aria-hidden="true"
        className={shineClasses}
      />

      {/* Inner pill */}
      <span className={innerPillClasses}>
        Login to Spotify
      </span>
    </a>
  );
}

function LogoutButton() {
  async function logout() {
    try {
      await fetch("/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } finally {
      location.reload();
    }
  }

  return (
    <button
      onClick={logout}
      type="button"
      className={buttonClasses}>
      {/* Gradient border pill */}
      <span className={borderPillClasses} />

      {/* Shine sweep (animated on hover) */}
      <span
        aria-hidden="true"
        className={shineClasses}
      />
      {/* Inner pill */}
      <span className={innerPillClasses}>
        Logout
      </span>
    </button>
  );
}

export { LoginButton, LogoutButton };
