import type { Track } from "../types/types";

export default function TrackCard({
  track,
  selected = false,
}: {
  track: Track;
  selected?: boolean;
}) {
  const containerClasses = [
    "flex w-full items-center gap-4 rounded-2xl border p-1 pr-2 transition",
    selected
      ? "border-white/70 bg-sapphire/70 shadow-glow"
      : "border-white/10 bg-sapphire/60 hover:border-teal/60 hover:bg-sapphire/70 hover:shadow-glow",
  ].join(" ");

  return (
    <div className={containerClasses}>
      {track.image && (
        <img
          src={track.image}
          className={`h-16 w-16 rounded-xl object-cover shadow-inner ${
            selected ? "border border-white/60" : "border border-white/10"
          }`}
          alt="album art"
        />
      )}
      <div className="flex-1 min-w-0">
        <div className="truncate text-sm font-semibold text-white">
          {track.name}
        </div>

        <div className="truncate text-xs text-slate-300">
          {track.artists[0]?.name}
        </div>
      </div>
    </div>
  );
}
