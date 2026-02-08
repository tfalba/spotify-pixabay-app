import clsx from "clsx";
import { memo, useEffect, useMemo, useState, type CSSProperties } from "react";
import type { HeroImage } from "@/api/lyricsTypes";

export type Img = {
  id: number;
  url: string;
  thumb: string;
  alt: string;
  pageURL: string;
};

const DEFAULT_COLUMNS = 2; // grid defaults to 2 columns on small screens
const MIN_VISIBLE_ROWS = 4;
const BASE_REQUIRED_CARDS = 20;
const MAX_COLUMN_TARGET = 4;
const MAX_COLUMN_TARGET_FULLSCREEN = 5;

function FlipCard({
  front,
  back,
  delay,
  duration,
  fullScreen = false,
}: {
  front: Img;
  back: Img;
  delay: number; // seconds
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
        !fullScreen && "aspect-[1]"
      )}
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
      <span className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-r from-midnight/10 via-white/5 to-emerald-300/20 mix-blend-overlay" />
    </a>
  );
}

const HeroSlot = memo(function HeroSlot({
  heroLoading,
  displayedHeroImage,
}: {
  heroLoading: boolean;
  displayedHeroImage: HeroImage | null;
}) {
  return (
    <div className="col-span-2 row-span-3 overflow-hidden rounded-[28px] shadow-lg md:col-span-2">
      <div className="relative h-full w-full">
        {displayedHeroImage ? (
          <>
            <img
              src={displayedHeroImage.url}
              alt={displayedHeroImage.alt}
              className="h-full w-full object-cover"
              loading="lazy"
            />
            {displayedHeroImage.attribution && (
              <div className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-black/60 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-white/80">
                {displayedHeroImage.attribution}
              </div>
            )}
            {heroLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[1px]">
                <span className="h-10 w-10 animate-spin rounded-full border-4 border-white/40 border-t-emerald-400" />
              </div>
            )}
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="h-10 w-10 animate-spin rounded-full border-4 border-white/30 border-t-emerald-400" />
          </div>
        )}
      </div>
    </div>
  );
});

type IndexConstraints = {
  avoidRows?: number[];
  avoidColumns?: number[];
};

function pickIndexWithParity(
  length: number,
  parity: 0 | 1,
  constraints?: IndexConstraints
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

function FlipPhotoGridBase({
  images,
  gridClassName,
  fullScreen = false,
  albumCover,
  heroImage,
  heroLoading = false,
  heroKey,
}: {
  images: Img[];
  gridClassName?: string;
  fullScreen?: boolean;
  albumCover?: string | null;
  heroImage?: HeroImage | null;
  heroLoading?: boolean;
  heroKey?: string | null;
}) {
  const baseImages = useMemo(() => images.slice(), [images]);
  const usable = useMemo(() => [...baseImages], [baseImages]);

  const usableWithAlbum = useMemo(() => {
    const list = [...usable];
    if (!albumCover || images.length < 2) return list;

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

    const evenIndex = pickIndexWithParity(list.length, 0);
    list.splice(evenIndex, 0, frontImg);
    const frontRow = Math.floor(evenIndex / DEFAULT_COLUMNS);
    const frontColumn = evenIndex % DEFAULT_COLUMNS;

    const oddIndex = pickIndexWithParity(list.length, 1, {
      avoidRows: [frontRow],
      avoidColumns: [frontColumn],
    });
    list.splice(oddIndex, 0, backImg);
    return list;
  }, [albumCover, images.length, usable]);

  const [displayedHeroImage, setDisplayedHeroImage] = useState<HeroImage | null>(
    heroImage ?? null,
  );

  useEffect(() => {
    setDisplayedHeroImage(heroImage ?? null);
  }, [heroKey, heroImage]);

  useEffect(() => {
    if (heroImage) return;
    if (!heroLoading) {
      setDisplayedHeroImage(null);
    }
  }, [heroImage, heroLoading]);

  const heroSlotActive = heroLoading || Boolean(displayedHeroImage);
  const targetColumns = fullScreen
    ? MAX_COLUMN_TARGET_FULLSCREEN
    : MAX_COLUMN_TARGET;
  const requiredCards = Math.max(
    BASE_REQUIRED_CARDS,
    targetColumns * MIN_VISIBLE_ROWS
  ) - (heroSlotActive ? 6 : 0);
  const pairs = useMemo(() => {
    const requiredImages = requiredCards * 2;
    const list = [...usableWithAlbum];

    if (list.length < requiredImages) {
      const pool = baseImages.length ? baseImages : list;
      if (pool.length > 0) {
        let i = 0;
        while (list.length < requiredImages) {
          list.push(pool[i % pool.length]);
          i += 1;
        }
      }
    }

    const maxPairs = Math.min(Math.floor(list.length / 2), requiredCards);
    const next: Array<{ front: Img; back: Img }> = [];
    for (let i = 0; i < maxPairs; i++) {
      next.push({
        front: list[i * 2],
        back: list[i * 2 + 1],
      });
    }
    return next;
  }, [baseImages, requiredCards, usableWithAlbum]);

  const animationTimings = useMemo(
    () =>
      pairs.map(() => ({
        duration: Math.round((8 + Math.random() * 8) * 10) / 10,
        delay: Math.round(Math.random() * 3 * 10) / 10,
      })),
    [pairs]
  );

  const gridClasses = clsx(
    gridClassName ?? "grid grid-cols-3 xl:grid-cols-4 gap-3",
    "auto-rows-[minmax(120px,_auto)]"
  );

  return (
    <div className={gridClasses}>
      {heroSlotActive && (
        <HeroSlot
          heroLoading={heroLoading}
          displayedHeroImage={displayedHeroImage}
        />
      )}
      {pairs.map((p, idx) => {
        const timing = animationTimings[idx];
        return (
          <FlipCard
            key={`${p.front.id}-${p.back.id}-${idx}`}
            front={p.front}
            back={p.back}
            duration={timing?.duration ?? 8}
            delay={timing?.delay ?? 0}
            fullScreen={fullScreen}
          />
        );
      })}
    </div>
  );
}

export const FlipPhotoGrid = memo(FlipPhotoGridBase);
