import clsx from "clsx";
import { useEffect, useState } from "react";
import { FlipPhotoGrid, type Img } from "./FlipPhotoGrid";
import centerLogo from "../assets/center-logo.svg";
import { useTheme } from "@/context/ThemeContext";
import { useSectionClass } from "@/styleHooks/useStyleHooks";
import type { KeywordPlan } from "@/hooks/useLyricsImages";
import type { HeroImage } from "@/api/lyricsTypes";

export default function PixabayGrid({
  images,
  keywords,
  loading,
  error,
  heroImage,
  noSelection,
  albumCover,
}: {
  images: Img[];
  keywords: KeywordPlan | null;
  loading: boolean;
  error: string | null;
  heroImage?: HeroImage | null;
  noSelection: boolean;
  albumCover?: string | null;
}) {
  const { theme } = useTheme();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const isLight = theme === "light";
  const hasSelection = !noSelection;
  const showAlbumCoverOnly = Boolean(albumCover) && hasSelection && loading;
  const hasImages = images.length >= 2;
  const shouldShowGrid = hasImages && !showAlbumCoverOnly;
  const shouldShowPlaceholderLogo = noSelection && !hasImages && !showAlbumCoverOnly;
  const albumCoverForGrid = hasSelection && !loading ? albumCover : null;

  const sectionClass = useSectionClass(isLight, 3);
  const infoPanelClass = clsx(
    "rounded-2xl border p-4 text-xs shadow-inner transition-colors duration-300",
    isLight
      ? "border-slate-200 bg-slate-50 text-slate-600"
      : "border-white/10 bg-black/20 text-slate-300",
  );
  const keywordPill = clsx(
    "rounded-full border px-3 py-1 text-[11px] uppercase tracking-wide transition-colors duration-300",
    isLight ? "border-slate-200 bg-white text-slate-600" : "border-white/20 bg-white/10 text-slate-200",
  );
  const fullScreenClass = clsx("fixed inset-0 z-50 flex h-screen w-screen flex-col", isLight ? "bg-white" : "bg-black/90");
  const fullScreenClose = clsx("rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] transition  focus-visible:outline-none focus-visible:ring-2",
    isLight ? "border-lilac/80 bg-lilac/10 hover:border-lilac/100 hover:bg-lical/30 focus-visible-lilac text-slate-900" : "border-white/30 bg-white/10 hover:border-white/60 hover:bg-white/20 focus-visible:ring-white text-white"
  )

  useEffect(() => {
    if (!isFullscreen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isFullscreen]);

  return (
    <>
      <section className={sectionClass}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2
              className={clsx(
                "text-lg font-semibold tracking-tight",
                isLight ? "text-slate-900" : "text-slate-50",
              )}
            >
              Visual Moodboard
            </h2>
            <p className={clsx("text-sm", isLight ? "text-slate-500" : "text-slate-400")}>
              Curated image prompts from your selected lyrics.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsFullscreen(true)}
            disabled={ !hasSelection}
            className={clsx(
              "rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500",
              isLight
                ? "border-slate-200 bg-white text-slate-600 hover:text-slate-900"
                : "border-white/30 bg-white/10 text-slate-100 hover:text-white",
            )}
          >
            Fullscreen
          </button>
        </div>

        <div className={`flex flex-col gap-4 ${images.length === 0 ? "m-auto" : "mt-4"}`}>
          <div>
            {albumCover && hasSelection && showAlbumCoverOnly && (
              <div className="m-auto place-items-center">
                <img
                  src={albumCover}
                  alt="Album cover"
                  className="h-80 w-auto rounded-lg shadow-glow"
                />
              </div>
            )}
          </div>
          <div className="flex flex-col gap-4">
            {shouldShowGrid ? (
              <div className="mt-4">
                <FlipPhotoGrid images={images} albumCover={albumCoverForGrid} heroImage={heroImage} />
              </div>
            ) : shouldShowPlaceholderLogo ? (
              <div className="m-auto place-items-center">
                <img
                  src={centerLogo}
                  alt="App logo"
                  className="h-80 w-auto animate-flipY"
                />
              </div>
            ) : null}
          </div>

          <div className={infoPanelClass}>
            {loading || !keywords || keywords.baseKeywords.length === 0 && (
              <div className="flex items-center gap-2 text-teal-500">
                <span className="h-2 w-2 animate-ping rounded-full bg-teal-500" />
                Finding imagery…
              </div>
            )}
            {/* {error && (
              <div className="text-red-400">Image search error: {error}</div>
            )} */}
            {/* // Currently not showing error to user */}
            {noSelection && !loading && !error && (
              <div>No images yet. Pick a track to get inspired.</div>
            )}
            {!!keywords && keywords?.topSingles.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-slate-400">Keywords:</span>
                {keywords.topSingles.map((k) => (
                  <span key={k} className={keywordPill}>
                    {k}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {isFullscreen && (
        <div className={fullScreenClass}>
          <div className="flex items-center justify-end gap-2 p-4">
            <button
              type="button"
              onClick={() => setIsFullscreen(false)}
              className={fullScreenClose}
            >
              Close
            </button>
          </div>
          <div className="mx-auto flex w-full max-w-6xl flex-1 overflow-y-auto p-4">
            {images.length >= 2 ? (
              <FlipPhotoGrid
                images={images}
                gridClassName="w-full grid grid-cols-3 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-3"
                fullScreen={true}
                albumCover={albumCoverForGrid}
                heroImage={heroImage}
              />
            ) : (
              <div className="m-auto text-center text-sm text-white/80">
                No images yet. Pick a track to get inspired.
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
