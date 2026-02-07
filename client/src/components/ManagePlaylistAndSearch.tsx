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
import { samplePlaylist } from "@/data/samplePlaylists";

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
    [showCurrentPlaylist],
  );

  const sectionClass = useSectionClass(false, 1);

  const [searchTracksState, setSearchTracksState] = useState<Track[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const ctrlRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const hadQueryRef = useRef(false);
  const lastSearchIdRef = useRef(0);

  const [tracksState, dispatchTracks] = useReducer(
    tracksReducer,
    initialTracksState,
  );
  const [trackFilter, setTrackFilter] = useState(
    () => lastPanelState?.trackFilter ?? "",
  );
  const [sampleSelected, setSampleSelected] = useState(false);
  const [sampleTracksState, setSampleTracksState] = useState<Track[]>(() =>
    samplePlaylist.tracks.map(toTrack),
  );
  const [sampleLoading, setSampleLoading] = useState(false);

  const stopPlayback = useCallback(() => {
    pause().catch(() => {});
  }, [pause]);

  const search = useCallback(async (term: string) => {
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
  }, []);

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
    [playlists],
  );

  const applyFilter = useCallback((list: Track[], filter: string) => {
    const value = filter.trim().toLowerCase();
    if (!value) return list;
    return list.filter((track) => {
      const title = track.name?.toLowerCase() ?? "";
      const artist = Array.isArray(track.artists)
        ? track.artists.map((a) => a?.name?.toLowerCase() ?? "").join(" ")
        : ((track.artists as unknown as string)?.toLowerCase() ?? "");
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
    [applyFilter, tracksState.tracks, tracksState.tracksLoading],
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
    setSampleSelected(false);
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

  useEffect(() => {
    if (loggedIn) return;
    let active = true;
    const baseTracks = samplePlaylist.tracks;

    setSampleLoading(true);
    enrichMissingPreviews(baseTracks as SpotifyTrack[], { limit: 6 })
      .then((enriched) => {
        if (!active) return;
        setSampleTracksState((enriched ?? []).map(toTrack));
      })
      .catch(() => {
        if (!active) return;
        setSampleTracksState(baseTracks.map(toTrack));
      })
      .finally(() => {
        if (active) setSampleLoading(false);
      });

    return () => {
      active = false;
    };
  }, [loggedIn]);

  const handleSelect = useCallback(
    (playlist: SpotifyPlaylist) => {
      setTrackFilter("");
      dispatchTracks({ type: "reset" });
      setSelectedPlaylistId(playlist.id);
    },
    [setSelectedPlaylistId],
  );

  const handleBack = useCallback(() => {
    setSelectedPlaylistId(null);
    dispatchTracks({ type: "reset" });
    setTrackFilter("");
  }, [setSelectedPlaylistId]);

  const sampleFilteredTracks = useMemo(
    () => applyFilter(sampleTracksState, trackFilter),
    [applyFilter, sampleTracksState, trackFilter],
  );

  const sampleThumb = useMemo(() => {
    const images = samplePlaylist.images ?? [];
    return images[images.length - 1]?.url ?? images[0]?.url ?? "";
  }, []);

  return (
    <section className={clsx(sectionClass, "h-full min-h-0 gap-4")}>
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
                "flex-1 rounded-t-2xl px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] transition",
                activeMode === tab.key
                  ? "bg-emerald-300/90 text-slate-900 shadow-[0_12px_25px_rgba(16,185,129,0.3)]"
                  : "bg-white/5 text-white/60 hover:bg-white/10",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="text-[14px] mr-10 pl-2 text-white/60">
          {activeMode === "search"
            ? "Search tracks and play previews (or full playback if enabled)."
            : "Browse your Spotify playlists (login required)."}
        </div>
      </div>

      <div className="min-h-0 overflow-y-auto">
        {activeMode === "search" ? (
          <section
            className={clsx(
              "flex h-fit min-h-0 flex-col rounded-[24px] border border-white/10 bg-white/5 p-2 lg:p-3 text-white shadow-glow",
            )}
          >
            <div className="mb-1 py-2 flex flex-col md:flex-row items-start md:items-center justify-between md:justify-start gap-3 flex-wrap overflow-x-hidden">
              <div className="flex items-center gap-2">
                <h2
                  className={clsx(
                    "text-sm font-semibold uppercase tracking-[0.2em] text-slate-400",
                  )}
                >
                  Search
                </h2>
                <div className="flex items-center gap-2 rounded-2xl">
                  <input
                    ref={inputRef}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search Spotify tracks…"
                    className={clsx(
                      "w-full min-w-[15rem] max-w-lg rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-[15px] text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-300/50",
                    )}
                  />

                  {searchQuery && (
                    <button
                      type="button"
                      onClick={clearSearch}
                      className={clsx(
                        "group inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-emerald-200 shadow-[0_12px_25px_-18px_rgba(16,185,129,0.4)] transition duration-200 hover:-translate-y-0.5 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-200/60",
                      )}
                      aria-label="Clear search"
                    >
                      <span className="text-md font-semibold leading-none transition group-hover:rotate-90">
                        ×
                      </span>
                    </button>
                  )}
                </div>
              </div>
              <div className="flex-wrap space-y-2 flex flex-col md:flex-[2] md:flex-row w-auto gap-4 justify-end">
                {!loggedIn && (
                  <LoginButton betaSubmit={true} />
                )}

                {loggedIn && !fullPlaybackEnabled && (
                  <div className="flex items-center justify-end">
                    <button
                      type="button"
                      onClick={enableFullPlayback}
                      className={clsx(
                        "rounded-full border border-amber-400/40 bg-amber-400/15 px-3 py-1 text-xs uppercase tracking-[0.2em] text-amber-100",
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
                  "flex items-center gap-2 text-[14px] text-emerald-200",
                )}
              >
                <span
                  className={clsx(
                    "h-2 w-2 animate-ping rounded-full",
                    "bg-emerald-300",
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
              "flex h-fit min-h-0 flex-col gap-4 rounded-[24px] border border-white/10 bg-white/5 p-3 text-white",
            )}
          >
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2
                    className={clsx(
                      "flex-1 text-sm font-semibold uppercase tracking-[0.2em] text-slate-400",
                    )}
                  >
                    Manage Playlists
                    {!loggedIn && (
                      <span className="normal-case tracking-[0] group relative ml-2 inline-flex h-5 w-5 font-cursive items-center justify-center rounded-full border border-white/20 text-[12px] font-semibold text-white/70">
                        i
                        <span
                          role="tooltip"
                          className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 w-max max-w-[min(90vw,360px)] -translate-x-1/2 rounded-lg border border-white/10 bg-[#0a0f16] px-3 py-2 text-[14px] font-normal text-white/80 opacity-0 shadow-[0_14px_30px_rgba(15,23,42,0.45)] transition-opacity duration-200 group-hover:opacity-100 whitespace-normal break-words"
                        >
                          Sample playlist available while logged out.
                        </span>
                      </span>
                    )}
                  </h2>
                  {loggedIn ? (
                    <div className="flex flex-[2] justify-end gap-4">
                      {selected && (
                        <button
                          type="button"
                          onClick={() => {
                            handleBack();
                          }}
                          className="rounded-full border border-white/20 px-3 py-2 text-[11px] uppercase tracking-[0.2em] text-white/80 transition hover:border-white/40 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200/60"
                          role="menuitem"
                        >
                          ← Back
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => refresh().catch(() => {})}
                        className={clsx(
                          "rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-white/80 hover:border-white/30 hover:text-white",
                        )}
                      >
                        Sync
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>

              {!loggedIn ? (
                <LoginButton betaSubmit={true} />
              ) : (
                !fullPlaybackEnabled && (
                  <button
                    type="button"
                    onClick={enableFullPlayback}
                    className="rounded-full border border-amber-400/40 bg-amber-400/15 px-3 py-1 text-xs uppercase tracking-[0.2em] text-amber-100"
                  >
                    Enable full playback
                  </button>
                )
              )}
            </div>

            {!loggedIn ? (
              <div className="overflow-x-hidden">
                {sampleSelected ? (
                  <div className="mt-4 flex flex-1 min-h-0 flex-col gap-2">
                    <div className="relative flex flex-wrap items-start gap-3">
                      <div className="min-w-0 flex items-center gap-col-4 flex-wrap flex-1">
                        <div className="truncate text-base font-semibold">
                          {samplePlaylist.name}
                        </div>
                        <div className="truncate text-[14px] text-slate-400">
                          Sample playlist · {samplePlaylist.tracks.length}{" "}
                          tracks
                        </div>
                      </div>
                      <div className="ml-auto flex flex-[2.5] items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSampleSelected(false);
                            setTrackFilter("");
                          }}
                          className="rounded-full border border-white/20 px-3 py-2 text-[11px] uppercase tracking-[0.2em] text-white/80 transition hover:border-white/40 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200/60"
                        >
                          ← Back
                        </button>
                        <input
                          type="text"
                          value={trackFilter}
                          onChange={(e) => handleFilterChange(e.target.value)}
                          placeholder="Filter tracks..."
                          className={clsx(
                            "w-28 flex-2 mr-1 rounded-full border border-white/20 bg-white/5 px-3 py-1 text-[15px] text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/60",
                          )}
                        />
                      </div>
                    </div>

                    {sampleLoading ? (
                      <div className="flex flex-1 items-center justify-center text-[15px] text-slate-400">
                        Loading preview samples…
                      </div>
                    ) : (
                      <TrackList
                        tracks={sampleFilteredTracks}
                        queue={sampleTracksState}
                        twoColumnOnLarge={twoColumnOnLarge}
                      />
                    )}
                  </div>
                ) : (
                  <div
                    className={clsx(
                      "mt-4 grid flex-1 grid-cols-1 gap-4 pr-1",
                      compactPlaylistGrid
                        ? "lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3"
                        : "grid-cols-1 2xl:grid-cols-2",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => setSampleSelected(true)}
                      className={clsx(
                        "flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/30 p-4 text-left shadow-[0_14px_30px_rgba(88,92,107,0.55)] transition hover:border-emerald-300/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200/50",
                      )}
                    >
                      <div className="flex items-center gap-3">
                        {sampleThumb ? (
                          <img
                            src={sampleThumb}
                            alt=""
                            className="h-12 w-12 rounded-xl object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-amber-400 text-lg font-semibold text-slate-900">
                            {samplePlaylist.name.charAt(0)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="truncate text-[15px] font-semibold">
                            {samplePlaylist.name}
                          </div>
                          <div className="truncate text-[14px] text-slate-400">
                            Sample playlist · {samplePlaylist.tracks.length}{" "}
                            tracks
                          </div>
                        </div>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="overflow-x-hidden">
                {(playlistsError || tracksState.localError) && (
                  <div
                    className={clsx(
                      "rounded-2xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-[14px] text-red-200",
                    )}
                  >
                    {playlistsError ??
                      tracksState.localError ??
                      "Please try refreshing the page."}
                  </div>
                )}

                {playlistsLoading ? (
                  <div className="flex flex-1 items-center justify-center text-[15px] text-slate-400">
                    Loading playlists…
                  </div>
                ) : playlists.length === 0 && !selected ? (
                  <div className="flex flex-1 items-center justify-center text-[15px] text-slate-400">
                    No playlists found.
                  </div>
                ) : selected ? (
                  <div className="flex flex-1 min-h-0 flex-col gap-2">
                    <div className="relative flex flex-wrap items-start gap-3">
                      <div className="min-w-0 flex items-center gap-col-4 flex-wrap flex-1">
                        <div className="truncate text-base font-semibold">
                          {selected.name}
                        </div>
                        <div className="truncate text-[14px] text-slate-400">
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
                            "w-48 rounded-full border border-white/20 bg-white/5 px-3 py-1 text-[15px] text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/60",
                          )}
                        />
                      </div>
                    </div>

                    {tracksState.tracksError && (
                      <div
                        className={clsx(
                          "rounded-2xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-[14px] text-red-200",
                        )}
                      >
                        {tracksState.tracksError}
                      </div>
                    )}

                    {tracksState.tracksLoading ? (
                      <div className="flex flex-1 items-center justify-center text-[15px] text-slate-400">
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
                      "grid flex-1 grid-cols-1 gap-4 pr-1",

                      compactPlaylistGrid
                        ? "lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3"
                        : "grid-cols-1 2xl:grid-cols-2",
                    )}
                  >
                    {playlistItems.map(({ playlist, thumb }) => {
                      return (
                        <button
                          key={playlist.id}
                          type="button"
                          onClick={() => handleSelect(playlist)}
                          className={clsx(
                            "flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/30 p-4 text-left shadow-[0_14px_30px_rgba(88,92,107,0.55)] transition hover:border-emerald-300/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200/50",
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
                              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-amber-400 text-lg font-semibold text-slate-900">
                                {playlist.name.charAt(0)}
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="truncate text-[15px] font-semibold">
                                {playlist.name}
                              </div>
                              <div className="truncate text-[14px] text-slate-400">
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
