import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { Track } from "@/types/types";

type CurrentTrackContextValue = {
  current: Track | null;
  albumCover: string | null;
  setCurrent: (track: Track | null) => void;
  queue: Track[];
  handleQueueChange: (tracks: Track[]) => void;
  handleTrackFinished: () => void;
};

const CurrentTrackContext = createContext<CurrentTrackContextValue | undefined>(undefined);

export function CurrentTrackProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<Track | null>(null);
  const [queue, setQueue] = useState<Track[]>([]);
  const albumCover = current?.image ?? null;

    const handleQueueChange = useCallback(
      (tracks: Track[]) => {
        setQueue(tracks);
        if (!tracks.length) {
          setCurrent(null);
          return;
        }
        if (current && tracks.some((t) => t.id === current.id)) {
          return;
        }
        setCurrent(null);
      },
      [current, setCurrent],
    );
  
    const handleTrackFinished = useCallback(() => {
      if (!queue.length || !current) return;
      const idx = queue.findIndex((t) => t.id === current.id);
      if (idx >= 0 && idx + 1 < queue.length) {
        setCurrent(queue[idx + 1]);
      }
    }, [queue, current, setCurrent]);

  const value = useMemo(
    () => ({ current, albumCover, setCurrent, queue, handleQueueChange, handleTrackFinished }),
    [current, albumCover, queue, handleQueueChange, handleTrackFinished],
  );
  return <CurrentTrackContext.Provider value={value}>{children}</CurrentTrackContext.Provider>;
}

export function useCurrentTrack() {
  const ctx = useContext(CurrentTrackContext);
  if (!ctx) throw new Error("useCurrentTrack must be used within CurrentTrackProvider");
  return ctx;
}
