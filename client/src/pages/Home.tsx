import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import clsx from "clsx";
import LyricPlayerContainer from "../components/LyricPlayerContainer";
import PixabayGrid from "../components/PixabayGrid";
import TracksListsContainer from "@/components/TrackListsContainer";
import { useTheme } from "@/context/ThemeContext";
import { useCurrentTrack } from "@/context/CurrentTrackContext";
import type { KeywordPlan } from "@/hooks/useLyricsImages";
import type { HeroImage, ImageCard } from "@/api/lyricsTypes";
import type { StyleCategory } from "@/types/types";
import {
  getAllPlaylistTracks,
  getAllUserPlaylists,
  type SpotifyPlaylist,
  type SpotifyTrack,
} from "@/lib/spotify";

type Props = {
  pixabay: {
    images: ImageCard[] | null;
    keywords: KeywordPlan | null;
    loading: boolean;
    error: string | null;
    heroImage?: HeroImage | null;
    heroLoading?: boolean;
    styleChoice?: StyleCategory | "surprise";
    onStyleChange?: (choice: StyleCategory | "surprise") => void;
  };
  albumCover?: string | null;
};

type SectionActions = {
  focusOnLyricsPanel: () => void;
};

const SectionsContext = createContext<SectionActions | null>(null);

function useSectionsContext() {
  const ctx = useContext(SectionsContext);
  if (!ctx)
    throw new Error(
      "useSectionsContext must be used within SectionsContext.Provider"
    );
  return ctx;
}

