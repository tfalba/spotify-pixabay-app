import SpotifySearch from "./SpotifySearch";
import PlaylistPicker from "./PlaylistPicker";
import type { Track } from "@/types/types";
import { useCallback, useState } from "react";
import TrackList from "./TrackList";
import clsx from "clsx";
import { useTheme } from "@/context/ThemeContext";

export default function TracksListsContainer({
  onPick,
  selectedTrackId,
  handleQueueChange,
}: {
  onPick: (track: any) => void;
  selectedTrackId: string | null | undefined;
  handleQueueChange: (tracks: any[]) => void;
}) {
  const { theme } = useTheme();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [activePanel, setActivePanel] = useState<"search" | "playlists">(
    "search"
  );

  const handleSetTracks = useCallback((nextTracks: Track[]) => {
    setTracks(nextTracks);
  }, []);

  const isLight = theme === "light";
  const sectionClass = clsx(
    "xl:col-span-1 flex min-w-0 flex-col rounded-3xl border p-4 shadow-glow max-h-[max(600px,calc(100vh-10rem))] overflow-hidden transition-colors duration-300",
    isLight ? "border-slate-200 bg-white text-slate-900" : "border-[amber]/80 bg-black/30 text-slate-100",
  );

  return (
    <section className={sectionClass}>
      <div className="flex items-center gap-3 pb-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-card-glow text-2xl text-accent shadow-glow">
          ♪
        </span>
        <div>
          <h2
            className={clsx(
              "text-lg font-semibold tracking-tight",
              isLight ? "text-slate-900" : "text-slate-50",
            )}
          >
            Discover Tracks
          </h2>
          <p className={clsx("text-sm", isLight ? "text-slate-500" : "text-slate-400")}>
            Search Spotify, view playlists, and set the tone.
          </p>
        </div>
      </div>

      <div
        className={clsx(
          "mb-4 flex rounded-full border p-1 text-xs font-semibold uppercase tracking-[0.2em]",
          isLight ? "border-slate-200 bg-slate-100" : "border-white/10 bg-white/5",
        )}
      >
        {[
          { key: "search" as const, label: "Search" },
          { key: "playlists" as const, label: "Playlists" },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActivePanel(tab.key)}
            className={clsx(
              "flex-1 rounded-full px-3 py-1 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber",
              activePanel === tab.key
                ? "bg-teal text-midnight"
                : isLight
                  ? "text-slate-600 hover:text-slate-900"
                  : "text-white/60 hover:text-white",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="min-h-min max-h-fit flex-1 overflow-y-auto pr-1">
        {activePanel === "search" ? (
          <SpotifySearch onPick={onPick} onSetTracks={handleSetTracks} />
        ) : (
          <PlaylistPicker
            onPick={onPick}
            onQueueChange={handleQueueChange}
            onSetTracks={handleSetTracks}
          />
        )}
      </div>

      {tracks.length > 0 && (
        <TrackList
          tracks={tracks}
          selectedTrackId={selectedTrackId ?? null}
          onPick={(track) => onPick(track)}
        />
      )}
    </section>
  );
}
