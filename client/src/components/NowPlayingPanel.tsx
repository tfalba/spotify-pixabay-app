import { useEffect, useState } from "react";
import { useSpotifyWebPlayback } from "../hooks/useSpotifyWebPlayback";
import backgroundPlayer from "../assets/IMG_4028.jpg";

function formatTime(ms = 0) {
  const sec = Math.floor(ms / 1000);
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function NowPlayingPanel({ current }: { current: any }) {
  const {
    sdkReady,
    isConnected,
    deviceId,
    playerState,
    transferToThisDevice,
    playUris,
    pause,
    resume,
    seek,
    setVolume,
  } = useSpotifyWebPlayback();

  const [pos, setPos] = useState(0);
  const duration = playerState?.duration ?? 0;
  const paused = playerState?.paused ?? true;

  // Derive display fields from `current` (your selected track)
  const trackUri =
    current?.uri || (current?.id ? `spotify:track:${current.id}` : undefined);
  const cover =
    current?.album?.images?.[0]?.url ||
    current?.image ||
    backgroundPlayer;
  const title = current?.name || "—";
  const artists = Array.isArray(current?.artists)
    ? current.artists.map((a: any) => a.name).join(", ")
    : "";

  // Keep seek slider roughly in sync with player
  useEffect(() => {
    if (typeof playerState?.position === "number") {
      setPos(playerState.position);
    }
  }, [playerState?.position]);

  // (Optional) Auto-play when the selected `current` changes and device is ready.
  // Comment this out if you prefer a manual "Play" button only.
  useEffect(() => {
    if (trackUri && deviceId && isConnected) {
      // user gesture already happened in smoke test flow; if not, show/require Connect button
      playUris([trackUri]).catch(() => {});
    }
  }, [trackUri, deviceId, isConnected, playUris]);

  return (
    <div>
      {/* Controls row (small) */}
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <button
          className="rounded bg-teal px-3 py-1 text-xs font-semibold text-midnight disabled:opacity-50"
          onClick={transferToThisDevice}
          disabled={!deviceId}
          title="Transfer playback to this browser device"
        >
          {isConnected ? "Connected" : "Connect Web Player"}
        </button>

        <button
          className="rounded bg-accent px-3 py-1 text-xs font-semibold disabled:opacity-50"
          onClick={() => trackUri && playUris([trackUri])}
          disabled={!deviceId || !trackUri}
        >
          Play
        </button>

        <button
          className="rounded bg-white/20 px-3 py-1 text-xs disabled:opacity-50"
          onClick={paused ? resume : pause}
          disabled={!deviceId}
        >
          {paused ? "Resume" : "Pause"}
        </button>

        {/* Volume quick buttons (optional) */}
        <div className="ml-2 flex items-center gap-1 text-xs">
          <button
            className="rounded bg-white/10 px-2 py-1"
            onClick={() => setVolume(20)}
            disabled={!deviceId}
          >
            Vol 20%
          </button>
          <button
            className="rounded bg-white/10 px-2 py-1"
            onClick={() => setVolume(60)}
            disabled={!deviceId}
          >
            60%
          </button>
          <button
            className="rounded bg-white/10 px-2 py-1"
            onClick={() => setVolume(100)}
            disabled={!deviceId}
          >
            100%
          </button>
        </div>
      </div>

      <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
        Now Playing
      </h2>

      <div className="mt-3 overflow-hidden rounded-2xl border border-white/10 bg-black/40 shadow-inner">
        {/* Artwork + meta */}
        <div className="flex items-center gap-3 p-3">
          <img
            src={cover}
            alt=""
            className="h-16 w-16 rounded object-cover"
          />
          <div className="min-w-0">
            <div className="truncate text-white">{title}</div>
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
