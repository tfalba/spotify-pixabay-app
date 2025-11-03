import { useSpotifyWebPlayback } from "../hooks/useSpotifyWebPlayback";

export default function PlayerControls() {
  const {
    isConnected, deviceId, playerState,
    playUris, pause, resume, nextTrack, previousTrack, seek, setVolume
  } = useSpotifyWebPlayback();

  return (
    <div className="p-3 rounded-xl border bg-white text-sm">
      <div className="mb-2">
        {isConnected ? "Player connected" : "Connecting…"} {deviceId && `(${deviceId})`}
      </div>
      <div className="flex gap-2">
        <button onClick={() => previousTrack()} className="px-2 py-1 border rounded">Prev</button>
        <button onClick={() => pause()} className="px-2 py-1 border rounded">Pause</button>
        <button onClick={() => resume()} className="px-2 py-1 border rounded">Play</button>
        <button onClick={() => nextTrack()} className="px-2 py-1 border rounded">Next</button>
        <button
          onClick={() => playUris(["spotify:track:3AJwUDP919kvQ9QcozQPxg"])}
          className="px-2 py-1 border rounded"
        >Play “Hey Ya!”</button>
      </div>

      {playerState && (
        <div className="mt-2">
          <div>Track: {playerState.track_window.current_track.name}</div>
          <div>Pos: {playerState.position}ms</div>
          <button onClick={() => seek(playerState.position + 10000)} className="mt-1 px-2 py-1 border rounded">+10s</button>
          <button onClick={() => setVolume(30)} className="ml-2 px-2 py-1 border rounded">Vol 30%</button>
        </div>
      )}
    </div>
  );
}
