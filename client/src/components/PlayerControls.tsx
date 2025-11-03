import { useSpotifyWebPlayback } from "../hooks/useSpotifyWebPlayback";

export default function PlayerControls() {
  const {
    isConnected, deviceId, playerState,
    playUris, pause, resume, nextTrack, previousTrack, seek, setVolume
  } = useSpotifyWebPlayback();

  return (
    <div className="rounded-3xl border border-white/10 bg-black/30 p-5 text-sm text-slate-200 shadow-soft backdrop-blur">
      <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-slate-500">
        <span className={`h-2 w-2 rounded-full ${isConnected ? "bg-teal" : "bg-amber"} animate-pulse`} />
        {isConnected ? "Player connected" : "Connecting…"} {deviceId && `(${deviceId})`}
      </div>
      <div className="flex flex-wrap gap-2">
        <button onClick={() => previousTrack()} className="rounded-full border border-white/10 bg-white/10 px-3 py-1 transition hover:border-teal/60 hover:bg-teal/20">Prev</button>
        <button onClick={() => pause()} className="rounded-full border border-white/10 bg-white/10 px-3 py-1 transition hover:border-teal/60 hover:bg-teal/20">Pause</button>
        <button onClick={() => resume()} className="rounded-full border border-white/10 bg-white/10 px-3 py-1 transition hover:border-teal/60 hover:bg-teal/20">Play</button>
        <button onClick={() => nextTrack()} className="rounded-full border border-white/10 bg-white/10 px-3 py-1 transition hover:border-teal/60 hover:bg-teal/20">Next</button>
        <button
          onClick={() => playUris(["spotify:track:3AJwUDP919kvQ9QcozQPxg"])}
          className="rounded-full border border-accent/60 bg-accent/30 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-accent/60"
        >Play “Hey Ya!”</button>
      </div>

      {playerState && (
        <div className="mt-4 space-y-2 text-xs text-slate-400">
          <div className="text-slate-300">Track: {playerState.track_window.current_track.name}</div>
          <div>Position: {playerState.position}ms</div>
          <div className="flex gap-2">
            <button onClick={() => seek(playerState.position + 10000)} className="rounded-full border border-white/10 bg-white/10 px-3 py-1 transition hover:border-teal/60 hover:bg-teal/20">+10s</button>
            <button onClick={() => setVolume(30)} className="rounded-full border border-white/10 bg-white/10 px-3 py-1 transition hover:border-teal/60 hover:bg-teal/20">Vol 30%</button>
          </div>
        </div>
      )}
    </div>
  );
}
