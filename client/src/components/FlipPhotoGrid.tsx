import type { CSSProperties } from "react";

type Img = {
  id: number;
  url: string;
  thumb: string;
  alt: string;
  pageURL: string;
};

function FlipCard({
  front, back, delay, duration,
}: {
  front: Img;
  back: Img;
  delay: number;    // seconds
  duration: number; // seconds
}) {
  return (
    <a
      href={front.pageURL}
      target="_blank"
      rel="noreferrer"
      title={front.alt}
      className="relative block w-full aspect-[4/3] overflow-hidden rounded-xl border-midnight-800/60 perspective-1000"
    >
      {/* flipper */}
      <span
        className="absolute inset-0 block transform-gpu preserve-3d animate-flipY"
        style={
          {
            animationDuration: `${duration}s`,
            animationDelay: `${delay}s`,
            willChange: "transform",
          } as CSSProperties
        }
      >
        {/* Front face */}
        <img
          src={front.thumb || front.url}
          alt={front.alt}
          className="absolute inset-0 h-full w-full rounded-xl object-cover backface-hidden"
          style={{ transform: "rotateY(0deg)" }}
          loading="lazy"
        />

        {/* Back face */}
        <img
          src={back.thumb || back.url}
          alt={back.alt}
          className="absolute inset-0 h-full w-full rounded-xl object-cover backface-hidden"
          style={{ transform: "rotateY(180deg)" }}
          loading="lazy"
        />
      </span>

      {/* optional rim */}
      <span className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-r from-midnight/10 via-white/5 to-teal/20 mix-blend-overlay" />
    </a>
  );
}



export function FlipPhotoGrid({ images }: { images: Img[] }) {
  // Need at least 30; if fewer, just slice pairs we have
  const usable = images.slice(0, 30);
  const pairs: Array<{ front: Img; back: Img }> = [];

  for (let i = 0; i < 15 && i * 2 + 1 < usable.length; i++) {
    pairs.push({
      front: usable[i * 2],
      back: usable[i * 2 + 1],
    });
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {pairs.map((p, idx) => {
        // randomized timing per tile
        const duration = Math.round((4 + Math.random() * 4) * 10) / 10; // 4–8s
        const delay = Math.round((Math.random() * 3) * 10) / 10;        // 0–3s
        return (
          <FlipCard
            key={`${p.front.id}-${p.back.id}-${idx}`}
            front={p.front}
            back={p.back}
            duration={duration}
            delay={delay}
          />
        );
      })}
    </div>
  );
}
