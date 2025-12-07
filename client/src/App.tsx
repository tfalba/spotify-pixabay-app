import { useEffect, useState } from "react";
import clsx from "clsx";
import HeaderBar from "./components/HeaderBar";
import Home from "./pages/Home";
import { get } from "./lib/fetcher";
import { useLyricsImages } from "./hooks/useLyricsImages";
import { SpotifyPlayerProvider } from "./context/SpotifyPlayerProvider";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import { CurrentTrackProvider, useCurrentTrack } from "./context/CurrentTrackContext";
import type { StyleCategory } from "./types/types";
import { STYLE_CATEGORIES } from "./types/types";

function AppContent() {
  const { current, albumCover } = useCurrentTrack();
  const API = import.meta.env.VITE_API_BASE || "http://127.0.0.1:5174";
  const [styleChoice, setStyleChoice] = useState<StyleCategory | "surprise">("surprise");

  const {
    fetchImages,
    ensureDemoImages,
    keywords,
    setKeywords,
    images,
    setImages,
    heroImage,
    setHeroImage,
    loading,
    error,
  } = useLyricsImages();


  useEffect(() => {
    if (!current?.artists?.length || !current?.name) {
      setImages(null);
      setKeywords(null);
      setHeroImage(null);
      void ensureDemoImages();
      return;
    }
    setImages(null);
    setKeywords(null);
    setHeroImage(null);
    const cacheKey =
      current.uri ||
      (current.artists[0]?.name && current.name
        ? `${current.artists[0]?.name}::${current.name}`
        : current.id);

    const styleForRequest: StyleCategory =
      styleChoice === "surprise"
        ? STYLE_CATEGORIES[Math.floor(Math.random() * STYLE_CATEGORIES.length)]
        : styleChoice;

    get<{ lyrics: string; source: string }>(
      `${API}/api/lyrics?artist=${encodeURIComponent(
        current.artists[0]?.name || ""
      )}&title=${encodeURIComponent(current.name)}`
    )
      .then((d) => {
        if (!d?.lyrics) {
          setImages(null);
          setKeywords(null);
          setHeroImage(null);
          return;
        }
        void fetchImages(d.lyrics, {
          cacheKey,
          songTitle: current.name,
          songArtist: current.artists[0]?.name,
          allowDemoFallback: false,
          styleCategory: styleForRequest,
        });
      })
      .catch(() => {
        setImages(null);
        setKeywords(null);
        setHeroImage(null);
      });
  }, [current, API, ensureDemoImages, fetchImages, setImages, setKeywords, setHeroImage, styleChoice]);

  const pixabayProps = { images, keywords, loading, error, heroImage };

  const { theme } = useTheme();
  const pageBg = clsx(
    "min-h-screen w-full transition-colors duration-300",
    theme === "light" ? "bg-slate-50 text-slate-900" : "bg-portfolio-gradient text-slate-100",
  );
  const shell = clsx(
    "mx-auto flex min-h-screen w-full max-w-[1700px] flex-col md:px-6 md:pb-12 pt-3 md:pt-8 lg:px-10 transition-colors duration-300",
    theme === "light" ? "text-slate-900" : "text-slate-100",
  );

  return (
    <SpotifyPlayerProvider>
      <div className={pageBg}>
        <div className={shell}>
          <HeaderBar styleChoice={styleChoice} onStyleChange={setStyleChoice} />
          <Home pixabay={pixabayProps} albumCover={albumCover} />
        </div>
      </div>
    </SpotifyPlayerProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <CurrentTrackProvider>
        <AppContent />
      </CurrentTrackProvider>
    </ThemeProvider>
  );
}
