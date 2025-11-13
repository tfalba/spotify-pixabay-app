import type { Track } from "../types/types";
import clsx from "clsx";
import { useTheme } from "@/context/ThemeContext";
import { useCurrentTrack } from "@/context/CurrentTrackContext";

type CardProps = {
  track: Track;
  selected?: boolean;
  isLight: boolean;
};

function TrackCard({ track, selected = false, isLight }: CardProps) {
  const containerClasses = clsx(
    "flex w-full items-center gap-4 rounded-2xl border p-1 pr-2 transition",
    selected
      ? isLight
        ? "border-teal/70 border-4 bg-sapphire/10 shadow-glow"
        : "border-teal/70 border-4 bg-sapphire/70 shadow-glow"
      : isLight
        ? "border-slate-200 bg-white hover:border-teal-500/40 hover:bg-slate-50"
        : "border-white/10 bg-sapphire/60 hover:border-teal/60 hover:bg-sapphire/70 hover:shadow-glow",
  );

  return (
    <div className={containerClasses}>
      {track.image && (
        <img
          src={track.image}
          className={`h-16 w-16 rounded-xl object-cover shadow-inner`}
          alt="album art"
        />
      )}
      <div className="flex-1 min-w-0">
        <div
          className={clsx(
            "truncate text-sm font-semibold",
            isLight ? "text-slate-900" : "text-white",
          )}
        >
          {track.name}
        </div>

        <div className={clsx("truncate text-xs", isLight ? "text-slate-600" : "text-slate-300")}>
          {Array.isArray(track.artists)
            ? track.artists[0]?.name ?? ""
            : (track.artists as unknown as string)}
        </div>
      </div>
    </div>
  );
}

export default function TrackList({ tracks }: { tracks: Track[] }) {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const { current, setCurrent } = useCurrentTrack();
  const selectedTrackId = current?.id ?? null;

  return (
    <ul
      className={clsx(
        "divide-y overflow-hidden overflow-scroll mt-6 shadow-inner rounded-2xl",
        isLight
          ? "divide-slate-200 border border-slate-200 bg-white"
          : "divide-white/5 bg-gradient-to-br from-teal/10 via-aurora/25 to-teal/40",
      )}
    >
      {tracks.map((t) => {
        const isSelected = selectedTrackId === t.id;
        return (
          <button
            key={t.id}
            onClick={() => setCurrent(t)}
            className={clsx(
              "flex w-full min-w-0 p-2 text-left rounded-2xl transition border",
              isSelected
                ? isLight
                  ? "border-amber/70 bg-white/70 shadow-glow"
                  : "border-amber/70 bg-white/10 shadow-glow"
                : isLight
                  ? "border-transparent bg-white hover:border-teal-500/30 hover:bg-slate-50"
                  : "border-transparent bg-white/5 hover:border-teal/40 hover:bg-white/10",
            )}
            type="button"
          >
            <TrackCard track={t} selected={isSelected} isLight={isLight} />
          </button>
        );
      })}
      {tracks.length === 0 && (
        <li className={clsx("p-4 text-center text-sm", isLight ? "text-slate-500" : "text-slate-400")}>
          No tracks
        </li>
      )}
    </ul>
  );
}
