import clsx from "clsx";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { FlipPhotoGrid, type Img } from "./FlipPhotoGrid";
import { useSectionClass } from "@/styleHooks/useStyleHooks";
import type { KeywordPlan } from "@/hooks/useLyricsImages";
import type { HeroImage } from "@/api/lyricsTypes";
import type { StyleCategory } from "@/types/types";
import ArtStyleDropdown from "./ArtStyleDropdown";

export default function PixabayGrid({
  images,
  keywords,
  loading,
  error,
  heroImage,
  heroLoading = false,
  noSelection,
  albumCover,
  trackTitle,
  trackArtist,
  styleChoice = "surprise",
  onStyleChange,
}: {
  images: Img[] | null;
  keywords: KeywordPlan | null;
  loading: boolean;
  error: string | null;
  heroImage?: HeroImage | null;
  heroLoading?: boolean;
  noSelection: boolean;
  albumCover?: string | null;
  trackTitle?: string | null;
  trackArtist?: string | null;
  styleChoice?: StyleCategory | "surprise";
  onStyleChange?: (choice: StyleCategory | "surprise") => void;
}) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const imageList = images ?? [];
  const hasSelection = !noSelection;
  const showAlbumCoverOnly = Boolean(albumCover) && hasSelection && loading;
  const hasImages = imageList.length >= 2;
  const shouldShowGrid = hasImages && !showAlbumCoverOnly;

  const albumCoverForGrid = hasSelection && !loading ? albumCover : null;
  const resolvedStyleName = styleChoice === "surprise" ? "Surprise me" : styleChoice;

  const sectionClass = useSectionClass(false, 3);
  const infoPanelClass = clsx(
    "rounded-2xl border p-3 text-xs shadow-inner",
    "border-white/10 bg-black/20 text-slate-300"
  );
  const keywordPill = clsx(
    "rounded-full border px-3 py-1 text-[11px] uppercase tracking-wide",
    "border-white/20 bg-white/10 text-slate-200"
  );
  const fullScreenClass = clsx(
    "fixed inset-0 z-50 flex h-screen w-screen flex-col",
    "bg-[#070a0f]"
  );
  const fullScreenClose = clsx(
    "rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] transition  focus-visible:outline-none focus-visible:ring-2",
    "border-white/30 bg-white/10 hover:border-white/60 hover:bg-white/20 focus-visible:ring-emerald-200/60 text-white"
  );

  useEffect(() => {
    if (!isFullscreen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isFullscreen]);

  const fullscreenModal = isFullscreen ? (
    <div className={fullScreenClass}>
      <div className="flex flex-wrap items-center justify-between gap-4 p-4">
        <div className="min-w-0 flex-[1.5]">
          {(trackTitle || trackArtist) && (
            <div>
              <p
                className={clsx(
                  "text-xs uppercase tracking-[0.28em] text-slate-400"
                )}
              >
                Currently Playing
              </p>
              <h3
                className={clsx(
                  "truncate text-2xl font-semibold text-slate-50"
                )}
              >
                {trackTitle ?? "Unknown Title"}
              </h3>
              {trackArtist && (
                <p
                  className={clsx(
                    "truncate text-sm text-slate-300"
                  )}
                >
                  {trackArtist}
                </p>
              )}
            </div>
          )}
        </div>
        <div className="flex gap-2 flex-wrap flex-1 justify-end">
          <ArtStyleDropdown
            resolvedStyleName={resolvedStyleName}
            styleChoice={styleChoice}
            onStyleChange={onStyleChange}
          />
          <button
            type="button"
            onClick={() => setIsFullscreen(false)}
            className={fullScreenClose}
          >
            Close
          </button>
        </div>
      </div>
      <div className="mx-auto flex w-full max-w-6xl flex-1 overflow-y-auto p-4 justify-center">
        {imageList.length >= 2 ? (
          <FlipPhotoGrid
            images={imageList}
            gridClassName="w-full grid grid-cols-3 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-3"
            fullScreen={true}
            albumCover={albumCoverForGrid}
            heroImage={heroImage}
            heroLoading={heroLoading}
          />
        ) : (
          <div>
            {albumCover && hasSelection && showAlbumCoverOnly && (
              <div className="m-auto flex items-center justify-center place-items-center">
                <img
                  src={albumCover}
                  alt="Album cover"
                  className="h-80 w-auto rounded-lg shadow-glow"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  ) : null;

  return (
    <>
      <section className={sectionClass}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex flex-col gap-1">
            <h2
              className={clsx(
                "text-lg font-semibold tracking-tight text-slate-50"
              )}
            >
              Visual Moodboard
            </h2>
            <p
              className={clsx(
                "text-sm text-slate-400"
              )}
            >
              Curated image prompts from your selected lyrics.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsFullscreen(true)}
            disabled={!hasSelection}
            className={clsx(
              "rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/60",
              "border-white/30 bg-white/10 text-slate-100 hover:text-white mr-10"
            )}
          >
            Fullscreen
          </button>
        </div>

        <div
          className={`flex flex-col gap-1 ${
            imageList.length === 0 ? "m-auto" : "mt-1"
          }`}
        >
          <div className="flex items-center justify-center mt-4">
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
                <FlipPhotoGrid
                  images={imageList}
                  albumCover={albumCoverForGrid}
                  heroImage={heroImage}
                  heroLoading={heroLoading}
                />
              </div>
            ) :  null}
          </div>

          <div className={infoPanelClass}>
            {(loading ||
              !keywords ||
              keywords.baseKeywords.length === 0) && (
                <div className="flex items-center gap-2 text-emerald-200">
                  <span className="h-2 w-2 animate-ping rounded-full bg-emerald-300 text-text" />
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
              <div className=" flex flex-wrap items-center gap-2">
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

      {fullscreenModal &&
        (typeof document === "undefined"
          ? fullscreenModal
          : createPortal(fullscreenModal, document.body))}
    </>
  );
}
