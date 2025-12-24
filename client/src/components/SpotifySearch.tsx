// client/src/components/SpotifySearch.tsx
import { useCallback, useEffect, useRef, useState } from "react";
import clsx from "clsx";
import type { Track } from "../types/types";
import { useSpotifyPlayerContext } from "../context/SpotifyPlayerProvider";
import { LoginButton } from "./LoginButtons";
import { useTheme } from "@/context/ThemeContext";
import TrackList from "./TrackList";
import { usePlaylists } from "@/context/PlaylistsContext";
import { enrichMissingPreviews, searchTracks, type SpotifyTrack } from "../lib/spotify";

type Props = {
  onSetTracks?: (tracks: Track[]) => void;
  tracks: Track[];
  twoColumnOnLarge?: boolean;
};

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
    album: t.album ? { images: t.album.images ?? [] } : undefined,
  } as Track;
}

export default function SpotifySearch({
  onSetTracks,
  tracks,
  twoColumnOnLarge,
}: Props) {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);

  const ctrlRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const hadQueryRef = useRef(false);
  const lastSearchIdRef = useRef(0);

  /**
   * Under Option 1:
   * - `loggedIn` = cookie auth (can access /api/me, playlists, search via server)
   * - `isAuthenticated` = SDK token fetch success (full playback capability)
   */
  const {
    loggedIn,
    fullPlaybackEnabled,
    enableFullPlayback,
    pause,
  } = useSpotifyPlayerContext();

  const { clearSelectedPlaylist } = usePlaylists();
  const { theme } = useTheme();
  const isLight = theme === "light";

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

      // Increase a monotonically increasing request id so we can ignore stale responses
      const requestId = ++lastSearchIdRef.current;

      setLoading(true);
      try {
        // 1) Spotify search via your server
        const results = await searchTracks(trimmed, { signal: ac.signal });

        // If a newer request started, ignore this one.
        if (requestId !== lastSearchIdRef.current) return;

        const out: Track[] = (results ?? []).map(toTrack);
        onSetTracks?.(out);

        // 2) OPTIONAL: enrich missing previews via iTunes (abort-safe)
        //    - only if query still current and request still latest
        //    - keep limit small for UX
        const enriched = await enrichMissingPreviews(results as SpotifyTrack[], {
          limit: 6,
          init: { signal: ac.signal },
        });

        if (requestId !== lastSearchIdRef.current) return;
        onSetTracks?.((enriched ?? []).map(toTrack));
      } catch (e: any) {
        if (e?.name === "AbortError") return;
        console.error(e);
        onSetTracks?.([]);
      } finally {
        // Only end loading for the latest request.
        if (requestId === lastSearchIdRef.current) setLoading(false);
      }
    },
    [onSetTracks]
  );

  useEffect(() => {
    const trimmed = q.trim();
    const hasQuery = trimmed.length > 0;

    if (!hasQuery) {
      if (ctrlRef.current) ctrlRef.current.abort();
      onSetTracks?.([]);
      setLoading(false);

      if (hadQueryRef.current) stopPlayback();
      hadQueryRef.current = false;
      return;
    }

    if (!hadQueryRef.current) {
      clearSelectedPlaylist();
    }
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
        "flex h-full min-h-0 flex-col gap-4 rounded-b-3xl p-6",
        isLight ? "bg-white/80 text-slate-700" : "bg-white/5 text-white"
      )}
    >
      <div className="mb-4 flex flex-col items-start justify-between gap-3 flex-wrap md:flex-nowrap">
        <h2
          className={clsx(
            "text-sm font-semibold uppercase tracking-[0.2em]",
            isLight ? "text-slate-500" : "text-slate-400"
          )}
        >
          Search
        </h2>

        {/* Search bar always visible */}
        <div className="w-full max-w-xl space-y-2">
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

          {/* Login CTA: cookie auth gates server search/playlists; SDK auth gates full playback */}
          {!loggedIn && (
            <div
              className={clsx(
                "flex items-center justify-end gap-2 text-xs",
                isLight ? "text-slate-600" : "text-white/70"
              )}
            >
              <span>Log in for full playback access</span>
              <LoginButton />
            </div>
          )}

          {loggedIn && !fullPlaybackEnabled && (
            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={enableFullPlayback}
                className={clsx(
                  "rounded-full px-3 py-1 text-xs uppercase tracking-[0.2em]",
                  isLight
                    ? "bg-slate-900 text-white"
                    : "bg-white/80 text-slate-900"
                )}
              >
                Enable full playback
              </button>
            </div>
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
          // onTrackSelected={onTrackSelected}
          twoColumnOnLarge={twoColumnOnLarge}
        />
      )}
    </section>
  );
}
