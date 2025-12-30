import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";

type SectionsState = {
  showCurrentPlaylist: boolean;
};

type SectionsAction =
  | { type: "set_show_current_playlist"; value: boolean }
  | { type: "toggle_show_current_playlist" };

function sectionsReducer(
  state: SectionsState,
  action: SectionsAction
): SectionsState {
  switch (action.type) {
    case "set_show_current_playlist":
      return { ...state, showCurrentPlaylist: action.value };
    case "toggle_show_current_playlist":
      return { ...state, showCurrentPlaylist: !state.showCurrentPlaylist };
    default:
      return state;
  }
}

type SectionsActions = {
  setShowCurrentPlaylist: (value: boolean) => void;
  toggleShowCurrentPlaylist: () => void;
};

export type SectionsContextValue = SectionsState & SectionsActions;

const SectionsContext = createContext<SectionsContextValue | undefined>(
  undefined
);

export function SectionsProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(sectionsReducer, {
    showCurrentPlaylist: false,
  });

  const setShowCurrentPlaylist = useCallback((value: boolean) => {
    dispatch({ type: "set_show_current_playlist", value });
  }, []);

  const toggleShowCurrentPlaylist = useCallback(() => {
    dispatch({ type: "toggle_show_current_playlist" });
  }, []);



  const value = useMemo<SectionsContextValue>(
    () => ({
      showCurrentPlaylist: state.showCurrentPlaylist,
      setShowCurrentPlaylist,
      toggleShowCurrentPlaylist,
    }),
    [
      state.showCurrentPlaylist,
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
