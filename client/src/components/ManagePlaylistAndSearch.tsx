// client/src/components/ManagePlaylistAndSearch.tsx

import { useMemo, useState } from "react";
import clsx from "clsx";

import SpotifySearch from "./SpotifySearch";
import ManagePlaylistsPanel from "./ManagePlaylistsPanel";

import type { Track } from "@/types/types";
import { useTheme } from "@/context/ThemeContext";
import { useSectionsContext } from "@/context/SectionsContext";

type Props = {
  twoColumnOnLarge?: boolean;
  compactPlaylistGrid?: boolean;
};

export default function ManagePlaylistAndSearch({
  twoColumnOnLarge = false,
  compactPlaylistGrid = false,
}: Props) {
  const { theme } = useTheme();
  const isLight = theme === "light";

  const { showCurrentPlaylist, setShowCurrentPlaylist } =
    useSectionsContext();

  // Local state for SEARCH results only (playlists manage their own track list)
  const [searchTracks, setSearchTracks] = useState<Track[]>([]);

  const activeMode = useMemo(
    () => (showCurrentPlaylist ? "playlists" : "search"),
    [showCurrentPlaylist]
  );

  return (
    <section
      className={clsx(
        "flex h-full min-h-0 flex-col gap-4 rounded-3xl border p-3 shadow-xl",
        isLight
          ? "border-slate-200 bg-white/70"
          : "border-white/10 bg-black/20"
      )}
    >
      {/* Top toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowCurrentPlaylist(false)}
            className={clsx(
              "rounded-full px-3 py-1 text-xs uppercase tracking-[0.2em] transition",
              activeMode === "search"
                ? isLight
                  ? "bg-slate-900 text-white"
                  : "bg-white/90 text-slate-900"
                : isLight
                ? "bg-white text-slate-700 border border-slate-200"
                : "bg-white/5 text-white border border-white/10"
            )}
          >
            Search
          </button>

          <button
            type="button"
            onClick={() => setShowCurrentPlaylist(true)}
            className={clsx(
              "rounded-full px-3 py-1 text-xs uppercase tracking-[0.2em] transition",
              activeMode === "playlists"
                ? isLight
                  ? "bg-slate-900 text-white"
                  : "bg-white/90 text-slate-900"
                : isLight
                ? "bg-white text-slate-700 border border-slate-200"
                : "bg-white/5 text-white border border-white/10"
            )}
          >
            Playlists
          </button>
        </div>

        <div
          className={clsx(
            "text-xs",
            isLight ? "text-slate-500" : "text-white/60"
          )}
        >
          {activeMode === "search"
            ? "Search tracks and play previews (or full playback if enabled)."
            : "Browse your Spotify playlists (login required)."}
        </div>
      </div>

      {/* Body */}
      <div className="min-h-0 flex-1">
        {showCurrentPlaylist ? (
          <ManagePlaylistsPanel
            twoColumnOnLarge={twoColumnOnLarge}
            compactPlaylistGrid={compactPlaylistGrid}
          />
        ) : (
          <SpotifySearch
            tracks={searchTracks}
            onSetTracks={setSearchTracks}
            twoColumnOnLarge={twoColumnOnLarge}
          />
        )}
      </div>
    </section>
  );
}
