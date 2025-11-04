import { useEffect, useState } from "react";
import type { Track } from "./types/types";
import { get } from "./lib/fetcher";
import { useLyricsImages } from "./hooks/useLyricsImages";
import HeaderBar from "./components/HeaderBar";
import SpotifySearch from "./components/SpotifySearch";
import PixabayGrid from "./components/PixabayGrid";
import LyricPlayerContainer from "./components/LyricPlayerContainer";

export default function App() {
  const [current, setCurrent] = useState<Track | null>(null);

  // hook that calls POST /api/lyrics-to-images and stores results
  const {
    fetchImages,
    keywords,
    setKeywords,
    images,
    setImages,
    loading,
    error,
  } = useLyricsImages();

  // fetch lyrics when artist/title change
  useEffect(() => {
    if (!current?.artists || !current?.name) {
      console.log("stuck in here");
      setKeywords([]);
      setImages([]);
      return;
    }
    setImages([]);
    setKeywords([]);
    get<{ lyrics: string; source: string }>(
      `/api/lyrics?artist=${encodeURIComponent(
        current.artists
      )}&title=${encodeURIComponent(current.name)}`
    )
      .then((d) => {
        fetchImages(d.lyrics);
      })
      .catch(() => {
        setImages([]);
      });
  }, [current]);

  return (
    <div className="min-h-screen w-full bg-portfolio-gradient text-slate-100">
      <div className="mx-auto flex min-h-screen w-full max-w-8xl flex-col px-6 pb-12 pt-8 lg:px-10">
        <HeaderBar />

        <main className="mt-10 flex flex-1 flex-col gap-6 lg:grid lg:grid-cols-3 xl:grid xl:grid-cols-[25%_31%_41%]">
          <SpotifySearch onPick={setCurrent} />
          <LyricPlayerContainer current={current} />
          <PixabayGrid
            images={images}
            keywords={keywords}
            loading={loading}
            error={error}
          />
        </main>
      </div>
    </div>
  );
}
