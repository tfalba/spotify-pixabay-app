import { useEffect, useState } from "react";
import clsx from "clsx";
import { get } from "../lib/fetcher";
import { LoginButton, LogoutButton } from "./LoginButtons";
import { useTheme } from "@/context/ThemeContext";
import type { StyleCategory } from "@/types/types";
import { useCurrentTrack } from "@/context/CurrentTrackContext";
import HeroBar from "./HeroBar";
import heroBannerAsset from "@/assets/hero-banner.png";
import { useSpotifyPlayerContext } from "@/context/SpotifyPlayerProvider";

type SpotifyUser = {
  id: string;
  display_name?: string | null;
};

type StyleChoice = StyleCategory | "surprise";

type Props = {
  styleChoice: StyleChoice;
  onStyleChange: (choice: StyleChoice) => void;
};

type AuthStatus = { authenticated: boolean };

export default function HeaderBar({ styleChoice, onStyleChange }: Props) {
  const [user, setUser] = useState<SpotifyUser | null>(null);
  const [checkedAuth, setCheckedAuth] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  const { theme, toggleTheme } = useTheme();
  const { handleTrackFinished } = useCurrentTrack();

  // NOTE: under Option 1, isAuthenticated is “SDK token success”, not “logged in”
  const { fullPlaybackEnabled, enableFullPlayback } = useSpotifyPlayerContext();

  const isLight = theme === "light";
  const API = import.meta.env.VITE_API_BASE ?? "";

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        // 1) auth status (cookie presence) – fast and reliable post-login
        const status = await get<AuthStatus>(`${API}/api/auth/status`);
        if (active) setLoggedIn(Boolean(status?.authenticated));

        // 2) profile (only works when logged in)
        if (status?.authenticated) {
          const profile = await get<SpotifyUser>(`${API}/api/me`);
          if (active) setUser(profile);
        } else {
          if (active) setUser(null);
        }
      } catch {
        if (active) {
          setLoggedIn(false);
          setUser(null);
        }
      } finally {
        if (active) setCheckedAuth(true);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [API]);

  const displayName = user?.display_name?.trim() ? user.display_name : user?.id;
  const resolvedStyleName =
    styleChoice === "surprise" ? "Surprise me" : styleChoice;

  return (
    <div>
      <header
        className={clsx(
          "md:sticky border-b-2 top-0 z-50 flex items-start md:items-center justify-between backdrop-blur-lg shadow-glow transition-colors duration-300 p-4 mb-4 md:mb-0",
          isLight
            ? " bg-white/80 text-slate-900 border-lilac/20"
            : "bg-teal/5 text-white border-teal/70"
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
        </div>

        <div className="flex items-center gap-4 text-sm">
          {!checkedAuth ? null : loggedIn && displayName ? (
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

          {/* Under Option 1: show this when logged in, but full playback not enabled */}
          {loggedIn && !fullPlaybackEnabled && (
            <button onClick={enableFullPlayback}>Enable full playback</button>
          )}
        </div>
      </header>

      <HeroBar
        heroBanner={heroBannerAsset}
        resolvedStyleName={resolvedStyleName}
        styleChoice={styleChoice}
        onStyleChange={onStyleChange}
        onTrackFinished={handleTrackFinished}
        onToggleTheme={toggleTheme}
      />
    </div>
  );
}
