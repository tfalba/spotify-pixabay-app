import { useEffect, useState } from "react";
import { get } from "../lib/fetcher";

type SpotifyUser = {
  id: string;
  display_name?: string | null;
};

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

export default function HeaderBar() {
  const [user, setUser] = useState<SpotifyUser | null>(null);
  const [checkedAuth, setCheckedAuth] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      try {
        const profile = await get<SpotifyUser>("/api/me");
        if (active) setUser(profile);
      } catch {
        if (active) setUser(null);
      } finally {
        if (active) setCheckedAuth(true);
      }
    }

    loadProfile();
    return () => {
      active = false;
    };
  }, []);

  const displayName = user?.display_name?.trim() ? user.display_name : user?.id;

  return (
    <header className="sticky top-0 z-50 -mx-6 flex items-center justify-between rounded-3xl border border-white/10 bg-black/20 px-6 py-5 backdrop-blur-lg shadow-soft lg:-mx-10 lg:px-10">
      <div>
        <p className="text-xs uppercase tracking-[0.4em] text-teal/70">
          Portfolio Studio
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-white">
          Spotify x Pixabay Showcase
        </h1>
      </div>

      <div className="flex items-center gap-3 text-sm text-amber-400">
        {!checkedAuth ? null : user && displayName ? (
          <>
            <span className="hidden sm:inline">
              <span className="text-white-500">Logged in as</span>{" "}
              <span className="font-medium text-white">{displayName}</span>
            </span>

            {/* Logout button with teal gradient border + shine-on-hover */}
            <button
              onClick={logout}
              type="button"
              className="group relative inline-flex items-center justify-center overflow-hidden rounded-full px-[1px] py-[1px] focus:outline-none focus:ring-2 focus:ring-teal/40 transition-transform duration-200 hover:-translate-y-0.5"
            >
              {/* Gradient border pill */}
              <span className="absolute border border-amber inset-0 z-0 rounded-full bg-gradient-to-r from-teal/80 via-white/20 to-teal/90 opacity-90 transition duration-200 group-hover:opacity-100" />

              {/* Shine sweep (animated on hover) */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 z-[1] -translate-x-full skew-x-12 bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-0 transition duration-700 motion-safe:group-hover:translate-x-full motion-safe:group-hover:opacity-60"
              />
              {/* Inner pill */}
              <span className="relative z-[2] border-amber inline-flex items-center gap-1 rounded-full bg-teal px-5 py-2 text-xs font-semibold uppercase tracking-wide text-midnight">
                Logout
              </span>
            </button>
          </>
        ) : (
          /* Login link with the same effect */
          <a
            href="/auth/login"
            className="group relative inline-flex items-center justify-center overflow-hidden rounded-full px-[1px] py-[1px] focus:outline-none focus:ring-2 focus:ring-teal/40 transition-transform duration-200 hover:-translate-y-0.5"
          >
            {/* Gradient border pill (teal) */}
            <span className="absolute border border-amber inset-0 z-0 rounded-full bg-gradient-to-r from-teal/80 via-white/20 to-teal/90 opacity-90 transition duration-200 group-hover:opacity-100" />

            {/* Shine sweep */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-[1] -translate-x-full skew-x-12 bg-gradient-to-r from-amber via-white/50 to-transparent opacity-0 transition duration-700 motion-safe:group-hover:translate-x-full motion-safe:group-hover:opacity-60"
            />

            {/* Inner pill */}
            <span className="relative z-[2] border-amber inline-flex items-center gap-1 rounded-full bg-teal px-5 py-2 text-xs font-semibold uppercase tracking-wide text-midnight">
              Login to Spotify
            </span>
          </a>
        )}
      </div>
    </header>
  );
}
