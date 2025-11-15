import clsx from "clsx";
import { FlipPhotoGrid, type Img } from "./FlipPhotoGrid";
import centerLogo from "../assets/center-logo.svg";
import { useTheme } from "@/context/ThemeContext";

export default function PixabayGrid({
  images,
  keywords,
  loading,
  error,
}: {
  images: Img[];
  keywords: string[];
  loading: boolean;
  error: string | null;
}) {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const sectionClass = clsx(
    "xl:col-span-1 xl:col-start-3 flex min-w-0 flex-col rounded-3xl border p-4 shadow-glow max-h-[max(600px,calc(100vh-10rem))] overflow-y-scroll transition-colors duration-300",
    isLight ? "border-slate-200 bg-white text-slate-900" : "border-white/90 bg-black/30 text-slate-100",
  );
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

  return (
    <section className={sectionClass}>
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

      <div
        className={`flex flex-col gap-4 ${
          (!images.length || images.length === 0) ?  "m-auto" : "mt-4"
        }`}
      >
        <div className="flex flex-col gap-4">
          {images.length >= 2 ? (
            <div className="mt-4">
              <FlipPhotoGrid images={images} />
            </div>
          ) : (
        
            <div className="m-auto place-items-center">
              <img
                src={ centerLogo}
                alt="App logo"
                className="h-80 w-auto animate-flipY"
              />
            </div>
          )}
        </div>

        <div className={infoPanelClass}>
          {loading && (
            <div className="flex items-center gap-2 text-teal-500">
              <span className="h-2 w-2 animate-ping rounded-full bg-teal-500" />
              Finding imagery…
            </div>
          )}
          {/* {error && (
            <div className="text-red-400">Image search error: {error}</div>
          )} */}
          {/* // Currently not showing error to user */}
          {images?.length === 0 && !loading && !error && (
            <div>No images yet. Pick a track to get inspired.</div>
          )}
          {keywords?.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-slate-400">Keywords:</span>
              {keywords.map((k) => (
                <span key={k} className={keywordPill}>
                  {k}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
