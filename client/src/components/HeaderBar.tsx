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
    <header className="w-full flex items-center justify-between py-3 px-4 border-b bg-white sticky top-0 z-50">
      <h1 className="font-semibold tracking-tight">Spotify + Pixabay</h1>

      <div className="flex items-center gap-3 text-sm text-slate-600">
        {!checkedAuth
          ? null
          : user && displayName ? (
              <>
                <span>
                  Logged in as <span className="font-medium">{displayName}</span>
                </span>
                <button
                  onClick={logout}
                  className="px-3 py-1.5 rounded-lg border hover:bg-slate-50"
                  type="button"
                >
                  Logout
                </button>
              </>
            ) : (
              <a
                href="/auth/login"
                className="px-3 py-1.5 rounded-lg border hover:bg-slate-50"
              >
                Login to Spotify
              </a>
            )}
      </div>
    </header>
  );
}
