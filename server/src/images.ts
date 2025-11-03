// server/src/images.ts
import { Router } from "express";
import { imagesFromLyrics } from "./lib/lyricsToImages";

const router = Router();

router.post("/lyrics-to-images", async (req, res) => {
  try {
    const { lyrics } = req.body ?? {};
    if (!lyrics || typeof lyrics !== "string") {
      return res.status(400).json({ error: "Missing lyrics" });
    }
    const payload = await imagesFromLyrics(lyrics);
    return res.json(payload);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Server error" });
  }
});

export default router;
