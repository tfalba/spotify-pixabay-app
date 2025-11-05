import React, { useEffect, useMemo, useState } from "react";
import { useSpotifyWebPlayback } from "../hooks/useSpotifyWebPlayback";

// Some safe test URIs to try
const TEST_TRACK = "spotify:track:4uLU6hMCjMI75M1A2tKUQC"; // Never Gonna Give You Up :)
const TEST_PLAYLIST = "spotify:playlist:37i9dQZF1DXcBWIGoYBM5M"; // Today's Top Hits (example, public)

export default function NowPlayingTestBar() {
  const {
    sdkReady,
    isConnected,
    deviceId,
    playerState,
    transferToThisDevice,
    playUris,
    playContext,
    pause,
    resume,
    nextTrack,
    previousTrack,
    seek,
    setVolume,
    toggleShuffle,
    setRepeat,
  } = useSpotifyWebPlayback();

  const [volume, setVolumeUI] = useState(0.8);
  const [position, setPositionUI] = useState(0);

  // Keep the position slider roughly in sync
  useEffect(() => {
    if (!playerState) return;
    setPositionUI(playerState.position || 0);
  }, [playerState?.position]);

  const trackName = useMemo(() => {
    const t = playerState?.track_window?.current_track;
    return t?.name || "—";
  }, [playerState]);

  const artistNames = useMemo(() => {
    const t = playerState?.track_window?.current_track;
    return t?.artists?.map((a) => a.name).join(", ") || "";
  }, [playerState]);

  const durationMs = playerState?.duration || 0;
  const paused = !!playerState?.paused;

  return (
    <div className="rounded-2xl border border-aurora/40 bg-sapphire/60 p-3 text-white space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="px-2 py-1 rounded bg-black/40">
          SDK: {sdkReady ? "ready" : "loading"}
        </span>
        <span className="px-2 py-1 rounded bg-black/40">
          Device: {deviceId || "—"}
        </span>
        <span className="px-2 py-1 rounded bg-black/40">
          Connected: {isConnected ? "yes" : "no"}
        </span>
      </div>

      <div className="text-sm">
        <div className="font-semibold">{trackName}</div>
        <div className="text-slate-300">{artistNames}</div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* 1) Transfer playback (do this once after the SDK is ready) */}
        <button
          className="rounded bg-teal px-3 py-1 text-xs font-semibold text-midnight"
          onClick={transferToThisDevice}
          disabled={!deviceId}
          title="Transfers playback to your browser 'Web Player (Dev)' device"
        >
          Connect Web Player
        </button>

        {/* 2) Play a single track */}
        <button
          className="rounded bg-accent px-3 py-1 text-xs font-semibold"
          onClick={() => playUris([TEST_TRACK])}
          disabled={!deviceId}
        >
          Play Test Track
        </button>

        {/* 3) Play a playlist context */}
        <button
          className="rounded bg-accent/70 px-3 py-1 text-xs font-semibold"
          onClick={() => playContext(TEST_PLAYLIST)}
          disabled={!deviceId}
        >
          Play Test Playlist
        </button>

        {/* Pause / Resume */}
        <button
          className="rounded bg-white/20 px-3 py-1 text-xs"
          onClick={paused ? resume : pause}
          disabled={!deviceId}
        >
          {paused ? "Resume" : "Pause"}
        </button>

        {/* Next / Previous */}
        <button
          className="rounded bg-white/20 px-3 py-1 text-xs"
          onClick={previousTrack}
          disabled={!deviceId}
        >
          ◀◀
        </button>
        <button
          className="rounded bg-white/20 px-3 py-1 text-xs"
          onClick={nextTrack}
          disabled={!deviceId}
        >
          ▶▶
        </button>
      </div>

      {/* Seek + Volume */}
      <div className="flex flex-wrap items-center gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-300">Seek:</span>
          <input
            type="range"
            min={0}
            max={durationMs || 1}
            step={1000}
            value={position}
            onChange={(e) => setPositionUI(Number(e.target.value))}
            onMouseUp={() => seek(position)}
            onTouchEnd={() => seek(position)}
          />
          <span className="w-14 text-right tabular-nums">
            {Math.floor((position / 1000) % 60)
              .toString()
              .padStart(2, "0")}
            s
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-300">Volume:</span>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={Math.round(volume * 100)}
            onChange={(e) => {
              const v = Number(e.target.value) / 100;
              setVolumeUI(v);
              setVolume(Math.round(v * 100)); // your server expects 0..100
            }}
          />
          <span className="w-12 text-right tabular-nums">
            {Math.round(volume * 100)}%
          </span>
        </div>
      </div>

      {/* Shuffle / Repeat */}
      <div className="flex items-center gap-2 text-xs">
        <button
          className="rounded bg-white/20 px-3 py-1"
          onClick={() => toggleShuffle(true)}
          disabled={!deviceId}
        >
          Shuffle ON
        </button>
        <button
          className="rounded bg-white/20 px-3 py-1"
          onClick={() => toggleShuffle(false)}
          disabled={!deviceId}
        >
          Shuffle OFF
        </button>

        <select
          className="rounded bg-black/40 px-2 py-1"
          defaultValue="off"
          onChange={(e) =>
            setRepeat(e.target.value as "off" | "track" | "context")
          }
          disabled={!deviceId}
        >
          <option value="off">Repeat: off</option>
          <option value="track">Repeat: track</option>
          <option value="context">Repeat: context</option>
        </select>
      </div>
    </div>
  );
}
