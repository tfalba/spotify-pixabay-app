import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useSpotifyWebPlayback } from "../hooks/useSpotifyWebPlayback";

type SpotifyPlayer = ReturnType<typeof useSpotifyWebPlayback>;

type SpotifyPlayerStateKeys =
  | "sdkReady"
  | "fullPlaybackEnabled"
  | "isConnected"
  | "deviceId"
  | "playerState"
  | "playbackPositionMs"
  | "isAuthenticated"
  | "loggedIn"
  | "authChecked"
  | "previewUrl"
  | "isPreviewPlaying"
  | "previewEndedAt";

type SpotifyPlayerState = Pick<SpotifyPlayer, SpotifyPlayerStateKeys>;
type SpotifyPlayerActions = Omit<SpotifyPlayer, SpotifyPlayerStateKeys>;

const SpotifyPlayerStateContext = createContext<SpotifyPlayerState | null>(null);
const SpotifyPlayerActionsContext =
  createContext<SpotifyPlayerActions | null>(null);

export function SpotifyPlayerProvider({ children }: { children: ReactNode }) {
  const player = useSpotifyWebPlayback();
  const state = useMemo<SpotifyPlayerState>(
    () => ({
      sdkReady: player.sdkReady,
      fullPlaybackEnabled: player.fullPlaybackEnabled,
      isConnected: player.isConnected,
      deviceId: player.deviceId,
      playerState: player.playerState,
      playbackPositionMs: player.playbackPositionMs,
      isAuthenticated: player.isAuthenticated,
      loggedIn: player.loggedIn,
      authChecked: player.authChecked,
      previewUrl: player.previewUrl,
      isPreviewPlaying: player.isPreviewPlaying,
      previewEndedAt: player.previewEndedAt,
    }),
    [
      player.sdkReady,
      player.fullPlaybackEnabled,
      player.isConnected,
      player.deviceId,
      player.playerState,
      player.playbackPositionMs,
      player.isAuthenticated,
      player.loggedIn,
      player.authChecked,
      player.previewUrl,
      player.isPreviewPlaying,
      player.previewEndedAt,
    ]
  );
  const actions = useMemo<SpotifyPlayerActions>(
    () => ({
      enableFullPlayback: player.enableFullPlayback,
      disableFullPlayback: player.disableFullPlayback,
      startPlayback: player.startPlayback,
      resumeOrStart: player.resumeOrStart,
      transferToThisDevice: player.transferToThisDevice,
      playUris: player.playUris,
      playContext: player.playContext,
      pause: player.pause,
      resume: player.resume,
      nextTrack: player.nextTrack,
      previousTrack: player.previousTrack,
      seek: player.seek,
      setVolume: player.setVolume,
      toggleShuffle: player.toggleShuffle,
      setRepeat: player.setRepeat,
      playPreview: player.playPreview,
      togglePreview: player.togglePreview,
      stopPreview: player.stopPreview,
      // refreshAuthStatus: player.refreshAuthStatus,
      playTrackSmart: player.playTrackSmart,
    }),
    [
      player.enableFullPlayback,
      player.disableFullPlayback,
      player.startPlayback,
      player.resumeOrStart,
      player.transferToThisDevice,
      player.playUris,
      player.playContext,
      player.pause,
      player.resume,
      player.nextTrack,
      player.previousTrack,
      player.seek,
      player.setVolume,
      player.toggleShuffle,
      player.setRepeat,
      player.playPreview,
      player.togglePreview,
      player.stopPreview,
      // player.refreshAuthStatus,
      player.playTrackSmart,
    ]
  );
  return (
    <SpotifyPlayerStateContext.Provider value={state}>
      <SpotifyPlayerActionsContext.Provider value={actions}>
        {children}
      </SpotifyPlayerActionsContext.Provider>
    </SpotifyPlayerStateContext.Provider>
  );
}

export function useSpotifyPlayerState() {
  const ctx = useContext(SpotifyPlayerStateContext);
  if (!ctx) {
    throw new Error(
      "useSpotifyPlayerState must be used inside SpotifyPlayerProvider"
    );
  }
  return ctx;
}

export function useSpotifyPlayerActions() {
  const ctx = useContext(SpotifyPlayerActionsContext);
  if (!ctx) {
    throw new Error(
      "useSpotifyPlayerActions must be used inside SpotifyPlayerProvider"
    );
  }
  return ctx;
}
