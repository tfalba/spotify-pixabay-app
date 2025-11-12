import { useEffect, useState } from "react";
import type { Track } from "./types/types";
import HeaderBar from "./components/HeaderBar";
import Home from "./pages/Home";
import { get } from "./lib/fetcher";
import { useLyricsImages } from "./hooks/useLyricsImages";
import { SpotifyPlayerProvider } from "./context/SpotifyPlayerProvider";


export default function App() {
  const [current, setCurrent] = useState<Track | null>(null);
  const API = import.meta.env.VITE_API_BASE || "http://127.0.0.1:5174";


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
      current.uri ||
      (current.artists[0]?.name && current.name
        ? `${current.artists[0]?.name}::${current.name}`
        : current.id);

    get<{ lyrics: string; source: string }>(
      `${API}/api/lyrics?artist=${encodeURIComponent(
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

  const pixabayProps = { images, keywords, loading, error };

  return (
    <SpotifyPlayerProvider>
      <div className="min-h-screen w-full bg-portfolio-gradient text-slate-100">
        <div className="mx-auto flex min-h-screen w-full max-w-8xl flex-col px-6 pb-12 pt-8 lg:px-10">
          <HeaderBar  />
            <Home current={current} onPick={setCurrent} pixabay={pixabayProps} />
        </div>
      </div>
    </SpotifyPlayerProvider>
  );
}
