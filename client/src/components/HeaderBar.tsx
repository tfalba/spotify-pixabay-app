import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getAuthStatus, spotifyApiJson } from "../lib/spotifyApi";
import { LoginButton, LogoutButton } from "./LoginButtons";
import type { StyleCategory } from "@/types/types";
import { useCurrentTrackActions } from "@/context/CurrentTrackContext";
import HeroBar from "./HeroBar";
import heroBannerAsset from "@/assets/hero-banner.png";
import {
  useSpotifyPlayerActions,
  useSpotifyPlayerState,
} from "@/context/SpotifyPlayerProvider";

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
  const [loggedIn, setLoggedIn] = useState(false);

  const { handleTrackFinished } = useCurrentTrackActions();

  // Option A / Option 1: "fullPlaybackEnabled" is separate from "logged in"
  const { fullPlaybackEnabled } = useSpotifyPlayerState();
  const { enableFullPlayback } = useSpotifyPlayerActions();

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
      let status: Awaited<ReturnType<typeof getAuthStatus>> | null = null;

      try {
        status = await getAuthStatus();
      } catch {
        status = null;
      }

      // If /api/auth/status doesn't exist yet, fall back to /api/me
      if (!status) {
        try {
          const profile = await spotifyApiJson<SpotifyUser>("/api/me");
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
          const profile = await spotifyApiJson<SpotifyUser>("/api/me");
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
  }, []);

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
        className="md:sticky md:top-4 z-50 flex items-center justify-between rounded-[24px] border border-white/10 bg-[#0a0e13] px-5 py-4 backdrop-blur-xl shadow-[0_20px_50px_rgba(124,92,252,0.35)]"
      >
        <div className="flex flex-col gap-1">
          <p className="text-xs uppercase tracking-[0.4em] text-emerald-200/70">
            Spotify x Pixabay
          </p>
          <h1 className="text-xl font-semibold tracking-tight text-slate-50 md:text-2xl">
            Noir Studio
          </h1>
        </div>

        <div className="flex items-center gap-4 text-sm">
          {!checkedAuth ? null : loggedIn && displayName ? (
            <>
              <span
                className="hidden md:inline text-slate-300"
              >
                <span className="text-inherit">Logged in as </span>
                <span
                  className="font-medium text-white"
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
              className="rounded-full border border-emerald-400/40 bg-emerald-400/15 px-3 py-1 text-xs uppercase tracking-[0.2em] text-emerald-100 transition hover:bg-emerald-400/25"
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
      />
    </div>
  );
}
