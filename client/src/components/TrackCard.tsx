import type { Track } from "../types/types";

export default function TrackCard({ track }: { track: Track }) {
  return (
    <div className="flex w-full items-center gap-4 rounded-2xl border border-white/10 bg-sapphire/60 p-3 pr-4 transition hover:border-teal/60 hover:bg-sapphire/70 hover:shadow-glow">
      {track.image && (
        <img
          src={track.image}
          className="h-16 w-16 rounded-xl border border-white/10 object-cover shadow-inner"
          alt="album art"
        />
      )}
      <div className="flex-1 min-w-0">
        <div className="truncate text-sm font-semibold text-white">
          {track.name}
        </div>

        <div className="truncate text-xs text-slate-300">
          {track.artists}
        </div>
      </div>
    </div>
  );
}
