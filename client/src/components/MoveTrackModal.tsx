// MoveTrackModal.tsx
import type { SpotifyPlaylist } from "@/lib/spotify";
import type { Track } from "@/types/types";
import React from "react";

interface MoveTrackModalProps {
  isOpen: boolean;
  track: Track | null;
  playlists: SpotifyPlaylist[];
  onClose: () => void;
  onSelectPlaylist: (playlistId: string) => void | Promise<void>;
}

export const MoveTrackModal: React.FC<MoveTrackModalProps> = ({
  isOpen,
  track,
  playlists,
  onClose,
  onSelectPlaylist,
}) => {
  if (!isOpen || !track) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/60"
      role="dialog"
      aria-modal="true"
    >
      {/* click the backdrop to close */}
      <button
        className="absolute inset-0 cursor-default"
        onClick={onClose}
        aria-label="Close move track dialog"
      />

      <div className="relative z-50 w-full max-w-md rounded-2xl bg-slate-900 p-4 shadow-xl">
        <div className="mb-3 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-100">
              Move track to playlist
            </h2>
            <p className="text-xs text-slate-400">
              {track.name}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-2 py-1 text-xs text-slate-400 hover:bg-slate-800"
          >
            ✕
          </button>
        </div>

        {/* Scrollable playlist list */}
        <div className="max-h-64 space-y-1 overflow-y-auto pr-1">
          {playlists.map((pl) => (
            <button
              key={pl.id}
              type="button"
              onClick={() => onSelectPlaylist(pl.id)}
              className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-slate-100 hover:bg-slate-800"
            >
              <span className="truncate">{pl.name}</span>
            </button>
          ))}

          {playlists.length === 0 && (
            <p className="py-4 text-center text-xs text-slate-500">
              No playlists found.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
