// server/src/images.ts
import { Router } from "express";
import { imagesFromLyrics } from "./lib/lyricsToImages";
import type { KeywordPlan } from "./lib/keywordExtractor";

type ImagesFromLyricsV2 = Awaited<ReturnType<typeof imagesFromLyrics>>;

type LegacyImagesPayload = {
  keywords: string[]; // flat keywords (v1 shape)
  images: ImagesFromLyricsV2["images"];
  heroImage: ImagesFromLyricsV2["heroImage"];
  cached?: boolean;
  debug?: DebugInfo;
};

type CachedPayload = ImagesFromLyricsV2 | LegacyImagesPayload;

const CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour
const CACHE_VERSION = "v3";
const lyricImageCache = new Map<
  string,
  { expires: number; payload: CachedPayload }
>();

const router = Router();

router.post("/lyrics-to-images", async (req, res) => {
  try {
    const { lyrics, cacheKey, songTitle, songArtist } = req.body ?? {};
    if (!lyrics || typeof lyrics !== "string") {
      return res.status(400).json({ error: "Missing lyrics" });
    }

    // flags can come from body or query
    const rawLegacy = (req.body?.legacy ?? req.query.legacy) as
      | string
      | boolean
      | undefined;
    const rawDebug = (req.body?.debug ?? req.query.debug) as
      | string
      | boolean
      | undefined;

    const legacy =
      rawLegacy === true ||
      rawLegacy === "true" ||
      rawLegacy === "1";
    const debug =
      rawDebug === true ||
      rawDebug === "true" ||
      rawDebug === "1";

    // versioned cache key so v1/v2 don’t collide
    const baseKey =
      typeof cacheKey === "string" && cacheKey.trim().length > 0
        ? cacheKey.trim()
        : null;
    const versionLabel = legacy ? `legacy-${CACHE_VERSION}` : `v-${CACHE_VERSION}`;
    const cacheId = baseKey != null ? `${baseKey}:${versionLabel}` : null;

    // try cache
    if (cacheId) {
      const cached = lyricImageCache.get(cacheId);
      if (cached && cached.expires > Date.now()) {
        const payload = cached.payload as any;
        const hasHeroImageProp = Object.prototype.hasOwnProperty.call(
          payload,
          "heroImage",
        );
        if (hasHeroImageProp) {
          const responseBody = addDebugIfNeeded(payload, debug);
          return res.json({ ...responseBody, cached: true });
        }
        lyricImageCache.delete(cacheId);
      }
    }

    // always compute v2, then convert to legacy if needed
    const validSongTitle =
      typeof songTitle === "string" && songTitle.trim().length > 0
        ? songTitle.trim()
        : undefined;
    const validSongArtist =
      typeof songArtist === "string" && songArtist.trim().length > 0
        ? songArtist.trim()
        : undefined;
    const v2Payload = await imagesFromLyrics(lyrics, validSongTitle, validSongArtist);

    const payload: CachedPayload = legacy
      ? toLegacyPayload(v2Payload)
      : v2Payload;

    if (cacheId) {
      lyricImageCache.set(cacheId, {
        expires: Date.now() + CACHE_TTL_MS,
        payload,
      });
    }

    const responseBody = addDebugIfNeeded(payload, debug);

    return res.json({ ...responseBody, cached: false });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Server error" });
  }
});

// ---- helpers ----

function toLegacyPayload(v2: ImagesFromLyricsV2): LegacyImagesPayload {
  return {
    keywords: v2.keywords.baseKeywords,
    images: v2.images,
    heroImage: v2.heroImage,
  };
}

function addDebugIfNeeded(
  payload: CachedPayload,
  debug: boolean,
): CachedPayload & { debug?: DebugInfo } {
  if (!debug) return payload as any;

  const isLegacy = Array.isArray((payload as any).keywords);

  if (isLegacy) {
    const legacy = payload as LegacyImagesPayload;
    const baseKeywords = legacy.keywords;
    const topSingles = baseKeywords.slice(0, 3);

    const debugInfo: DebugInfo = {
      baseKeywords,
      pairQueries: [],
      topSingles,
      searchQueries: {
        pairs: [],
        singles: topSingles,
      },
    };

    return { ...legacy, debug: debugInfo };
  }

  const v2 = payload as ImagesFromLyricsV2;
  const { baseKeywords, pairQueries, topSingles } = v2.keywords;

  const pairQueryStrings = pairQueries.map(([a, b]) => `${a} ${b}`);
  const singleQueryStrings = topSingles;

  const debugInfo: DebugInfo = {
    baseKeywords,
    pairQueries,
    topSingles,
    searchQueries: {
      pairs: pairQueryStrings,
      singles: singleQueryStrings,
    },
  };

  return { ...v2, debug: debugInfo };
}

type DebugInfo = {
  baseKeywords: string[];
  pairQueries: [string, string][];
  topSingles: string[];
  searchQueries: {
    pairs: string[];
    singles: string[];
  };
};

export default router;
