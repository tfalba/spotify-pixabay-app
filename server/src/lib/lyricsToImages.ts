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
  const keywords = await extractDescriptiveKeywords(lyrics); // now 4 items

  const perKeyword = 8;   // ⬅️ eight per keyword => 30 base
  const overfetch = 2;    // small buffer to help dedupe
  const desiredTotal = 30;

  const batches = await Promise.all(
    keywords.map((k) => fetchPixabayImagesForKeyword(k, perKeyword + overfetch))
  );

  const all = dedupeById(batches.flat());
  const picked = shuffle(all).slice(0, desiredTotal); // ⬅️ 30 images

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

