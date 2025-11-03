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

  const displayName = user?.display_name?.trim()
    ? user.display_name
    : user?.id;

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

      <div className="flex items-center gap-3 text-sm text-slate-300">
        {!checkedAuth
          ? null
          : user && displayName ? (
              <>
                <span className="hidden sm:inline">
                  <span className="text-slate-500">Logged in as</span>{" "}
                  <span className="font-medium text-white">{displayName}</span>
                </span>
                <button
                  onClick={logout}
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-wide text-slate-200 transition hover:border-teal/60 hover:bg-teal/20"
                  type="button"
                >
                  Logout
                </button>
              </>
            ) : (
              <a
                href="/auth/login"
                className="rounded-full border border-white/10 bg-accent/80 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow-glow transition hover:bg-accent"
              >
                Login to Spotify
              </a>
            )}
      </div>
    </header>
  );
}
