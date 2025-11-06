// src/lib/spotify.ts

export type SpotifyImage = { url: string; width: number | null; height: number | null };
export type SpotifyTrack = {
  id: string;
  name: string;
  preview_url: string | null;
  external_url: string;
  image: string | null;
  uri: string;
  artists: { name: string }[];
  album: { images: SpotifyImage[]; name: string };
};

export type SpotifyPlaylist = {
  id: string;
  name: string;
  images: SpotifyImage[];
  tracks: { total: number };
  owner: { display_name: string | null };
};

const API_BASE = "http://127.0.0.1:5173"; // wherever your server runs

async function api<T>(path: string): Promise<T> {
  const r = await fetch(`${API_BASE}${path}`, { credentials: "include" }); // include cookies
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

// ---- Public helpers ----

/** Fetch all of the user's playlists (auto-paginates) */

export async function getAllUserPlaylists(): Promise<SpotifyPlaylist[]> {
  // Call YOUR server
  const data = await api<{ items: any[] }>("/api/me/playlists");
  return (data.items ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    images: p.images ?? [],
    tracks: { total: p.tracks?.total ?? 0 },
    owner: { display_name: p.owner?.display_name ?? null },
  }));
}

export async function getAllPlaylistTracks(playlistId: string): Promise<SpotifyTrack[]> {
  // Call YOUR server
  const data = await api<{ items: { track: any }[] }>(`/api/playlists/${playlistId}/tracks`);
  const tracks: SpotifyTrack[] = [];
  for (const it of data.items ?? []) {
    const t = it.track;
    if (!t) continue;
    tracks.push({
      id: t.id,
      name: t.name,
      preview_url: t.preview_url,
      external_url: t.external_urls?.spotify,
      image: t.album?.images?.[0]?.url ?? null,
      uri: t.uri,
      artists: (t.artists ?? []).map((a: any) => ({ name: a.name })),
      album: { name: t.album?.name ?? "", images: t.album?.images ?? [] },
    });
  }
  return tracks;
}
