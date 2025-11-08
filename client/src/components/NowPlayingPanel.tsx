import { useEffect, useRef, useState } from "react";
import { useSpotifyPlayerContext } from "../context/SpotifyPlayerProvider";
import backgroundLogo from "../assets/center-logo.svg";

function formatTime(ms = 0) {
  const sec = Math.floor(ms / 1000);
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function NowPlayingPanel({
  current,
  onTrackFinished,
}: {
  current: any;
  onTrackFinished?: () => void;
}) {
  const {
    sdkReady,
    isConnected,
    deviceId,
    playerState,
    playUris,
    pause,
    resume,
    seek,
  } = useSpotifyPlayerContext();

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

  useEffect(() => {
    if (!onTrackFinished) return;
    const currentUri =
      playerState?.track_window?.current_track?.uri ?? current?.uri ?? null;
    if (!currentUri || duration === 0) {
      finishedRef.current = null;
      return;
    }

    const position = playerState?.position ?? pos;
    const pausedState = playerState?.paused ?? false;
    const nearEnd = duration > 0 && duration - position <= 1200;
    const ended = pausedState && position === 0;

    if ((nearEnd || ended) && finishedRef.current !== currentUri) {
      finishedRef.current = currentUri;
      onTrackFinished();
    }

    if (!nearEnd && !ended && finishedRef.current === currentUri) {
      finishedRef.current = null;
    }
  }, [
    onTrackFinished,
    playerState?.paused,
    playerState?.position,
    playerState?.track_window?.current_track?.uri,
    duration,
    pos,
    current?.uri,
  ]);

  return (
    <div>
      {/* Controls row (small) */}

      <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
        Now Playing
      </h2>

      <div className="mt-3 overflow-hidden rounded-2xl border border-white/10 bg-black/40 shadow-inner">
        {/* Artwork + meta */}
        <div className="flex items-center gap-3 p-3">
          <img src={cover} alt="" className="h-16 w-16 rounded object-cover" />
          <div className="min-w-0 min-w-70 justify-end">
            <div className="flex justify-between gap-2">
              {title && <div className="truncate text-white">{title}</div>}
              <div className="mb-2 flex flex-wrap items-center gap-2 justify-end">
                {title?.length > 0 && (
                  <button
                    className="rounded-full bg-white/80 text-xs disabled:opacity-5 py-1 px-2 font-semibold text-midnight"
                    onClick={paused ? resume : pause}
                    disabled={!deviceId}
                  >
                    {paused ? ">" : "="}
                  </button>
                )}
              </div>
            </div>
            <div className="truncate text-slate-300 text-sm">{artists}</div>
            <div className="text-xs text-slate-400">
              {sdkReady ? "SDK ready" : "Loading SDK…"} ·{" "}
              {deviceId ? "Device detected" : "No device yet"}
            </div>
          </div>
        </div>

        {/* Seek bar */}
        <div className="flex items-center gap-2 px-3 pb-3">
          <span className="w-10 text-right text-[11px] tabular-nums text-slate-400">
            {formatTime(pos)}
          </span>
          <input
            type="range"
            className="w-full"
            min={0}
            max={Math.max(duration, 1)}
            step={1000}
            value={pos}
            onChange={(e) => setPos(Number(e.target.value))}
            onMouseUp={() => seek(pos)}
            onTouchEnd={() => seek(pos)}
            disabled={!deviceId}
          />
          <span className="w-10 text-[11px] tabular-nums text-slate-400">
            {formatTime(duration)}
          </span>
        </div>
      </div>
    </div>
  );
}
