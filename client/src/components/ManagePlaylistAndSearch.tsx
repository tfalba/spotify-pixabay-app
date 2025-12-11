import SpotifySearch from "./SpotifySearch";
import type { Track } from "@/types/types";
import { useCallback, useEffect, useState } from "react";
import TrackList from "./TrackList";
import clsx from "clsx";
import { useTheme } from "@/context/ThemeContext";
import { useCurrentTrack } from "@/context/CurrentTrackContext";
import { useSectionsContext } from "@/context/SectionsContext";
import { useSectionClass } from "@/styleHooks/useStyleHooks";
import ManagePlaylistsPanel from "./ManagePlaylistsPanel";

type ManagePlaylistsAndSearchProps = {
  compactPlaylistGrid?: boolean;
  soloExpanded?: boolean;
};

type DiscoverPanelSnapshot = {
  activePanel: "search" | "playlists";
  tracks: Track[];
};

let lastTrackSource: "search" | "playlists" | null = null;
let persistedDiscoverState: DiscoverPanelSnapshot | null = null;

export default function ManagePlaylistsAndSearch({ compactPlaylistGrid = false, soloExpanded = false }: ManagePlaylistsAndSearchProps) {
  const { theme } = useTheme();
  const { setCurrent, handleQueueChange } = useCurrentTrack();
  const { focusOnLyricsPanel } = useSectionsContext();
  const [tracks, setTracks] = useState<Track[]>(() => persistedDiscoverState?.tracks ?? []);
  const [activePanel, setActivePanel] = useState<"search" | "playlists">(
    () => persistedDiscoverState?.activePanel ?? lastTrackSource ?? "search",
  );

  const handleSetTracks = useCallback(
    (nextTracks: Track[]) => {
      setTracks(nextTracks);
    },
    [],
  );

  const handleSearchTrackSelected = useCallback(
    (track: Track) => {
      lastTrackSource = "search";
      setActivePanel("search");
      const queueTracks = tracks.length ? tracks : [track];
      handleQueueChange(queueTracks);
      setCurrent(track);
      focusOnLyricsPanel();
    },
    [focusOnLyricsPanel, handleQueueChange, setCurrent, tracks],
  );

  const handlePlaylistTrackSelected = useCallback(
    (track: Track, queue: Track[]) => {
      lastTrackSource = "playlists";
      setActivePanel("playlists");
      handleQueueChange(queue.length ? queue : [track]);
      setCurrent(track);
      focusOnLyricsPanel();
    },
    [focusOnLyricsPanel, handleQueueChange, setCurrent],
  );

  useEffect(() => {
    return () => {
      persistedDiscoverState = {
        activePanel,
        tracks,
      };
    };
  }, [activePanel, tracks]);

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

      <div className="max-h-max min-h-fit flex-1 overflow-y-auto pr-1">
        {activePanel === "search" ? (
          <SpotifySearch onSetTracks={handleSetTracks} />
        ) : (
          <ManagePlaylistsPanel
            compactPlaylistGrid={compactPlaylistGrid}
            twoColumnOnLarge={soloExpanded}
            onTrackSelected={handlePlaylistTrackSelected}
          />
        )}
      </div>

      {tracks.length > 0 && activePanel === "search" && (
        <TrackList
          tracks={tracks}
          onTrackSelected={handleSearchTrackSelected}
          twoColumnOnLarge={soloExpanded}
        />
      )}
    </section>
  );
}
