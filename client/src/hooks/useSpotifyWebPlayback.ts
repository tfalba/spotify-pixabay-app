// useSpotifyWebPlayback.ts
import { useCallback, useEffect, useRef, useState } from "react";
import { getItunesPreview } from "@/lib/spotify"; // or "@/lib/itunes"

type AuthStatus = { authenticated: boolean };

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
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  // ✅ cookie-based login status (separate from SDK token success)
  const [loggedIn, setLoggedIn] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  // Preview playback state (works when not connected / not authenticated)
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);

  const playerRef = useRef<Spotify.Player | null>(null);

  const refreshAuthStatus = useCallback(async () => {
    try {
      const r = await apiFetch("/api/auth/status", { method: "GET" });
      if (!r.ok) {
        setLoggedIn(false);
        setAuthChecked(true);
        return false;
      }
      const json = (await r.json()) as AuthStatus;
      const ok = Boolean(json?.authenticated);
      setLoggedIn(ok);
      setAuthChecked(true);
      return ok;
    } catch {
      setLoggedIn(false);
      setAuthChecked(true);
      return false;
    }
  }, []);

  const ensurePreviewAudio = useCallback(() => {
    if (!previewAudioRef.current) {
      const a = new Audio();
      a.preload = "none";
      a.crossOrigin = "anonymous";

      a.addEventListener("ended", () => setIsPreviewPlaying(false));
      a.addEventListener("pause", () => setIsPreviewPlaying(false));
      a.addEventListener("play", () => setIsPreviewPlaying(true));

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
    // initial check
    refreshAuthStatus().catch(() => {});
  }, [refreshAuthStatus]);

  useEffect(() => {
    // helpful after redirect login or tab switching
    const onVis = () => {
      if (document.visibilityState === "visible") {
        refreshAuthStatus().catch(() => {});
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [refreshAuthStatus]);

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
      if (!playerRef.current || !deviceId) return;

      // Stop any preview audio so we don't overlap
      stopPreview();

      // 1) Mobile unlock: MUST be called during a user gesture (wrap this in onClick)
      if (
        "activateElement" in playerRef.current &&
        typeof (playerRef.current as any).activateElement === "function"
      ) {
        await (playerRef.current as any).activateElement();
      }
      await playerRef.current.resume().catch(() => {});

      // 2) Ensure SDK device is active right now
      await apiFetch("/api/player/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ device_id: deviceId }),
      });

      // 3) Play on THIS device explicitly
      await apiFetch("/api/player/play", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...urisOrContext, device_id: deviceId }),
      });
    },
    [deviceId, stopPreview]
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
    await apiFetch("/api/player/pause", { method: "PUT" });
  }, []);

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

  const playTrackSmart = useCallback(
    async (track: {
      id?: string;
      uri?: string | null;
      preview_url?: string | null;
      external_url?: string | null;
      artists?: { name: string }[];
      name?: string;
    }) => {
      // 1) Full playback if authenticated + device
      if (isAuthenticated && deviceId && track?.uri) {
        await startPlayback({ uris: [track.uri] });
        return;
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
    [deviceId, isAuthenticated, playPreview, startPlayback]
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

    isAuthenticated, // ✅ “SDK token success”
    loggedIn, // ✅ “cookie login status”
    authChecked,
    refreshAuthStatus,

    // Convenience
    playTrackSmart,
  };
}
