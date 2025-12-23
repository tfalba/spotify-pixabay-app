import { useTheme } from "@/context/ThemeContext";
import { type SpotifyPlaylist } from "@/lib/spotify";
import clsx from "clsx";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Track } from "@/types/types";
import TrackList from "./TrackList";
import { LoginButton } from "./LoginButtons";
import { usePlaylists } from "@/context/PlaylistsContext";
import { useSpotifyPlayerContext } from "@/context/SpotifyPlayerProvider";
import { get } from "@/lib/fetcher";

type ManagePlaylistsPanelProps = {
  compactPlaylistGrid?: boolean;
  twoColumnOnLarge?: boolean;
};

type PanelSnapshot = {
  trackFilter: string;
};

type AuthStatus = { authenticated: boolean };

let lastPanelState: PanelSnapshot | null = null;

function ManagePlaylistsPanel({
  compactPlaylistGrid = false,
  twoColumnOnLarge = false,
}: ManagePlaylistsPanelProps) {
  const { theme } = useTheme();
  const isLight = theme === "light";

  const {
    playlists,
    loading,
    error,
    refresh,
    selectedPlaylistId,
    setSelectedPlaylistId,
    playlistTracksCache,
    refreshPlaylistTracks,
  } = usePlaylists();

  // NOTE: Under Option 1, isAuthenticated != "logged in".
  // Use cookie-based login status for gating playlist access.
  const { fullPlaybackEnabled, enableFullPlayback } = useSpotifyPlayerContext();

  const [loggedIn, setLoggedIn] = useState(false);

  const [tracks, setTracks] = useState<Track[]>([]);
  const [filteredTracks, setFilteredTracks] = useState<Track[]>([]);
  const [trackFilter, setTrackFilter] = useState(
    lastPanelState?.trackFilter ?? ""
  );
  const [tracksLoading, setTracksLoading] = useState(false);
  const [tracksError, setTracksError] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const API = import.meta.env.VITE_API_BASE ?? "";

  // ✅ cookie login status
  useEffect(() => {
    let active = true;

    async function loadStatus() {
      try {
        const status = await get<AuthStatus>(`${API}/api/auth/status`);
        if (active) setLoggedIn(Boolean(status?.authenticated));
      } catch {
        if (active) setLoggedIn(false);
      }
    }

    loadStatus();
    return () => {
      active = false;
    };
  }, [API]);

  const selected = useMemo(() => {
    if (!selectedPlaylistId) return null;
    return playlists.find((p) => p.id === selectedPlaylistId) ?? null;
  }, [playlists, selectedPlaylistId]);

  const applyFilter = useCallback((list: Track[], filter: string) => {
    const value = filter.trim().toLowerCase();
    if (!value) return list;
    return list.filter((track) => {
      const title = track.name?.toLowerCase() ?? "";
      const artist = Array.isArray(track.artists)
        ? track.artists.map((a) => a?.name?.toLowerCase() ?? "").join(" ")
        : (track.artists as unknown as string)?.toLowerCase() ?? "";
      return title.includes(value) || artist.includes(value);
    });
  }, []);

  const handleFilterChange = useCallback(
    (value: string) => {
      setTrackFilter(value);
      setFilteredTracks(applyFilter(tracks, value));
    },
    [applyFilter, tracks]
  );

  const cachedTracks = selectedPlaylistId
    ? playlistTracksCache[selectedPlaylistId]
    : undefined;

  useEffect(() => {
    return () => {
      lastPanelState = { trackFilter };
    };
  }, [trackFilter]);

  // If user logs out, reset local selection state
  useEffect(() => {
    if (loggedIn) return;
    setSelectedPlaylistId(null);
    setTracks([]);
    setFilteredTracks([]);
    setTrackFilter("");
    setTracksError(null);
    setLocalError(null);
    setTracksLoading(false);
  }, [loggedIn, setSelectedPlaylistId]);

  useEffect(() => {
    let active = true;

    // Gate playlist track loading by cookie login
    if (!loggedIn) {
      setTracks([]);
      setFilteredTracks([]);
      setTracksError(null);
      setLocalError(null);
      setTracksLoading(false);
      return () => {
        active = false;
      };
    }

    if (!selectedPlaylistId) {
      setTracks([]);
      setFilteredTracks([]);
      setTracksError(null);
      setLocalError(null);
      setTracksLoading(false);
      return () => {
        active = false;
      };
    }

    const playlist = playlists.find((p) => p.id === selectedPlaylistId);
    if (!playlist) {
      setSelectedPlaylistId(null);
      setTracks([]);
      setFilteredTracks([]);
      return () => {
        active = false;
      };
    }

    if (cachedTracks) {
      setTracks(cachedTracks);
      setFilteredTracks(applyFilter(cachedTracks, trackFilter));
      setTracksLoading(false);
      return () => {
        active = false;
      };
    }

    setTracks([]);
    setFilteredTracks([]);
    setTracksLoading(true);
    setTracksError(null);
    setLocalError(null);

    refreshPlaylistTracks(selectedPlaylistId)
      .then((normalized) => {
        if (!active) return;
        setTracks(normalized);
        setFilteredTracks(applyFilter(normalized, trackFilter));
      })
      .catch((e: any) => {
        if (!active) return;
        const message = e?.message ?? "Failed to load playlist tracks";
        setTracksError(message);
        setLocalError(message);
      })
      .finally(() => {
        if (active) setTracksLoading(false);
      });

    return () => {
      active = false;
    };
  }, [
    loggedIn,
    selectedPlaylistId,
    playlists,
    cachedTracks,
    trackFilter,
    applyFilter,
    refreshPlaylistTracks,
    setSelectedPlaylistId,
  ]);

  const handleSelect = useCallback(
    (playlist: SpotifyPlaylist) => {
      setTrackFilter("");
      setTracks([]);
      setFilteredTracks([]);
      setSelectedPlaylistId(playlist.id);
    },
    [setSelectedPlaylistId]
  );

  const handleBack = useCallback(() => {
    setSelectedPlaylistId(null);
    setTracks([]);
    setFilteredTracks([]);
    setTrackFilter("");
    setTracksError(null);
    setLocalError(null);
  }, [setSelectedPlaylistId]);


  return (
    <section
      className={clsx(
        "flex h-full min-h-0 flex-col gap-4 rounded-b-3xl p-2 pt-6",
        isLight ? "bg-white/80 text-slate-700" : " bg-white/5 text-white"
      )}
    >
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2
            className={clsx(
              "text-sm font-semibold uppercase tracking-[0.2em]",
              isLight ? "text-slate-500" : "text-slate-400"
            )}
          >
            Manage Playlists
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-300">
            View your Spotify playlists like folders. Organization tools coming
            soon.
          </p>
        </div>

        {!loggedIn ? (
          <LoginButton />
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => refresh().catch(() => {})}
              className={clsx(
                "rounded-full px-3 py-1 text-xs uppercase tracking-[0.2em]",
                isLight
                  ? "bg-slate-900 text-white"
                  : "bg-white/80 text-slate-900"
              )}
            >
              Sync
            </button>

            {!fullPlaybackEnabled && (
              <button onClick={enableFullPlayback}>Enable full playback</button>
            )}
          </div>
        )}
      </div>

      {/* Gate entire panel body by cookie login */}
      {!loggedIn ? (
        <div
          className={clsx(
            "rounded-2xl border px-4 py-3 text-sm",
            isLight
              ? "border-slate-200 bg-white text-slate-700"
              : "border-white/10 bg-black/30 text-white/80"
          )}
        >
          Log in to view and manage your playlists.
        </div>
      ) : (
        <div>
          {(error || localError) && (
            <div
              className={clsx(
                "rounded-2xl border px-3 py-2 text-xs",
                isLight
                  ? "border-red-200 bg-red-50 text-red-700"
                  : "border-red-500/30 bg-red-500/10 text-red-200"
              )}
            >
              {error ?? localError ?? "Please try refreshing the page."}
            </div>
          )}

          {loading ? (
            <div className="flex flex-1 items-center justify-center text-sm text-slate-500 dark:text-slate-300">
              Loading playlists…
            </div>
          ) : playlists.length === 0 && !selected ? (
            <div className="flex flex-1 items-center justify-center text-sm text-slate-500 dark:text-slate-300">
              No playlists found.
            </div>
          ) : selected ? (
            <div className="flex flex-1 min-h-0 flex-col gap-4">
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={handleBack}
                  className={clsx(
                    "rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.2em] transition focus-visible:outline-none focus-visible:ring-2",
                    isLight
                      ? "border-slate-200 text-slate-600 focus-visible:ring-slate-300"
                      : "border-white/30 text-white/80 focus-visible:ring-white"
                  )}
                >
                  ← Back
                </button>

                <div className="min-w-0">
                  <div className="truncate text-base font-semibold">
                    {selected.name}
                  </div>
                  <div className="truncate text-xs text-slate-500 dark:text-slate-300">
                    {selected.owner?.display_name
                      ? `by ${selected.owner.display_name} · `
                      : ""}
                    {selected.tracks?.total ?? 0} tracks
                  </div>
                </div>
                <div className="ml-auto">
                  <input
                    type="text"
                    value={trackFilter}
                    onChange={(e) => handleFilterChange(e.target.value)}
                    placeholder="Filter tracks..."
                    className={clsx(
                      "w-64 rounded-full border px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2",
                      isLight
                        ? "border-slate-200 bg-white text-slate-700 focus-visible:ring-teal-400"
                        : "border-white/20 bg-white/5 text-white focus-visible:ring-teal/70"
                    )}
                  />
                </div>
              </div>

              {tracksError && (
                <div
                  className={clsx(
                    "rounded-2xl border px-3 py-2 text-xs",
                    isLight
                      ? "border-red-200 bg-red-50 text-red-700"
                      : "border-red-500/30 bg-red-500/10 text-red-200"
                  )}
                >
                  {tracksError}
                </div>
              )}

              {tracksLoading ? (
                <div className="flex flex-1 items-center justify-center text-sm text-slate-500 dark:text-slate-300">
                  Loading tracks…
                </div>
              ) : (
                <TrackList
                  tracks={filteredTracks}
                  queue={tracks} // ✅ queue uses full track list (not just filtered)
                  twoColumnOnLarge={twoColumnOnLarge}
                  sourcePlaylistId={selected?.id ?? ""}
                />
              )}
            </div>
          ) : (
            <div
              className={clsx(
                "grid flex-1 grid-cols-1 gap-4 overflow-y-auto pr-1 md:grid-cols-2",
                compactPlaylistGrid ? "xl:grid-cols-2" : "xl:grid-cols-3"
              )}
            >
              {playlists.map((playlist) => {
                const playlistImages = playlist.images ?? [];
                const thumb =
                  playlistImages[playlistImages.length - 1]?.url ??
                  playlistImages[0]?.url ??
                  "";
                return (
                  <button
                    key={playlist.id}
                    type="button"
                    onClick={() => handleSelect(playlist)}
                    className={clsx(
                      "flex flex-col gap-3 rounded-2xl border p-4 text-left shadow-lg transition hover:border-teal-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal",
                      isLight
                        ? "border-slate-200 bg-white"
                        : "border-white/10 bg-black/30"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {thumb ? (
                        <img
                          src={thumb}
                          alt=""
                          className="h-12 w-12 rounded-xl object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 to-sky-600 text-lg font-semibold text-white">
                          {playlist.name.charAt(0)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold">
                          {playlist.name}
                        </div>
                        <div className="truncate text-xs text-slate-400 dark:text-slate-300">
                          {playlist.owner?.display_name
                            ? `by ${playlist.owner.display_name} · `
                            : ""}
                          {playlist.tracks?.total ?? 0} tracks
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export default ManagePlaylistsPanel;
