// imagesFromLyrics.ts
import { extractDescriptiveKeywords, type KeywordPlan } from "./keywordExtractor";
import { dedupeById, fetchPixabayImagesForKeyword, PixabayImage, shuffle } from "./pixabayHelpers";
import { generateSongMoodImage, StyleCategory, type HeroImage } from "./songMoodImage";

export type ImageCard = {
  id: number;
  thumb: string;
  url: string;
  alt: string;
  author: string;
  authorAvatar: string;
  pageURL: string;
};

function sortByPopularity(images: PixabayImage[]): PixabayImage[] {
  // Adjust weighting if you prefer; this favors downloads, then likes, then views
  return images.slice().sort((a, b) => {
    const aScore =
      (a.downloads ?? 0) * 3 +
      (a.likes ?? 0) * 2 +
      (a.views ?? 0);
    const bScore =
      (b.downloads ?? 0) * 3 +
      (b.likes ?? 0) * 2 +
      (b.views ?? 0);
    return bScore - aScore; // descending
  });
}

export async function imagesFromLyrics(
  lyrics: string,
  songTitle?: string,
  artistName?: string,
  styleCategory?: StyleCategory,
): Promise<{
  keywords: KeywordPlan;   // return the full plan so caller can inspect pairs/singles
  images: ImageCard[];
  heroImage: HeroImage | null;
}> {
  const heroPromise = generateSongMoodImage({
    lyrics,
    songTitle,
    artist: artistName,
    styleCategory: styleCategory,
  }).catch(() => null);

  const keywordPlan = await extractDescriptiveKeywords(lyrics, songTitle);
  const { baseKeywords, pairQueries, topSingles } = keywordPlan;

  // Build 3 pair queries + 3 single queries
  const pairQueryStrings = pairQueries.map(([a, b]) => `${a} ${b}`);
  const singleQueryStrings = topSingles;
  let queries = [...pairQueryStrings, ...singleQueryStrings];

  // Remove accidental duplicates just in case
  queries = Array.from(new Set(queries));

  const desiredTotal = 48;
  const oversample = 12;
  const totalTarget = desiredTotal + oversample;

  const perQuery = Math.ceil(totalTarget / queries.length); // ~7 each for 6 queries

  const batches = await Promise.all(
    queries.map((q) => fetchPixabayImagesForKeyword(q, perQuery)),
  );

  // Deduplicate across all queries
  const all: PixabayImage[] = dedupeById(batches.flat());

  // Bias toward more "popular" images using downloads/likes/views
  const sorted = sortByPopularity(all);

  // Take the top 30, then shuffle for variety in the UI
  const picked = sorted.slice(0, desiredTotal);

  const images: ImageCard[] = picked.map((h) => ({
    id: h.id,
    thumb: h.previewURL || h.webformatURL,
    url: h.webformatURL || h.largeImageURL,
    alt: h.tags || "Pixabay image",
    author: h.user,
    authorAvatar: h.userImageURL,
    pageURL: h.pageURL,
  }));

  const heroImage = await heroPromise;

  return {
    keywords: keywordPlan,
    images: shuffle(images),
    heroImage,
  };
}

// If you want the demo to stay simple, you can leave this as-is
export async function imagesForDemo(): Promise<{ keywords: string[]; images: ImageCard[] }> {
  const keywords = ["music"];
  const batches = await Promise.all(
    keywords.map((k) => fetchPixabayImagesForKeyword(k, 40)),
  );

  const all = dedupeById(batches.flat());
  const picked = sortByPopularity(all).slice(0, 30);

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
