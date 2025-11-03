import { useEffect, useState } from "react";
import HeaderBar from "./components/HeaderBar";
import SpotifySearch from "./components/SpotifySearch";
import PixabayGrid from "./components/PixabayGrid";
import LyricsPane from "./components/LyricsPane";
import type { Track } from "./types/types";
import { get } from "./lib/fetcher";
import { useLyricsImages } from "./hooks/useLyricsImages";

export default function App() {
  const [current, setCurrent] = useState<Track | null>(null);

  // hook that calls POST /api/lyrics-to-images and stores results
  const { fetchImages, keywords, images, setImages, loading, error } =
    useLyricsImages();

  // fetch lyrics when artist/title change
  useEffect(() => {
    if (!current?.artists || !current?.name) {
      console.log("stuck in here");
      setImages([]);
      return;
    }
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
    <div className="min-h-screen flex flex-col">
      <HeaderBar current={current} />

      <main className="max-w-8xl w-full mx-auto p-4 flex gap-4">
        <section className="col-span-2 md:col-span-1 space-y-4 flex-1">
          <div className="p-4 rounded-2xl border bg-white">
            {current && (
              <div className="flex items-center gap-3 p-3">

                </div>
            )}
            <div className="mb-4">
              <SpotifySearch onPick={setCurrent} />
            </div>
          </div>
        </section>

        <aside className="col-span-2 md:col-span-1 p-4 rounded-2xl border bg-white flex-1">
          <h2 className="text-sm font-semibold mb-2">Lyrics</h2>
          <LyricsPane
            artist={current?.artists || ""}
            title={current?.name || ""}
          />
        </aside>
        <div className="col-span-2 md:col-span-1 p-4 rounded-2xl border bg-white flex-3">
          <h2 className="text-sm font-semibold mb-2">Pixabay Images</h2>
          <PixabayGrid
            keywords={keywords}
            images={images}
            loading={loading}
            error={error}
          />
        </div>
      </main>
    </div>
  );
}
