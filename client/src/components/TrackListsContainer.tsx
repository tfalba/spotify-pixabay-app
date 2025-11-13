import SpotifySearch from "./SpotifySearch";
import PlaylistPicker from "./PlaylistPicker";
import type { Track } from "@/types/types";
import { useCallback, useState } from "react";
import TrackList from "./TrackList";
import clsx from "clsx";

export default function TracksListsContainer({
  onPick,
  selectedTrackId,
  handleQueueChange,
}: {
  onPick: (track: any) => void;
  selectedTrackId: string | null | undefined;
  handleQueueChange: (tracks: any[]) => void;
}) {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [activePanel, setActivePanel] = useState<"search" | "playlists">(
    "search"
  );

  const handleSetTracks = useCallback((nextTracks: Track[]) => {
    setTracks(nextTracks);
  }, []);

  return (
    <section className="xl:col-span-1 flex min-w-0 flex-col rounded-3xl border border-[amber]/80 p-4 shadow-glow max-h-[max(600px,calc(100vh-10rem))] overflow-hidden">
      <div className="flex items-center gap-3 pb-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-card-glow text-2xl text-accent shadow-glow">
          ♪
        </span>
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-slate-50">
            Discover Tracks
          </h2>
          <p className="text-sm text-slate-400">
            Search Spotify, view playlists, and set the tone.
          </p>
        </div>
      </div>

      <div className="mb-4 flex rounded-full border border-white/10 bg-white/5 p-1 text-xs font-semibold uppercase tracking-[0.2em]">
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
                : "text-white/60 hover:text-white"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="min-h-min flex-1 overflow-y-auto pr-1">
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
