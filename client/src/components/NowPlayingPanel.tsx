import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import backgroundLogo from "../assets/center-logo.svg";
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
    "relative overflow-hidden rounded-[28px] shadow-[0_24px_60px_rgba(2,6,23,0.55)] transition-transform duration-300",
    "bg-gradient-to-br from-[#0c1118] via-[#0d141c] to-emerald-400/15 before:absolute before:inset-0 before:-z-10 before:rounded-[32px] before:bg-gradient-to-br before:from-white/10 before:via-transparent before:to-amber-500/20 before:blur-3xl before:opacity-70 before:content-[''] hover:-translate-y-0.5"
  );

  const showPaused = paused && !isPreviewPlaying;

  return (
    <div className={wrapperClass}>
      <div
        className={clsx(
          "relative z-10 flex items-center justify-between overflow-hidden rounded-[24px] border p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] backdrop-blur-xl transition-colors duration-300",
          "border-white/10 bg-[#0a0f16]/80"
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
                "font-semibold text-sm truncate text-white"
              )}
            >
              {title}
            </div>
            <div
              className={clsx(
                "text-sm truncate text-slate-400"
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
                    "text-2xl text-white hover:text-emerald-200"
                  )}
                >
                  ▶️
                </button>
              ) : (
                <button
                  onClick={() => pause().catch(() => {})}
                  className={clsx(
                    "text-2xl text-white hover:text-emerald-200"
                  )}
                >
                  ⏸
                </button>
              )}
            </div>

            <h2
              className={clsx(
                "text-sm font-semibold uppercase tracking-[0.2em] text-slate-400"
              )}
            >
              Now Playing
            </h2>
          </div>

          {/* Seek bar (Spotify player only) */}
          <div className="flex items-center gap-2 px-2 pb-1">
            <span
              className={clsx(
                "w-10 text-right text-[11px] tabular-nums text-slate-400"
              )}
            >
              {formatTime(pos)}
            </span>

            <input
              type="range"
              className="w-full accent-emerald-300"
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
                "w-10 text-[11px] tabular-nums text-slate-400"
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
