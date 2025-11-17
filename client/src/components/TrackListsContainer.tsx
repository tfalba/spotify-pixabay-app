import SpotifySearch from "./SpotifySearch";
import PlaylistPicker from "./PlaylistPicker";
import type { Track } from "@/types/types";
import { useCallback, useState } from "react";
import TrackList from "./TrackList";
import clsx from "clsx";
import { useTheme } from "@/context/ThemeContext";
import { useCurrentTrack } from "@/context/CurrentTrackContext";
import { useSpotifyPlayerContext } from "@/context/SpotifyPlayerProvider";
import { useSectionClass } from "@/styleHooks/useStyleHooks";

export default function TracksListsContainer({
  handleQueueChange,
}: {
  handleQueueChange: (tracks: Track[]) => void;
}) {
  const { theme } = useTheme();
  const { setCurrent } = useCurrentTrack();
  const { pause } = useSpotifyPlayerContext();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [activePanel, setActivePanel] = useState<"search" | "playlists">(
    "search"
  );

  const clearSelectionAndPause = useCallback(() => {
    setCurrent(null);
    pause().catch(() => {});
  }, [pause, setCurrent]);

  const handleSetTracks = useCallback(
    (nextTracks: Track[]) => {
      setCurrent(null);
      setTracks(nextTracks);
    },
    [setCurrent],
  );

  const isLight = theme === "light";
  const sectionClass = useSectionClass(isLight, 1);
 
  return (
    <section className={sectionClass}>
      <div className="flex items-center gap-3 pb-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-card-glow text-2xl text-slate shadow-glow">
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

      <div className="mb-4 flex rounded-full border p-1 text-xs font-semibold uppercase tracking-[0.2em] bg-white/5 border-white/10 dark:bg-white/5 dark:border-white/10">
        {[
          { key: "search" as const, label: "Search" },
          { key: "playlists" as const, label: "Playlists" },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => {
              if (activePanel === "playlists" && tab.key === "search") {
                clearSelectionAndPause();
              }
              setActivePanel(tab.key);
            }}
            className={clsx(
              "flex-1 rounded-full px-3 py-1 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber",
              activePanel === tab.key
                ? isLight ? "bg-teal/40 text-midnight" : "bg-teal text-midnight"
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
          <SpotifySearch onSetTracks={handleSetTracks} />
        ) : (
          <PlaylistPicker onQueueChange={handleQueueChange} onSetTracks={handleSetTracks} />
        )}
      </div>

      {tracks.length > 0 && (
        <TrackList tracks={tracks} />
      )}
    </section>
  );
}
