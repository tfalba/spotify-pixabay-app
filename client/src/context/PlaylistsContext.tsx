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
import {
  useSpotifyPlayerActions,
  useSpotifyPlayerState,
} from "./SpotifyPlayerProvider";
import type { Track } from "@/types/types";
import { getAuthStatus } from "@/lib/spotifyApi";

type PlaylistsData = {
  playlists: SpotifyPlaylist[];
  loading: boolean;
  error: string | null;
  moveTrack: (
    trackId: string,
    sourcePlaylistId: string,
    targetPlaylistId: string
  ) => Promise<void>;

  loggedIn: boolean;

  selectedPlaylistId: string | null;
  setSelectedPlaylistId: React.Dispatch<React.SetStateAction<string | null>>;
  clearSelectedPlaylist: () => void;

  currentPlaylistId: string | null;
  setCurrentPlaylistId: React.Dispatch<React.SetStateAction<string | null>>;

  playlistTracksCache: Record<string, Track[]>;
};

type PlaylistsActions = {
  refresh: () => Promise<void>;
  moveTrack: (
    trackId: string,
    sourcePlaylistId: string,
    targetPlaylistId: string
  ) => Promise<void>;
  refreshPlaylistTracks: (playlistId: string) => Promise<Track[]>;
  setSelectedPlaylistId: React.Dispatch<React.SetStateAction<string | null>>;
  clearSelectedPlaylist: () => void;
  setCurrentPlaylistId: React.Dispatch<React.SetStateAction<string | null>>;
};

const PlaylistsDataContext = createContext<PlaylistsData | undefined>(
  undefined
);
const PlaylistsActionsContext = createContext<PlaylistsActions | undefined>(
  undefined
);

export function PlaylistsProvider({ children }: { children: ReactNode }) {
  const { fullPlaybackEnabled } = useSpotifyPlayerState();
  const { enableFullPlayback } = useSpotifyPlayerActions();
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

  // ✅ cookie login status (no token refresh)
  useEffect(() => {
    let active = true;

    async function loadStatus() {
      try {
        const status = await getAuthStatus();
        if (active) setLoggedIn(Boolean(status?.authenticated));
      } catch {
        if (active) setLoggedIn(false);
      }
    }

    loadStatus();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!loggedIn || fullPlaybackEnabled) return;
    enableFullPlayback().catch(() => {});
  }, [loggedIn, fullPlaybackEnabled, enableFullPlayback]);

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

  const data = useMemo<PlaylistsData>(
    () => ({
      playlists,
      loading,
      error,
      moveTrack,

      loggedIn,

      selectedPlaylistId,
      setSelectedPlaylistId,
      clearSelectedPlaylist,
      currentPlaylistId,
      setCurrentPlaylistId,

      playlistTracksCache,
    }),
    [
      playlists,
      loading,
      error,
      moveTrack,
      loggedIn,
      selectedPlaylistId,
      setSelectedPlaylistId,
      clearSelectedPlaylist,
      currentPlaylistId,
      setCurrentPlaylistId,
      playlistTracksCache,
    ]
  );
  const actions = useMemo<PlaylistsActions>(
    () => ({
      refresh,
      moveTrack,
      refreshPlaylistTracks,
      setSelectedPlaylistId,
      clearSelectedPlaylist,
      setCurrentPlaylistId,
    }),
    [
      refresh,
      moveTrack,
      refreshPlaylistTracks,
      setSelectedPlaylistId,
      clearSelectedPlaylist,
      setCurrentPlaylistId,
    ]
  );

  return (
    <PlaylistsDataContext.Provider value={data}>
      <PlaylistsActionsContext.Provider value={actions}>
        {children}
      </PlaylistsActionsContext.Provider>
    </PlaylistsDataContext.Provider>
  );
}

export function usePlaylistsData() {
  const ctx = useContext(PlaylistsDataContext);
  if (!ctx) {
    throw new Error("usePlaylistsData must be used within a PlaylistsProvider");
  }
  return ctx;
}

export function usePlaylistsActions() {
  const ctx = useContext(PlaylistsActionsContext);
  if (!ctx) {
    throw new Error(
      "usePlaylistsActions must be used within a PlaylistsProvider"
    );
  }
  return ctx;
}
