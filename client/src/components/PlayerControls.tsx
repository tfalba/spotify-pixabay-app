import clsx from "clsx";
import { useSpotifyWebPlayback } from "../hooks/useSpotifyWebPlayback";
import { useTheme } from "@/context/ThemeContext";

export default function PlayerControls() {
  const {
    isConnected, deviceId, playerState,
    playUris, pause, resume, nextTrack, previousTrack, seek, setVolume
  } = useSpotifyWebPlayback();
  const { theme } = useTheme();
  const isLight = theme === "light";
  const containerClass = clsx(
    "rounded-3xl border p-5 text-sm shadow-soft backdrop-blur transition-colors duration-300",
    isLight ? "border-slate-200 bg-white text-slate-800" : "border-white/10 bg-black/30 text-slate-200",
  );
  const badgeClass = clsx(
    "mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.25em]",
    isLight ? "text-slate-500" : "text-slate-500",
  );
  const baseButton = clsx(
    "rounded-full border px-3 py-1 transition",
    isLight
      ? "border-slate-200 bg-white text-slate-800 hover:border-teal-500/40 hover:bg-teal-50"
      : "border-white/10 bg-white/10 hover:border-teal/60 hover:bg-teal/20",
  );

  return (
    <div className={containerClass}>
      <div className={badgeClass}>
        <span
          className={clsx(
            "h-2 w-2 rounded-full animate-pulse",
            isConnected ? (isLight ? "bg-teal-500" : "bg-teal") : "bg-amber",
          )}
        />
        {isConnected ? "Player connected" : "Connecting…"} {deviceId && `(${deviceId})`}
      </div>
      <div className="flex flex-wrap gap-2">
        <button onClick={() => previousTrack()} className={baseButton}>Prev</button>
        <button onClick={() => pause()} className={baseButton}>Pause</button>
        <button onClick={() => resume()} className={baseButton}>Play</button>
        <button onClick={() => nextTrack()} className={baseButton}>Next</button>
        <button
          onClick={() => playUris(["spotify:track:3AJwUDP919kvQ9QcozQPxg"])}
          className={clsx(
            "rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide transition",
            isLight ? "border-amber-400 bg-amber/20 text-slate-900 hover:bg-amber/40" : "border-amber/80 bg-accent/30 text-white hover:bg-accent/60",
          )}
        >Play “Hey Ya!”</button>
      </div>

      {playerState && (
        <div className={clsx("mt-4 space-y-2 text-xs", isLight ? "text-slate-600" : "text-slate-400")}>
          <div className={clsx(isLight ? "text-slate-700" : "text-slate-300")}>
            Track: {playerState.track_window.current_track.name}
          </div>
          <div>Position: {playerState.position}ms</div>
          <div className="flex gap-2">
            <button onClick={() => seek(playerState.position + 10000)} className={baseButton}>+10s</button>
            <button onClick={() => setVolume(30)} className={baseButton}>Vol 30%</button>
          </div>
        </div>
      )}
    </div>
  );
}
