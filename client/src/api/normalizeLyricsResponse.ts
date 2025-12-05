// client/src/api/normalizeLyricsResponse.ts
import {
  type KeywordPlan,
  type LyricsImagesResponseV1,
  type LyricsImagesResponseV2,
  type NormalizedLyricsImagesResult,
  type DebugInfo,
} from "./lyricsTypes";

function isV1Response(
  raw: LyricsImagesResponseV1 | LyricsImagesResponseV2,
): raw is LyricsImagesResponseV1 {
  // v1: keywords is an array of strings
  return Array.isArray((raw as any).keywords);
}

export function normalizeLyricsImagesResponse(
  raw: LyricsImagesResponseV1 | LyricsImagesResponseV2,
): NormalizedLyricsImagesResult {
  const cached = !!(raw as any).cached;
  const debug = (raw as any).debug as DebugInfo | undefined;

  if (isV1Response(raw)) {
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
      cached,
      debug,
    };
  }

  // v2
  return {
    keywords: raw.keywords,
    images: raw.images,
    cached,
    debug,
  };
}
