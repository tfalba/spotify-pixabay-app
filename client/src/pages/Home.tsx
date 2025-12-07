import { useCallback, useState } from "react";
import clsx from "clsx";
import LyricPlayerContainer from "../components/LyricPlayerContainer";
import PixabayGrid from "../components/PixabayGrid";
import type { Track } from "../types/types";
import TracksListsContainer from "@/components/TrackListsContainer";
import { useTheme } from "@/context/ThemeContext";
import { useCurrentTrack } from "@/context/CurrentTrackContext";
import type { KeywordPlan } from "@/hooks/useLyricsImages";
import type { HeroImage, ImageCard } from "@/api/lyricsTypes";

type Props = {
  pixabay: {
    images: ImageCard[] | null;
    keywords: KeywordPlan | null;
    loading: boolean;
    error: string | null;
    heroImage?: HeroImage | null;
  };
  albumCover?: string | null;
};

export default function Home({ pixabay, albumCover }: Props) {
  const { theme } = useTheme();
  const { current, setCurrent } = useCurrentTrack();
  const [queue, setQueue] = useState<Track[]>([]);

  const handleQueueChange = useCallback(
    (tracks: Track[]) => {
      setQueue(tracks);
      if (!tracks.length) {
        setCurrent(null);
        return;
      }
      if (current && tracks.some((t) => t.id === current.id)) {
        return;
      }
      setCurrent(null);
    },
    [current, setCurrent],
  );

  const handleTrackFinished = useCallback(() => {
    if (!queue.length || !current) return;
    const idx = queue.findIndex((t) => t.id === current.id);
    if (idx >= 0 && idx + 1 < queue.length) {
      setCurrent(queue[idx + 1]);
    }
  }, [queue, current, setCurrent]);

  const mainClass = clsx(
    "relative md:mt-4 flex flex-1 flex-col gap-6 rounded-[32px] border md:p-2 ring-1 before:pointer-events-none before:absolute before:inset-0 before:rounded-[32px] before:opacity-80 before:blur before:content-[''] lg:grid lg:grid-cols-3 xl:grid xl:grid-cols-[27%_27%_42%]",
    theme === "light"
      ? "border-slate-200 bg-lilac/15 text-slate-900 ring-white/40 before:bg-gradient-to-br before:from-white/50 before:via-transparent before:to-slate-100/60 shadow-[0_25px_80px_rgba(4,6,11,0.35)]"
      : "border-white/5 bg-gradient-to-br from-midnight/80 via-amber/5 to-sapphire/80 text-slate-100 ring-white/10 before:bg-gradient-to-br before:from-white/10 before:via-transparent before:to-white/5 shadow-[0_25px_80px_rgba(45,212,191,0.30)]",
  );

  return (
    <main className={mainClass}>
      <TracksListsContainer handleQueueChange={handleQueueChange} />

      <LyricPlayerContainer onTrackFinished={handleTrackFinished} />
      <PixabayGrid
        images={pixabay.images}
        keywords={pixabay.keywords}
        loading={pixabay.loading}
        error={pixabay.error}
        heroImage={pixabay.heroImage ?? null}
        noSelection={!albumCover}
        albumCover={albumCover}
      />
    </main>
  );
}
