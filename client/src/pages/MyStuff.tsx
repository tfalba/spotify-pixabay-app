import { useEffect, useState } from "react";
import LyricPlayerContainer from "../components/LyricPlayerContainer";
import PixabayGrid from "../components/PixabayGrid";
import { useLyricsImages } from "../hooks/useLyricsImages";
import type { Track } from "../types/types";
import { get } from "../lib/fetcher";
import PlaylistPicker from "../components/PlaylistPicker";

export default function MyStuff() {
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
          current.artists[0]?.name || ""
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
    <main className="mt-4 flex flex-1 flex-col gap-6 lg:grid lg:grid-cols-3 xl:grid xl:grid-cols-[25%_31%_41%]">
      <PlaylistPicker
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
  );
}
