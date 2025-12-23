import { useCallback, useEffect, useRef, useState } from "react";
import clsx from "clsx";
import type { Track } from "../types/types";
import { useSpotifyPlayerContext } from "../context/SpotifyPlayerProvider";
import { LoginButton } from "./LoginButtons";
import { useTheme } from "@/context/ThemeContext";
import TrackList from "./TrackList";
import { usePlaylists } from "@/context/PlaylistsContext";
import { searchTracks } from "../lib/spotify";
import { get } from "../lib/fetcher";

type Props = {
  onSetTracks?: (tracks: Track[]) => void;
  tracks: Track[];
  twoColumnOnLarge?: boolean;
};

type AuthStatus = { authenticated: boolean };

function toTrack(t: any): Track {
  return {
    id: t.id,
    name: t.name,
    artists: (t.artists || []).map((a: any) => ({ name: a.name })),
    image:
      t.image ?? t.album?.images?.[1]?.url ?? t.album?.images?.[0]?.url ?? null,
    preview_url: t.preview_url ?? null,
    external_url: t.external_url ?? t.external_urls?.spotify ?? "",
    uri: t.uri ?? null,
  };
}

export default function SpotifySearch({
  onSetTracks,
  tracks,
  twoColumnOnLarge,
}: Props) {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);

  // ✅ cookie-based login state (updates immediately after OAuth redirect)
  const [loggedIn, setLoggedIn] = useState(false);

  const ctrlRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const hadQueryRef = useRef(false);

  // NOTE: isAuthenticated = “full playback token success” under Option 1.
  const { fullPlaybackEnabled, enableFullPlayback, pause } =
    useSpotifyPlayerContext();

  const { clearSelectedPlaylist } = usePlaylists();
  const { theme } = useTheme();
  const isLight = theme === "light";

  const API = import.meta.env.VITE_API_BASE ?? "";

  // ✅ Check login cookie state (no token refresh)
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

  const stopPlayback = useCallback(() => {
    pause().catch(() => {});
  }, [pause]);

  const search = useCallback(
    async (term: string) => {
      const trimmed = term.trim();
      if (!trimmed) return;

      // Abort any in-flight request
      if (ctrlRef.current) ctrlRef.current.abort();
      const ac = new AbortController();
      ctrlRef.current = ac;

      setLoading(true);
      try {
        const results = await searchTracks(trimmed, { signal: ac.signal });
        const out: Track[] = results.map(toTrack);
        onSetTracks?.(out);
      } catch (e: any) {
        if (e?.name !== "AbortError") onSetTracks?.([]);
      } finally {
        setLoading(false);
      }
    },
    [onSetTracks]
  );

  useEffect(() => {
    const trimmed = q.trim();
    const hasQuery = trimmed.length > 0;

    if (!hasQuery) {
      if (ctrlRef.current) ctrlRef.current.abort();
      if (hadQueryRef.current) {
        onSetTracks?.([]);
      }
      setLoading(false);

      if (hadQueryRef.current) stopPlayback();
      hadQueryRef.current = false;
      return;
    }

    if (!hadQueryRef.current) clearSelectedPlaylist();
    hadQueryRef.current = true;

    const id = window.setTimeout(() => {
      search(trimmed).catch(() => {});
    }, 350);

    return () => window.clearTimeout(id);
  }, [q, clearSelectedPlaylist, search, stopPlayback, onSetTracks]);

  function clearSearch() {
    if (ctrlRef.current) ctrlRef.current.abort();
    setLoading(false);
    setQ("");
    onSetTracks?.([]);
    hadQueryRef.current = false;
    stopPlayback();
    inputRef.current?.focus();
  }

  return (
    <section
      className={clsx(
        "flex h-full min-h-0 flex-col gap-4 rounded-b-3xl p-2 pt-6",
        isLight ? "bg-white/80 text-slate-700" : "bg-white/5 text-white"
      )}
    >
      <div className="mb-1 flex items-center justify-start gap-3 flex-wrap md:flex-nowrap">
        <h2
          className={clsx(
            "text-sm font-semibold uppercase tracking-[0.2em]",
            isLight ? "text-slate-500" : "text-slate-400"
          )}
        >
          Search
        </h2>

        {/* Search bar always visible */}
        <div className="w-full max-w-lg space-y-2">
          <div className="flex items-center gap-2 rounded-2xl shadow-glow">
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search Spotify tracks…"
              className={clsx(
                "w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40",
                isLight
                  ? "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400"
                  : "border-white/20 bg-gradient-to-br from-sapphire/90 via-sapphire to-sapphire/70 text-amber-100 placeholder:text-white/50"
              )}
            />

            {q && (
              <button
                type="button"
                onClick={clearSearch}
                className={clsx(
                  "group inline-flex h-9 w-9 items-center justify-center rounded-full border border-transparent shadow-[0_12px_25px_-18px_rgba(251,191,36,0.9)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_35px_-16px_rgba(124,92,252,0.55)] focus:outline-none focus:ring-2 focus:ring-amber/50",
                  isLight ? "bg-teal/20 text-slate-900" : "text-teal"
                )}
                aria-label="Clear search"
              >
                <span className="text-md font-semibold leading-none transition group-hover:rotate-90">
                  ×
                </span>
              </button>
            )}
          </div>

          {/* ✅ Login CTA based on cookie login, not SDK auth */}
          {!loggedIn ? (
            <div
              className={clsx(
                "flex items-center justify-end gap-2 text-xs",
                isLight ? "text-slate-600" : "text-white/70"
              )}
            >
              <span>Log in for full playback access</span>
              <LoginButton />
            </div>
          ) : !fullPlaybackEnabled ? (
            <div className="flex items-center justify-end">
              <button onClick={enableFullPlayback}>Enable full playback</button>
            </div>
          ) : null}
        </div>
      </div>

      {loading ? (
        <div
          className={clsx(
            "flex items-center gap-2 text-xs",
            isLight ? "text-teal-600" : "text-teal"
          )}
        >
          <span
            className={clsx(
              "h-2 w-2 animate-ping rounded-full",
              isLight ? "bg-teal-500" : "bg-teal"
            )}
          />
          Searching Spotify…
        </div>
      ) : (
        <TrackList
          tracks={tracks}
          twoColumnOnLarge={twoColumnOnLarge}
        />
      )}
    </section>
  );
}
