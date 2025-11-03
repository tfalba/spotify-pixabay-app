import { extractDescriptiveKeywords } from "./keywordExtractor";
import { dedupeById, fetchPixabayImagesForKeyword, PixabayImage, shuffle } from "./pixabayHelpers";

export type ImageCard = {
  id: number;
  thumb: string;
  url: string;
  alt: string;
  author: string;
  authorAvatar: string;
  pageURL: string;
};

export async function imagesFromLyrics(lyrics: string): Promise<{
  keywords: string[];
  images: ImageCard[];
}> {
  const keywords = await extractDescriptiveKeywords(lyrics); // 3 items
  const perKeyword = Math.ceil(12 / keywords.length); // 4 each

  const batches = await Promise.all(
    keywords.map((k) => fetchPixabayImagesForKeyword(k, perKeyword + 2)) // overfetch to allow dedupe
  );

  const all: PixabayImage[] = dedupeById(batches.flat());
  const picked = shuffle(all).slice(0, 12);

  const images: ImageCard[] = picked.map((h) => ({
    id: h.id,
    thumb: h.previewURL || h.webformatURL,
    url: h.webformatURL || h.largeImageURL,
    alt: h.tags || "Pixabay image",
    author: h.user,
    authorAvatar: h.userImageURL,
    pageURL: h.pageURL,
  }));

  return { keywords, images: shuffle(images) };
}