export default function Home({ pixabay, albumCover }: Props) {
  const { theme } = useTheme();
  const isLightTheme = theme === "light";
  const { current, handleQueueChange } = useCurrentTrack();
  const [collapsed, setCollapsed] = useState<{
    tracks: boolean;
    lyrics: boolean;
    pixabay: boolean;
    manage: boolean;
  }>({
    tracks: false,
    lyrics: false,
    pixabay: false,
    manage: true,
  });

  const sectionMeta = useMemo(
    () => [
      {
        id: "tracks" as const,
        title: "Track Discovery",
        ratio: 27,
        render: () => (
          <TracksListsContainer handleQueueChange={handleQueueChange} />
        ),
      },
      {
        id: "manage" as const,
        title: "Manage Playlists",
        ratio: 42,
        render: () => <ManagePlaylistsPanel />,
      },
      {
        id: "lyrics" as const,
        title: "Lyrics",
        ratio: 27,
        render: () => (
          <LyricPlayerContainer />
        ),
      },
      {
        id: "pixabay" as const,
        title: "Visual Moodboard",
        ratio: 42,
        render: () => (
          <PixabayGrid
            images={pixabay.images}
            keywords={pixabay.keywords}
            loading={pixabay.loading}
            error={pixabay.error}
            heroImage={pixabay.heroImage ?? null}
            heroLoading={pixabay.heroLoading ?? false}
            styleChoice={pixabay.styleChoice ?? "surprise"}
            onStyleChange={pixabay.onStyleChange}
            noSelection={!current}
            albumCover={albumCover}
            trackTitle={current?.name ?? null}
            trackArtist={
              current?.artists
                ?.map((artist) => artist?.name)
                .filter(Boolean)
                .join(", ") || null
            }
          />
        ),
      },
    ],
    [
      albumCover,
      current,
      handleQueueChange,
      pixabay.error,
      pixabay.heroImage,
      pixabay.heroLoading,
      pixabay.images,
      pixabay.keywords,
      pixabay.loading,
      pixabay.onStyleChange,
      pixabay.styleChoice,
    ]
  );

  const activeSections = sectionMeta.filter(
    (section) => !collapsed[section.id]
  );
  const dynamicColumns =
    activeSections.length > 0
      ? activeSections.map((section) => `${section.ratio}fr`).join(" ")
      : undefined;

  const toggleSection = useCallback((id: keyof typeof collapsed) => {
    setCollapsed((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      if (id === "manage" && next.manage === false) {
        next.lyrics = true;
        next.pixabay = true;
      }
      return next;
    });
  }, []);

  const resetSections = useCallback(() => {
    setCollapsed({
      tracks: false,
      lyrics: false,
      pixabay: false,
      manage: true,
    });
  }, []);

  const focusOnLyricsPanel = useCallback(() => {
    setCollapsed((prev) => ({
      ...prev,
      manage: true,
      lyrics: false,
      pixabay: false,
    }));
  }, []);

  const mainClass = clsx(
    "relative md:mt-4 flex flex-1 flex-col gap-6 rounded-[32px] border md:p-2 ring-1 before:pointer-events-none before:absolute before:inset-0 before:rounded-[32px] before:opacity-80 before:blur before:content-[''] lg:grid",
    isLightTheme
      ? "border-slate-200 bg-lilac/15 text-slate-900 ring-white/40 before:bg-gradient-to-br before:from-white/50 before:via-transparent before:to-slate-100/60 shadow-[0_25px_80px_rgba(4,6,11,0.35)]"
      : "border-white/5 bg-gradient-to-br from-midnight/80 via-amber/5 to-sapphire/80 text-slate-100 ring-white/10 before:bg-gradient-to-br before:from-white/10 before:via-transparent before:to-white/5 shadow-[0_25px_80px_rgba(45,212,191,0.30)]"
  );

  return (
    <SectionsContext.Provider value={{ focusOnLyricsPanel }}>
      <main
        className={mainClass}
        style={
          dynamicColumns
            ? {
                gridTemplateColumns: dynamicColumns,
              }
            : undefined
        }
      >
        <div
          className={clsx(
            "lg:col-span-full flex flex-wrap items-center gap-3 rounded-3xl border px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] max-h-fit",
            isLightTheme
              ? "border-slate-200 bg-white/60 text-slate-700"
              : "border-white/20 bg-white/5 text-white/80"
          )}
        >
          {sectionMeta.map((section) => {
            const isCollapsed = collapsed[section.id];
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => toggleSection(section.id)}
                className={clsx(
                  "rounded-full px-3 py-1 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal",
                  isCollapsed
                    ? isLightTheme
                      ? "bg-white/90 text-slate-600"
                      : "bg-white/10 text-white"
                    : isLightTheme
                    ? "bg-teal/40 text-midnight"
                    : "bg-teal text-midnight"
                )}
              >
                {isCollapsed ? "Expand" : "Collapse"} {section.title}
              </button>
            );
          })}
          <button
            type="button"
            onClick={resetSections}
            className={clsx(
              "ml-auto rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.2em] transition focus-visible:outline-none focus-visible:ring-2",
              isLightTheme
                ? "border-slate-300 text-slate-600 hover:text-slate-900 focus-visible:ring-slate-400"
                : "border-white/30 text-white/80 hover:text-white focus-visible:ring-white"
            )}
          >
            Reset Layout
          </button>
        </div>

        {activeSections.length === 0 && (
          <div className="lg:col-span-full rounded-3xl border border-dashed border-white/20 p-6 text-center text-sm text-white/80 min-h-[calc(80vh-4rem)]">
            All sections are collapsed. Use the controls above to expand a
            panel.
          </div>
        )}

        {sectionMeta.map((section) => {
          const isCollapsed = collapsed[section.id];
          if (isCollapsed) return null;

          return (
            <div
              key={section.id}
              className="relative md:min-h-[calc(80vh-4rem)]"
            >
              <button
                type="button"
                onClick={() => toggleSection(section.id)}
                className={clsx(
                  "absolute right-4 top-4 z-10 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] transition focus-visible:outline-none focus-visible:ring-2",
                  isLightTheme
                    ? "border-slate-200 bg-white/80 text-slate-600 hover:bg-white focus-visible:ring-slate-400"
                    : "border-white/30 bg-black/40 text-white hover:bg-black/60 focus-visible:ring-white"
                )}
              >
                Collapse
              </button>
              {section.render()}
            </div>
          );
        })}
      </main>
    </SectionsContext.Provider>
  );
}

