import { useEffect, useMemo, useState } from "react";
import {
  getAllPlaylistTracks,
  getAllUserPlaylists,
  type SpotifyPlaylist,
  type SpotifyTrack,
} from "../lib/spotify";
import TrackCard from "./TrackCard";
import type { Track } from "../types/types";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";

type Props = {
  onPick: (t: Track | null) => void; // hook into your NowPlaying
  selectedTrackId?: string | null;
  onQueueChange?: (tracks: Track[]) => void;
};

const mapToTrack = (t: SpotifyTrack): Track => ({
  id: t.id,
  name: t.name,
  artists: t.artists,
  image: t.image,
  preview_url: t.preview_url,
  external_url: t.external_url,
  uri: t.uri,
});

export default function PlaylistPicker({
  onPick,
  selectedTrackId,
  onQueueChange,
}: Props) {
  const [loading, setLoading] = useState(true);
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [tracks, setTracks] = useState<Track[]>([]);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const pls = await getAllUserPlaylists();
        setPlaylists(pls);
        // optionally auto-select first playlist
        if (pls.length) setSelectedId(pls[0].id);
      } catch (e: any) {
        setError(e.message ?? "Failed to load playlists");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    (async () => {
      try {
        setLoading(true);
        const ts = await getAllPlaylistTracks(selectedId);
        const normalized = ts.map(mapToTrack);
        setTracks(normalized);
        onQueueChange?.(normalized);
      } catch (e: any) {
        setError(e.message ?? "Failed to load tracks");
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedId]);

  const options = useMemo(
    () =>
      playlists.map((p) => ({
        id: p.id,
        name: p.name,
        count: p.tracks?.total ?? 0,
        owner: p.owner?.display_name ?? "",
        thumb: p.images?.[p.images.length - 1]?.url ?? p.images?.[0]?.url ?? "",
      })),
    [playlists]
  );

  const selected = options.find((o) => o.id === selectedId);

  return (
    <section
      className="xl:col-span-1 xl:col-start-1
           flex min-w-0 flex-col rounded-3xl border border-[amber]/80 p-6 shadow-glow max-h-[max(600px,calc(100vh-10rem))] overflow-y-scroll"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
          Playlists
        </h2>
        {loading ? (
          <span className="text-xs text-slate-500">loading…</span>
        ) : null}
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
          {error}
        </div>
      )}

      {/* Dropdown */}
      {/* shadcn/ui Select */}
      <Select
        value={selectedId}
        onValueChange={(value) => {
          if (value !== selectedId) {
            onPick(null);
            setTracks([]);
          }
          setSelectedId(value);
        }}
      >
        <SelectTrigger
          className="w-full rounded-xl border border-white/40 h-12 bg-sapphire text-white px-4 py-3
                     focus:ring-2 focus:ring-accent/50 focus:outline-none"
        >
          <SelectValue
            placeholder="Choose a playlist"
            aria-label={selected?.name}
          />
        </SelectTrigger>

        <SelectContent
          className="border-white/10 bg-sapphire text-white"
          position="popper"
          align="start"
        >
          {/* Scrollable list with brand hover */}
          <ScrollArea className="max-h-80 overflow-scroll">
            <SelectGroup>
              {options.length === 0 && (
                <div className="px-3 py-2 text-sm text-slate-400">
                  No playlists found
                </div>
              )}
              {options.map((o) => (
                <SelectItem
                  key={o.id}
                  value={o.id}
                  className="focus:bg-aurora/20 data-[highlighted]:bg-aurora/20 data-[state=checked]:bg-aurora/25
                             rounded-md focus:border-white"
                >
                  <div className="flex items-center gap-3">
                    {o.thumb ? (
                      <img
                        src={o.thumb}
                        alt=""
                        className="h-8 w-8 rounded object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded bg-aurora/30" />
                    )}
                    <div className="min-w-0">
                      <div className="truncate text-sm">{o.name}</div>
                      <div className="truncate text-xs text-slate-300">
                        {o.owner ? `by ${o.owner} · ` : ""}
                        {o.count} tracks
                      </div>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectGroup>
          </ScrollArea>
        </SelectContent>
      </Select>

      {/* Tracks list */}
      {/* {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</div>
      )}  // Currently not showing error to user */}

      <ul className="divide-y divide-white/5 overflow-hidden overflow-scroll rounded-2xl border border-white/10 bg-black/30 mt-6 shadow-inner">
        {tracks.map((t) => {
          const isSelected = selectedTrackId === t.id;
          return (
            <button
              key={t.id}
              onClick={() => onPick(t)}
              className={`flex w-full min-w-0 p-2 text-left rounded-2xl border transition ${
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
        {!loading && tracks.length === 0 && (
          <li className="p-4 text-center text-sm text-slate-400">No tracks</li>
        )}
      </ul>
    </section>
  );
}
