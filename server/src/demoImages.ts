// server/src/demoImages.ts
import { Router } from "express";
import { imagesForDemo } from "./lib/lyricsToImages";

type CachedPayload = Awaited<ReturnType<typeof imagesForDemo>>;

const CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour
const DEFAULT_CACHE_KEY = "demo-music";
const demoImageCache = new Map<
  string,
  { expires: number; payload: CachedPayload }
>();

const demoRouter = Router();

demoRouter.get("/", async (req, res) => {
  try {
    const cacheKey = (req.query.cacheKey as string) || DEFAULT_CACHE_KEY;
    const key =
      typeof cacheKey === "string" && cacheKey.trim().length > 0
        ? cacheKey.trim()
        : DEFAULT_CACHE_KEY;

    const cached = demoImageCache.get(key);
    if (cached && cached.expires > Date.now()) {
      return res.json({ ...cached.payload, cached: true });
    }

    const payload = await imagesForDemo();
    demoImageCache.set(key, {
      expires: Date.now() + CACHE_TTL_MS,
      payload,
    });
    return res.json(payload);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Server error" });
  }
});

export default demoRouter;
