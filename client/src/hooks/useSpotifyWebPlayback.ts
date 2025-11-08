import { useCallback, useEffect, useRef, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE ?? "";
const apiFetch = (path: string, init?: RequestInit) =>
  fetch(`${API_BASE}${path}`, { credentials: "include", ...init });

type PlayerState = Spotify.PlaybackState | null;

export function useSpotifyWebPlayback() {
  const [sdkReady, setSdkReady] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [playerState, setPlayerState] = useState<PlayerState>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const playerRef = useRef<Spotify.Player | null>(null);

  // 1) Load SDK script once
  useEffect(() => {
    const src = "https://sdk.scdn.co/spotify-player.js";
    if (document.querySelector(`script[src="${src}"]`)) {
      // already loaded or loading
    } else {
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
    return () => {
      // don't remove the script: allows hot reloads without re-downloading
    };
  }, []);

  // 2) Create the player when SDK is ready
  useEffect(() => {
    if (!sdkReady || playerRef.current) return;

    const player = new window.Spotify.Player({
      name: "Web Player (Dev)",
      volume: 0.7,
      getOAuthToken: async (cb) => {
        try {
          const res = await apiFetch("/auth/token");
          if (!res.ok) {
            setIsAuthenticated(false);
            throw new Error(await res.text());
          }
          const { access_token } = await res.json();
          setIsAuthenticated(true);
          cb(access_token);
        } catch (err) {
          console.error("Unable to fetch access token:", err);
          setIsAuthenticated(false);
          // Optionally redirect to login if 401
          // location.href = "/auth/login";
        }
      },
    });

    player.addListener("ready", ({ device_id }) => {
      setDeviceId(device_id);
      setIsConnected(true);
      // Immediately request transfer to this device
      apiFetch("/api/player/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ device_id }),
      });
    });

    player.addListener("not_ready", ({ device_id }) => {
      if (deviceId === device_id) setDeviceId(null);
      setIsConnected(false);
    });

    player.addListener("player_state_changed", (state) => {
      setPlayerState(state);
    });

    player.addListener("initialization_error", ({ message }) =>
      console.error("init_error", message)
    );
  player.addListener("authentication_error", ({ message }) =>
      {
        console.error("auth_error", message);
        setIsAuthenticated(false);
      }
    );
    player.addListener("account_error", ({ message }) =>
      console.error("account_error", message)
    );
    player.addListener("playback_error", ({ message }) =>
      console.error("playback_error", message)
    );

    player.connect();
    playerRef.current = player;

    return () => {
      player.disconnect();
      playerRef.current = null;
    };
  }, [sdkReady]);

  // 3) Convenience actions -> hit your server routes
  const transferToThisDevice = useCallback(async () => {
    if (!deviceId) return;
    await apiFetch("/api/player/transfer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ device_id: deviceId }),
    });
  }, [deviceId]);

  const playUris = useCallback(async (uris: string[], position_ms?: number) => {
    await apiFetch("/api/player/play", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uris, position_ms }),
    });
  }, []);

  const playContext = useCallback(
    async (context_uri: string, position_ms?: number) => {
      await apiFetch("/api/player/play", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context_uri, position_ms }),
      });
    },
    []
  );

  const pause = useCallback(async () => {
    await apiFetch("/api/player/pause", {
      method: "PUT",
    });
  }, []);

  const resume = useCallback(async () => {
    await apiFetch("/api/player/play", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
  }, []);

  const nextTrack = useCallback(async () => {
    await apiFetch("/api/player/next", { method: "POST" });
  }, []);

  const previousTrack = useCallback(async () => {
    await apiFetch("/api/player/previous", {
      method: "POST",
    });
  }, []);

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

  return {
    sdkReady,
    isConnected,
    deviceId,
    playerState,
    isAuthenticated,
    // actions
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
  };
}
