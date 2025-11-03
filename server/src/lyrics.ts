import { env } from "./env";


export async function fetchLyrics(artist: string, title: string) {
const provider = env.LYRICS_PROVIDER.trim().toLowerCase();


// Placeholder: attempt a community LRC provider when explicitly enabled.
if (provider === "lrclib") {
try {
const params = new URLSearchParams({ track_name: title, artist_name: artist });
const url = `https://lrclib.net/api/get?${params.toString()}`;
const res = await fetch(url);
if (res.ok) {
const data: any = await res.json();
const text = data?.plainLyrics || data?.syncedLyrics || "";
if (text) return { lyrics: text, source: "lrclib" };
}
} catch (e) {
// swallow, fall through
}
}


// Default graceful fallback
return { lyrics: "Lyrics not available. Connect a licensed lyrics provider.", source: "none" };
}