import { useEffect, useState } from "react";
import HeaderBar from "./components/HeaderBar";
import SpotifySearch from "./components/SpotifySearch";
import PixabayGrid from "./components/PixabayGrid";
import LyricsPane from "./components/LyricsPane";
import type { Track } from "./types/types";
import { get } from "./lib/fetcher";
import { useLyricsImages } from "./hooks/useLyricsImages";
import backgroundPlayer from "./assets/IMG_4028.jpg";

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
    <div className="min-h-screen min-w-[1400px] flex flex-col">
      <HeaderBar />

      <main className="max-w-8xl w-full mx-auto p-4 flex gap-4">
        <div className="p-4 rounded-2xl border bg-white flex-1 min-w-0 flex flex-col">
          <SpotifySearch onPick={setCurrent} />
        </div>

        <aside className="bg-black p-2 rounded-2xl border bg-white flex-[1.1] min-w-0">
          {current && current.preview_url ? (
            <audio controls src={current.preview_url} className="w-full" />
          ) : current ? (
            <iframe
              className="rounded-lg"
              src={`https://open.spotify.com/embed/track/${current.id}`}
              width="100%"
              height="80"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              title="Spotify Player"
            />
          ) : (
            <img
              src={backgroundPlayer}
              alt="background"
              className="rounded-lg w-full h-20 object-cover mt-2"
            />
          )}
          <div className="flex-1 min-w-0 mt-2 p-2 rounded-2xl border">
            <h2 className="text-sm font-semibold mb-2">Lyrics</h2>
            <LyricsPane
              artist={current?.artists || ""}
              title={current?.name || ""}
            />
          </div>
        </aside>
        <div className="p-4 rounded-2xl border bg-white flex-[2.5] min-w-0">
          <PixabayGrid images={images} />
          <div className="flex mb-4 flex-col align-items-center justify-between">
            <h2 className="text-sm font-semibold mb-2">Pixabay Images</h2>
            {/* Keywords */}
            {/* Status for image generation */}
            {loading && (
              <div className="text-xs text-slate-500">Finding images…</div>
            )}
            {error && (
              <div className="text-xs text-red-600">
                Image search error: {error}
              </div>
            )}
            {images?.length === 0 && !loading && !error && (
              <div className="text-xs text-slate-500">No images found.</div>
            )}
            {keywords?.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-slate-400">Keywords:</span>
                {keywords.map((k) => (
                  <span
                    key={k}
                    className="text-xs px-2 py-1 rounded-full bg-slate-800/50 text-slate-200 border border-slate-700"
                  >
                    {k}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
