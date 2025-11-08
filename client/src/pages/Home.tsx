import SpotifySearch from "../components/SpotifySearch";
import LyricPlayerContainer from "../components/LyricPlayerContainer";
import PixabayGrid from "../components/PixabayGrid";
import type { Track } from "../types/types";

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
  return (
    <main className="mt-4 flex flex-1 flex-col gap-6 lg:grid lg:grid-cols-3 xl:grid xl:grid-cols-[25%_31%_41%]">
      <SpotifySearch onPick={onPick} selectedTrackId={current?.id ?? null} />
      <LyricPlayerContainer current={current} />
      <PixabayGrid
        images={pixabay.images}
        keywords={pixabay.keywords}
        loading={pixabay.loading}
        error={pixabay.error}
      />
    </main>
  );
}
