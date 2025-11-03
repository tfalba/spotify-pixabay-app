export default function PixabayGrid({ images }: { images: any[] }) {
  return (
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
  );
}
