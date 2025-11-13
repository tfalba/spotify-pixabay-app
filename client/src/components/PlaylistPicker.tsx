import { useEffect, useMemo, useState } from "react";
import {
  getAllPlaylistTracks,
  getAllUserPlaylists,
  type SpotifyPlaylist,
  type SpotifyTrack,
} from "../lib/spotify";
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
import { useSpotifyPlayerContext } from "@/context/SpotifyPlayerProvider";

type Props = {
  onPick: (t: Track | null) => void; // hook into your NowPlaying
  onQueueChange?: (tracks: Track[]) => void;
  onSetTracks?: (tracks: Track[]) => void;
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
  onQueueChange,
  onSetTracks,
}: Props) {
  const [loading, setLoading] = useState(true);
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [error, setError] = useState<string>("");

  const { isAuthenticated } = useSpotifyPlayerContext();

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
  useEffect(() => {
    if (!selectedId || !selected) return;
    (async () => {
      try {
        setLoading(true);
        const ts = await getAllPlaylistTracks(selectedId);
        const normalized = ts.map(mapToTrack);
        onSetTracks?.(normalized);
        onQueueChange?.(normalized);
      } catch (e: any) {
        setError(e.message ?? "Failed to load tracks");
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedId]);

  return (
    <>
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
          Playlists
        </h2>
        {loading ? (
          <span className="text-xs text-slate-500">loading…</span>
        ) : null}
      </div>

      {error && isAuthenticated && (
        <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
          {" Please try refreshing the page or logging back in."}
        </div>
      )}

      {/* Dropdown */}
      {/* shadcn/ui Select */}
      <Select
        value={selectedId}
        onValueChange={(value) => {
          if (value !== selectedId) {
            onPick(null);
            onSetTracks?.([]);
          }
          setSelectedId(value);
        }}
      >
        <SelectTrigger
          className="w-full rounded-xl border border-white/40 h-14 bg-sapphire text-white px-4 py-3"
        >
          <SelectValue
            placeholder="Choose a playlist"
            aria-label={selected?.name + selectedId + selected?.id}
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
    </>
  );
}
