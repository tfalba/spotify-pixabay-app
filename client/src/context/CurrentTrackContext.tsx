// client/src/context/CurrentTrackContext.tsx
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Track } from "@/types/types";

export type CurrentTrackContextValue = {
  current: Track | null;
  albumCover: string | null;

  /** Set the current track directly (does not change queue) */
  setCurrent: (track: Track | null) => void;
  selectTrack: (track: Track, queue?: Track[]) => void;


  /** The active queue for next/prev behaviors */
  queue: Track[];

  /**
   * Replace the queue (and ensure current is valid).
   * - If queue is empty → clears current.
   * - If current exists in new queue → keep it.
   * - Else → sets current to first track by default.
   */
  handleQueueChange: (tracks: Track[]) => void;

  /** Advance to the next track in queue (if any) */
  handleTrackFinished: () => void;
};

const CurrentTrackContext = createContext<CurrentTrackContextValue | undefined>(
  undefined
);

export function CurrentTrackProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<Track | null>(null);
  const [queue, setQueue] = useState<Track[]>([]);

  const albumCover = current?.image ?? null;

  useEffect(() => {
    setCurrent(null);
    setQueue([]);
  }, []);

  const handleQueueChange = useCallback(
    (tracks: Track[]) => {
      const nextQueue = Array.isArray(tracks) ? tracks : [];
      setQueue(nextQueue);

      if (!nextQueue.length) {
        setCurrent(null);
        return;
      }

      // Keep current if still in the new queue
      if (current && nextQueue.some((t) => t.id === current.id)) {
        return;
      }

      // Otherwise default to the first track (most predictable UX)
      setCurrent(nextQueue[0]);
    },
    [current]
  );

  const selectTrack = useCallback(
  (track: Track, nextQueue?: Track[]) => {
    if (nextQueue) setQueue(nextQueue);
    setCurrent(track);
  },
  []
);

  const handleTrackFinished = useCallback(() => {
    if (!queue.length || !current) return;
    const idx = queue.findIndex((t) => t.id === current.id);
    if (idx >= 0 && idx + 1 < queue.length) {
      setCurrent(queue[idx + 1]);
    }
  }, [queue, current]);

  const value = useMemo(
    () => ({
      current,
      albumCover,
      setCurrent,
      queue,
      handleQueueChange,
      handleTrackFinished,
      selectTrack,
    }),
    [current, albumCover, queue, handleQueueChange, handleTrackFinished, selectTrack]
  );

  return (
    <CurrentTrackContext.Provider value={value}>
      {children}
    </CurrentTrackContext.Provider>
  );
}

export function useCurrentTrack() {
  const ctx = useContext(CurrentTrackContext);
  if (!ctx) {
    throw new Error("useCurrentTrack must be used within CurrentTrackProvider");
  }
  return ctx;
}
