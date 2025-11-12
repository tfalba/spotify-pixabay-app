import LyricPlayerContainer from "../components/LyricPlayerContainer";
import PixabayGrid from "../components/PixabayGrid";
import type { Track } from "../types/types";
import TracksListsContainer from "@/components/TrackListsContainer";
import { useCallback, useState } from "react";

type Props = {
  current: Track | null;
  onPick: (track: Track | null) => void;
  pixabay: {
    images: any[];
    keywords: string[];
    loading: boolean;
    error: string | null;
  };
};

export default function Home({ current, onPick, pixabay }: Props) {
  const [queue, setQueue] = useState<Track[]>([]);

  const handleQueueChange = useCallback(
    (tracks: Track[]) => {
      setQueue(tracks);
      if (!tracks.length) {
        onPick(null);
        return;
      }
      if (current && tracks.some((t) => t.id === current.id)) {
        return;
      }
      onPick(null);
    },
    [current, onPick]
  );

  const handlePick = useCallback(
    (track: Track | null) => {
      onPick(track);
    },
    [onPick]
  );

  const handleTrackFinished = useCallback(() => {
    if (!queue.length || !current) return;
    const idx = queue.findIndex((t) => t.id === current.id);
    if (idx >= 0 && idx + 1 < queue.length) {
      onPick(queue[idx + 1]);
    }
  }, [queue, current, onPick]);

  return (
    <main className="relative mt-4 flex flex-1 flex-col gap-6 rounded-[32px] border border-white/5  p-2 shadow-[0_25px_80px_rgba(4,6,11,0.65)] ring-1 ring-white/10 before:pointer-events-none before:absolute before:inset-0 before:rounded-[32px] before:bg-gradient-to-br before:from-white/10 before:via-transparent before:to-white/5 before:opacity-80 before:blur before:content-[''] lg:grid lg:grid-cols-3 xl:grid xl:grid-cols-[27%_27%_44%]">
      <TracksListsContainer
        onPick={handlePick}
        selectedTrackId={current?.id ?? null}
        handleQueueChange={handleQueueChange}
      ></TracksListsContainer>

      <LyricPlayerContainer
        current={current}
        onTrackFinished={handleTrackFinished}
      />
      <PixabayGrid
        images={pixabay.images}
        keywords={pixabay.keywords}
        loading={pixabay.loading}
        error={pixabay.error}
      />
    </main>
  );
}
