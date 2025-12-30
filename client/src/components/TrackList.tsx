import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Track } from "../types/types";
import clsx from "clsx";
import {
  useCurrentTrackActions,
  useCurrentTrackData,
} from "@/context/CurrentTrackContext";
import { MoveTrackModal } from "./MoveTrackModal";
import {
  usePlaylistsActions,
  usePlaylistsData,
} from "@/context/PlaylistsContext";
import { useSpotifyPlayerActions } from "@/context/SpotifyPlayerProvider";

type CardProps = {
  track: Track;
  actions?: ReactNode;
};

function TrackCard({ track, actions }: CardProps) {
  const containerClasses = "flex w-full min-w-0 items-center gap-4";
  return (
    <div className={containerClasses}>
      {track.image && (
        <img
          src={track.image}
          className="h-16 w-16 rounded-xl object-cover shadow-inner"
          alt="album art"
        />
      )}
      <div className="min-w-0 flex-1">
        <div
          className={clsx(
            "truncate text-sm font-semibold text-white"
          )}
        >
          {track.name}
        </div>

        <div
          className={clsx(
            "truncate text-xs text-slate-300"
          )}
        >
          {Array.isArray(track.artists)
            ? track.artists[0]?.name ?? ""
            : (track.artists as unknown as string)}
        </div>
      </div>

      {actions && <div className="flex items-end gap-2 shrink-0">{actions}</div>}
    </div>
  );
}

type Props = {
  tracks: Track[];

  /** Optional: used to seed queue behavior (search list vs playlist list) */
  queue?: Track[];

  twoColumnOnLarge?: boolean;
  sourcePlaylistId?: string;
};

export default function TrackList({
  tracks,
  queue,
  twoColumnOnLarge = false,
  sourcePlaylistId = "",
}: Props) {
  const { current } = useCurrentTrackData();
  const { setCurrent, selectTrack, handleQueueChange } =
    useCurrentTrackActions();
  const { playTrackSmart, playPreview } = useSpotifyPlayerActions();
  const { playlists, loggedIn } = usePlaylistsData();
  const { moveTrack } = usePlaylistsActions();

  const selectedTrackId = current?.id ?? null;

  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [trackToMove, setTrackToMove] = useState<Track | null>(null);

  const listRef = useRef<HTMLDivElement | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);

  const shouldVirtualize = !twoColumnOnLarge && tracks.length > 50;
  const rowHeight = 96;
  const rowGap = 12;
  const rowStride = rowHeight + rowGap;
  const overscan = 6;

  useEffect(() => {
    if (!shouldVirtualize || !listRef.current) return;
    const el = listRef.current;
    const handleScroll = () => setScrollTop(el.scrollTop);
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [shouldVirtualize]);

  useEffect(() => {
    if (!shouldVirtualize || !listRef.current) return;
    const el = listRef.current;
    const update = () => setViewportHeight(el.clientHeight);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [shouldVirtualize]);

  const virtualWindow = useMemo(() => {
    if (!shouldVirtualize) {
      return {
        start: 0,
        end: tracks.length,
        offset: 0,
        totalHeight: 0,
      };
    }
    const totalHeight = tracks.length * rowStride;
    const start = Math.max(0, Math.floor(scrollTop / rowStride) - overscan);
    const end = Math.min(
      tracks.length,
      Math.ceil((scrollTop + viewportHeight) / rowStride) + overscan
    );
    return {
      start,
      end,
      offset: start * rowStride,
      totalHeight,
    };
  }, [shouldVirtualize, tracks.length, rowStride, scrollTop, viewportHeight]);

  const visibleTracks = useMemo(
    () => tracks.slice(virtualWindow.start, virtualWindow.end),
    [tracks, virtualWindow.start, virtualWindow.end]
  );

  const openMoveModal = (track: Track) => {
    setTrackToMove(track);
    setMoveModalOpen(true);
  };

  const closeMoveModal = () => {
    setMoveModalOpen(false);
    setTrackToMove(null);
  };

  const handlePlaylistClick = async (targetPlaylistId: string) => {
    if (!trackToMove || !targetPlaylistId) return;
    await moveTrack(trackToMove.id, sourcePlaylistId, targetPlaylistId);
    closeMoveModal();
  };

  return (
    <div
      className={clsx(
        "flex-[2] mt-2 min-w-0 overflow-hidden overflow-y-auto rounded-2xl border border-white/10 bg-[#0a0f16] shadow-[inset_0_1px_0_rgba(63,81,181,0.55)]"
      )}
      ref={listRef}
    >
      {tracks.length > 0 && (
        <div
          className={clsx(
            "px-0 md:px-4 py-4",
            twoColumnOnLarge
              ? "flex min-w-0 flex-col gap-3 lg:grid xl:grid-cols-2 lg:gap-4"
              : "flex min-w-0 flex-col gap-3"
          )}
          style={
            shouldVirtualize
              ? { height: virtualWindow.totalHeight, position: "relative" }
              : undefined
          }
        >
          <div
            className="contents"
            style={
              shouldVirtualize
                ? { transform: `translateY(${virtualWindow.offset}px)` }
                : undefined
            }
          >
            {(shouldVirtualize ? visibleTracks : tracks).map((t) => {
              const isSelected = selectedTrackId === t.id;

              return (
                <div
                  key={t.id}
                  className={clsx(
                    "flex w-full min-w-0 flex-col gap-2 rounded-2xl border p-2 px-4 transition shadow-[0_14px_30px_rgba(63,81,181,0.40)]",
                    isSelected
                      ? "border-amber-300/70 bg-amber-400/10"
                      : "border-transparent bg-white/5 hover:border-emerald-300/40 hover:bg-white/10"
                  )}
                  style={shouldVirtualize ? { height: rowHeight } : undefined}
                >
                  <TrackCard
                    track={t}
                    actions={
                      loggedIn ? (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              const q = queue?.length ? queue : tracks;
                              handleQueueChange(q);
                              selectTrack(t, q);
                              setCurrent(t);
                              playTrackSmart({
                                uri: t.uri ?? null,
                                preview_url: t.preview_url ?? null,
                              }).catch(() => {});
                            }}
                            className={clsx(
                              "rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wide opacity-90",
                              "bg-emerald-300/90 text-slate-900 hover:bg-emerald-200"
                            )}
                          >
                            Play
                          </button>

                          <button
                            type="button"
                            onClick={() => openMoveModal(t)}
                            className={clsx(
                              "rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide opacity-90",
                              "border-white/20 text-white/70 hover:border-white/40"
                            )}
                          >
                            Move
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            handleQueueChange([t]);
                            setCurrent(t);
                            if (t.preview_url) {
                              playPreview(t.preview_url).catch(() => {});
                            }
                          }}
                          className={clsx(
                            "rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wide transition",
                            "bg-emerald-300/90 text-slate-900 hover:bg-emerald-200"
                          )}
                        >
                          Preview
                        </button>
                      )
                    }
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      <MoveTrackModal
        isOpen={moveModalOpen}
        track={trackToMove}
        playlists={playlists}
        onClose={closeMoveModal}
        onSelectPlaylist={handlePlaylistClick}
      />
    </div>
  );
}
