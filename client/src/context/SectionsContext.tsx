import { createContext, useContext, type ReactNode } from "react";

type SectionActions = {
  focusOnLyricsPanel: () => void;
};

const SectionsContext = createContext<SectionActions | null>(null);

export function useSectionsContext() {
  const ctx = useContext(SectionsContext);
  if (!ctx)
    throw new Error(
      "useSectionsContext must be used within SectionsContext.Provider"
    );
  return ctx;
}

export function SectionsContextProvider({ value, children }: { value: SectionActions; children: ReactNode }) {
  return (
    <SectionsContext.Provider value={value}>
      {children}
    </SectionsContext.Provider>
  );
}

