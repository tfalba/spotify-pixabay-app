import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Track } from "@/types/types";

type CurrentTrackContextValue = {
  current: Track | null;
  albumCover: string | null;

  queue: Track[];

  /** Set current only (rarely what you want) */
  setCurrent: (track: Track | null) => void;

  /** Replace queue, keep current if it still exists in the new queue */
  setQueue: (tracks: Track[]) => void;

  /**
   * ✅ Single “source of truth” action:
   * - sets queue (optional)
   * - sets current
   * - guarantees current is in queue (if queue provided)
   */
  playTrack: (track: Track, queue?: Track[]) => void;

  handleTrackFinished: () => void;
};

const CurrentTrackContext = createContext<CurrentTrackContextValue | undefined>(
  undefined
);

export function CurrentTrackProvider({ children }: { children: ReactNode }) {
  const [current, _setCurrent] = useState<Track | null>(null);
  const [queue, _setQueue] = useState<Track[]>([]);
  const albumCover = current?.image ?? null;

  const setCurrent = useCallback((track: Track | null) => {
    _setCurrent(track);
  }, []);

  const setQueue = useCallback(
    (tracks: Track[]) => {
      _setQueue(tracks);

      if (!tracks.length) {
        _setCurrent(null);
        return;
      }

      if (current && tracks.some((t) => t.id === current.id)) {
        // keep current
        return;
      }

      // if current isn't in the new queue, clear it
      _setCurrent(null);
    },
    [current]
  );

  const playTrack = useCallback((track: Track, nextQueue?: Track[]) => {
    if (nextQueue && nextQueue.length) {
      // ensure the chosen track exists in the queue (defensive)
      const exists = nextQueue.some((t) => t.id === track.id);
      const normalizedQueue = exists ? nextQueue : [track, ...nextQueue];
      _setQueue(normalizedQueue);
    } else if (!queue.length) {
      // if no queue provided and queue is empty, seed it with this track
      _setQueue([track]);
    }
    _setCurrent(track);
  }, [queue.length]);

  const handleTrackFinished = useCallback(() => {
    if (!queue.length || !current) return;
    const idx = queue.findIndex((t) => t.id === current.id);
    if (idx >= 0 && idx + 1 < queue.length) {
      _setCurrent(queue[idx + 1]);
    }
  }, [queue, current]);

  const value = useMemo(
    () => ({
      current,
      albumCover,
      queue,
      setCurrent,
      setQueue,
      playTrack,
      handleTrackFinished,
    }),
    [current, albumCover, queue, setCurrent, setQueue, playTrack, handleTrackFinished]
  );

  return (
    <CurrentTrackContext.Provider value={value}>
      {children}
    </CurrentTrackContext.Provider>
  );
}

export function useCurrentTrack() {
  const ctx = useContext(CurrentTrackContext);
  if (!ctx) throw new Error("useCurrentTrack must be used within CurrentTrackProvider");
  return ctx;
}
