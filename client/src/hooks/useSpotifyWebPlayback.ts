// useSpotifyWebPlayback.ts
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuthStatus } from "@/context/AuthStatusContext";
import { getItunesPreview } from "@/lib/spotify"; // or "@/lib/itunes"

const API_BASE = import.meta.env.VITE_API_BASE ?? "";
const apiFetch = (path: string, init?: RequestInit) =>
  fetch(`${API_BASE}${path}`, { credentials: "include", ...init });

type PlayerState = Spotify.PlaybackState | null;

export function useSpotifyWebPlayback() {
  const [sdkReady, setSdkReady] = useState(false);

  // Full-playback is OFF by default (Option 1)
  const [fullPlaybackEnabled, setFullPlaybackEnabled] = useState(false);

  const [isConnected, setIsConnected] = useState(false);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [playerState, setPlayerState] = useState<PlayerState>(null);
  const [playbackPositionMs, setPlaybackPositionMs] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  // ✅ cookie-based login status (separate from SDK token success)
  const [loggedIn, setLoggedIn] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const { authenticated, checked } = useAuthStatus();

  // Preview playback state (works when not connected / not authenticated)
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [previewEndedAt, setPreviewEndedAt] = useState<number | null>(null);
  const [previewPositionMs, setPreviewPositionMs] = useState(0);
  const [previewDurationMs, setPreviewDurationMs] = useState(0);

  const playerRef = useRef<Spotify.Player | null>(null);
  const positionThrottleRef = useRef<{
    last: number;
    timer: number | null;
    pending: number | null;
  }>({ last: 0, timer: null, pending: null });
  const deviceIdRef = useRef<string | null>(null);
  const authRef = useRef({
    isAuthenticated: false,
    fullPlaybackEnabled: false,
    loggedIn: false,
  });
  const pendingDeviceResolvers = useRef<Array<(id: string) => void>>([]);

  const ensurePreviewAudio = useCallback(() => {
    if (!previewAudioRef.current) {
      const a = new Audio();
      a.preload = "none";
      a.crossOrigin = "anonymous";

      const handleEnded = () => {
        setIsPreviewPlaying(false);
        setPreviewEndedAt(Date.now());
      };
      const handlePause = () => setIsPreviewPlaying(false);
      const handlePlay = () => setIsPreviewPlaying(true);
      const handleTimeUpdate = () => {
        setPreviewPositionMs(Math.floor(a.currentTime * 1000));
      };
      const handleDurationChange = () => {
        const nextDuration = Number.isFinite(a.duration) ? a.duration : 0;
        setPreviewDurationMs(Math.floor(nextDuration * 1000));
      };

      a.addEventListener("ended", handleEnded);
      a.addEventListener("pause", handlePause);
      a.addEventListener("play", handlePlay);
      a.addEventListener("timeupdate", handleTimeUpdate);
      a.addEventListener("loadedmetadata", handleDurationChange);
      a.addEventListener("durationchange", handleDurationChange);

      previewAudioRef.current = a;
    }
    return previewAudioRef.current;
  }, []);

  const stopPreview = useCallback(() => {
    const a = previewAudioRef.current;
    if (!a) return;
    a.pause();
    a.currentTime = 0;
    a.src = "";
    setIsPreviewPlaying(false);
    setPreviewUrl(null);
    setPreviewPositionMs(0);
    setPreviewDurationMs(0);
  }, []);

  const playPreview = useCallback(
    async (url: string) => {
      if (!url) return;

      // Avoid overlap: if Spotify SDK is playing, pause it (best effort).
      try {
        if (playerRef.current) {
          await playerRef.current.pause().catch(() => {});
        }
      } catch {
        // ignore
      }

      const a = ensurePreviewAudio();

      // Toggle if same preview is currently playing
      if (previewUrl === url && !a.paused) {
        a.pause();
        return;
      }

      // Switch previews
      a.pause();
      a.currentTime = 0;
      a.src = url;
      setPreviewUrl(url);

      // Must be called during a user gesture (onClick) to satisfy autoplay rules
      await a.play();
    },
    [ensurePreviewAudio, previewUrl]
  );

  const togglePreview = useCallback(
    async (url: string | null) => {
      if (!url) return;
      const a = ensurePreviewAudio();
      if (previewUrl === url && !a.paused) a.pause();
      else await playPreview(url);
    },
    [ensurePreviewAudio, playPreview, previewUrl]
  );

  useEffect(() => {
    setLoggedIn(authenticated);
    setAuthChecked(checked);
  }, [authenticated, checked]);

  useEffect(() => {
    deviceIdRef.current = deviceId;
    if (!deviceId) return;
    pendingDeviceResolvers.current.forEach((resolve) => resolve(deviceId));
    pendingDeviceResolvers.current = [];
  }, [deviceId]);

  useEffect(() => {
    authRef.current = {
      isAuthenticated,
      fullPlaybackEnabled,
      loggedIn,
    };
  }, [isAuthenticated, fullPlaybackEnabled, loggedIn]);


  // 1) Load SDK script once (safe even if we don't connect yet)
  useEffect(() => {
    const src = "https://sdk.scdn.co/spotify-player.js";
    if (!document.querySelector(`script[src="${src}"]`)) {
      const s = document.createElement("script");
      s.src = src;
      s.async = true;
      document.body.appendChild(s);
    }
    if (typeof window.Spotify !== "undefined") {
      setSdkReady(true);
    } else {
      window.onSpotifyWebPlaybackSDKReady = () => setSdkReady(true);
    }
  }, []);

  // Cleanup preview audio on unmount
  useEffect(() => {
    return () => {
      const a = previewAudioRef.current;
      if (a) {
        a.pause();
        a.src = "";
      }
    };
  }, []);

  /**
   * OPTION 1: Explicitly enable full playback.
   * - Call this from a user click (best for iOS/Safari)
   * - We verify auth ONCE; if not logged in, it returns false.
   * - If logged in, we flip the flag and the SDK will be created/connected.
   */
  const enableFullPlayback = useCallback(async (): Promise<boolean> => {
    try {
      const res = await apiFetch("/auth/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        setIsAuthenticated(false);
        setFullPlaybackEnabled(false);
        return false;
      }
      setIsAuthenticated(true);
      setFullPlaybackEnabled(true);
      return true;
    } catch {
      setIsAuthenticated(false);
      setFullPlaybackEnabled(false);
      return false;
    }
  }, []);

  const disableFullPlayback = useCallback(() => {
    setFullPlaybackEnabled(false);
    setIsConnected(false);
    setDeviceId(null);
    setPlayerState(null);

    // Disconnect SDK if it exists
    if (playerRef.current) {
      try {
        playerRef.current.disconnect();
      } catch {
        // ignore
      }
      playerRef.current = null;
    }
  }, []);

  // 2) Create/connect the player ONLY when:
  // - SDK script is ready
  // - full playback has been explicitly enabled
  useEffect(() => {
    if (!sdkReady) return;
    if (!fullPlaybackEnabled) return;
    if (playerRef.current) return;

    const player = new window.Spotify.Player({
      name: "Web Player (Dev)",
      volume: 0.7,
      getOAuthToken: async (cb) => {
        try {
          const res = await apiFetch("/auth/token", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          });
          if (!res.ok) {
            setIsAuthenticated(false);
            throw new Error(await res.text());
          }
          const { access_token } = await res.json();
          setIsAuthenticated(true);
          cb(access_token);
        } catch (err) {
          // Avoid spammy logs; SDK will surface auth_error too
          setIsAuthenticated(false);
          console.error("Unable to fetch access token:", err);
        }
      },
    });

    player.addListener("ready", ({ device_id }) => {
      setDeviceId(device_id);
      setIsConnected(true);

      // Stop preview so we don't overlap
      stopPreview();

      // Immediately request transfer to this device (requires login)
      apiFetch("/api/player/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ device_id }),
      }).catch(() => {});
    });

    player.addListener("not_ready", ({ device_id }) => {
      setIsConnected(false);
      setDeviceId((prev) => (prev === device_id ? null : prev));
    });

    player.addListener("player_state_changed", (state) => {
      setPlayerState(state);

      const now = Date.now();
      const throttleMs = 250;
      const throttle = positionThrottleRef.current;
      const position = state?.position ?? 0;

      if (now - throttle.last >= throttleMs) {
        throttle.last = now;
        setPlaybackPositionMs(position);
        return;
      }

      throttle.pending = position;
      if (throttle.timer) return;
      const delay = throttleMs - (now - throttle.last);
      throttle.timer = window.setTimeout(() => {
        throttle.timer = null;
        throttle.last = Date.now();
        if (throttle.pending !== null) {
          setPlaybackPositionMs(throttle.pending);
          throttle.pending = null;
        }
      }, Math.max(0, delay));
    });

    player.addListener("initialization_error", ({ message }) =>
      console.error("init_error", message)
    );
    player.addListener("authentication_error", ({ message }) => {
      console.error("auth_error", message);
      setIsAuthenticated(false);
      // If auth breaks, disable full playback to stop token retries
      setFullPlaybackEnabled(false);
    });
    player.addListener("account_error", ({ message }) =>
      console.error("account_error", message)
    );
    player.addListener("playback_error", ({ message }) =>
      console.error("playback_error", message)
    );

    player.connect();
    playerRef.current = player;

    return () => {
      const throttle = positionThrottleRef.current;
      if (throttle.timer) {
        window.clearTimeout(throttle.timer);
        throttle.timer = null;
        throttle.pending = null;
      }
      try {
        player.disconnect();
      } catch {
        // ignore
      }
      playerRef.current = null;
    };
  }, [sdkReady, fullPlaybackEnabled, stopPreview]);

  // 3) Convenience actions -> hit your server routes

  const startPlayback = useCallback(
    async (urisOrContext: {
      uris?: string[];
      context_uri?: string;
      position_ms?: number;
    }) => {
      const activeDeviceId = deviceIdRef.current;
      if (!playerRef.current || !activeDeviceId) return;

      // Stop any preview audio so we don't overlap
      stopPreview();

      // 1) Mobile unlock: MUST be called during a user gesture (wrap this in onClick)
      if (
        "activateElement" in playerRef.current &&
        typeof (playerRef.current as any).activateElement === "function"
      ) {
        await (playerRef.current as any).activateElement();
      }

      // 2) Play on THIS device explicitly (device_id hints transfer)
      const playRes = await apiFetch("/api/player/play", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...urisOrContext, device_id: activeDeviceId }),
      });
      if (playRes.ok) return;

      // If device isn't active yet, fall back to an explicit transfer + retry.
      if (playRes.status === 404) {
        const transferRes = await apiFetch("/api/player/transfer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ device_id: activeDeviceId, play: true }),
        });
        if (!transferRes.ok) {
          throw new Error(`transfer_failed:${transferRes.status}`);
        }
        const retryRes = await apiFetch("/api/player/play", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...urisOrContext, device_id: activeDeviceId }),
        });
        if (!retryRes.ok) {
          throw new Error(`play_failed:${retryRes.status}`);
        }
        return;
      }
      throw new Error(`play_failed:${playRes.status}`);
    },
    [stopPreview]
  );

  const resumeOrStart = useCallback(
    async (opts: {
      uris?: string[];
      context_uri?: string;
      position_ms?: number;
    }) => {
      if (playerRef.current) {
        try {
          const state = await playerRef.current.getCurrentState();
          const hasSomethingLoaded =
            !!state && !!state.track_window?.current_track;
          const isPaused = !!state?.paused;

          if (hasSomethingLoaded && isPaused) {
            stopPreview();

            if (
              "activateElement" in playerRef.current &&
              typeof (playerRef.current as any).activateElement === "function"
            ) {
              await (playerRef.current as any).activateElement();
            }
            await playerRef.current.resume();
            return;
          }
        } catch {
          // ignore
        }
      }
      await startPlayback(opts);
    },
    [startPlayback, stopPreview]
  );

  const transferToThisDevice = useCallback(async () => {
    if (!deviceId) return;
    await apiFetch("/api/player/transfer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ device_id: deviceId }),
    });
  }, [deviceId]);

  const playUris = useCallback(
    async (uris: string[], position_ms?: number) => {
      stopPreview();
      await apiFetch("/api/player/play", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uris, position_ms }),
      });
    },
    [stopPreview]
  );

  const playContext = useCallback(
    async (context_uri: string, position_ms?: number) => {
      stopPreview();
      await apiFetch("/api/player/play", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context_uri, position_ms }),
      });
    },
    [stopPreview]
  );

  const pause = useCallback(async () => {
    if (previewAudioRef.current && !previewAudioRef.current.paused) {
      stopPreview();
      return;
    }
    await apiFetch("/api/player/pause", { method: "PUT" });
  }, [stopPreview]);

  const resume = useCallback(async () => {
    stopPreview();
    const currentUri = playerState?.track_window?.current_track?.uri ?? null;
    await apiFetch("/api/player/play", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        currentUri ? { uris: [currentUri], position_ms: 0 } : { position_ms: 0 }
      ),
    });
  }, [playerState?.track_window?.current_track?.uri, stopPreview]);

  const nextTrack = useCallback(async () => {
    stopPreview();
    await apiFetch("/api/player/next", { method: "POST" });
  }, [stopPreview]);

  const previousTrack = useCallback(async () => {
    stopPreview();
    await apiFetch("/api/player/previous", { method: "POST" });
  }, [stopPreview]);

  const seek = useCallback(async (position_ms: number) => {
    await apiFetch(`/api/player/seek?position_ms=${position_ms}`, {
      method: "PUT",
    });
  }, []);

  const setVolume = useCallback(async (volume_percent: number) => {
    await apiFetch(`/api/player/volume?volume_percent=${volume_percent}`, {
      method: "PUT",
    });
  }, []);

  const toggleShuffle = useCallback(async (state: boolean) => {
    await apiFetch(`/api/player/shuffle?state=${state ? "true" : "false"}`, {
      method: "PUT",
    });
  }, []);

  const setRepeat = useCallback(async (state: "off" | "track" | "context") => {
    await apiFetch(`/api/player/repeat?state=${state}`, {
      method: "PUT",
    });
  }, []);

  const itunesCacheRef = useRef<Record<string, string | null>>({});
  const waitForDeviceReady = useCallback((timeoutMs = 1200) => {
    if (deviceIdRef.current) return Promise.resolve(deviceIdRef.current);
    return new Promise<string | null>((resolve) => {
      const resolver = (id: string) => {
        window.clearTimeout(timer);
        resolve(id);
      };
      const timer = window.setTimeout(() => {
        pendingDeviceResolvers.current = pendingDeviceResolvers.current.filter(
          (fn) => fn !== resolver
        );
        resolve(null);
      }, timeoutMs);
      pendingDeviceResolvers.current.push(resolver);
    });
  }, []);

  const playTrackSmart = useCallback(
    async (track: {
      id?: string;
      uri?: string | null;
      preview_url?: string | null;
      external_url?: string | null;
      artists?: { name: string }[];
      name?: string;
    }) => {
      const shouldPreferFullPlayback =
        !!track?.uri &&
        (authRef.current.fullPlaybackEnabled || authRef.current.loggedIn);

      if (shouldPreferFullPlayback && !deviceIdRef.current) {
        await waitForDeviceReady();
      }

      // 1) Full playback if authenticated + device
      if (
        authRef.current.isAuthenticated &&
        deviceIdRef.current &&
        track?.uri
      ) {
        try {
          await startPlayback({ uris: [track.uri] });
          return;
        } catch {
          // fall through to preview fallback
        }
      }

      // 2) Spotify preview if available
      if (track?.preview_url) {
        await playPreview(track.preview_url);
        return;
      }

      // 3) iTunes fallback (best-effort)
      const artist = track?.artists?.[0]?.name?.trim() ?? "";
      const title = track?.name?.trim() ?? "";
      const key =
        track?.id ||
        track?.uri ||
        (artist && title ? `${artist}::${title}` : null);
      if (key) {
        if (!(key in itunesCacheRef.current)) {
          itunesCacheRef.current[key] = await getItunesPreview(artist, title);
        }
        const itunesPreview = itunesCacheRef.current[key];
        if (itunesPreview) {
          await playPreview(itunesPreview);
          return;
        }
      }

      // 4) last fallback: open Spotify
      if (track?.external_url) {
        window.open(track.external_url, "_blank", "noopener,noreferrer");
      }
    },
    [playPreview, startPlayback, waitForDeviceReady]
  );

  return {
    sdkReady,

    // Full playback gating (Option 1)
    fullPlaybackEnabled,
    enableFullPlayback,
    disableFullPlayback,

    isConnected,
    deviceId,
    playerState,
    playbackPositionMs,

    // Spotify playback actions (only meaningful when fullPlaybackEnabled)
    startPlayback,
    resumeOrStart,
    transferToThisDevice,
    playUris,
    playContext,
    pause,
    resume,
    nextTrack,
    previousTrack,
    seek,
    setVolume,
    toggleShuffle,
    setRepeat,

    // Preview actions (anonymous-safe)
    playPreview,
    togglePreview,
    stopPreview,
    previewUrl,
    isPreviewPlaying,
    previewEndedAt,
    previewPositionMs,
    previewDurationMs,

    isAuthenticated, // ✅ “SDK token success”
    loggedIn, // ✅ “cookie login status”
    authChecked,

    // Convenience
    playTrackSmart,
  };
}
