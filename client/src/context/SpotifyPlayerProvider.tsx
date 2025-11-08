import { createContext, useContext, type ReactNode } from "react";
import { useSpotifyWebPlayback } from "../hooks/useSpotifyWebPlayback";

const SpotifyPlayerContext = createContext<ReturnType<typeof useSpotifyWebPlayback> | null>(null);

export function SpotifyPlayerProvider({ children }: { children: ReactNode }) {
  const value = useSpotifyWebPlayback();
  return (
    <SpotifyPlayerContext.Provider value={value}>
      {children}
    </SpotifyPlayerContext.Provider>
  );
}

export function useSpotifyPlayerContext() {
  const ctx = useContext(SpotifyPlayerContext);
  if (!ctx) {
    throw new Error("useSpotifyPlayerContext must be used inside SpotifyPlayerProvider");
  }
  return ctx;
}
