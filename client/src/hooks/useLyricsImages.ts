// client/src/hooks/useLyricsImages.ts
import { useCallback, useRef, useState } from "react";
import type { HeroImage } from "@/api/lyricsTypes";
import type { StyleCategory } from "@/types/types";

export type KeywordPlan = {
  baseKeywords: string[];
  pairQueries: [string, string][];
  topSingles: string[];
};

type DebugInfo = {
  baseKeywords: string[];
  pairQueries: [string, string][];
  topSingles: string[];
  searchQueries: {
    pairs: string[];
    singles: string[];
  };
};

type ImageCard = {
  id: number;
  thumb: string;
  url: string;
  alt: string;
  author: string;
  authorAvatar: string;
  pageURL: string;
};

// New v2 server shape
type LyricsImagesResponseV2 = {
  keywords: KeywordPlan;
  images: ImageCard[];
  heroImage?: HeroImage | null;
  cached?: boolean;
  debug?: DebugInfo;
};

// Old v1 server shape (flat keywords)
type LyricsImagesResponseV1 = {
  keywords: string[];
  images: ImageCard[];
  cached?: boolean;
  debug?: DebugInfo;
};

type AnyLyricsImagesResponse = LyricsImagesResponseV1 | LyricsImagesResponseV2;

type NormalizedLyricsImagesResponse = {
  keywords: KeywordPlan;
  images: ImageCard[];
  cached?: boolean;
  debug?: DebugInfo;
  heroImage?: HeroImage | null;
};

// Demo endpoint may also be v1 or v2
type DemoImagesResponse = NormalizedLyricsImagesResponse;

// ---- helpers ----

function isV1Response(
  raw: AnyLyricsImagesResponse,
): raw is LyricsImagesResponseV1 {
  return Array.isArray((raw as any).keywords);
}

function normalizeResponse(
  raw: AnyLyricsImagesResponse,
): NormalizedLyricsImagesResponse {
  if (isV1Response(raw)) {
    console.log("Normalizing v1 response");
    const baseKeywords = raw.keywords;
    const topSingles = baseKeywords.slice(0, 3);

    const keywordPlan: KeywordPlan = {
      baseKeywords,
      pairQueries: [],
      topSingles,
    };

    return {
      keywords: keywordPlan,
      images: raw.images,
      cached: raw.cached,
      debug: raw.debug,
      heroImage: null,
    };
  }

  // v2 shape
  return {
    keywords: raw.keywords,
    images: raw.images,
    cached: raw.cached,
    debug: raw.debug,
    heroImage: raw.heroImage ?? null,
  };
}

// ---- hook ----

export function useLyricsImages() {
  const [keywords, setKeywords] = useState<KeywordPlan | null>(null);
  const [images, setImages] = useState<ImageCard[] | null>(null);
  const [heroImage, setHeroImage] = useState<HeroImage | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const demoCacheRef = useRef<DemoImagesResponse | null>(null);
  const demoPromiseRef = useRef<Promise<DemoImagesResponse | null> | null>(null);
  const activeRequestRef = useRef<AbortController | null>(null);

  const API = import.meta.env.VITE_API_BASE || "http://127.0.0.1:5174";

  const ensureDemoImages = useCallback(async () => {
    if (demoCacheRef.current) {
      setKeywords(demoCacheRef.current.keywords);
      setImages(demoCacheRef.current.images);
      setHeroImage(demoCacheRef.current.heroImage ?? null);
      return demoCacheRef.current;
    }

    if (demoPromiseRef.current) {
      const existing = await demoPromiseRef.current;
      if (existing) {
        setKeywords(existing.keywords);
        setImages(existing.images);
        setHeroImage(existing.heroImage ?? null);
      }
      return existing;
    }

    demoPromiseRef.current = (async () => {
      try {
        const res = await fetch(`${API}/api/demo?cacheKey=demo-music`);
        const raw = (await res.json()) as AnyLyricsImagesResponse;
        if (!res.ok) throw new Error((raw as any).error || "Request failed");

        const data = normalizeResponse(raw);
        demoCacheRef.current = data;
        setKeywords(data.keywords);
        setImages(data.images);
        setHeroImage(data.heroImage ?? null);
        return data;
      } catch {
        return null;
      }
    })();

    return demoPromiseRef.current;
  }, [API]);

  const fetchImages = useCallback(
    async (
      lyrics: string,
      opts?: {
        songTitle?: string;
        songArtist?: string;
        cacheKey?: string;
        debug?: boolean;
        legacy?: boolean;
        allowDemoFallback?: boolean;
        styleCategory?: StyleCategory;
      },
    ) => {
      const allowDemoFallback = opts?.allowDemoFallback !== false;
      const abortActiveRequest = () => {
        if (activeRequestRef.current) {
          activeRequestRef.current.abort();
          activeRequestRef.current = null;
        }
      };
      if (!lyrics) {
        abortActiveRequest();
        if (allowDemoFallback) {
          // fallback to demo if no lyrics entered
          await ensureDemoImages();
        } else {
          setKeywords(null);
          setImages(null);
          setHeroImage(null);
        }
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      if (allowDemoFallback) {
        void ensureDemoImages(); // pre-warm demo in background
      }
      abortActiveRequest();
      const controller = new AbortController();
      activeRequestRef.current = controller;

      try {
        const params = new URLSearchParams();
        if (opts?.debug) params.set("debug", "1");
        if (opts?.legacy) params.set("legacy", "1");

        const res = await fetch(
          `${API}/api/lyrics-to-images${params.toString() ? `?${params.toString()}` : ""}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            signal: controller.signal,
            body: JSON.stringify({
              lyrics,
              songTitle: opts?.songTitle,
              songArtist: opts?.songArtist,
              cacheKey: opts?.cacheKey,
              styleCategory: opts?.styleCategory ?? "retro",
            }),
          },
        );

        const raw = (await res.json()) as AnyLyricsImagesResponse & {
          error?: string;
        };

        if (!res.ok) throw new Error(raw.error || "Request failed");

        const data = normalizeResponse(raw);

        setKeywords(data.keywords);
        setImages(data.images);
        setHeroImage(data.heroImage ?? null);
      } catch (err: any) {
        if (err?.name === "AbortError") {
          return;
        }
        setError(err.message || "Something went wrong");
        if (allowDemoFallback) {
          await ensureDemoImages();
        }
      } finally {
        if (activeRequestRef.current === controller) {
          activeRequestRef.current = null;
          setLoading(false);
        }
      }
    },
    [API, ensureDemoImages],
  );

  return {
    fetchImages,
    ensureDemoImages,
    keywords, // KeywordPlan | null
    setKeywords,
    images,
    setImages,
    heroImage,
    setHeroImage,
    loading,
    error,
  };
}
