import { FlipPhotoGrid } from "./FlipPhotoGrid";

export default function PixabayGrid({
  images,
  keywords,
  loading,
  error,
}: {
  images: any[];
  keywords: string[];
  loading: boolean;
  error: string | null;
}) {
  return (
    <section className=" xl:col-span-1 xl:col-start-3
           flex min-w-0 flex-col rounded-3xl border border-[white]/90
           bg-gradient-to-br from-[sapphire/90] via-[aurora/80] to-[sapphire/70] p-6 shadow-glow max-h-[max(600px,calc(100vh-10rem))] overflow-y-scroll">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-slate-50">
          Visual Moodboard
        </h2>
        <p className="text-sm text-slate-400">
          Curated image prompts from your selected lyrics.
        </p>
      </div>

      <div className="mt-4 flex flex-col gap-4">
        <div className="flex flex-col gap-4">
          {images.length >= 2 && (
            <div className="mt-4">
              <FlipPhotoGrid images={images} />
            </div>
          )}
       
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-xs text-slate-300 shadow-inner">
          {loading && (
            <div className="flex items-center gap-2 text-teal">
              <span className="h-2 w-2 animate-ping rounded-full bg-teal" />
              Finding imagery…
            </div>
          )}
          {error && (
            <div className="text-red-400">Image search error: {error}</div>
          )}
          {images?.length === 0 && !loading && !error && (
            <div>No images yet. Pick a track to get inspired.</div>
          )}
          {keywords?.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-slate-400">Keywords:</span>
              {keywords.map((k) => (
                <span
                  key={k}
                  className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] uppercase tracking-wide text-slate-200"
                >
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
