import { useTheme } from "@/context/ThemeContext";
import {
  getAllPlaylistTracks,
  getAllUserPlaylists,
  type SpotifyPlaylist,
  type SpotifyTrack,
} from "@/lib/spotify";
import clsx from "clsx";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Track } from "@/types/types";
import TrackList from "./TrackList";

function mapSpotifyTrackToTrack(track: SpotifyTrack): Track {
  const albumImages = track.album?.images ?? [];
  const fallbackImage =
    albumImages[0]?.url ??
    albumImages[albumImages.length - 1]?.url ??
    track.image ??
    null;

  return {
    id: track.id,
    name: track.name,
    artists: track.artists ?? [],
    image: fallbackImage,
    preview_url: track.preview_url,
    external_url: track.external_url,
    uri: track.uri ?? null,
    album: { images: albumImages },
  };
}

type ManagePlaylistsPanelProps = {
  compactPlaylistGrid?: boolean;
  twoColumnOnLarge?: boolean;
  onTrackSelected?: (track: Track, queue: Track[]) => void;
  onMoveTrack: (
    trackId: string,
    playlistId: string,
    sourcePlaylistId: string
  ) => Promise<void>;
};

type PanelSnapshot = {
  playlists: SpotifyPlaylist[];
  selectedPlaylistId: string | null;
  tracks: Track[];
  trackCache: Record<string, Track[]>;
};

const restoreTracks = (raw?: Track[] | SpotifyTrack[]) =>
  (raw ?? []).map((entry) => mapSpotifyTrackToTrack(entry as SpotifyTrack));

const restoreCache = (raw?: Record<string, Track[] | SpotifyTrack[]>) => {
  if (!raw) return {};
  const entries = Object.entries(raw).map(([id, cached]) => [
    id,
    (cached as SpotifyTrack[]).map(mapSpotifyTrackToTrack),
  ]);
  return Object.fromEntries(entries);
};

let lastPanelState: PanelSnapshot | null = null;

function ManagePlaylistsPanel({
  compactPlaylistGrid = false,
  twoColumnOnLarge = false,
  onTrackSelected,
  onMoveTrack,
}: ManagePlaylistsPanelProps) {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>(
    () => lastPanelState?.playlists ?? []
  );
  const [loading, setLoading] = useState(
    () => !lastPanelState?.playlists?.length
  );
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(
    () => lastPanelState?.selectedPlaylistId ?? null
  );
  const [trackCache, setTrackCache] = useState<Record<string, Track[]>>(() =>
    restoreCache(
      lastPanelState?.trackCache as
        | Record<string, Track[] | SpotifyTrack[]>
        | undefined
    )
  );
  const [tracks, setTracks] = useState<Track[]>(() =>
    restoreTracks(lastPanelState?.tracks)
  );
  const [tracksLoading, setTracksLoading] = useState(false);
  const [tracksError, setTracksError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (playlists.length) {
      setLoading(false);
      return () => {
        active = false;
      };
    }
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
  }, [playlists.length]);

  const selected = useMemo(() => {
    if (!selectedId) return null;
    return playlists.find((p) => p.id === selectedId) ?? null;
  }, [playlists, selectedId]);

  useEffect(() => {
    return () => {
      lastPanelState = {
        playlists,
        selectedPlaylistId: selected ? selected.id : null,
        tracks,
        trackCache,
      };
    };
  }, [playlists, selected, tracks, trackCache]);

  const handleSelect = useCallback(
    async (playlist: SpotifyPlaylist) => {
      setSelectedId(playlist.id);
      setTracksError(null);
      const cached = trackCache[playlist.id];
      if (cached) {
        setTracks(cached);
        setTracksLoading(false);
        return;
      }
      setTracks([]);
      setTracksLoading(true);
      try {
        const ts = await getAllPlaylistTracks(playlist.id);
        const normalized = ts.map(mapSpotifyTrackToTrack);
        setTracks(normalized);
        setTrackCache((prev) => ({ ...prev, [playlist.id]: normalized }));
      } catch (e: any) {
        setTracksError(e?.message ?? "Failed to load playlist tracks");
      } finally {
        setTracksLoading(false);
      }
    },
    [trackCache]
  );

  const handleBack = useCallback(() => {
    setSelectedId(null);
    setTracks([]);
    setTracksError(null);
  }, []);

  const handleTrackSelect = useCallback(
    (track: Track) => {
      const queueTracks = tracks.length ? tracks : [track];
      onTrackSelected?.(track, queueTracks);
    },
    [onTrackSelected, tracks]
  );

  return (
    <section
      className={clsx(
        "flex h-full min-h-0 flex-col gap-4 rounded-b-3xl p-6",
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
            {" "}
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
          {/* {error} */}
          Please make sure you are logged in to Spotify or try refreshing the
          page.
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
            <TrackList
              tracks={tracks}
              onTrackSelected={handleTrackSelect}
              twoColumnOnLarge={twoColumnOnLarge}
              playlists={playlists}
              onMoveTrack={onMoveTrack}
              sourcePlaylistId={selected.id}
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
    </section>
  );
}
export default ManagePlaylistsPanel;
