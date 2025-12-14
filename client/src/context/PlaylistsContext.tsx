import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getAllUserPlaylists, type SpotifyPlaylist } from "@/lib/spotify";
import { moveTrackOnServer } from "@/lib/spotifyActions";
import { useSpotifyPlayerContext } from "./SpotifyPlayerProvider";

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
      console.log(selectedPlaylistId, "selectedPlaylistId");
      refresh().catch(() => {});
    }
  }, [isAuthenticated, playlists.length, refresh]);

  const moveTrack = useCallback(
    async (
      trackId: string,
      sourcePlaylistId: string,
      targetPlaylistId: string,
    ) => {
      await moveTrackOnServer(trackId, sourcePlaylistId, targetPlaylistId);
    },
    [],
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
