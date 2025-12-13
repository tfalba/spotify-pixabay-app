import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type JSX,
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
import { PlaylistsProvider } from "@/context/PlaylistsContext";
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

type SectionConfig = {
  id: "manage" | "lyrics" | "pixabay";
  title: string;
  ratio: number;
  render: () => JSX.Element;
  maxWidth?: number;
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
  const previousCollapsedRef = useRef<typeof collapsed | null>(null);

  const allPanelsExpanded =
    !collapsed.manage && !collapsed.lyrics && !collapsed.pixabay;
  const manageSoloExpanded =
    !collapsed.manage && collapsed.lyrics && collapsed.pixabay;

  const sectionMeta = useMemo<SectionConfig[]>(
    () => [
      {
        id: "manage" as const,
        title: "Manage Playlists",
        ratio: 42,
        render: () => (
          <ManagePlaylistsAndSearch
            compactPlaylistGrid={allPanelsExpanded}
            soloExpanded={manageSoloExpanded}
          />
        ),
        maxWidth: 1050,
      },
      {
        id: "lyrics" as const,
        title: "Lyrics",
        ratio: 27,
        render: () => <LyricPlayerContainer />,
        maxWidth: 700,
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
      manageSoloExpanded,
    ]
  );

  const dynamicColumns = sectionMeta
    .map((section) => (collapsed[section.id] ? "56px" : `${section.ratio}fr`))
    .join(" ");

  const toggleSection = useCallback((id: keyof typeof collapsed) => {
    setCollapsed((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
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
      ? "border-slate-200 bg-lilac/5 text-slate-900 ring-white/40 before:bg-gradient-to-br before:from-white/50 before:via-transparent before:to-slate-100/60 shadow-[0_25px_80px_rgba(4,6,11,0.35)]"
      : "border-white/5 bg-gradient-to-br from-midnight/80 via-amber/5 to-sapphire/80 text-slate-100 ring-white/10 before:bg-gradient-to-br before:from-white/10 before:via-transparent before:to-white/5 shadow-[0_25px_80px_rgba(45,212,191,0.30)]"
  );

  useEffect(() => {
    if (!current) {
      setCollapsed((prev) => {
        if (!previousCollapsedRef.current) {
          previousCollapsedRef.current = prev;
        }
        if (
          prev.tracks === true &&
          prev.lyrics === true &&
          prev.pixabay === true &&
          prev.manage === false
        ) {
          return prev;
        }
        return {
          tracks: true,
          lyrics: true,
          pixabay: true,
          manage: false,
        };
      });
    } else if (previousCollapsedRef.current) {
      setCollapsed(previousCollapsedRef.current);
      previousCollapsedRef.current = null;
    }
  }, [current]);

  return (
    <PlaylistsProvider>
      <SectionsContextProvider value={{ focusOnLyricsPanel }}>
      <main
        className={mainClass}
        style={{ gridTemplateColumns: dynamicColumns }}
      >
        {sectionMeta.map((section) => {
          const isCollapsed = collapsed[section.id];
          const wrapperStyle = section.maxWidth
            ? { maxWidth: `${section.maxWidth}px` }
            : undefined;
          return (
            <div
              key={section.id}
              className={clsx(
                "relative min-w-0 lg:min-h-[calc(80vh-4rem)] transition-all duration-300",
                isCollapsed ? "flex items-start justify-center" : "block"
              )}
            >
              {isCollapsed ? (
                <button
                  type="button"
                  onClick={() => toggleSection(section.id)}
                  className={clsx(
                    "mt-2 flex lg:flex-col w-full lg:w-auto items-center gap-2 rounded-2xl border px-4 lg:px-2 py-1 lg:py-3 text-xs font-semibold uppercase tracking-[0.2em] focus-visible:outline-none focus-visible:ring-2",
                    isLightTheme
                      ? "border-slate-200 bg-white/80 text-slate-600 focus-visible:ring-slate-400"
                      : "border-white/30 bg-teal/5 text-white focus-visible:ring-white"
                  )}
                  aria-label={`Expand ${section.title}`}
                >
                  <span className="text-lg leading-none">+</span>
                  <span className="text-[11px] uppercase tracking-[0.3em]">
                    <span
                      className="hidden lg:inline"
                      style={{
                        writingMode: "vertical-rl",
                        textOrientation: "mixed",
                      }}
                    >
                      {section.title}
                    </span>
                    <span className="lg:hidden">{section.title}</span>
                  </span>
                </button>
              ) : (
                <div
                  className={clsx(
                    "relative flex h-full w-full min-w-0",
                    section.maxWidth ? "justify-center" : "justify-start",
                  )}
                  style={wrapperStyle}
                >
                  <button
                    type="button"
                    onClick={() => toggleSection(section.id)}
                    className={clsx(
                      "absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full border text-lg font-semibold focus-visible:outline-none focus-visible:ring-2",
                      isLightTheme
                        ? "border-slate-200 bg-white/80 text-slate-600 hover:bg-white focus-visible:ring-slate-400"
                        : "border-white/30 bg-black/40 text-white hover:bg-black/60 focus-visible:ring-white"
                    )}
                    aria-label={`Collapse ${section.title}`}
                  >
                    −
                  </button>
                  <div className="h-full w-full">{section.render()}</div>
                </div>
              )}
            </div>
          );
        })}
      </main>
      </SectionsContextProvider>
    </PlaylistsProvider>
  );
}
