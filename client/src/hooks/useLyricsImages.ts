import { useState } from "react";

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
};

export function useLyricsImages() {
  const [keywords, setKeywords] = useState<string[]>([]);
  const [images, setImages] = useState<ImageCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchImages = async (lyrics: string) => {
    if (!lyrics) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE}/api/lyrics-to-images`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lyrics }),
        }
      );

      const data: LyricsImagesResponse = await res.json();
      if (!res.ok) throw new Error((data as any).error || "Request failed");

      setKeywords(data.keywords);
      setImages(data.images);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return { fetchImages, keywords, setKeywords,images, setImages, loading, error };
}
