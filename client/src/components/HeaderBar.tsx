import { useEffect, useMemo } from "react";
import { useAuthStatus } from "@/context/AuthStatusContext";
import { LoginButton, LogoutButton } from "./LoginButtons";
import type { StyleCategory } from "@/types/types";
import { useCurrentTrackActions } from "@/context/CurrentTrackContext";
import HeroBar from "./HeroBar";
import heroBannerAsset from "@/assets/hero-banner.png";
import {
  useSpotifyPlayerActions,
  useSpotifyPlayerState,
} from "@/context/SpotifyPlayerProvider";

type StyleChoice = StyleCategory | "surprise";

type Props = {
  styleChoice: StyleChoice;
  onStyleChange: (choice: StyleChoice) => void;
};

export default function HeaderBar({ styleChoice, onStyleChange }: Props) {
  const { authenticated, checked, profile, refresh } = useAuthStatus();

  const { handleTrackFinished } = useCurrentTrackActions();

  // Option A / Option 1: "fullPlaybackEnabled" is separate from "logged in"
  const { fullPlaybackEnabled } = useSpotifyPlayerState();
  const { enableFullPlayback } = useSpotifyPlayerActions();

  useEffect(() => {
    if (authenticated) {
      refresh({ forceProfile: false }).catch(() => {});
    }
  }, [authenticated, refresh]);

  const displayName = useMemo(() => {
    const dn = profile?.display_name?.trim();
    return dn ? dn : profile?.id ?? null;
  }, [profile]);

  const resolvedStyleName =
    styleChoice === "surprise" ? "Surprise me" : styleChoice;

  return (
    <div>
      <header
        className="md:sticky md:top-4 z-50 flex items-center justify-between rounded-[24px] border border-white/10 bg-[#0a0e13] px-5 py-4 backdrop-blur-xl shadow-[0_20px_50px_rgba(124,92,252,0.35)]"
      >
        <div className="flex flex-col gap-1">
          <p className="text-sm uppercase tracking-[0.4em] text-emerald-200/70">
            Spotify x Pixabay
          </p>
          <h1 className="text-xl font-semibold tracking-tight text-slate-50 md:text-2xl">
            Noir Studio
          </h1>
        </div>

        <div className="flex items-center gap-4 text-[15px]">
          {!checked ? null : authenticated && displayName ? (
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
          {authenticated && !fullPlaybackEnabled && (
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
