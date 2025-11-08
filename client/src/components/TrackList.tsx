import type { Track } from "../types/types";

function TrackCard({
  track,
  selected = false,
}: {
  track: Track;
  selected?: boolean;
}) {
  const containerClasses = [
    "flex w-full items-center gap-4 rounded-2xl border p-1 pr-2 transition",
    selected
      ? "border-teal/70 border-4 bg-sapphire/70 shadow-glow"
      : "border-white/10 bg-sapphire/60 hover:border-teal/60 hover:bg-sapphire/70 hover:shadow-glow",
  ].join(" ");

  return (
    <div className={containerClasses}>
      {track.image && (
        <img
          src={track.image}
          // className={`h-16 w-16 rounded-xl object-cover shadow-inner ${
          //   selected ? "border-white/60" : "border-white/10"
          // }`}
          className={`h-16 w-16 rounded-xl object-cover shadow-inner`}
          alt="album art"
        />
      )}
      <div className="flex-1 min-w-0">
        <div className="truncate text-sm font-semibold text-white">
          {track.name}
        </div>

        <div className="truncate text-xs text-slate-300">
          {Array.isArray(track.artists)
            ? track.artists[0]?.name ?? ""
            : (track.artists as unknown as string)}
        </div>
      </div>
    </div>
  );
}

export default function TrackList({
  tracks,
  selectedTrackId,
  onPick,
}: {
  tracks: Track[];
  selectedTrackId: string | null;
  onPick: (track: Track) => void;
}) {
  return (
    <ul className="divide-y divide-white/5 overflow-hidden overflow-scroll rounded-2xl border border-white/10 bg-black/30 mt-6 shadow-inner">
      {tracks.map((t) => {
        const isSelected = selectedTrackId === t.id;
        return (
          <button
            key={t.id}
            onClick={() => onPick(t)}
            className={`flex w-full min-w-0 p-2 text-left rounded-2xl transition ${
              isSelected
                ? "border-amber/70 bg-white/10 shadow-glow"
                : "border-transparent bg-white/7 hover:border-teal/40 hover:bg-white/10"
            }`}
            type="button"
          >
            <TrackCard track={t} selected={isSelected} />
          </button>
        );
      })}
      {tracks.length === 0 && (
        <li className="p-4 text-center text-sm text-slate-400">No tracks</li>
      )}
    </ul>
  );
}

