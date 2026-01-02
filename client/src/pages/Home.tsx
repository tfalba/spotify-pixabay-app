import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type JSX,
} from "react";
import clsx from "clsx";
import { motion } from "framer-motion";
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
  lyricsAvailable?: boolean;
};

type SectionConfig = {
  id: "manage" | "lyrics" | "pixabay";
  title: string;
  ratio: number;
  render: () => JSX.Element;
  maxWidth?: number;
};

export default function Home({ pixabay, albumCover, lyricsAvailable }: Props) {
  const { current } = useCurrentTrackData();
  const [collapsed, setCollapsed] = useState<{
    manage: boolean;
    lyrics: boolean;
    pixabay: boolean;
  }>({
    manage: false,
    lyrics: true,
    pixabay: true,
  });
  const autoExpandedRef = useRef<string | null>(null);
  const lastTrackKeyRef = useRef<string | null>(null);
  const trackKey = current?.uri ?? current?.id ?? null;
  const panelsReady = Boolean(lyricsAvailable && albumCover);

  const somePanelsExpanded =
    !collapsed.manage && (collapsed.lyrics || collapsed.pixabay);

  const allPanelsExpanded =
    !collapsed.manage && collapsed.lyrics && collapsed.pixabay;

  const sectionMeta = useMemo<SectionConfig[]>(
    () => [
      {
        id: "manage" as const,
        title: "Manage Playlists",
        ratio: 36,
        render: () => (
          <ManagePlaylistsAndSearch
            compactPlaylistGrid={somePanelsExpanded}
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
      somePanelsExpanded,
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
    "relative flex flex-1 flex-col gap-4 rounded-[34px] border p-4 ring-1 before:pointer-events-none before:absolute before:inset-0 before:rounded-[34px] before:opacity-80 before:blur before:content-[''] lg:grid",
    "border-white/10 bg-[#0a0e13] text-slate-100 ring-white/10 before:bg-gradient-to-br before:from-white/10 before:via-transparent before:to-amber-500/10 shadow-[0_20px_50px_rgba(124,92,252,0.25)] "
  );

  useEffect(() => {
    if (trackKey === lastTrackKeyRef.current) return;

    lastTrackKeyRef.current = trackKey;
    autoExpandedRef.current = null;

    if (!trackKey) return;

    setCollapsed((prev) => ({
      ...prev,
      lyrics: true,
      pixabay: true,
    }));
  }, [trackKey]);

  useEffect(() => {
    if (!trackKey) {
      autoExpandedRef.current = null;
      setCollapsed((prev) => {
        if (!prev.manage && prev.lyrics && prev.pixabay) return prev;
        return {
          manage: false,
          lyrics: true,
          pixabay: true,
        };
      });
      return;
    }

    if (!panelsReady || autoExpandedRef.current === trackKey) return;

    setCollapsed((prev) => ({
      ...prev,
      lyrics: false,
      pixabay: false,
    }));
    autoExpandedRef.current = trackKey;
  }, [trackKey, panelsReady]);

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
                  "relative min-w-0 lg:min-h-[calc(50vh-4rem)] pb-4 rounded-2xl",
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
                      "mt-2 mx-2 flex flex-row-reverse lg:flex-col w-fit lg:w-auto items-center gap-2 rounded-2xl border px-2 lg:px-2 pl-4 lg:pl-2 py-2 lg:py-3 text-s font-semibold uppercase tracking-[0.2em] focus-visible:outline-none focus-visible:ring-2",
                      "border-white/50 bg-transparent text-white/80 focus-visible:ring-emerald-300/50 shadow-[0_20px_50px_rgba(0,150,136,0.55)]"
                    )}
                    aria-label={`Expand ${section.title}`}
                  >
                    <span className="text-lg leading-none">+</span>
                    <span className="text-[12px] uppercase tracking-[0.3em]">
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
                <motion.div
                  className={clsx(
                    "relative flex w-full min-w-0 overflow-hidden rounded-2xl",
                    section.maxWidth ? "justify-center" : "justify-start",
                    isCollapsed
                      ? "pointer-events-none hidden"
                      : "pointer-events-auto flex"
                  )}
                  style={wrapperStyle}
                  animate={
                    isCollapsed
                      ? { height: 0, opacity: 0, y: 12 }
                      : { height: "auto", opacity: 1, y: 0 }
                  }
                  initial={false}
                  transition={{ duration: 0.28, ease: "easeOut" }}
                  inert={isCollapsed || undefined}
                >
                  <div className="relative h-full w-full">
                    <button
                      type="button"
                      onClick={() => toggleSection(section.id)}
                      className={clsx(
                        "absolute right-2 top-2 md:right-5 md:top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full border font-semibold focus-visible:outline-none focus-visible:ring-2",
                        "border-white/15 bg-black/50 text-white/80 hover:bg-black/70 focus-visible:ring-emerald-300/50 text-[12px] uppercase tracking-[0.3em]"
                      )}
                      aria-label={`Collapse ${section.title}`}
                    >
                      −
                    </button>
                    <div className="h-full w-full p-0 md:pt-2 md:px-1 xl:px-3 pb-4">
                      {section.render()}
                    </div>
                  </div>
                </motion.div>
              </div>
            );
          })}
        </main>
      </SectionsProvider>
    </PlaylistsProvider>
  );
}
