const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:5174";

export async function getImagesFromLyrics(lyrics: string) {
  const res = await fetch(`${API_BASE}/api/lyrics-to-images`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lyrics }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  return data; // { keywords: [...], images: [...] }
}