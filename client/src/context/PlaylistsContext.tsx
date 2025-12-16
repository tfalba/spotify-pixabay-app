import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  getAllPlaylistTracks,
  getAllUserPlaylists,
  type SpotifyPlaylist,
  type SpotifyTrack,
} from "@/lib/spotify";
import { moveTrackOnServer } from "@/lib/spotifyActions";
import { useSpotifyPlayerContext } from "./SpotifyPlayerProvider";
import type { Track } from "@/types/types";

type PlaylistsContextValue = {
  playlists: SpotifyPlaylist[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  setPlaylists: React.Dispatch<React.SetStateAction<SpotifyPlaylist[]>>;
  moveTrack: (
    trackId: string,
    sourcePlaylistId: string,
    targetPlaylistId: string,
  ) => Promise<void>;
  isAuthenticated: boolean;
  selectedPlaylistId: string | null;
  setSelectedPlaylistId: React.Dispatch<React.SetStateAction<string | null>>;
  clearSelectedPlaylist: () => void;
  currentPlaylistId: string | null;
  setCurrentPlaylistId: React.Dispatch<React.SetStateAction<string | null>>;
  playlistTracksCache: Record<string, Track[]>;
  refreshPlaylistTracks: (playlistId: string) => Promise<Track[]>;
};

const PlaylistsContext = createContext<PlaylistsContextValue | undefined>(
  undefined,
);

export function PlaylistsProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useSpotifyPlayerContext();
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [currentPlaylistId, setCurrentPlaylistId] = useState<string | null>(null);
  const [playlistTracksCache, setPlaylistTracksCache] = useState<Record<string, Track[]>>({});

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setPlaylists([]);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const pls = await getAllUserPlaylists();
      setPlaylists(pls);
      setError(null);
    } catch (err: any) {
      setError(err?.message ?? "Failed to load playlists");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      setPlaylists([]);
      setLoading(false);
      setError(null);
      setSelectedPlaylistId(null);
      setCurrentPlaylistId(null);
      return;
    }
    if (!playlists.length) {
      refresh().catch(() => {});
    }
  }, [isAuthenticated, playlists.length, refresh]);

  const refreshPlaylistTracks = useCallback(
    async (playlistId: string) => {
      if (!playlistId) return [];
      const tracks = await getAllPlaylistTracks(playlistId);
      const normalized = tracks.map((track: SpotifyTrack) => {
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
        } as Track;
      });
      setPlaylistTracksCache((prev) => ({ ...prev, [playlistId]: normalized }));
      return normalized;
    },
    [],
  );

  const moveTrack = useCallback(
    async (
      trackId: string,
      sourcePlaylistId: string,
      targetPlaylistId: string,
    ) => {
      await moveTrackOnServer(trackId, sourcePlaylistId, targetPlaylistId);
      await Promise.all([
        sourcePlaylistId ? refreshPlaylistTracks(sourcePlaylistId).catch(() => null) : null,
        targetPlaylistId ? refreshPlaylistTracks(targetPlaylistId).catch(() => null) : null,
      ]);
      await refresh();
    },
    [refresh, refreshPlaylistTracks],
  );

  const clearSelectedPlaylist = useCallback(() => {
    setSelectedPlaylistId(null);
  }, []);

  const value = useMemo(
    () => ({
      playlists,
      loading,
      error,
      refresh,
      setPlaylists,
      moveTrack,
      isAuthenticated,
      selectedPlaylistId,
      setSelectedPlaylistId,
      clearSelectedPlaylist,
      currentPlaylistId,
      setCurrentPlaylistId,
      playlistTracksCache,
      refreshPlaylistTracks,
    }),
    [
      playlists,
      loading,
      error,
      refresh,
      moveTrack,
      isAuthenticated,
      selectedPlaylistId,
      setSelectedPlaylistId,
      clearSelectedPlaylist,
      currentPlaylistId,
      setCurrentPlaylistId,
      playlistTracksCache,
      refreshPlaylistTracks,
    ],
  );

  return (
    <PlaylistsContext.Provider value={value}>
      {children}
    </PlaylistsContext.Provider>
  );
}

export function usePlaylists() {
  const ctx = useContext(PlaylistsContext);
  if (!ctx) {
    throw new Error("usePlaylists must be used within a PlaylistsProvider");
  }
  return ctx;
}
