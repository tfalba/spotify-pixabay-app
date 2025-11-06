import { useEffect, useRef, useState } from "react";
import { get } from "../lib/fetcher";
import type { Track } from "../types/types";
import TrackCard from "./TrackCard";

export default function SpotifySearch({
  onPick,
  selectedTrackId,
}: {
  onPick: (t: Track | null) => void;
  selectedTrackId?: string | null;
}) {
  const [q, setQ] = useState("");
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const ctrl = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  async function search(term: string) {
    if (ctrl.current) ctrl.current.abort();
    const ac = new AbortController();
    ctrl.current = ac;
    setLoading(true);
    try {
      const data = await get<any>(`/api/search?q=${encodeURIComponent(term)}`);
      const items = (data?.tracks?.items || []) as any[];
      const out: Track[] = items.map((it) => ({
        id: it.id,
        name: it.name,
        artists: (it.artists || []).map((a: any) => ({ name: a.name })),
        image: it.album?.images?.[1]?.url || it.album?.images?.[0]?.url || null,
        preview_url: it.preview_url || null,
        external_url: it.external_urls?.spotify,
        uri: it.uri ?? null,
      }));
      setTracks(out);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (q.trim().length === 0) {
      if (ctrl.current) ctrl.current.abort();
      setTracks([]);
      onPick(null);
      return;
    }
    const id = setTimeout(() => search(q.trim()), 350);
    return () => clearTimeout(id);
  }, [q]);

  function clearSearch() {
    // if (ctrl.current) ctrl.current.abort();
    setLoading(false);
    setQ("");
    setTracks([]);
    onPick(null);
    inputRef.current?.focus();
  }

  return (
    <section className="xl:col-span-1 xl:col-start-1
           flex min-w-0 flex-col rounded-3xl border border-[amber]/80 p-6 shadow-glow max-h-[max(600px,calc(100vh-10rem))] overflow-y-scroll">
      <div className="flex items-center gap-3 pb-4">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-card-glow text-2xl text-accent shadow-glow">
          ♪
        </span>
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-slate-50">
            Discover Tracks
          </h2>
          <p className="text-sm text-slate-400">
            Search Spotify, audition previews, and set the tone.
          </p>
        </div>
      </div>
      <div className="space-y-4">
        <div className="flex items-center gap-2 rounded-2xl shadow-glow">
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search Spotify tracks..."
            className="w-full rounded-xl border border-transparent bg-gradient-to-br from-[sapphire]/20 via-[white]/30 to-[sapphire]/70 px-3 py-2 text-sm text-amber-100 placeholder:text-[white]-300 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
          />
          {q && (
            <button
              type="button"
              onClick={clearSearch}
              className="group inline-flex w-9 h-9 items-center justify-center rounded-full border border-transparent shadow-[0_12px_25px_-18px_rgba(251,191,36,0.9)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_35px_-16px_rgba(124,92,252,0.55)] focus:outline-none focus:ring-2 focus:ring-amber/50"
              aria-label="Clear search"
            >
              <span className="text-md font-semibold leading-none text-amber transition group-hover:rotate-90">
                ×
              </span>
            </button>
          )}
        </div>

        {loading && (
          <div className="flex items-center gap-2 text-xs text-teal">
            <span className="h-2 w-2 animate-ping rounded-full bg-teal" />
            Searching Spotify…
          </div>
        )}

        <div className="flex flex-col gap-3">
          {tracks.map((t) => {
            const isSelected = selectedTrackId === t.id;
            return (
              <button
                key={t.id}
                onClick={() => onPick(t)}
                className={`flex w-full min-w-0 text-left rounded-2xl border transition ${
                  isSelected
                    ? "border-white/70 bg-white/10 shadow-glow"
                    : "border-transparent bg-white/7 hover:border-teal/40 hover:bg-white/10"
                }`}
                type="button"
              >
                <TrackCard track={t} selected={isSelected} />
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
