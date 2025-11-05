import { useEffect, useState } from "react";
import HeaderBar from "../components/HeaderBar";
import SpotifySearch from "../components/SpotifySearch";
import LyricPlayerContainer from "../components/LyricPlayerContainer";
import PixabayGrid from "../components/PixabayGrid";
import type { Track } from "../types/types";
import { get } from "../lib/fetcher";
import { useLyricsImages } from "../hooks/useLyricsImages";

export default function Home() {
  const [current, setCurrent] = useState<Track | null>(null);

  const {
    fetchImages,
    keywords,
    setKeywords,
    images,
    setImages,
    loading,
    error,
  } = useLyricsImages();

  useEffect(() => {
    if (!current?.artists || !current?.name) {
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
        <HeaderBar activePath="/" />

        <main className="mt-4 flex flex-1 flex-col gap-6 lg:grid lg:grid-cols-3 xl:grid xl:grid-cols-[25%_31%_41%]">
          <SpotifySearch
            onPick={setCurrent}
            selectedTrackId={current?.id ?? null}
          />
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
