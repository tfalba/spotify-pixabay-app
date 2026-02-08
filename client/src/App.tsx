import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import HeaderBar from "./components/HeaderBar";
import Home from "./pages/Home";
import { get } from "./lib/fetcher";
import { useLyricsImages } from "./hooks/useLyricsImages";
import {
  normalizeLyricsImagesResponse,
} from "./api/normalizeLyricsResponse";
import type { HeroImage, ImageCard, KeywordPlan } from "./api/lyricsTypes";
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
  const { current, albumCover, queue } = useCurrentTrackData();
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
  const prefetchStyleRef = useRef<Map<string, StyleCategory>>(new Map());
  const prefetchCacheRef = useRef<
    Map<
      string,
      {
        lyrics: string;
        keywords: KeywordPlan;
        images: ImageCard[];
        heroImage: HeroImage | null;
      }
    >
  >(new Map());
  const prefetchAbortRef = useRef<AbortController | null>(null);

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

    const baseKey =
      current?.uri ||
      (artist && title ? `${artist}::${title}` : current?.id ?? "");
    setCurrentCacheKey(baseKey);

    const prefetchedStyle =
      styleChoiceRef.current === "surprise"
        ? prefetchStyleRef.current.get(baseKey)
        : null;
    const styleForRequest = prefetchedStyle ?? resolveStyle(styleChoiceRef.current);
    const requestCacheKey = makeCacheKey(baseKey, styleForRequest);

    if (requestCacheKey) {
      const prefetched = prefetchCacheRef.current.get(requestCacheKey);
      if (prefetched) {
        setCurrentLyrics(prefetched.lyrics);
        setKeywords(prefetched.keywords);
        setImages(prefetched.images);
        setHeroImage(prefetched.heroImage);
        setHasInitialHero(true);
        return;
      }
    }

    // reset for new track (no prefetched data)
    setImages(null);
    setKeywords(null);
    setHeroImage(null);
    setCurrentLyrics(null);
    setHasInitialHero(false);

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

  // 1b) Prefetch next track's lyrics + images while current plays
  useEffect(() => {
    if (!current || !queue.length) return;
    const idx = queue.findIndex((t) => t.id === current.id);
    if (idx < 0 || idx + 1 >= queue.length) return;

    const next = queue[idx + 1];
    const artist = next?.artists?.[0]?.name ?? "";
    const title = next?.name ?? "";
    if (!artist || !title) return;

    const baseKey =
      next?.uri || (artist && title ? `${artist}::${title}` : next?.id ?? "");
    if (!baseKey) return;

    const resolvedStyle =
      styleChoiceRef.current === "surprise"
        ? prefetchStyleRef.current.get(baseKey) ?? resolveStyle("surprise")
        : resolveStyle(styleChoiceRef.current);

    if (styleChoiceRef.current === "surprise") {
      prefetchStyleRef.current.set(baseKey, resolvedStyle);
    }

    const cacheKey = makeCacheKey(baseKey, resolvedStyle);
    if (!cacheKey) return;
    if (prefetchCacheRef.current.has(cacheKey)) return;

    if (prefetchAbortRef.current) {
      prefetchAbortRef.current.abort();
    }
    const controller = new AbortController();
    prefetchAbortRef.current = controller;

    get<{ lyrics: string; source: string }>(
      `${API}/api/lyrics?artist=${encodeURIComponent(
        artist
      )}&title=${encodeURIComponent(title)}`,
      { signal: controller.signal }
    )
      .then(async (d) => {
        if (controller.signal.aborted) return;
        if (!d?.lyrics) return;

        const res = await fetch(`${API}/api/lyrics-to-images`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            lyrics: d.lyrics,
            songTitle: title,
            songArtist: artist,
            cacheKey,
            styleCategory: resolvedStyle,
          }),
        });

        const raw = await res.json();
        if (!res.ok) return;
        const data = normalizeLyricsImagesResponse(raw);
        prefetchCacheRef.current.set(cacheKey, {
          lyrics: d.lyrics,
          keywords: data.keywords,
          images: data.images,
          heroImage: data.heroImage ?? null,
        });
      })
      .catch(() => {})
      .finally(() => {
        if (prefetchAbortRef.current === controller) {
          prefetchAbortRef.current = null;
        }
      });
  }, [
    current?.id,
    current?.uri,
    queue,
    API,
    makeCacheKey,
    resolveStyle,
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
    "mx-auto flex min-h-screen w-full max-w-[2150px] flex-col px-3 pb-4 md:pb-12 pt-3 md:pt-4 lg:px-10"
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
