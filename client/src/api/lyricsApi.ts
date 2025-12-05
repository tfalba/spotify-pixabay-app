import {
  type NormalizedLyricsImagesResult,
  type LyricsImagesResponseV1,
  type LyricsImagesResponseV2,
} from "./lyricsTypes";
import { normalizeLyricsImagesResponse } from "./normalizeLyricsResponse";

export async function fetchImagesForLyrics(
  lyrics: string,
  songTitle?: string,
  options?: { debug?: boolean; legacy?: boolean },
): Promise<NormalizedLyricsImagesResult> {
  const params = new URLSearchParams();
  if (options?.debug) params.set("debug", "1");
  if (options?.legacy) params.set("legacy", "1");

  const res = await fetch(`/api/lyrics-to-images?${params.toString()}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lyrics, songTitle }),
  });

  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`);
  }

  const json = (await res.json()) as LyricsImagesResponseV1 | LyricsImagesResponseV2;

  return normalizeLyricsImagesResponse(json);
}
