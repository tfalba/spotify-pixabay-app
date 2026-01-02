import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import HeaderBar from "./components/HeaderBar";
import Home from "./pages/Home";
import { get } from "./lib/fetcher";
import { useLyricsImages } from "./hooks/useLyricsImages";
import { SpotifyPlayerProvider } from "./context/SpotifyPlayerProvider";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthStatusProvider } from "./context/AuthStatusContext";
import {
  CurrentTrackProvider,
  useCurrentTrackActions,
  useCurrentTrackData,
} from "./context/CurrentTrackContext";
import type { StyleCategory } from "./types/types";
import { STYLE_CATEGORIES } from "./types/types";

function AppContent() {
  const { current, albumCover } = useCurrentTrackData();
  const { reset } = useCurrentTrackActions();

  // ✅ memoize to avoid changing string identity in deps
  const API = useMemo(
    () => import.meta.env.VITE_API_BASE || "http://127.0.0.1:5174",
    []
  );

  const [styleChoice, setStyleChoice] = useState<StyleCategory | "surprise">(
    "surprise"
  );
  const [currentLyrics, setCurrentLyrics] = useState<string | null>(null);
  const [currentCacheKey, setCurrentCacheKey] = useState<string | null>(null);
  const [hasInitialHero, setHasInitialHero] = useState(false);

  // refs used to avoid dependency-triggered reruns
  const styleChoiceRef = useRef<StyleCategory | "surprise">("surprise");
  const hasInitialHeroRef = useRef(false);

  // ✅ stable helpers
  const pickRandomStyle = useCallback(
    () => STYLE_CATEGORIES[Math.floor(Math.random() * STYLE_CATEGORIES.length)],
    []
  );

  const resolveStyle = useCallback(
    (choice: StyleCategory | "surprise"): StyleCategory =>
      choice === "surprise" ? pickRandomStyle() : choice,
    [pickRandomStyle]
  );

  const makeCacheKey = useCallback(
    (baseKey: string | null, style: StyleCategory) =>
      baseKey ? `${baseKey}::${style}` : undefined,
    []
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

  // keep refs synced (no heavy rerenders)
  useEffect(() => {
    styleChoiceRef.current = styleChoice;
  }, [styleChoice]);

  useEffect(() => {
    hasInitialHeroRef.current = hasInitialHero;
  }, [hasInitialHero]);

  // ✅ request id guard to prevent async overlap/stale updates
  const requestIdRef = useRef(0);

  // 1) When current track changes, fetch lyrics + images once
  useEffect(() => {
    const artist = current?.artists?.[0]?.name ?? "";
    const title = current?.name ?? "";

    // No track selected: reset + ensure demo
    if (!artist || !title) {
      requestIdRef.current += 1; // invalidate any in-flight work
      setImages(null);
      setKeywords(null);
      setHeroImage(null);
      setCurrentLyrics(null);
      setCurrentCacheKey(null);
      setHasInitialHero(false);
      void ensureDemoImages();
      return;
    }

    const myRequestId = ++requestIdRef.current;

    // reset for new track
    setImages(null);
    setKeywords(null);
    setHeroImage(null);
    setCurrentLyrics(null);
    setHasInitialHero(false);

    const baseKey =
      current?.uri ||
      (artist && title ? `${artist}::${title}` : current?.id ?? "");
    setCurrentCacheKey(baseKey);

    const styleForRequest = resolveStyle(styleChoiceRef.current);

    get<{ lyrics: string; source: string }>(
      `${API}/api/lyrics?artist=${encodeURIComponent(
        artist
      )}&title=${encodeURIComponent(title)}`
    )
      .then(async (d) => {
        // stale request? bail
        if (requestIdRef.current !== myRequestId) return;

        if (!d?.lyrics) {
          setImages(null);
          setKeywords(null);
          setHeroImage(null);
          setCurrentLyrics(null);
          return;
        }

        setCurrentLyrics(d.lyrics);

        const requestCacheKey = makeCacheKey(baseKey, styleForRequest);

        try {
          await fetchImages(d.lyrics, {
            cacheKey: requestCacheKey,
            songTitle: title,
            songArtist: artist,
            allowDemoFallback: false,
            styleCategory: styleForRequest,
          });

          if (requestIdRef.current !== myRequestId) return;
          setHasInitialHero(true);
        } catch {
          // ignore
        }
      })
      .catch(() => {
        if (requestIdRef.current !== myRequestId) return;
        setImages(null);
        setKeywords(null);
        setHeroImage(null);
        setCurrentLyrics(null);
      });

    // Only depend on track identity + the specific helpers you truly need
  }, [
    current?.uri,
    current?.id,
    current?.name,
    current?.artists,
    API,
    ensureDemoImages,
    fetchImages,
    resolveStyle,
    makeCacheKey,
    setImages,
    setKeywords,
    setHeroImage,
  ]);

  useEffect(() => {
    if (typeof performance === "undefined") return;
    const navEntries = performance.getEntriesByType?.("navigation");
    const navType = (navEntries?.[0] as PerformanceNavigationTiming | undefined)
      ?.type;
    const legacyReload =
      (performance as any).navigation?.type === 1;
    if (navType === "reload" || legacyReload) {
      reset();
    }
  }, [reset]);

  // 2) When style changes AFTER initial hero exists, refresh hero only
  useEffect(() => {
    const artist = current?.artists?.[0]?.name ?? "";
    const title = current?.name ?? "";
    if (!artist || !title) return;
    if (!currentLyrics) return;
    if (!hasInitialHeroRef.current) return;
    if (!currentCacheKey) return;

    const concreteStyle = resolveStyle(styleChoice);
    const heroCacheKey = makeCacheKey(currentCacheKey, concreteStyle);

    void refreshHeroImage(currentLyrics, {
      cacheKey: heroCacheKey,
      songTitle: title,
      songArtist: artist,
      styleCategory: concreteStyle,
    });
  }, [
    styleChoice,
    currentLyrics,
    currentCacheKey,
    current?.name,
    current?.artists?.[0],
    refreshHeroImage,
    resolveStyle,
    makeCacheKey,
  ]);

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

  const pageBg = clsx("min-h-screen w-full text-slate-100");
  const shell = clsx(
    "mx-auto flex min-h-screen w-full max-w-[1850px] flex-col px-6 pb-4 md:pb-12 pt-3 md:pt-4 lg:px-10"
  );

  return (
    <div className={pageBg}>
      <div className={shell}>
        <HeaderBar styleChoice={styleChoice} onStyleChange={setStyleChoice} />
        <Home
          pixabay={pixabayProps}
          albumCover={albumCover}
          lyricsAvailable={Boolean(currentLyrics)}
        />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthStatusProvider>
        <SpotifyPlayerProvider>
          <CurrentTrackProvider>
            <AppContent />
          </CurrentTrackProvider>
        </SpotifyPlayerProvider>
      </AuthStatusProvider>
    </ThemeProvider>
  );
}
