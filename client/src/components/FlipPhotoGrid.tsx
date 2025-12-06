import clsx from "clsx";
import type { CSSProperties } from "react";
import type { HeroImage } from "@/api/lyricsTypes";

export type Img = {
  id: number;
  url: string;
  thumb: string;
  alt: string;
  pageURL: string;
};

const DEFAULT_COLUMNS = 2; // grid defaults to 2 columns on small screens

function FlipCard({
  front, back, delay, duration, fullScreen = false
}: {
  front: Img;
  back: Img;
  delay: number;    // seconds
  duration: number; // seconds
  fullScreen: boolean;
}) {
  return (
    <a
      href={front.pageURL}
      target="_blank"
      rel="noreferrer"
      title={front.alt}
      className={clsx(
  "relative block w-full overflow-hidden rounded-xl border-midnight-800/60 perspective-1000",
  !fullScreen && "aspect-[4/3]"
)}
      // className={clsx(`"relative block w-full  overflow-hidden rounded-xl border-midnight-800/60 perspective-1000", ${!fullScreen} && "aspect-[4/3]"`)}
      // className="relative block w-full aspect-[4/3] overflow-hidden rounded-xl border-midnight-800/60 perspective-1000"
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



type IndexConstraints = {
  avoidRows?: number[];
  avoidColumns?: number[];
};

function pickIndexWithParity(
  length: number,
  parity: 0 | 1,
  constraints?: IndexConstraints,
): number {
  const maxIndex = Math.max(0, length);
  const valid: number[] = [];
  for (let i = parity; i <= maxIndex; i += 2) {
    const row = Math.floor(i / DEFAULT_COLUMNS);
    const col = i % DEFAULT_COLUMNS;
    const blockedRow = constraints?.avoidRows?.includes(row);
    const blockedCol = constraints?.avoidColumns?.includes(col);
    if (blockedRow || blockedCol) continue;
    valid.push(i);
  }

  if (valid.length === 0) {
    const fallback: number[] = [];
    for (let i = parity; i <= maxIndex; i += 2) fallback.push(i);
    if (!fallback.length) return maxIndex;
    return fallback[Math.floor(Math.random() * fallback.length)];
  }

  const randomIdx = Math.floor(Math.random() * valid.length);
  return valid[randomIdx];
}

export function FlipPhotoGrid({
  images,
  gridClassName,
  fullScreen = false,
  albumCover,
  heroImage,
}: {
  images: Img[];
  gridClassName?: string;
  fullScreen?: boolean;
  albumCover?: string | null;
  heroImage?: HeroImage | null;
}) {
  // Need at least 30; if fewer, just slice pairs we have
  const base = images.slice(0, 30);
  const usable = [...base];

  if (albumCover && images.length >= 2) {
    const frontImg: Img = {
      id: Number.MIN_SAFE_INTEGER,
      url: albumCover,
      thumb: albumCover,
      alt: "Album cover",
      pageURL: albumCover,
    };
    const backImg: Img = {
      ...frontImg,
      id: Number.MIN_SAFE_INTEGER + 1,
    };

    const evenIndex = pickIndexWithParity(usable.length, 0);
    usable.splice(evenIndex, 0, frontImg);
    const frontRow = Math.floor(evenIndex / DEFAULT_COLUMNS);
    const frontColumn = evenIndex % DEFAULT_COLUMNS;

    const oddIndex = pickIndexWithParity(usable.length, 1, {
      avoidRows: [frontRow],
      avoidColumns: [frontColumn],
    });
    usable.splice(oddIndex, 0, backImg);
  }

  const pairs: Array<{ front: Img; back: Img }> = [];

  for (let i = 0; i < 15 && i * 2 + 1 < usable.length; i++) {
    pairs.push({
      front: usable[i * 2],
      back: usable[i * 2 + 1],
    });
  }

  const gridClasses = clsx(
    gridClassName ?? "grid grid-cols-2 md:grid-cols-3 gap-3",
    "auto-rows-[minmax(140px,_auto)]",
  );

  return (
    <div className={gridClasses}>
      {heroImage && (
        <div className="col-span-2 row-span-3 overflow-hidden rounded-[28px] shadow-lg md:col-span-2">
          <div className="relative h-full w-full">
            <img
              src={heroImage.url}
              alt={heroImage.alt}
              className="h-full w-full object-cover"
              loading="lazy"
            />
            {heroImage.attribution && (
              <div className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-black/60 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-white/80">
                {heroImage.attribution}
              </div>
            )}
          </div>
        </div>
      )}
      {pairs.map((p, idx) => {
        // randomized timing per tile
        const duration = Math.round((8 + Math.random() * 8) * 10) / 10; // 4–8s -- now 8-16s
        const delay = Math.round((Math.random() * 3) * 10) / 10;        // 0–3s
        return (
          <FlipCard
            key={`${p.front.id}-${p.back.id}-${idx}`}
            front={p.front}
            back={p.back}
            duration={duration}
            delay={delay}
            fullScreen={fullScreen}
          />
        );
      })}
    </div>
  );
}
