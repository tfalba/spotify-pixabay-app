import {
  useCallback,
  useMemo,
  useState,
} from "react";
import clsx from "clsx";
import LyricPlayerContainer from "../components/LyricPlayerContainer";
import PixabayGrid from "../components/PixabayGrid";
import { useTheme } from "@/context/ThemeContext";
import { useCurrentTrack } from "@/context/CurrentTrackContext";
import type { KeywordPlan } from "@/hooks/useLyricsImages";
import type { HeroImage, ImageCard } from "@/api/lyricsTypes";
import type { StyleCategory } from "@/types/types";
import { SectionsContextProvider } from "@/context/SectionsContext";
import ManagePlaylistsAndSearch from "@/components/ManagePlaylistAndSearch";

type Props = {
  pixabay: {
    images: ImageCard[] | null;
    keywords: KeywordPlan | null;
    loading: boolean;
    error: string | null;
    heroImage?: HeroImage | null;
    heroLoading?: boolean;
    styleChoice?: StyleCategory | "surprise";
    onStyleChange?: (choice: StyleCategory | "surprise") => void;
  };
  albumCover?: string | null;
};


export default function Home({ pixabay, albumCover }: Props) {
  const { theme } = useTheme();
  const isLightTheme = theme === "light";
  const { current, handleQueueChange } = useCurrentTrack();
  const [collapsed, setCollapsed] = useState<{
    tracks: boolean;
    lyrics: boolean;
    pixabay: boolean;
    manage: boolean;
  }>({
    tracks: false,
    lyrics: false,
    pixabay: false,
    manage: true,
  });

  const allPanelsExpanded = !collapsed.manage && !collapsed.lyrics && !collapsed.pixabay;

  const sectionMeta = useMemo(
    () => [
      // {
      //   id: "tracks" as const,
      //   title: "Track Discovery",
      //   ratio: 27,
      //   render: () => (
      //     <TracksListsContainer handleQueueChange={handleQueueChange} />
      //   ),
      // },
      {
        id: "manage" as const,
        title: "Manage Playlists",
        ratio: 42,
        render: () => (
          <ManagePlaylistsAndSearch compactPlaylistGrid={allPanelsExpanded} />
        ),
      },
      {
        id: "lyrics" as const,
        title: "Lyrics",
        ratio: 27,
        render: () => (
          <LyricPlayerContainer />
        ),
      },
      {
        id: "pixabay" as const,
        title: "Visual Moodboard",
        ratio: 42,
        render: () => (
          <PixabayGrid
            images={pixabay.images}
            keywords={pixabay.keywords}
            loading={pixabay.loading}
            error={pixabay.error}
            heroImage={pixabay.heroImage ?? null}
            heroLoading={pixabay.heroLoading ?? false}
            styleChoice={pixabay.styleChoice ?? "surprise"}
            onStyleChange={pixabay.onStyleChange}
            noSelection={!current}
            albumCover={albumCover}
            trackTitle={current?.name ?? null}
            trackArtist={
              current?.artists
                ?.map((artist) => artist?.name)
                .filter(Boolean)
                .join(", ") || null
            }
          />
        ),
      },
    ],
    [
      albumCover,
      current,
      handleQueueChange,
      pixabay.error,
      pixabay.heroImage,
      pixabay.heroLoading,
      pixabay.images,
      pixabay.keywords,
      pixabay.loading,
      pixabay.onStyleChange,
      pixabay.styleChoice,
      allPanelsExpanded,
    ]
  );

  const activeSections = sectionMeta.filter(
    (section) => !collapsed[section.id]
  );
  const dynamicColumns =
    activeSections.length > 0
      ? activeSections.map((section) => `${section.ratio}fr`).join(" ")
      : undefined;

  const toggleSection = useCallback((id: keyof typeof collapsed) => {
    setCollapsed((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  }, []);

  const resetSections = useCallback(() => {
    setCollapsed({
      tracks: false,
      lyrics: false,
      pixabay: false,
      manage: true,
    });
  }, []);

  const focusOnLyricsPanel = useCallback(() => {
    setCollapsed((prev) => ({
      ...prev,
      manage: false,
      lyrics: false,
      pixabay: false,
    }));
  }, []);

  const mainClass = clsx(
    "relative md:mt-4 flex flex-1 flex-col gap-6 rounded-[32px] border md:p-2 ring-1 before:pointer-events-none before:absolute before:inset-0 before:rounded-[32px] before:opacity-80 before:blur before:content-[''] lg:grid",
    isLightTheme
      ? "border-slate-200 bg-lilac/15 text-slate-900 ring-white/40 before:bg-gradient-to-br before:from-white/50 before:via-transparent before:to-slate-100/60 shadow-[0_25px_80px_rgba(4,6,11,0.35)]"
      : "border-white/5 bg-gradient-to-br from-midnight/80 via-amber/5 to-sapphire/80 text-slate-100 ring-white/10 before:bg-gradient-to-br before:from-white/10 before:via-transparent before:to-white/5 shadow-[0_25px_80px_rgba(45,212,191,0.30)]"
  );

  return (
    <SectionsContextProvider value={{ focusOnLyricsPanel }}>
      <main
        className={mainClass}
        style={
          dynamicColumns
            ? {
                gridTemplateColumns: dynamicColumns,
              }
            : undefined
        }
      >
        <div
          className={clsx(
            "lg:col-span-full flex flex-wrap items-center gap-3 rounded-3xl border px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] max-h-fit",
            isLightTheme
              ? "border-slate-200 bg-white/60 text-slate-700"
              : "border-white/20 bg-white/5 text-white/80"
          )}
        >
          {sectionMeta.map((section) => {
            const isCollapsed = collapsed[section.id];
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => toggleSection(section.id)}
                className={clsx(
                  "rounded-full px-3 py-1 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal",
                  isCollapsed
                    ? isLightTheme
                      ? "bg-white/90 text-slate-600"
                      : "bg-white/10 text-white"
                    : isLightTheme
                    ? "bg-teal/40 text-midnight"
                    : "bg-teal text-midnight"
                )}
              >
                {isCollapsed ? "Expand" : "Collapse"} {section.title}
              </button>
            );
          })}
          <button
            type="button"
            onClick={resetSections}
            className={clsx(
              "ml-auto rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.2em] transition focus-visible:outline-none focus-visible:ring-2",
              isLightTheme
                ? "border-slate-300 text-slate-600 hover:text-slate-900 focus-visible:ring-slate-400"
                : "border-white/30 text-white/80 hover:text-white focus-visible:ring-white"
            )}
          >
            Reset Layout
          </button>
        </div>

        {activeSections.length === 0 && (
          <div className="lg:col-span-full rounded-3xl border border-dashed border-white/20 p-6 text-center text-sm text-white/80 min-h-[calc(80vh-4rem)]">
            All sections are collapsed. Use the controls above to expand a
            panel.
          </div>
        )}

        {sectionMeta.map((section) => {
          const isCollapsed = collapsed[section.id];
          if (isCollapsed) return null;

          return (
            <div
              key={section.id}
              className="relative md:min-h-[calc(80vh-4rem)]"
            >
              <button
                type="button"
                onClick={() => toggleSection(section.id)}
                className={clsx(
                  "absolute right-4 top-4 z-10 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] transition focus-visible:outline-none focus-visible:ring-2",
                  isLightTheme
                    ? "border-slate-200 bg-white/80 text-slate-600 hover:bg-white focus-visible:ring-slate-400"
                    : "border-white/30 bg-black/40 text-white hover:bg-black/60 focus-visible:ring-white"
                )}
              >
                Collapse
              </button>
              {section.render()}
            </div>
          );
        })}
      </main>
    </SectionsContextProvider>
  );
}
