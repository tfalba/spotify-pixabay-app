import { useEffect, useState } from "react";
import clsx from "clsx";
import { get } from "../lib/fetcher";
import { LoginButton, LogoutButton } from "./LoginButtons";
import { useTheme } from "@/context/ThemeContext";
import type { StyleCategory } from "@/types/types";
import { NowPlayingPanel } from "./NowPlayingPanel";
import { useCurrentTrack } from "@/context/CurrentTrackContext";
import ArtStyleDropdown  from "./ArtStyleDropdown";

type SpotifyUser = {
  id: string;
  display_name?: string | null;
};

type StyleChoice = StyleCategory | "surprise";

type Props = {
  styleChoice: StyleChoice;
  onStyleChange: (choice: StyleChoice) => void;
};

export default function HeaderBar({ styleChoice, onStyleChange }: Props) {
  const [user, setUser] = useState<SpotifyUser | null>(null);
  const [checkedAuth, setCheckedAuth] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { handleTrackFinished } = useCurrentTrack();
  const isLight = theme === "light";

  const API = import.meta.env.VITE_API_BASE;

  useEffect(() => {
    let active = true;

    async function getSpotifyToken() {
      const res = await fetch(`${API}/auth/token`, {
        method: "POST",
        credentials: "include", // send signed cookies
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Not authenticated");
      return res.json(); // { access_token, token_type }
    }

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
  }, [API]);

  const displayName = user?.display_name?.trim() ? user.display_name : user?.id;
  const resolvedStyleName =
    styleChoice === "surprise" ? "Surprise me" : styleChoice;

  return (
    <header
      className={clsx(
        "md:sticky top-0 z-50 flex items-start md:items-center justify-between rounded-3xl backdrop-blur-lg shadow-glow transition-colors duration-300 px-4 mb-4 md:mb-0",
        isLight ? " bg-white/80 text-slate-900" : "bg-teal/5 text-white"
      )}
    >
      <div className="flex flex-col gap-1">
        <div className="flex-1">
          <p
            className={clsx(
              "text-xl uppercase tracking-[0.4em] font-semibold",
              isLight ? "text-lilac" : "text-teal/90"
            )}
          >
            Spotify * Pixabay Showcase
          </p>
        </div>
        <NowPlayingPanel onTrackFinished={handleTrackFinished} />
      </div>

      <div className="flex flex-col items-end gap-3">
        <div className="flex items-center gap-3 flex-wrap justify-end">
          <button
            type="button"
            onClick={toggleTheme}
            className={clsx(
              "inline-flex items-center gap-2 rounded-full border px-4 py-1 text-xs font-semibold uppercase tracking-wide transition-colors",
              isLight
                ? "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                : "border-white/30 bg-white/10 text-white hover:bg-white/20"
            )}
          >
            {isLight ? "Dark Mode" : "Light Mode"}
          </button>
          <ArtStyleDropdown
            resolvedStyleName={resolvedStyleName}
            styleChoice={styleChoice}
            onStyleChange={onStyleChange}
          />
        </div>

        <div className="flex items-center gap-4 text-sm">
          {!checkedAuth ? null : user && displayName ? (
            <>
              <span
                className={clsx(
                  "hidden md:inline",
                  isLight ? "text-slate-500" : "text-slate-300"
                )}
              >
                <span className="text-inherit">Logged in as </span>
                <span
                  className={clsx(
                    "font-medium",
                    isLight ? "text-slate-900" : "text-white"
                  )}
                >
                  {displayName}
                </span>
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
