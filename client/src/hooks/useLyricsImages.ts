import { useCallback, useRef, useState } from "react";

type ImageCard = {
  id: number;
  thumb: string;
  url: string;
  alt: string;
  author: string;
  authorAvatar: string;
  pageURL: string;
};

type LyricsImagesResponse = {
  keywords: string[];
  images: ImageCard[];
  cached?: boolean;
};

type DemoImagesResponse = {
  keywords: string[];
  images: ImageCard[];
  cached?: boolean;
};

export function useLyricsImages() {
  const [keywords, setKeywords] = useState<string[]>([]);
  const [images, setImages] = useState<ImageCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const demoCacheRef = useRef<DemoImagesResponse | null>(null);
  const demoPromiseRef = useRef<Promise<DemoImagesResponse | null> | null>(null);

  const API = import.meta.env.VITE_API_BASE || "http://127.0.0.1:5174";

  const ensureDemoImages = useCallback(async () => {
    if (demoCacheRef.current) {
      setKeywords(demoCacheRef.current.keywords);
      setImages(demoCacheRef.current.images);
      return demoCacheRef.current;
    }
    if (demoPromiseRef.current) {
      const existing = await demoPromiseRef.current;
      if (existing) {
        setKeywords(existing.keywords);
        setImages(existing.images);
      }
      return existing;
    }

    demoPromiseRef.current = (async () => {
      try {
        const res = await fetch(`${API}/api/demo?cacheKey=demo-music`);
        const data: DemoImagesResponse = await res.json();
        if (!res.ok) throw new Error((data as any).error || "Request failed");
        demoCacheRef.current = data;
        setKeywords(data.keywords);
        setImages(data.images);
        return data;
      } catch {
        return null;
      }
    })();

    return demoPromiseRef.current;
  }, [API]);

  const fetchImages = useCallback(async (lyrics: string, opts?: { cacheKey?: string }) => {
    if (!lyrics) {
      await ensureDemoImages();
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    void ensureDemoImages();
    try {
      const res = await fetch(
        `${API}/api/lyrics-to-images`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lyrics, cacheKey: opts?.cacheKey }),
        }
      );

      const data: LyricsImagesResponse = await res.json();
      if (!res.ok) throw new Error((data as any).error || "Request failed");

      setKeywords(data.keywords);
      setImages(data.images);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
      await ensureDemoImages();
    } finally {
      setLoading(false);
    }
  }, [API, ensureDemoImages]);

  return { fetchImages, ensureDemoImages, keywords, setKeywords, images, setImages, loading, error };
}
