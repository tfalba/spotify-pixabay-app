import type { Track } from "../types/types";

export default function TrackCard({ track }: { track: Track }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border bg-white hover:shadow-sm">
      {track.image && (
        <img
          src={track.image}
          className="w-16 h-16 rounded-lg object-cover"
          alt="album art"
        />
      )}
      <div className="min-w-0">
        <div className="font-medium truncate">{track.name}</div>
        <div className="text-xs text-slate-500 truncate">{track.artists}</div>
      </div>
    </div>
  );
}
