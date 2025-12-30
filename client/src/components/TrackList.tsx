import { useState, type ReactNode } from "react";
import type { Track } from "../types/types";
import clsx from "clsx";
import { useTheme } from "@/context/ThemeContext";
import { useCurrentTrack } from "@/context/CurrentTrackContext";
import { MoveTrackModal } from "./MoveTrackModal";
import { usePlaylists } from "@/context/PlaylistsContext";
import { useSpotifyPlayerContext } from "@/context/SpotifyPlayerProvider";

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
  twoColumnOnLarge,
  sourcePlaylistId = "",
}: Props) {
  const { theme } = useTheme();
  const isLight = theme === "light";

  const { current, setCurrent, selectTrack, handleQueueChange } =
    useCurrentTrack();
  const { playTrackSmart, playPreview } = useSpotifyPlayerContext();
  const { playlists, moveTrack, loggedIn } = usePlaylists();

  const selectedTrackId = current?.id ?? null;

  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [trackToMove, setTrackToMove] = useState<Track | null>(null);

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
    >
      {tracks.length > 0 && (
        <div
          className={clsx("p-4",
            twoColumnOnLarge
              ? "flex min-w-0 flex-col gap-3 p-3 lg:grid lg:grid-cols-2 lg:gap-4"
              : "flex min-w-0 flex-col gap-3",
          )}
        >
          {tracks.map((t) => {
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
