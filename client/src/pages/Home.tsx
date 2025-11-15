import { useCallback, useState } from "react";
import clsx from "clsx";
import LyricPlayerContainer from "../components/LyricPlayerContainer";
import PixabayGrid from "../components/PixabayGrid";
import type { Track } from "../types/types";
import TracksListsContainer from "@/components/TrackListsContainer";
import { useTheme } from "@/context/ThemeContext";
import { useCurrentTrack } from "@/context/CurrentTrackContext";
import type { Img } from "@/components/FlipPhotoGrid";

type Props = {
  pixabay: {
    images: Img[];
    keywords: string[];
    loading: boolean;
    error: string | null;
  };
};

export default function Home({ pixabay }: Props) {
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
    "relative mt-4 flex flex-1 flex-col gap-6 rounded-[32px] border p-2 ring-1 before:pointer-events-none before:absolute before:inset-0 before:rounded-[32px] before:opacity-80 before:blur before:content-[''] lg:grid lg:grid-cols-3 xl:grid xl:grid-cols-[27%_27%_42%]",
    theme === "light"
      ? "border-slate-200 bg-white text-slate-900 ring-white/40 before:bg-gradient-to-br before:from-white/50 before:via-transparent before:to-slate-100/60 shadow-[0_25px_80px_rgba(4,6,11,0.65)]"
      : "border-white/5 bg-gradient-to-br from-lilac/30 via-aurora/60 to-sapphire/80 text-slate-100 ring-white/10 before:bg-gradient-to-br before:from-white/10 before:via-transparent before:to-white/5 shadow-[0_25px_80px_rgba(45,212,191,0.65)]",
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
      />
    </main>
  );
}
