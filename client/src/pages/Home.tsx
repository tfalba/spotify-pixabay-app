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
import { useCurrentTrackData } from "@/context/CurrentTrackContext";
import type { KeywordPlan } from "@/hooks/useLyricsImages";
import type { HeroImage, ImageCard } from "@/api/lyricsTypes";
import type { StyleCategory } from "@/types/types";
import { SectionsProvider } from "@/context/SectionsContext";
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
  const { current } = useCurrentTrackData();
  const [collapsed, setCollapsed] = useState<{
    manage: boolean;
    lyrics: boolean;
    pixabay: boolean;
  }>({
    manage: true,
    lyrics: false,
    pixabay: false,
  });
  const previousCollapsedRef = useRef<typeof collapsed | null>(null);

  const allPanelsExpanded =
    !collapsed.manage && (collapsed.lyrics || collapsed.pixabay);

  const sectionMeta = useMemo<SectionConfig[]>(
    () => [
      {
        id: "manage" as const,
        title: "Manage Playlists",
        ratio: 36,
        render: () => (
          <ManagePlaylistsAndSearch
            compactPlaylistGrid={allPanelsExpanded}
            twoColumnOnLarge={allPanelsExpanded}
          />
        ),
        maxWidth: 1050,
      },
      {
        id: "lyrics" as const,
        title: "Lyrics",
        ratio: 25,
        render: () => <LyricPlayerContainer />,
        maxWidth: 1050,
      },
      {
        id: "pixabay" as const,
        title: "Visual Moodboard",
        ratio: 39,
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

  const dynamicRows = useMemo(
    () =>
      sectionMeta
        .map((section) =>
          collapsed[section.id] ? "56px" : `${section.ratio}fr`
        )
        .join(" "),
    [sectionMeta, collapsed]
  );

  type SectionId = SectionConfig["id"];

  const expandButtonRefs = useRef<Record<SectionId, HTMLButtonElement | null>>({
    manage: null,
    lyrics: null,
    pixabay: null,
  });

  const toggleSection = useCallback((id: SectionId) => {
    setCollapsed((prev) => {
      const willCollapse = !prev[id];
      if (willCollapse) {
        window.setTimeout(() => {
          expandButtonRefs.current[id]?.focus();
        }, 0);
      }
      return {
        ...prev,
        [id]: !prev[id],
      };
    });
  }, []);

  const mainClass = clsx(
    "relative flex flex-1 flex-col gap-6 rounded-[34px] border md:p-4 ring-1 before:pointer-events-none before:absolute before:inset-0 before:rounded-[34px] before:opacity-80 before:blur before:content-[''] lg:grid",
    "border-white/10 bg-[#0a0e13] text-slate-100 ring-white/10 before:bg-gradient-to-br before:from-white/10 before:via-transparent before:to-amber-500/10 shadow-[0_20px_50px_rgba(124,92,252,0.25)] "
  );

  useEffect(() => {
    if (!current) {
      setCollapsed((prev) => {
        if (!previousCollapsedRef.current) {
          previousCollapsedRef.current = prev;
        }
        if (
          prev.manage === false &&
          prev.lyrics === true &&
          prev.pixabay === true
        ) {
          return prev;
        }
        return {
          manage: false,
          lyrics: true,
          pixabay: true,
        };
      });
    } else if (previousCollapsedRef.current) {
      setCollapsed(previousCollapsedRef.current);
      previousCollapsedRef.current = null;
    }
  }, [current]);

  return (
    <PlaylistsProvider>
      <SectionsProvider>
        <main
          className={mainClass}
          style={{
            gridTemplateColumns: dynamicRows,
            transition: "grid-template-rows 320ms cubic-bezier(0.4, 0, 0.2, 1)",
          }}
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
                  "relative min-w-0 lg:min-h-[calc(80vh-4rem)]",
                  isCollapsed
                    ? "flex justify-end items-start lg:justify-start"
                    : "block"
                )}
              >
                {isCollapsed && (
                  <button
                    type="button"
                    onClick={() => toggleSection(section.id)}
                    ref={(node) => {
                      expandButtonRefs.current[section.id] = node;
                    }}
                    className={clsx(
                      "mt-2 mx-2 flex flex-row-reverse lg:flex-col w-fit lg:w-auto items-center gap-2 rounded-2xl border px-4 lg:px-2 py-1 lg:py-3 text-xs font-semibold uppercase tracking-[0.2em] focus-visible:outline-none focus-visible:ring-2",
                      "border-white/50 bg-transparent text-white/80 focus-visible:ring-emerald-300/50"
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
                )}
                <div
                  className={clsx(
                    "relative flex h-full w-full min-w-0",
                    section.maxWidth ? "justify-center" : "justify-start",
                    "transform-gpu transition-transform duration-300",
                    isCollapsed
                      ? "pointer-events-none opacity-0 translate-y-3 hidden"
                      : "translate-y-0 flex"
                  )}
                  style={wrapperStyle}
                  inert={isCollapsed || undefined}
                >
                  <button
                    type="button"
                    onClick={() => toggleSection(section.id)}
                    className={clsx(
                      "absolute right-4 top-2 z-10 flex h-9 w-9 items-center justify-center rounded-full border text-lg font-semibold focus-visible:outline-none focus-visible:ring-2",
                      "border-white/15 bg-black/50 text-white hover:bg-black/70 focus-visible:ring-emerald-300/50"
                    )}
                    aria-label={`Collapse ${section.title}`}
                  >
                    −
                  </button>
                  <div
                    className={clsx(
                      "h-full w-full",
                      isCollapsed ? "hidden" : "block"
                    )}
                  >
                    {section.render()}
                  </div>
                </div>
              </div>
            );
          })}
        </main>
      </SectionsProvider>
    </PlaylistsProvider>
  );
}
