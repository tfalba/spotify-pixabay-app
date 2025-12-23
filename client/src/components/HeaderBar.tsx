import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

  // Option A / Option 1: "fullPlaybackEnabled" is separate from "logged in"
  const { fullPlaybackEnabled, enableFullPlayback } = useSpotifyPlayerContext();

  const isLight = theme === "light";
  const API = import.meta.env.VITE_API_BASE ?? "";

  // Avoid races between multiple refreshes (focus + mount + polling)
  const reqIdRef = useRef(0);

  const refreshAuth = useCallback(async () => {
    const myReqId = ++reqIdRef.current;

    // Helper to safely commit only the latest request
    const commitIfLatest = (fn: () => void) => {
      if (reqIdRef.current === myReqId) fn();
    };

    try {
      // Preferred fast path (you added/are adding this route)
      let status: AuthStatus | null = null;

      try {
        status = await get<AuthStatus>(`${API}/api/auth/status`);
      } catch {
        status = null;
      }

      // If /api/auth/status doesn't exist yet, fall back to /api/me
      if (!status) {
        try {
          const profile = await get<SpotifyUser>(`${API}/api/me`);
          commitIfLatest(() => {
            setLoggedIn(true);
            setUser(profile ?? null);
          });
          return;
        } catch {
          commitIfLatest(() => {
            setLoggedIn(false);
            setUser(null);
          });
          return;
        }
      }

      const authed = Boolean(status.authenticated);
      commitIfLatest(() => {
        setLoggedIn(authed);
        if (!authed) setUser(null);
      });

      // If logged in, fetch profile (nice-to-have)
      if (authed) {
        try {
          const profile = await get<SpotifyUser>(`${API}/api/me`);
          commitIfLatest(() => setUser(profile ?? null));
        } catch {
          // If status said authed but /me fails, treat as logged out (cookie/token mismatch)
          commitIfLatest(() => {
            setLoggedIn(false);
            setUser(null);
          });
        }
      }
    } finally {
      // "checkedAuth" just means we've attempted at least once
      if (reqIdRef.current === myReqId) setCheckedAuth(true);
    }
  }, [API]);

  // Initial load
  useEffect(() => {
    refreshAuth().catch(() => {});
  }, [refreshAuth]);

  // Refresh when the tab becomes visible / window regains focus
  useEffect(() => {
    const onFocus = () => refreshAuth().catch(() => {});
    const onVis = () => {
      if (document.visibilityState === "visible") {
        refreshAuth().catch(() => {});
      }
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVis);

    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [refreshAuth]);

  // Lightweight polling as a backstop (handles cases where cookies change without reload)
  useEffect(() => {
    const id = window.setInterval(() => {
      refreshAuth().catch(() => {});
    }, 30_000);
    return () => window.clearInterval(id);
  }, [refreshAuth]);

  const displayName = useMemo(() => {
    const dn = user?.display_name?.trim();
    return dn ? dn : user?.id ?? null;
  }, [user]);

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

          {/* Show full playback enable only when actually logged in */}
          {loggedIn && !fullPlaybackEnabled && (
            <button
              type="button"
              onClick={enableFullPlayback}
              className={clsx(
                "rounded-full px-3 py-1 text-xs uppercase tracking-[0.2em] transition",
                isLight
                  ? "bg-slate-900 text-white hover:bg-slate-800"
                  : "bg-white/80 text-slate-900 hover:bg-white"
              )}
            >
              Enable full playback
            </button>
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
