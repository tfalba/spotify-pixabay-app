import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import clsx from "clsx";

import type { Track } from "@/types/types";
import { useTheme } from "@/context/ThemeContext";
import { useSectionsContext } from "@/context/SectionsContext";
import {
  useSpotifyPlayerActions,
  useSpotifyPlayerState,
} from "@/context/SpotifyPlayerProvider";
import {
  usePlaylistsActions,
  usePlaylistsData,
} from "@/context/PlaylistsContext";
import TrackList from "./TrackList";
import { LoginButton } from "./LoginButtons";
import {
  enrichMissingPreviews,
  searchTracks,
  type SpotifyPlaylist,
  type SpotifyTrack,
} from "@/lib/spotify";
import { useSectionClass } from "@/styleHooks/useStyleHooks";

type Props = {
  twoColumnOnLarge?: boolean;
  compactPlaylistGrid?: boolean;
};

type PanelSnapshot = {
  trackFilter: string;
};

type TracksState = {
  tracks: Track[];
  filteredTracks: Track[];
  tracksLoading: boolean;
  tracksError: string | null;
  localError: string | null;
};

type TracksAction =
  | { type: "reset" }
  | {
      type: "set_tracks";
      tracks: Track[];
      filtered: Track[];
      loading?: boolean;
    }
  | { type: "set_loading"; loading: boolean }
  | { type: "set_error"; message: string | null };

const initialTracksState: TracksState = {
  tracks: [],
  filteredTracks: [],
  tracksLoading: false,
  tracksError: null,
  localError: null,
};

function tracksReducer(state: TracksState, action: TracksAction): TracksState {
  switch (action.type) {
    case "reset":
      return {
        ...state,
        tracks: [],
        filteredTracks: [],
        tracksLoading: false,
        tracksError: null,
        localError: null,
      };
    case "set_tracks":
      return {
        ...state,
        tracks: action.tracks,
        filteredTracks: action.filtered,
        tracksLoading: action.loading ?? false,
        tracksError: null,
        localError: null,
      };
    case "set_loading":
      return { ...state, tracksLoading: action.loading };
    case "set_error":
      return {
        ...state,
        tracksError: action.message,
        localError: action.message,
        tracksLoading: false,
      };
    default:
      return state;
  }
}

let lastPanelState: PanelSnapshot | null = null;

function toTrack(t: any): Track {
  return {
    id: t.id,
    name: t.name,
    artists: (t.artists || []).map((a: any) => ({ name: a.name })),
    image:
      t.image ?? t.album?.images?.[1]?.url ?? t.album?.images?.[0]?.url ?? null,
    preview_url: t.preview_url ?? null,
    external_url: t.external_url ?? t.external_urls?.spotify ?? "",
    uri: t.uri ?? null,
    album: t.album ? { images: t.album.images ?? [] } : undefined,
  } as Track;
}

