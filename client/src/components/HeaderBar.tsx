import { useEffect, useState } from "react";
import { get } from "../lib/fetcher";
import { LoginButton, LogoutButton } from "./LoginButtons";

type SpotifyUser = {
  id: string;
  display_name?: string | null;
};

export default function HeaderBar({ activePath }: { activePath?: string }) {
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

  const currentPath =
    activePath ??
    (typeof window !== "undefined"
      ? window.location.hash.replace(/^#/, "") || "/"
      : "/");

  const linkClass = (path: string) => {
    const isCurrent = currentPath === path;
    return [
      "relative inline-flex items-center justify-center rounded-full px-4 py-1 text-s font-semibold uppercase tracking-wide transition-colors duration-200",
      isCurrent
        ? "text-amber shadow-[0_0_0_2px_rgba(251,191,36,0.25)] after:absolute after:inset-0 after:-z-10 after:rounded-full after:bg-amber/15 after:content-['']"
        : " text-slate-300 hover:border-amber/60 hover:text-amber",
    ].join(" ");
  };

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
             <nav className="flex items-center gap-3 p-1 text-xs">
          <a href="#/" className={linkClass("/")}>
            Home
          </a>
          <a href="#/mystuff" className={linkClass("/mystuff")}>
            My Stuff
          </a>
        </nav>
      </div>
    </header>
  );
}
