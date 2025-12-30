// client/src/context/CurrentTrackContext.tsx
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Track } from "@/types/types";

export type CurrentTrackData = {
  current: Track | null;
  albumCover: string | null;

  /** The active queue for next/prev behaviors */
  queue: Track[];
};

export type CurrentTrackActions = {
  /** Set the current track directly (does not change queue) */
  setCurrent: (track: Track | null) => void;
  selectTrack: (track: Track, queue?: Track[]) => void;
  reset: () => void;

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

const CurrentTrackDataContext = createContext<CurrentTrackData | undefined>(
  undefined
);
const CurrentTrackActionsContext = createContext<
  CurrentTrackActions | undefined
>(undefined);

export function CurrentTrackProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<Track | null>(null);
  const [queue, setQueue] = useState<Track[]>([]);

  const albumCover = current?.image ?? null;

  const reset = useCallback(() => {
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

  const data = useMemo<CurrentTrackData>(
    () => ({
      current,
      albumCover,
      queue,
    }),
    [current, albumCover, queue]
  );
  const actions = useMemo<CurrentTrackActions>(
    () => ({
      setCurrent,
      handleQueueChange,
      handleTrackFinished,
      selectTrack,
      reset,
    }),
    [setCurrent, handleQueueChange, handleTrackFinished, selectTrack, reset]
  );

  return (
    <CurrentTrackDataContext.Provider value={data}>
      <CurrentTrackActionsContext.Provider value={actions}>
        {children}
      </CurrentTrackActionsContext.Provider>
    </CurrentTrackDataContext.Provider>
  );
}

export function useCurrentTrackData() {
  const ctx = useContext(CurrentTrackDataContext);
  if (!ctx) {
    throw new Error(
      "useCurrentTrackData must be used within CurrentTrackProvider"
    );
  }
  return ctx;
}

export function useCurrentTrackActions() {
  const ctx = useContext(CurrentTrackActionsContext);
  if (!ctx) {
    throw new Error(
      "useCurrentTrackActions must be used within CurrentTrackProvider"
    );
  }
  return ctx;
}