export default function ManagePlaylistAndSearch({
  twoColumnOnLarge = false,
  compactPlaylistGrid = false,
}: Props) {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const { showCurrentPlaylist, setShowCurrentPlaylist } = useSectionsContext();

  const {
    playlists,
    loading: playlistsLoading,
    error: playlistsError,
    selectedPlaylistId,
    playlistTracksCache,
    loggedIn,
  } = usePlaylistsData();
  const {
    refresh,
    setSelectedPlaylistId,
    clearSelectedPlaylist,
    refreshPlaylistTracks,
  } = usePlaylistsActions();

  const { fullPlaybackEnabled } = useSpotifyPlayerState();
  const { enableFullPlayback, pause } = useSpotifyPlayerActions();

  const activeMode = useMemo(
    () => (showCurrentPlaylist ? "playlists" : "search"),
    [showCurrentPlaylist]
  );

  const sectionClass = useSectionClass(isLight, 1);

  const [searchTracksState, setSearchTracksState] = useState<Track[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const ctrlRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const hadQueryRef = useRef(false);
  const lastSearchIdRef = useRef(0);

  const [tracksState, dispatchTracks] = useReducer(
    tracksReducer,
    initialTracksState
  );
  const [trackFilter, setTrackFilter] = useState(
    () => lastPanelState?.trackFilter ?? ""
  );

  const stopPlayback = useCallback(() => {
    pause().catch(() => {});
  }, [pause]);

  const search = useCallback(
    async (term: string) => {
      const trimmed = term.trim();
      if (!trimmed) return;

      if (ctrlRef.current) ctrlRef.current.abort();
      const ac = new AbortController();
      ctrlRef.current = ac;

      const requestId = ++lastSearchIdRef.current;

      setSearchLoading(true);
      try {
        const results = await searchTracks(trimmed, { signal: ac.signal });

        if (requestId !== lastSearchIdRef.current) return;

        const out: Track[] = (results ?? []).map(toTrack);
        setSearchTracksState(out);

        const enriched = await enrichMissingPreviews(results as SpotifyTrack[], {
          limit: 6,
          init: { signal: ac.signal },
        });

        if (requestId !== lastSearchIdRef.current) return;
        setSearchTracksState((enriched ?? []).map(toTrack));
      } catch (e: any) {
        if (e?.name === "AbortError") return;
        console.error(e);
        setSearchTracksState([]);
      } finally {
        if (requestId === lastSearchIdRef.current) setSearchLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    const trimmed = searchQuery.trim();
    const hasQuery = trimmed.length > 0;

    if (!hasQuery) {
      if (ctrlRef.current) ctrlRef.current.abort();
      setSearchTracksState([]);
      setSearchLoading(false);

      if (hadQueryRef.current) stopPlayback();
      hadQueryRef.current = false;
      return;
    }

    if (!hadQueryRef.current) {
      clearSelectedPlaylist();
    }
    hadQueryRef.current = true;

    const id = window.setTimeout(() => {
      search(trimmed).catch(() => {});
    }, 350);

    return () => window.clearTimeout(id);
  }, [searchQuery, clearSelectedPlaylist, search, stopPlayback]);

  function clearSearch() {
    if (ctrlRef.current) ctrlRef.current.abort();
    setSearchLoading(false);
    setSearchQuery("");
    setSearchTracksState([]);
    hadQueryRef.current = false;
    stopPlayback();
    inputRef.current?.focus();
  }

  const selected = useMemo(() => {
    if (!selectedPlaylistId) return null;
    return playlists.find((p) => p.id === selectedPlaylistId) ?? null;
  }, [playlists, selectedPlaylistId]);

  const playlistItems = useMemo(
    () =>
      playlists.map((playlist) => {
        const playlistImages = playlist.images ?? [];
        const thumb =
          playlistImages[playlistImages.length - 1]?.url ??
          playlistImages[0]?.url ??
          "";
        return {
          playlist,
          thumb,
        };
      }),
    [playlists]
  );

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
      dispatchTracks({
        type: "set_tracks",
        tracks: tracksState.tracks,
        filtered: applyFilter(tracksState.tracks, value),
        loading: tracksState.tracksLoading,
      });
    },
    [applyFilter, tracksState.tracks, tracksState.tracksLoading]
  );

  const cachedTracks = selectedPlaylistId
    ? playlistTracksCache[selectedPlaylistId]
    : undefined;

  useEffect(() => {
    return () => {
      lastPanelState = { trackFilter };
    };
  }, [trackFilter]);

  useEffect(() => {
    if (loggedIn) return;
    setSelectedPlaylistId(null);
    dispatchTracks({ type: "reset" });
    setTrackFilter("");
  }, [loggedIn, setSelectedPlaylistId]);

  useEffect(() => {
    let active = true;

    if (!loggedIn) {
      dispatchTracks({ type: "reset" });
      return () => {
        active = false;
      };
    }

    if (!selectedPlaylistId) {
      console.log('hitting no selected playlist', searchQuery.trim());
      dispatchTracks({ type: "reset" });
      return () => {
        active = false;
      };
    }

    if (!selected) {
      setSelectedPlaylistId(null);
      dispatchTracks({ type: "reset" });
      return () => {
        active = false;
      };
    }

    if (cachedTracks) {
      dispatchTracks({
        type: "set_tracks",
        tracks: cachedTracks,
        filtered: applyFilter(cachedTracks, trackFilter),
        loading: false,
      });
      return () => {
        active = false;
      };
    }

    dispatchTracks({ type: "reset" });
    dispatchTracks({ type: "set_loading", loading: true });

    refreshPlaylistTracks(selectedPlaylistId)
      .then((normalized) => {
        if (!active) return;
        dispatchTracks({
          type: "set_tracks",
          tracks: normalized,
          filtered: applyFilter(normalized, trackFilter),
          loading: false,
        });
      })
      .catch((e: any) => {
        if (!active) return;
        const message = e?.message ?? "Failed to load playlist tracks";
        dispatchTracks({ type: "set_error", message });
      })
      .finally(() => {
        if (active) dispatchTracks({ type: "set_loading", loading: false });
      });

    return () => {
      active = false;
    };
  }, [
    loggedIn,
    selectedPlaylistId,
    playlists,
    selected,
    cachedTracks,
    trackFilter,
    applyFilter,
    refreshPlaylistTracks,
    setSelectedPlaylistId,
  ]);

  const handleSelect = useCallback(
    (playlist: SpotifyPlaylist) => {
      setTrackFilter("");
      dispatchTracks({ type: "reset" });
      setSelectedPlaylistId(playlist.id);
    },
    [setSelectedPlaylistId]
  );

  const handleBack = useCallback(() => {
    setSelectedPlaylistId(null);
    dispatchTracks({ type: "reset" });
    setTrackFilter("");
  }, [setSelectedPlaylistId]);

  return (
    <section
      className={clsx(
        sectionClass, "flex h-full min-h-0 flex-col gap-4 rounded-3xl border p-3 shadow-xl",
        isLight
          ? "border-slate-200 bg-white/70"
          : "border-white/10 bg-black/20"
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-3">
          {[
            { key: "search" as const, label: "Search" },
            { key: "playlists" as const, label: "Playlists" },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setShowCurrentPlaylist(tab.key === "playlists")}
              className={clsx(
                "flex-1 rounded-t-xl px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] transition",
                activeMode === tab.key
                  ? isLight
                    ? "bg-teal/50 text-midnight"
                    : "bg-teal text-midnight"
                  : isLight
                  ? "bg-white/70 text-slate-500"
                  : "bg-white/10 text-white/60"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div
          className={clsx(
            "text-xs mr-10",
            isLight ? "text-slate-500" : "text-white/60"
          )}
        >
          {activeMode === "search"
            ? "Search tracks and play previews (or full playback if enabled)."
            : "Browse your Spotify playlists (login required)."}
        </div>
      </div>

      <div className="min-h-0 flex-1">
        {activeMode === "search" ? (
          <section
            className={clsx(
              "flex h-full min-h-0 flex-col gap-4 rounded-b-3xl p-2 bg-transparent",
              isLight ? " text-slate-700" : " text-white"
            )}
          >
            <div className="mb-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 flex-wrap">
              <h2
                className={clsx(
                  "text-sm font-semibold uppercase tracking-[0.2em]",
                  isLight ? "text-slate-500" : "text-slate-400"
                )}
              >
                Search
              </h2>

              <div className="flex-wrap space-y-2 flex flex-col md:flex-row w-full gap-4 justify-between">
                <div className="flex items-center gap-2 rounded-2xl shadow-glow">
                  <input
                    ref={inputRef}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search Spotify tracks…"
                    className={clsx(
                      "w-full min-w-[15rem] max-w-lg rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40",
                      isLight
                        ? "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400"
                        : "border-white/20 bg-gradient-to-br from-sapphire/90 via-sapphire to-sapphire/70 text-amber-100 placeholder:text-white/50"
                    )}
                  />

                  {searchQuery && (
                    <button
                      type="button"
                      onClick={clearSearch}
                      className={clsx(
                        "group inline-flex h-9 w-9 items-center justify-center rounded-full border border-transparent shadow-[0_12px_25px_-18px_rgba(251,191,36,0.9)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_35px_-16px_rgba(124,92,252,0.55)] focus:outline-none focus:ring-2 focus:ring-amber/50",
                        isLight ? "bg-teal/20 text-slate-900" : "text-teal"
                      )}
                      aria-label="Clear search"
                    >
                      <span className="text-md font-semibold leading-none transition group-hover:rotate-90">
                        ×
                      </span>
                    </button>
                  )}
                </div>

                {!loggedIn && (
                  <div
                    className={clsx(
                      "flex items-center justify-end gap-2 text-xs",
                      isLight ? "text-slate-600" : "text-white/70"
                    )}
                  >
                    <span className="flex-1">Log in for full playback access</span>
                    <LoginButton />
                  </div>
                )}

                {loggedIn && !fullPlaybackEnabled && (
                  <div className="flex items-center justify-end">
                    <button
                      type="button"
                      onClick={enableFullPlayback}
                      className={clsx(
                        "rounded-full px-3 py-1 text-xs uppercase tracking-[0.2em]",
                        isLight
                          ? "bg-slate-900 text-white"
                          : "bg-white/80 text-slate-900"
                      )}
                    >
                      Enable full playback
                    </button>
                  </div>
                )}
              </div>
            </div>

            {searchLoading ? (
              <div
                className={clsx(
                  "flex items-center gap-2 text-xs",
                  isLight ? "text-teal-600" : "text-teal"
                )}
              >
                <span
                  className={clsx(
                    "h-2 w-2 animate-ping rounded-full",
                    isLight ? "bg-teal-500" : "bg-teal"
                  )}
                />
                Searching Spotify…
              </div>
            ) : (
              <TrackList
                tracks={searchTracksState}
                twoColumnOnLarge={twoColumnOnLarge}
              />
            )}
          </section>
        ) : (
          <section
            className={clsx(
              "flex h-full min-h-0 flex-col gap-4 rounded-b-3xl p-2",
              isLight ? "bg-white/80 text-slate-700" : " bg-teal/5 text-white"
            )}
          >
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <h2
                    className={clsx(
                      "text-sm font-semibold uppercase tracking-[0.2em]",
                      isLight ? "text-slate-500" : "text-slate-400"
                    )}
                  >
                    Manage Playlists
                  </h2>
                  {loggedIn && (
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
                  )}
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-300 pt-2">
                  View your Spotify playlists like folders.
                </p>
              </div>

              {!loggedIn ? (
                <LoginButton />
              ) : (
                !fullPlaybackEnabled && (
                  <button onClick={enableFullPlayback}>Enable full playback</button>
                )
              )}
            </div>

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
                {(playlistsError || tracksState.localError) && (
                  <div
                    className={clsx(
                      "rounded-2xl border px-3 py-2 text-xs",
                      isLight
                        ? "border-red-200 bg-red-50 text-red-700"
                        : "border-red-500/30 bg-red-500/10 text-red-200"
                    )}
                  >
                    {playlistsError ??
                      tracksState.localError ??
                      "Please try refreshing the page."}
                </div>
              )}

                {playlistsLoading ? (
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

                    {tracksState.tracksError && (
                      <div
                        className={clsx(
                          "rounded-2xl border px-3 py-2 text-xs",
                          isLight
                            ? "border-red-200 bg-red-50 text-red-700"
                            : "border-red-500/30 bg-red-500/10 text-red-200"
                        )}
                      >
                        {tracksState.tracksError}
                      </div>
                    )}

                    {tracksState.tracksLoading ? (
                      <div className="flex flex-1 items-center justify-center text-sm text-slate-500 dark:text-slate-300">
                        Loading tracks…
                      </div>
                    ) : (
                      <TrackList
                        tracks={tracksState.filteredTracks}
                        queue={tracksState.tracks}
                        twoColumnOnLarge={twoColumnOnLarge}
                        sourcePlaylistId={selected?.id ?? ""}
                      />
                    )}
                  </div>
                ) : (
                  <div
                    className={clsx(
                      "grid flex-1 grid-cols-1 gap-4 overflow-y-auto pr-1",
                      compactPlaylistGrid ? "lg:grid-cols-2 xl:grid-cols-3" : "lg:grid-cols-2 xl:grid-cols-2"
                    )}
                  >
                    {playlistItems.map(({ playlist, thumb }) => {
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
        )}
      </div>
    </section>
  );
}