function ManagePlaylistsPanel() {
  const { theme } = useTheme();
  const { setCurrent } = useCurrentTrack();
  const { focusOnLyricsPanel } = useSectionsContext();
  const isLight = theme === "light";
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<SpotifyPlaylist | null>(null);
  const [tracks, setTracks] = useState<SpotifyTrack[]>([]);
  const [tracksLoading, setTracksLoading] = useState(false);
  const [tracksError, setTracksError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
        const pls = await getAllUserPlaylists();
        if (!active) return;
        setPlaylists(pls);
      } catch (e: any) {
        if (!active) return;
        setError(e?.message ?? "Failed to load playlists");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const handleSelect = useCallback(async (playlist: SpotifyPlaylist) => {
    setSelected(playlist);
    setTracks([]);
    setTracksError(null);
    setTracksLoading(true);
    try {
      const ts = await getAllPlaylistTracks(playlist.id);
      setTracks(ts);
    } catch (e: any) {
      setTracksError(e?.message ?? "Failed to load playlist tracks");
    } finally {
      setTracksLoading(false);
    }
  }, []);

  const handleBack = useCallback(() => {
    setSelected(null);
    setTracks([]);
    setTracksError(null);
  }, []);

  const handleTrackSelect = useCallback(
    (track: SpotifyTrack) => {
      const albumImages = track.album?.images ?? [];
      const fallbackImage =
        albumImages[0]?.url ??
        albumImages[albumImages.length - 1]?.url ??
        track.image ??
        null;
      setCurrent({
        id: track.id,
        name: track.name,
        artists: track.artists ?? [],
        image: fallbackImage,
        preview_url: track.preview_url,
        external_url: track.external_url,
        uri: track.uri ?? null,
        album: { images: albumImages },
      });
      focusOnLyricsPanel();
    },
    [focusOnLyricsPanel, setCurrent]
  );

  return (
    <section
      className={clsx(
        "flex h-full min-h-0 flex-col gap-4 rounded-3xl border p-6",
        isLight
          ? "border-slate-200 bg-white/80 text-slate-700"
          : "border-white/10 bg-white/5 text-white"
      )}
    >
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            Manage Playlists
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-300">
            View your Spotify playlists like folders. Organization tools coming
            soon.
          </p>
        </div>
        <button
          type="button"
          className={clsx(
            "rounded-full px-3 py-1 text-xs uppercase tracking-[0.2em]",
            isLight ? "bg-slate-900 text-white" : "bg-white/80 text-slate-900"
          )}
        >
          Sync
        </button>
      </div>

      {error && (
        <div
          className={clsx(
            "rounded-2xl border px-3 py-2 text-xs",
            isLight
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-red-500/30 bg-red-500/10 text-red-200"
          )}
        >
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-1 items-center justify-center text-sm text-slate-500 dark:text-slate-300">
          Loading playlists…
        </div>
      ) : playlists.length === 0 ? (
        <div className="flex flex-1 items-center justify-center text-sm text-slate-500 dark:text-slate-300">
          No playlists found.
        </div>
      ) : selected ? (
        <div className="flex flex-1 min-h-0 flex-col gap-4">
          <div className="flex items-center gap-3">
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
            <div className="flex-1 min-h-0 overflow-y-auto pr-1">
              <div className="flex flex-wrap gap-2">
                {tracks.map((track) => {
                  const albumImages = track.album?.images ?? [];
                  const thumb =
                    albumImages[albumImages.length - 1]?.url ??
                    albumImages[0]?.url ??
                    track.image ??
                    "";
                  return (
                    <button
                      key={track.id}
                      type="button"
                      onClick={() => handleTrackSelect(track)}
                      className={clsx(
                        "flex flex-col gap-2 w-[140px] rounded-xl border p-3 text-left text-xs shadow-sm transition hover:border-teal-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal",
                        isLight
                          ? "border-slate-200 bg-white"
                          : "border-white/10 bg-black/40"
                      )}
                    >
                      {thumb ? (
                        <img
                          src={thumb}
                          alt=""
                          className="h-24 w-full rounded-lg object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-24 items-center justify-center rounded-lg bg-gradient-to-br from-teal-400 to-sky-600 text-white">
                          {track.name.charAt(0)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="truncate font-semibold text-sm">
                          {track.name}
                        </div>
                        <div className="truncate text-[11px] text-slate-500 dark:text-slate-300">
                          {(track.artists ?? []).map((a) => a.name).join(", ")}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="grid flex-1 grid-cols-1 gap-4 overflow-y-auto pr-1 md:grid-cols-2 xl:grid-cols-3">
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
    </section>
  );
}
