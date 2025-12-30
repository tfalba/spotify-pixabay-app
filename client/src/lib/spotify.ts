// client/src/lib/spotify.ts

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

import { spotifyApiJson } from "./spotifyApi";

// ---- Helpers ----

function normalizeTrack(t: any): SpotifyTrack {
  return {
    id: t.id,
    name: t.name,
    preview_url: t.preview_url ?? null,
    external_url: t.external_urls?.spotify ?? t.external_url ?? "",
    image: t.image ?? t.album?.images?.[0]?.url ?? null,
    uri: t.uri,
    artists: (t.artists ?? []).map((a: any) => ({ name: a.name })),
    album: {
      name: t.album?.name ?? "",
      images: t.album?.images ?? [],
    },
  };
}

// ---- Public helpers ----

export async function getAllUserPlaylists(init?: RequestInit): Promise<SpotifyPlaylist[]> {
  const data = await spotifyApiJson<{ items: SpotifyPlaylist[] }>(
    "/api/me/playlists",
    init
  );
  return (data.items ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    images: p.images ?? [],
    tracks: { total: p.tracks?.total ?? 0 },
    owner: { display_name: p.owner?.display_name ?? null },
  }));
}

export async function getAllPlaylistTracks(
  playlistId: string,
  init?: RequestInit
): Promise<SpotifyTrack[]> {
  const data = await spotifyApiJson<{ items: { track: SpotifyTrack }[] }>(
    `/api/playlists/${playlistId}/tracks`,
    init
  );

  const tracks: SpotifyTrack[] = [];
  for (const it of data.items ?? []) {
    const t: any = it.track;
    if (!t) continue;
    tracks.push({
      id: t.id,
      name: t.name,
      preview_url: t.preview_url ?? null,
      external_url: t.external_urls?.spotify ?? t.external_url ?? "",
      image: t.album?.images?.[0]?.url ?? null,
      uri: t.uri,
      artists: (t.artists ?? []).map((a: any) => ({ name: a.name })),
      album: { name: t.album?.name ?? "", images: t.album?.images ?? [] },
    });
  }
  return tracks;
}

export async function searchTracks(q: string, init?: RequestInit): Promise<SpotifyTrack[]> {
  const trimmed = q.trim();
  if (!trimmed) return [];

  const data = await spotifyApiJson<{ tracks: { items: any[] } }>(
    `/api/search?q=${encodeURIComponent(trimmed)}`,
    init
  );

  const items = data.tracks?.items ?? [];
  return items.map(normalizeTrack);
}

/**
 * Server endpoint should return: { preview_url: string | null }
 * You already have /api/itunes/preview in place.
 */
export async function getItunesPreview(
  artist: string,
  title: string,
  init?: RequestInit
): Promise<string | null> {
  const params = new URLSearchParams({ artist, title });
  try {
    const json = await spotifyApiJson<{ preview_url?: string | null }>(
      `/api/itunes/preview?${params.toString()}`,
      init
    );
    return json?.preview_url ?? null;
  } catch {
    return null;
  }
}

/**
 * OPTIONAL: Enrich tracks missing preview_url using iTunes.
 * - Does NOT block initial rendering if you call it after showing results.
 * - Batches requests with Promise.all but only for N tracks to avoid hammering.
 */
export async function enrichMissingPreviews(
  tracks: SpotifyTrack[],
  opts?: { limit?: number; init?: RequestInit }
): Promise<SpotifyTrack[]> {
  const limit = opts?.limit ?? 6; // keep this small for UX
  const init = opts?.init;

  let count = 0;

  const enriched = await Promise.all(
    tracks.map(async (t) => {
      if (t.preview_url) return t;
      if (count >= limit) return t;

      const artist = t.artists?.[0]?.name ?? "";
      const title = t.name ?? "";
      if (!title) return t;

      count += 1;
      const preview = await getItunesPreview(artist, title, init);
      if (!preview) return t;

      return { ...t, preview_url: preview };
    })
  );

  return enriched;
}
