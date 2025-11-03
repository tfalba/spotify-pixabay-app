export default function PixabayGrid({ loading, error, keywords, images }: { loading: boolean; error: string | null; keywords: string[]; images: any[] }) {


  return (
        <div className="flex flex-col gap-4">
     
      {/* Status for image generation */}
      {loading && (
        <div className="text-xs text-slate-500">Finding images…</div>
      )}
      {error && (
        <div className="text-xs text-red-600">Image search error: {error}</div>
      )}
      {images?.length === 0 && !loading && !error && (
        <div className="text-xs text-slate-500">No images found.</div>
      )}

      {/* Keywords */}
      {keywords?.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400">Keywords:</span>
          {keywords.map((k) => (
            <span
              key={k}
              className="text-xs px-2 py-1 rounded-full bg-slate-800/50 text-slate-200 border border-slate-700"
            >
              {k}
            </span>
          ))}
        </div>
      )}

      {/* Image grid (12 total, shuffled by server) */}
      {images?.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {images.map((img) => (
            <a
              key={img.id}
              href={img.pageURL}
              target="_blank"
              rel="noreferrer"
              className="group block rounded overflow-hidden border border-slate-800"
              title={img.alt}
            >
              <img
                src={img.thumb}
                alt={img.alt}
                className="w-full h-32 object-cover transition-transform duration-150 group-hover:scale-[1.03]"
                loading="lazy"
              />
            </a>
          ))}
        </div>
      )}
        </div>
  );
}
