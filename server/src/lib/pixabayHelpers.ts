import { ensureOk, parseJson } from "./http";
import { ImageCard } from "./lyricsToImages";

export type PixabayImage = {
  id: number;
  pageURL: string;
  previewURL: string;
  webformatURL: string;
  largeImageURL: string;
  tags: string;
  user: string;
  userImageURL: string;
};

export interface PixabayResponse {
  total: number;
  totalHits: number;
  hits: PixabayImage[];
}

const PIXABAY_BASE = "https://pixabay.com/api/";

export async function fetchPixabayImagesForKeyword(
  keyword: string,
  perKeyword = 4
): Promise<PixabayImage[]> {
  const params = new URLSearchParams({
    key: process.env.PIXABAY_API_KEY!,
    q: keyword,
    image_type: "photo",
    per_page: String(perKeyword),
    safesearch: "true",
    orientation: "horizontal",
    lang: "en",
  });
  const res = await fetch(`${PIXABAY_BASE}?${params.toString()}`);
  if (!res.ok) throw new Error(`Pixabay error: ${res.status}`);
  ensureOk(res, "pixabay search");
  const data = await parseJson<PixabayResponse>(res);
  return (data.hits || []) as PixabayImage[];
}

export function shuffle<T extends PixabayImage | ImageCard>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = a[i]!;
    a[i] = a[j]!;
    a[j] = tmp;
  }
  return a;
}

export function dedupeById(images: PixabayImage[]) {
  const seen = new Set<number>();
  return images.filter((img) => {
    if (seen.has(img.id)) return false;
    seen.add(img.id);
    return true;
  });
}
