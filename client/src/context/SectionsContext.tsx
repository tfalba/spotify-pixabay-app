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



  const value = useMemo<SectionsContextValue>(
    () => ({
      showCurrentPlaylist,
      setShowCurrentPlaylist,
      toggleShowCurrentPlaylist,
    }),
    [
      showCurrentPlaylist,
      setShowCurrentPlaylist,
      toggleShowCurrentPlaylist,
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
