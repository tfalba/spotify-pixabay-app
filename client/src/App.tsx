import { useEffect, useState } from "react";
import clsx from "clsx";
import type { Track } from "./types/types";
import HeaderBar from "./components/HeaderBar";
import Home from "./pages/Home";
import { get } from "./lib/fetcher";
import { useLyricsImages } from "./hooks/useLyricsImages";
import { SpotifyPlayerProvider } from "./context/SpotifyPlayerProvider";
import { ThemeProvider, useTheme } from "./context/ThemeContext";

function AppContent() {
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

  const { theme } = useTheme();
  const pageBg = clsx(
    "min-h-screen w-full transition-colors duration-300",
    theme === "light" ? "bg-slate-50 text-slate-900" : "bg-portfolio-gradient text-slate-100",
  );
  const shell = clsx(
    "mx-auto flex min-h-screen w-full max-w-[1700px] flex-col px-6 pb-12 pt-8 lg:px-10 transition-colors duration-300",
    theme === "light" ? "text-slate-900" : "text-slate-100",
  );

  return (
    <SpotifyPlayerProvider>
      <div className={pageBg}>
        <div className={shell}>
          <HeaderBar />
          <Home current={current} onPick={setCurrent} pixabay={pixabayProps} />
        </div>
      </div>
    </SpotifyPlayerProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
