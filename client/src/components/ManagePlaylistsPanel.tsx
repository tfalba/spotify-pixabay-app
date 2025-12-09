import { useCurrentTrack } from "@/context/CurrentTrackContext";
import { useSectionsContext } from "@/context/SectionsContext";
import { useTheme } from "@/context/ThemeContext";
import { getAllPlaylistTracks, getAllUserPlaylists, type SpotifyPlaylist, type SpotifyTrack } from "@/lib/spotify";
import clsx from "clsx";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Track } from "@/types/types";

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
};

function ManagePlaylistsPanel({ compactPlaylistGrid = false }: ManagePlaylistsPanelProps) {
  const { theme } = useTheme();
  const { setCurrent, handleQueueChange } = useCurrentTrack();
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

  const playlistQueue = useMemo(() => tracks.map(mapSpotifyTrackToTrack), [tracks]);

  const handleTrackSelect = useCallback(
    (track: SpotifyTrack) => {
      const queueTracks = playlistQueue.length
        ? playlistQueue
        : [mapSpotifyTrackToTrack(track)];
      handleQueueChange(queueTracks);
      const nextCurrent =
        queueTracks.find((t) => t.id === track.id) ?? mapSpotifyTrackToTrack(track);
      setCurrent(nextCurrent);
      focusOnLyricsPanel();
    },
    [focusOnLyricsPanel, handleQueueChange, playlistQueue, setCurrent]
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
                        "flex flex-col gap-2 w-[5%] min-w-[max(146px,10%)] rounded-xl border p-3 text-left text-xs shadow-sm transition hover:border-teal-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal",
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
