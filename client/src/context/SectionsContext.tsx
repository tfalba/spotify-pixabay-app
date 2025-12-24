import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type SectionsState = {
  showCurrentPlaylist: boolean;
};

type SectionsActions = {
  setShowCurrentPlaylist: (value: boolean) => void;
  toggleShowCurrentPlaylist: () => void;
  focusOnLyricsPanel: () => void;
};

export type SectionsContextValue = SectionsState & SectionsActions;

const SectionsContext = createContext<SectionsContextValue | undefined>(
  undefined
);

export function SectionsProvider({ children }: { children: ReactNode }) {
  const [showCurrentPlaylist, setShowCurrentPlaylistState] =
    useState<boolean>(false);

  const setShowCurrentPlaylist = useCallback((value: boolean) => {
    setShowCurrentPlaylistState(value);
  }, []);

  const toggleShowCurrentPlaylist = useCallback(() => {
    setShowCurrentPlaylistState((v) => !v);
  }, []);

  /**
   * Keep this as a no-op hook point for now, or wire it to scroll / focus logic.
   * Your ManagePlaylistAndSearch expects it to exist.
   */
  const focusOnLyricsPanel = useCallback(() => {
    // e.g. document.getElementById("lyrics-panel")?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const value = useMemo<SectionsContextValue>(
    () => ({
      showCurrentPlaylist,
      setShowCurrentPlaylist,
      toggleShowCurrentPlaylist,
      focusOnLyricsPanel,
    }),
    [
      showCurrentPlaylist,
      setShowCurrentPlaylist,
      toggleShowCurrentPlaylist,
      focusOnLyricsPanel,
    ]
  );

  return (
    <SectionsContext.Provider value={value}>{children}</SectionsContext.Provider>
  );
}

export function useSectionsContext() {
  const ctx = useContext(SectionsContext);
  if (!ctx) throw new Error("useSectionsContext must be used within SectionsProvider");
  return ctx;
}
