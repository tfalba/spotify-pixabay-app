// server/src/images.ts
import { Router } from "express";
import { imagesFromLyrics } from "./lib/lyricsToImages";

type CachedPayload = Awaited<ReturnType<typeof imagesFromLyrics>>;

const CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour
const lyricImageCache = new Map<
  string,
  { expires: number; payload: CachedPayload }
>();

const router = Router();

router.post("/lyrics-to-images", async (req, res) => {
  try {
    const { lyrics, cacheKey } = req.body ?? {};
    if (!lyrics || typeof lyrics !== "string") {
      return res.status(400).json({ error: "Missing lyrics" });
    }

    const key =
      typeof cacheKey === "string" && cacheKey.trim().length > 0
        ? cacheKey.trim()
        : null;

    if (key) {
      const cached = lyricImageCache.get(key);
      if (cached && cached.expires > Date.now()) {
        return res.json({ ...cached.payload, cached: true });
      }
    }

    const payload = await imagesFromLyrics(lyrics);
    if (key) {
      lyricImageCache.set(key, {
        expires: Date.now() + CACHE_TTL_MS,
        payload,
      });
    }
    return res.json(payload);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Server error" });
  }
});

export default router;
