import { useCallback, useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { get } from "../lib/fetcher";
import type { Track } from "../types/types";
import { useSpotifyPlayerContext } from "../context/SpotifyPlayerProvider";
import { LoginButton } from "./LoginButtons";
import { useTheme } from "@/context/ThemeContext";
import type { SpotifyPlaylist } from "@/lib/spotify";
import TrackList from "./TrackList";

type Props = {
  onSetTracks?: (tracks: Track[]) => void;
  tracks: Track[];
  onTrackSelected: (track: Track) => void;
  twoColumnOnLarge?: boolean;
  playlists: SpotifyPlaylist[];
  onMoveTrack: (
    trackId: string,
    sourcePlaylistId: string,
    targetPlaylistId: string
  ) => Promise<void>;
};

export default function SpotifySearch({
  onSetTracks,
  tracks,
  onTrackSelected,
  twoColumnOnLarge,
  playlists,
  onMoveTrack,
}: Props) {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const ctrl = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const hadQueryRef = useRef(false);

  const API_BASE = import.meta.env.VITE_API_BASE ?? "";

  const { isAuthenticated, pause } = useSpotifyPlayerContext();
  const { theme } = useTheme();
  const isLight = theme === "light";

  const stopPlayback = useCallback(() => {
    pause().catch(() => {});
  }, [pause]);

  const search = useCallback(
    async (term: string) => {
      if (ctrl.current) ctrl.current.abort();
      const ac = new AbortController();
      ctrl.current = ac;
      setLoading(true);
      try {
        const data = await get<any>(
          `${API_BASE}/api/search?q=${encodeURIComponent(term)}`
        );
        const items = (data?.tracks?.items || []) as any[];
        const out: Track[] = items.map((it) => ({
          id: it.id,
          name: it.name,
          artists: (it.artists || []).map((a: any) => ({ name: a.name })),
          image:
            it.album?.images?.[1]?.url || it.album?.images?.[0]?.url || null,
          preview_url: it.preview_url || null,
          external_url: it.external_urls?.spotify,
          uri: it.uri ?? null,
        }));
        onSetTracks?.(out);
      } finally {
        setLoading(false);
      }
    },
    [API_BASE]
  );

  useEffect(() => {
    const trimmed = q.trim();
    const hasQuery = trimmed.length > 0;
    if (!hasQuery) {
      if (ctrl.current) ctrl.current.abort();
      onSetTracks?.([]);
      setLoading(false);
      if (hadQueryRef.current) {
        stopPlayback();
      }
      hadQueryRef.current = false;
      return;
    }
    hadQueryRef.current = true;
    const id = setTimeout(() => {
      search(trimmed).catch(() => {});
    }, 350);
    return () => clearTimeout(id);
  }, [q]);

  function clearSearch() {
    if (ctrl.current) ctrl.current.abort();
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
        "flex h-full min-h-0 flex-col gap-4 rounded-b-3xl p-6",
        isLight
          ? " bg-white/80 text-slate-700"
          : " bg-white/5 text-white"
      )}
    >
      {" "}
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap md:flex-nowrap">
        <h2
          className={clsx(
            "text-sm font-semibold uppercase tracking-[0.2em]",
            isLight ? "text-slate-500" : "text-slate-400"
          )}
        >
          Search
        </h2>
    
      <div className="space-y-4 p-1 text-right w-full">
        {isAuthenticated ? (
          <div className="flex items-center gap-2 rounded-2xl shadow-glow">
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search Spotify tracks..."
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
                  "group inline-flex w-9 h-9 items-center justify-center rounded-full border border-transparent shadow-[0_12px_25px_-18px_rgba(251,191,36,0.9)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_35px_-16px_rgba(124,92,252,0.55)] focus:outline-none focus:ring-2 focus:ring-amber/50",
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
        ) : (
          <LoginButton />
        )}
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
          onTrackSelected={onTrackSelected}
          twoColumnOnLarge={twoColumnOnLarge}
          playlists={playlists}
          onMoveTrack={onMoveTrack}
        />
      )}
    </section>
  );
}
