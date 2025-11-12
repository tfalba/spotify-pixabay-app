import { useEffect, useState } from "react";
import { get } from "../lib/fetcher";
import { LoginButton, LogoutButton } from "./LoginButtons";

type SpotifyUser = {
  id: string;
  display_name?: string | null;
};

export default function HeaderBar() {
  const [user, setUser] = useState<SpotifyUser | null>(null);
  const [checkedAuth, setCheckedAuth] = useState(false);

  const API = import.meta.env.VITE_API_BASE;

 async function getSpotifyToken() {
  const res = await fetch(`${API}/auth/token`, {
    method: "POST",
    credentials: "include",     // send signed cookies
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error("Not authenticated");
  return res.json(); // { access_token, token_type }
}

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      try {
        const profile = await get<SpotifyUser>(`${API}/api/me`);
        if (active) {
          getSpotifyToken(); // warm up token
          setUser(profile);
        }
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
    <header className="sticky top-0 z-50 -mx-6 flex items-center justify-between rounded-3xl border border-white/30 bg-black/60 px-6 pt-2 pb-7 backdrop-blur-lg shadow-soft lg:-mx-10 lg:px-10">
      <div>
        <p className="text-s uppercase tracking-[0.4em] text-teal/90">
          Portfolio Studio
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-white">
          Spotify x Pixabay Showcase
        </h1>
      </div>

      <div className="flex flex-col items-end justify-center gap-2">
   

        {/* <div className="flex items-center gap-3 text-sm text-amber-400"> */}
          <div className="flex items-center gap-4">
          {!checkedAuth ? null : user && displayName ? (
            <>
              <span className="hidden sm:inline">
                <span className="text-slate-500">Logged in as</span>{" "}
                <span className="font-medium text-white">{displayName}</span>
              </span>

              <LogoutButton />
            </>
          ) : (
            <LoginButton />
          )}
        </div>
      </div>
    </header>
  );
}
