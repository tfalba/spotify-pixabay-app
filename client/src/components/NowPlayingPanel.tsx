import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { useSpotifyPlayerContext } from "../context/SpotifyPlayerProvider";
import backgroundLogo from "../assets/center-logo.svg";
import { useTheme } from "@/context/ThemeContext";
import { useCurrentTrack } from "@/context/CurrentTrackContext";

function formatTime(ms = 0) {
  const sec = Math.floor(ms / 1000);
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function NowPlayingPanel({
  onTrackFinished,
}: {
  onTrackFinished?: () => void;
}) {
  const {
    isConnected,
    deviceId,
    playerState,
    playUris,
    resumeOrStart,
    pause,
    seek,
  } = useSpotifyPlayerContext();
  const { current } = useCurrentTrack();

  const [pos, setPos] = useState(0);
  const duration = playerState?.duration ?? 0;
  const paused = playerState?.paused ?? true;

  // Derive display fields from `current` (your selected track)
  const trackUri =
    current?.uri || (current?.id ? `spotify:track:${current.id}` : undefined);

  const cover =
    current?.album?.images?.[0]?.url || current?.image || backgroundLogo;
  const title = current?.name || "";
  const artists = Array.isArray(current?.artists)
    ? current.artists.map((a: any) => a.name).join(", ")
    : "";

  // Keep seek slider roughly in sync with player
  useEffect(() => {
    if (typeof playerState?.position === "number") {
      setPos(playerState.position);
    }
  }, [playerState?.position]);

  useEffect(() => {
    if (!current) {
      setPos(0);
      return;
    }
  }, [current?.id]);

  // (Optional) Auto-play when the selected `current` changes and device is ready.
  // Comment this out if you prefer a manual "Play" button only.
  useEffect(() => {
    if (trackUri && deviceId && isConnected) {
      // user gesture already happened in smoke test flow; if not, show/require Connect button
      playUris([trackUri]).catch(() => {});
    }
  }, [trackUri, deviceId, isConnected, playUris]);

  const finishedRef = useRef<string | null>(null);
  const { theme } = useTheme();
  const isLight = theme === "light";

  useEffect(() => {
    if (!onTrackFinished) return;
    const currentUri =
      playerState?.track_window?.current_track?.uri ?? current?.uri ?? null;
    if (!currentUri || duration === 0) {
      finishedRef.current = null;
      return;
    }

    const position = playerState?.position ?? pos;
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
    playerState?.position,
    playerState?.track_window?.current_track?.uri,
    duration,
    pos,
    current?.uri,
  ]);

  return (
    <div>
      {/* Controls row (small) */}

      <h2
        className={clsx(
          "text-sm font-semibold uppercase tracking-[0.2em]",
          isLight ? "text-slate-500" : "text-slate-400"
        )}
      >
        Now Playing
      </h2>

      <div
        className={clsx(
          "mt-3 overflow-hidden rounded-2xl border shadow-inner transition-colors duration-300",
          isLight ? "border-slate-200 bg-white" : "border-white/10 bg-black/40"
        )}
      >
        {/* Artwork + meta */}
       <div className="flex items-center justify-between p-3">
  <div className="flex flex-1 min-w-0 items-center gap-3">
    <img
      src={cover}
      alt={title}
      className="h-16 w-16 rounded-xl object-cover shrink-0"
    />
    <div className="p-2 min-w-0 flex-1">
      <div
        className={clsx(
          "font-semibold text-sm truncate",
          isLight ? "text-slate-700" : "text-white"  // note: "text-slate" isn't a valid class
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

  <div className="flex items-center p-4 shrink-0">
    {paused ? (
      <button
        onClick={() => {
          if (!trackUri || !deviceId) return;
          resumeOrStart({ uris: [trackUri] }).catch(() => {});
        }}
        className="text-white text-2xl hover:text-slate-300"
      >
        ▶️
      </button>
    ) : (
      <button
        onClick={pause}
        className={clsx(
          "text-2xl",
          isLight ? "text-slate-700 hover:text-teal-700"
                  : "text-white hover:text-slate-300"
        )}
      >
        ⏸
      </button>
    )}
  </div>
</div>

        {/* Seek bar */}
        <div className="flex items-center gap-2 px-3 pb-3">
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
            className={clsx(
              "w-full accent-teal-500",
              isLight ? "bg-transparent" : "bg-transparent"
            )}
            min={0}
            max={Math.max(duration, 1)}
            step={1000}
            value={pos}
            onChange={(e) => setPos(Number(e.target.value))}
            onMouseUp={() => seek(pos)}
            onTouchEnd={() => seek(pos)}
            disabled={!deviceId}
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
  );
}
