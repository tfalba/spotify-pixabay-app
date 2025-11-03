import { useCallback, useEffect, useRef, useState } from "react";

type PlayerState = Spotify.PlaybackState | null;

export function useSpotifyWebPlayback() {
  const [sdkReady, setSdkReady] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [playerState, setPlayerState] = useState<PlayerState>(null);
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
    window.onSpotifyWebPlaybackSDKReady = () => setSdkReady(true);
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
      const res = await fetch("/auth/token", { credentials: "include" });
      if (!res.ok) throw new Error(await res.text());
      const { access_token } = await res.json();
      cb(access_token);
    } catch (err) {
      console.error("Unable to fetch access token:", err);
      // Optionally redirect to login if 401
      // location.href = "/auth/login";
    }
  },
});

    player.addListener("ready", ({ device_id }) => {
      setDeviceId(device_id);
      setIsConnected(true);
      // Immediately request transfer to this device
      fetch("/api/player/transfer", {
        method: "POST",
        credentials: "include",
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
      console.error("auth_error", message)
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
    await fetch("/api/player/transfer", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ device_id: deviceId }),
    });
  }, [deviceId]);

  const playUris = useCallback(async (uris: string[], position_ms?: number) => {
    await fetch("/api/player/play", {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uris, position_ms }),
    });
  }, []);

  const playContext = useCallback(
    async (context_uri: string, position_ms?: number) => {
      await fetch("/api/player/play", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context_uri, position_ms }),
      });
    },
    []
  );

  const pause = useCallback(async () => {
    await fetch("/api/player/pause", {
      method: "PUT",
      credentials: "include",
    });
  }, []);

  const resume = useCallback(async () => {
    await fetch("/api/player/play", {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
  }, []);

  const nextTrack = useCallback(async () => {
    await fetch("/api/player/next", { method: "POST", credentials: "include" });
  }, []);

  const previousTrack = useCallback(async () => {
    await fetch("/api/player/previous", { method: "POST", credentials: "include" });
  }, []);

  const seek = useCallback(async (position_ms: number) => {
    await fetch(`/api/player/seek?position_ms=${position_ms}`, {
      method: "PUT",
      credentials: "include",
    });
  }, []);

  const setVolume = useCallback(async (volume_percent: number) => {
    await fetch(`/api/player/volume?volume_percent=${volume_percent}`, {
      method: "PUT",
      credentials: "include",
    });
  }, []);

  const toggleShuffle = useCallback(async (state: boolean) => {
    await fetch(`/api/player/shuffle?state=${state ? "true" : "false"}`, {
      method: "PUT",
      credentials: "include",
    });
  }, []);

  const setRepeat = useCallback(async (state: "off" | "track" | "context") => {
    await fetch(`/api/player/repeat?state=${state}`, {
      method: "PUT",
      credentials: "include",
    });
  }, []);

  return {
    sdkReady,
    isConnected,
    deviceId,
    playerState,
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
