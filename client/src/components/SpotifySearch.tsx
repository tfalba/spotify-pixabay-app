import { useEffect, useRef, useState } from "react";
import { get } from "../lib/fetcher";
import type { Track } from "../types/types";
import TrackCard from "./TrackCard";

export default function SpotifySearch({
  onPick,
}: {
  onPick: (t: Track | null) => void;
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
        artists: (it.artists || []).map((a: any) => a.name).join(", "),
        image: it.album?.images?.[1]?.url || it.album?.images?.[0]?.url || null,
        preview_url: it.preview_url || null,
        external_url: it.external_urls?.spotify,
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
    if (ctrl.current) ctrl.current.abort();
    setLoading(false);
    setQ("");
    setTracks([]);
    onPick(null);
    inputRef.current?.focus();
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search Spotify tracks..."
          className="w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
        />
        {q && (
          <button
            type="button"
            onClick={clearSearch}
            className="rounded-full border px-3 py-1 text-sm text-slate-500 transition hover:border-slate-400 hover:text-slate-700"
            aria-label="Clear search"
          >
            ×
          </button>
        )}
      </div>

      {loading && <div className="text-xs text-slate-500">Searching…</div>}

      <div className="grid gap-3">
        {tracks.map((t) => (
          <button
            key={t.id}
            onClick={() => onPick(t)}
            className="text-left p-1 rounded-lg hover:bg-slate-100 w-full"
            type="button"
          >
            <TrackCard track={t} />
          </button>
        ))}
      </div>
    </div>
  );
}
