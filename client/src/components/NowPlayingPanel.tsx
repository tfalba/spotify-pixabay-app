import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import backgroundLogo from "../assets/center-logo.svg";
import { useTheme } from "@/context/ThemeContext";
import { useCurrentTrackData } from "@/context/CurrentTrackContext";
import {
  useSpotifyPlayerActions,
  useSpotifyPlayerState,
} from "../context/SpotifyPlayerProvider";

function formatTime(ms = 0) {
  const sec = Math.floor(ms / 1000);
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function NowPlayingPanel({ onTrackFinished }: { onTrackFinished?: () => void }) {
  const { current } = useCurrentTrackData();
  const { theme } = useTheme();
  const isLight = theme === "light";

  const { playerState, playbackPositionMs, isPreviewPlaying } =
    useSpotifyPlayerState();
  const { pause, seek, playTrackSmart } = useSpotifyPlayerActions();

  const [pos, setPos] = useState(0);
  const duration = playerState?.duration ?? 0;
  const paused = playerState?.paused ?? true;

  const cover =
    current?.album?.images?.[0]?.url || current?.image || backgroundLogo;
  const title = current?.name || "";
  const artists = Array.isArray(current?.artists)
    ? current.artists.map((a: { name: string }) => a.name).join(", ")
    : "";

  // Keep seek slider roughly in sync with Spotify player state (preview audio has its own timing)
  useEffect(() => {
    if (typeof playbackPositionMs === "number") setPos(playbackPositionMs);
  }, [playbackPositionMs]);

  useEffect(() => {
    if (!current) setPos(0);
  }, [current]);

  // ✅ Track finished logic (Spotify player only; preview doesn’t report position here)
  const finishedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!onTrackFinished) return;

    const currentUri =
      playerState?.track_window?.current_track?.uri ?? current?.uri ?? null;

    if (!currentUri || duration === 0) {
      finishedRef.current = null;
      return;
    }

    const position = playbackPositionMs ?? pos;
    const nearEnd = duration > 0 && duration - position <= 1200;
    const ended = paused && position === 0;

    if ((nearEnd || ended) && finishedRef.current !== currentUri) {
      finishedRef.current = currentUri;
      onTrackFinished();
    }

    if (!nearEnd && !ended && finishedRef.current === currentUri) {
      finishedRef.current = null;
    }
  }, [
    onTrackFinished,
    paused,
    playbackPositionMs,
    playerState?.track_window?.current_track?.uri,
    duration,
    pos,
    current?.uri,
  ]);

  const wrapperClass = clsx(
    "relative overflow-hidden rounded-[28px] shadow-[0_20px_60px_rgba(15,23,42,0.15)] transition-transform duration-300",
    isLight
      ? "bg-gradient-to-br from-white/40 via-lilac/30 to-amber/40 before:from-white/50 before:to-teal/40"
      : "bg-gradient-to-br from-slate-900 via-midnight/60 to-teal/40 before:from-white/20 before:to-sky-500/30",
    "before:absolute before:inset-0 before:-z-10 before:rounded-[32px] before:bg-gradient-to-br before:blur-3xl before:opacity-70 before:content-[''] hover:-translate-y-0.5"
  );

  const showPaused = paused && !isPreviewPlaying;

  return (
    <div className={wrapperClass}>
      <div
        className={clsx(
          "relative z-10 flex items-center justify-between overflow-hidden rounded-[24px] border p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] backdrop-blur-xl transition-colors duration-300",
          isLight ? "border-white/40 bg-white/80" : "border-white/10 bg-slate-900/70"
        )}
      >
        {/* Artwork + meta */}
        <div className="flex flex-1 min-w-0 items-center gap-3">
          <img
            src={cover}
            alt={title}
            className="h-12 w-12 rounded-xl object-cover shrink-0"
          />
          <div className="p-2 min-w-0 flex-1">
            <div
              className={clsx(
                "font-semibold text-sm truncate",
                isLight ? "text-slate-700" : "text-white"
              )}
            >
              {title}
            </div>
            <div
              className={clsx(
                "text-sm truncate",
                isLight ? "text-slate-400" : "text-white/80"
              )}
            >
              {artists}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col flex-1 min-w-0 items-center">
          <div className="flex items-center">
            <div className="flex items-center p-2 shrink-0">
              {showPaused ? (
                <button
                  onClick={() => {
                    if (!current) return;
                    playTrackSmart(current).catch(() => {});
                  }}
                  className={clsx(
                    "text-2xl",
                    isLight ? "text-slate-700 hover:text-teal-700" : "text-white hover:text-slate-300"
                  )}
                >
                  ▶️
                </button>
              ) : (
                <button
                  onClick={() => pause().catch(() => {})}
                  className={clsx(
                    "text-2xl",
                    isLight ? "text-slate-700 hover:text-teal-700" : "text-white hover:text-slate-300"
                  )}
                >
                  ⏸
                </button>
              )}
            </div>

            <h2
              className={clsx(
                "text-sm font-semibold uppercase tracking-[0.2em]",
                isLight ? "text-slate-500" : "text-slate-400"
              )}
            >
              Now Playing
            </h2>
          </div>

          {/* Seek bar (Spotify player only) */}
          <div className="flex items-center gap-2 px-2 pb-1">
            <span
              className={clsx(
                "w-10 text-right text-[11px] tabular-nums",
                isLight ? "text-slate-500" : "text-slate-400"
              )}
            >
              {formatTime(pos)}
            </span>

            <input
              type="range"
              className="w-full accent-teal-500"
              min={0}
              max={Math.max(duration, 1)}
              step={1000}
              value={pos}
              onChange={(e) => setPos(Number(e.target.value))}
              onMouseUp={() => seek(pos).catch(() => {})}
              onTouchEnd={() => seek(pos).catch(() => {})}
              disabled={!duration}
            />

            <span
              className={clsx(
                "w-10 text-[11px] tabular-nums",
                isLight ? "text-slate-500" : "text-slate-400"
              )}
            >
              {formatTime(duration)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
