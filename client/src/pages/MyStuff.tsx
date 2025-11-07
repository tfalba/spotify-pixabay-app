import { useCallback, useEffect, useState } from "react";
import LyricPlayerContainer from "../components/LyricPlayerContainer";
import PixabayGrid from "../components/PixabayGrid";
import { useLyricsImages } from "../hooks/useLyricsImages";
import type { Track } from "../types/types";
import { get } from "../lib/fetcher";
import PlaylistPicker from "../components/PlaylistPicker";

export default function MyStuff() {
  const [current, setCurrent] = useState<Track | null>(null);
  const [queue, setQueue] = useState<Track[]>([]);

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
    if (!current?.artists?.length || !current?.name) {
      setKeywords([]);
      setImages([]);
      return;
    }
    setImages([]);
    setKeywords([]);
    const cacheKey =
      current?.uri ||
      (current?.artists?.[0]?.name && current?.name
        ? `${current.artists[0]?.name}::${current.name}`
        : current?.id);

    get<{ lyrics: string; source: string }>(
      `/api/lyrics?artist=${encodeURIComponent(
        current.artists[0]?.name || ""
      )}&title=${encodeURIComponent(current.name)}`
    )
      .then((d) => {
        fetchImages(d.lyrics, { cacheKey });
      })
      .catch(() => {
        setImages([]);
      });
  }, [current]);

  const handleQueueChange = useCallback((tracks: Track[]) => {
    setQueue(tracks);
    if (!tracks.length) {
      setCurrent(null);
      return;
    }

    setCurrent((prev) => {
      if (!prev) {
        return tracks[0];
      }
      const idx = tracks.findIndex((t) => t.id === prev.id);
      if (idx === -1) {
        return tracks[0];
      }
      return prev;
    });
  }, []);

  const handlePick = useCallback((track: Track | null) => {
    setCurrent(track);
  }, []);

  const handleTrackFinished = useCallback(() => {
    if (!queue.length) return;
    setCurrent((prev) => {
      if (!prev) return queue[0] ?? null;
      const idx = queue.findIndex((t) => t.id === prev.id);
      if (idx >= 0 && idx + 1 < queue.length) {
        return queue[idx + 1];
      }
      return prev;
    });
  }, [queue]);

  return (
    <main className="mt-4 flex flex-1 flex-col gap-6 lg:grid lg:grid-cols-3 xl:grid xl:grid-cols-[25%_31%_41%]">
      <PlaylistPicker
        onPick={handlePick}
        selectedTrackId={current?.id ?? null}
        onQueueChange={handleQueueChange}
      />
      <LyricPlayerContainer current={current} onTrackFinished={handleTrackFinished} />
      <PixabayGrid
        images={images}
        keywords={keywords}
        loading={loading}
        error={error}
      />
    </main>
  );
}
