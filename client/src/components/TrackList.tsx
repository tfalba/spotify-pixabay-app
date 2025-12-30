import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Track } from "../types/types";
import clsx from "clsx";
import { useTheme } from "@/context/ThemeContext";
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
  isLight: boolean;
  actions?: ReactNode;
};

function TrackCard({ track, isLight, actions }: CardProps) {
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
            "truncate text-sm font-semibold",
            isLight ? "text-slate-900" : "text-white"
          )}
        >
          {track.name}
        </div>

        <div
          className={clsx(
            "truncate text-xs",
            isLight ? "text-slate-600" : "text-slate-300"
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
  const { theme } = useTheme();
  const isLight = theme === "light";

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
        "flex-[2] mt-2 min-w-0 overflow-hidden overflow-y-auto rounded-2xl shadow-inner",
        isLight
          ? "border border-slate-200 bg-white"
          : "bg-gradient-to-br from-black/5 via-aurora/15 to-teal/10"
      )}
      ref={listRef}
    >
      {tracks.length > 0 && (
        <div
          className={clsx(
            "p-4",
            twoColumnOnLarge
              ? "flex min-w-0 flex-col gap-3 p-3 lg:grid lg:grid-cols-2 lg:gap-4"
              : "flex min-w-0 flex-col gap-3"
          )}
          style={
            shouldVirtualize
              ? { height: virtualWindow.totalHeight, position: "relative" }
              : undefined
          }
        >
          <div
            className={clsx(!shouldVirtualize && "contents")}
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
                    "flex w-full min-w-0 flex-col gap-2 rounded-2xl border p-2 px-4 transition shadow-glow",
                    isSelected
                      ? isLight
                        ? "border-amber/70 bg-white/70 shadow-glow"
                        : "border-amber/90 bg-white/1 shadow-glow"
                      : isLight
                      ? "border-transparent bg-white hover:border-teal-500/30 hover:bg-slate-50"
                      : "border-transparent bg-white/5 hover:border-teal/40 hover:bg-white/10"
                  )}
                  style={shouldVirtualize ? { height: rowHeight } : undefined}
                >
                  <TrackCard
                    track={t}
                    isLight={isLight}
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
                              isLight
                                ? "bg-teal/30 text-midnight hover:bg-teal/30"
                                : "bg-teal/80 text-midnight hover:bg-teal"
                            )}
                          >
                            Play
                          </button>

                          <button
                            type="button"
                            onClick={() => openMoveModal(t)}
                            className={clsx(
                              "rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide opacity-90",
                              isLight
                                ? "border-slate-300 text-slate-500"
                                : "border-white/30 text-white/70"
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
                            isLight
                              ? "bg-teal/30 text-midnight hover:bg-teal/30"
                              : "bg-teal/80 text-midnight hover:bg-teal"
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
