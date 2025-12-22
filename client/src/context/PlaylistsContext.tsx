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
import { get } from "@/lib/fetcher";

type PlaylistsContextValue = {
  playlists: SpotifyPlaylist[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  setPlaylists: React.Dispatch<React.SetStateAction<SpotifyPlaylist[]>>;
  moveTrack: (
    trackId: string,
    sourcePlaylistId: string,
    targetPlaylistId: string
  ) => Promise<void>;

  /**
   * Keep both:
   * - loggedIn: cookie-based auth (true right after OAuth redirect)
   * - isAuthenticated: SDK token auth (Option 1: only true after "Enable full playback")
   */
  loggedIn: boolean;
  isAuthenticated: boolean;

  selectedPlaylistId: string | null;
  setSelectedPlaylistId: React.Dispatch<React.SetStateAction<string | null>>;
  clearSelectedPlaylist: () => void;

  currentPlaylistId: string | null;
  setCurrentPlaylistId: React.Dispatch<React.SetStateAction<string | null>>;

  playlistTracksCache: Record<string, Track[]>;
  refreshPlaylistTracks: (playlistId: string) => Promise<Track[]>;
};

type AuthStatus = { authenticated: boolean };

const PlaylistsContext = createContext<PlaylistsContextValue | undefined>(
  undefined
);

export function PlaylistsProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useSpotifyPlayerContext(); // SDK auth (not login)
  const [loggedIn, setLoggedIn] = useState(false); // cookie login

  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(
    null
  );
  const [currentPlaylistId, setCurrentPlaylistId] = useState<string | null>(
    null
  );
  const [playlistTracksCache, setPlaylistTracksCache] = useState<
    Record<string, Track[]>
  >({});

  const API = import.meta.env.VITE_API_BASE ?? "";

  // ✅ cookie login status (no token refresh)
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

  const clearAll = useCallback(() => {
    setPlaylists([]);
    setLoading(false);
    setError(null);
    setSelectedPlaylistId(null);
    setCurrentPlaylistId(null);
    setPlaylistTracksCache({});
  }, []);

  const refresh = useCallback(async () => {
    if (!loggedIn) {
      clearAll();
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
  }, [loggedIn, clearAll]);

  // Load playlists when logged in
  useEffect(() => {
    if (!loggedIn) {
      clearAll();
      return;
    }

    // If we just logged in and have no playlists yet, fetch
    if (!playlists.length) {
      refresh().catch(() => {});
    }
  }, [loggedIn, playlists.length, refresh, clearAll]);

  const refreshPlaylistTracks = useCallback(
    async (playlistId: string) => {
      if (!loggedIn || !playlistId) return [];

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
    [loggedIn]
  );

  const moveTrack = useCallback(
    async (
      trackId: string,
      sourcePlaylistId: string,
      targetPlaylistId: string
    ) => {
      if (!loggedIn) return;

      await moveTrackOnServer(trackId, sourcePlaylistId, targetPlaylistId);

      await Promise.all([
        sourcePlaylistId
          ? refreshPlaylistTracks(sourcePlaylistId).catch(() => null)
          : null,
        targetPlaylistId
          ? refreshPlaylistTracks(targetPlaylistId).catch(() => null)
          : null,
      ]);

      await refresh();
    },
    [loggedIn, refresh, refreshPlaylistTracks]
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

      loggedIn,
      isAuthenticated, // still exposed if you want to show SDK state in UI

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
      loggedIn,
      isAuthenticated,
      selectedPlaylistId,
      setSelectedPlaylistId,
      clearSelectedPlaylist,
      currentPlaylistId,
      setCurrentPlaylistId,
      playlistTracksCache,
      refreshPlaylistTracks,
    ]
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
