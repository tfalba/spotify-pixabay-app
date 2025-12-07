import { useCallback, useEffect, useRef, useState } from "react";
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
  const [currentLyrics, setCurrentLyrics] = useState<string | null>(null);
  const [currentCacheKey, setCurrentCacheKey] = useState<string | null>(null);
  const [hasInitialHero, setHasInitialHero] = useState(false);
  const styleChoiceRef = useRef<StyleCategory | "surprise">(styleChoice);
  const hasInitialHeroRef = useRef(false);
  const pickRandomStyle = useCallback(
    () => STYLE_CATEGORIES[Math.floor(Math.random() * STYLE_CATEGORIES.length)],
    [],
  );
  const resolveStyle = useCallback(
    (choice: StyleCategory | "surprise"): StyleCategory =>
      choice === "surprise" ? pickRandomStyle() : choice,
    [pickRandomStyle],
  );
  const styleCacheKey = useCallback(
    (baseKey: string | null, style: StyleCategory) =>
      baseKey ? `${baseKey}::${style}` : undefined,
    [],
  );

  const {
    fetchImages,
    ensureDemoImages,
    keywords,
    setKeywords,
    images,
    setImages,
    heroImage,
    setHeroImage,
    heroLoading,
    refreshHeroImage,
    loading,
    error,
  } = useLyricsImages();

  useEffect(() => {
    styleChoiceRef.current = styleChoice;
  }, [styleChoice]);

  useEffect(() => {
    if (!current?.artists?.length || !current?.name) {
      setImages(null);
      setKeywords(null);
      setHeroImage(null);
      setCurrentLyrics(null);
      setCurrentCacheKey(null);
      setHasInitialHero(false);
      void ensureDemoImages();
      return;
    }
    setImages(null);
    setKeywords(null);
    setHeroImage(null);
    setCurrentLyrics(null);
    setCurrentCacheKey(null);
    setHasInitialHero(false);
    const cacheKey =
      current.uri ||
      (current.artists[0]?.name && current.name
        ? `${current.artists[0]?.name}::${current.name}`
        : current.id);
    setCurrentCacheKey(cacheKey);

    const styleForRequest = resolveStyle(styleChoiceRef.current);

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
          setCurrentLyrics(null);
          return;
        }
        setCurrentLyrics(d.lyrics);
        const requestCacheKey = styleCacheKey(cacheKey, styleForRequest);
        void fetchImages(d.lyrics, {
          cacheKey: requestCacheKey,
          songTitle: current.name,
          songArtist: current.artists[0]?.name,
          allowDemoFallback: false,
          styleCategory: styleForRequest,
        }).then(
          () => setHasInitialHero(true),
          () => {},
        );
      })
      .catch(() => {
        setImages(null);
        setKeywords(null);
        setHeroImage(null);
        setCurrentLyrics(null);
      });
  }, [current, API, ensureDemoImages, fetchImages, setImages, setKeywords, setHeroImage, resolveStyle, styleCacheKey]);

  useEffect(() => {
    hasInitialHeroRef.current = hasInitialHero;
  }, [hasInitialHero]);

  useEffect(() => {
    if (!current?.artists?.length || !current?.name) return;
    if (!currentLyrics) return;
    if (!hasInitialHeroRef.current) return;
    const concreteStyle = resolveStyle(styleChoice);
    const heroCacheKey = styleCacheKey(currentCacheKey, concreteStyle);
    void refreshHeroImage(currentLyrics, {
      cacheKey: heroCacheKey,
      songTitle: current.name,
      songArtist: current.artists[0]?.name,
      styleCategory: concreteStyle,
    });
  }, [styleChoice, current, currentLyrics, currentCacheKey, refreshHeroImage, resolveStyle, styleCacheKey]);

  const pixabayProps = {
    images,
    keywords,
    loading,
    error,
    heroImage,
    heroLoading,
    styleChoice,
    onStyleChange: setStyleChoice,
  };

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
