import { useState, type ReactNode } from "react";
import type { Track } from "../types/types";
import clsx from "clsx";
import { useTheme } from "@/context/ThemeContext";
import { useCurrentTrack } from "@/context/CurrentTrackContext";
import type { SpotifyPlaylist } from "@/lib/spotify";
import { MoveTrackModal } from "./MoveTrackModal";

type CardProps = {
  track: Track;
  selected?: boolean;
  isLight: boolean;
  actions?: ReactNode;
};

function TrackCard({ track, selected = false, isLight, actions }: CardProps) {
  const containerClasses = clsx(
    "flex w-full items-center gap-4 rounded-2xl border p-1 pr-2 transition",
    selected
      ? isLight
        ? "border-teal/70 border-4 bg-sapphire/10 shadow-glow"
        : "border-teal/70 border-4 bg-sapphire/70 shadow-glow"
      : isLight
      ? "border-slate-200 bg-white hover:border-teal-500/40 hover:bg-slate-50"
      : "border-white/10 bg-sapphire/60 hover:border-teal/60 hover:bg-sapphire/70 hover:shadow-glow"
  );

  return (
    <div className="space-y-2">
      <div className={containerClasses}>
        {track.image && (
          <img
            src={track.image}
            className="h-16 w-16  rounded-xl object-cover shadow-inner"
            alt="album art"
          />
        )}
        <div className="flex flex-[3] items-center gap-3 min-w-0">
          <div className="min-w-0">
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
         
        </div>
         {actions && (
            <div className="flex flex-1 gap-2 items-end shrink-0">{actions}</div>
          )}
      </div>
    </div>
  );
}

type Props = {
  tracks: Track[];
  onTrackSelected?: (track: Track) => void;
  twoColumnOnLarge?: boolean;
  playlists?: SpotifyPlaylist[];
  onMoveTrack: (
    trackId: string,
    sourcePlaylistId: string,
    targetPlaylistId: string
  ) => Promise<void>;
  sourcePlaylistId?: string;
};

export default function TrackList({
  tracks,
  onTrackSelected,
  twoColumnOnLarge = false,
  playlists = [],
  onMoveTrack,
  sourcePlaylistId = "",
}: Props) {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const { current, setCurrent } = useCurrentTrack();
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
    await onMoveTrack(trackToMove.id, sourcePlaylistId, targetPlaylistId);
    closeMoveModal();
  };

  return (
    <div
      className={clsx(
        "flex-[2] mt-6 overflow-hidden overflow-y-auto rounded-2xl shadow-inner",
        isLight
          ? "border border-slate-200 bg-white"
          // : "border border-white/10 bg-black/20",
          : "bg-gradient-to-br from-teal/10 via-aurora/25 to-teal/20"
      )}
    >
      {tracks.length > 0 && (
      <div
        className={clsx(
          twoColumnOnLarge
            ? "flex flex-col gap-3 p-3 lg:grid lg:grid-cols-2 lg:gap-4"
            : "flex flex-col divide-y",
          !twoColumnOnLarge && (isLight ? "divide-slate-200" : "divide-white/5")
        )}
      >
        {tracks.map((t) => {
          const isSelected = selectedTrackId === t.id;
          return (
            <div
              key={t.id}
              className={clsx(
                "flex w-full flex-col gap-2 rounded-2xl border p-2 transition",
                isSelected
                  ? isLight
                    ? "border-amber/70 bg-white/70 shadow-glow"
                    : "border-amber/70 bg-white/10 shadow-glow"
                  : isLight
                  ? "border-transparent bg-white hover:border-teal-500/30 hover:bg-slate-50"
                  : "border-transparent bg-white/5 hover:border-teal/40 hover:bg-white/10"
              )}
            >
              <TrackCard
                track={t}
                selected={isSelected}
                isLight={isLight}
                actions={
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        onTrackSelected?.(t);
                        setCurrent(t);
                      }}
                      className={clsx(
                        "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide transition",
                        isLight
                          ? "bg-teal/20 text-midnight hover:bg-teal/30"
                          : "bg-teal/70 text-midnight hover:bg-teal"
                      )}
                    >
                      Play
                    </button>
                    <button
                      type="button"
                      onClick={() => openMoveModal(t)}
                      className={clsx(
                        "rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide opacity-70",
                        isLight
                          ? "border-slate-300 text-slate-500"
                          : "border-white/30 text-white/70"
                      )}
                    >
                      Move
                    </button>
                  </>
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
