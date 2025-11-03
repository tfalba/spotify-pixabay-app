export default function PixabayGrid({ images }: { images: any[] }) {


  return (
        <div className="flex flex-col gap-4">

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
                className="w-full h-50 object-cover transition-transform duration-150 group-hover:scale-[1.03]"
                loading="lazy"
              />
            </a>
          ))}
        </div>
      )}
        </div>
  );
}
