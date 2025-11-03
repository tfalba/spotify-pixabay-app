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
    <section className="col-span-4 flex min-w-0 flex-col rounded-3xl border border-teal/40 bg-gradient-to-br from-sapphire/90 via-aurora/80 to-sapphire/70 p-6 shadow-glow">
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
          {images?.length > 0 && (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {images.map((img) => (
                <a
                  key={img.id}
                  href={img.pageURL}
                  target="_blank"
                  rel="noreferrer"
                  className="group overflow-hidden rounded-2xl border border-white/10 bg-black/20 shadow-soft transition hover:border-teal/60 hover:shadow-glow"
                  title={img.alt}
                >
                  <img
                    src={img.thumb}
                    alt={img.alt}
                    className="h-32 w-full object-cover transition duration-200 ease-out group-hover:scale-[1.05]"
                    loading="lazy"
                  />
                </a>
              ))}
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
