import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { Track } from "@/types/types";

type CurrentTrackContextValue = {
  current: Track | null;
  setCurrent: (track: Track | null) => void;
};

const CurrentTrackContext = createContext<CurrentTrackContextValue | undefined>(undefined);

export function CurrentTrackProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<Track | null>(null);
  const value = useMemo(() => ({ current, setCurrent }), [current]);
  return <CurrentTrackContext.Provider value={value}>{children}</CurrentTrackContext.Provider>;
}

export function useCurrentTrack() {
  const ctx = useContext(CurrentTrackContext);
  if (!ctx) throw new Error("useCurrentTrack must be used within CurrentTrackProvider");
  return ctx;
}
