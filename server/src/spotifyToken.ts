import type { Request, Response } from "express";
import { getAccessToken as getUserAccessToken } from "./auth";
import { getAppAccessToken } from "./spotifyAppAuth";

export function getCookieAccessToken(req: Request) {
  return req.signedCookies["sp_access"] as string | undefined;
}

/**
 * Get a token for Spotify requests.
 * - mode "user"   => requires logged-in cookies (refreshable)
 * - mode "app"    => client credentials
 * - mode "either" => prefer user token if present, else app
 */
export async function getSpotifyToken(
  req: Request,
  res: Response,
  mode: "user" | "app" | "either"
): Promise<string> {
  if (mode === "app") return getAppAccessToken();
  if (mode === "user") return getUserAccessToken(req, res);

  // either
  try {
    return await getUserAccessToken(req, res);
  } catch {
    return getAppAccessToken();
  }
}

export async function spotifySearch(req: Request, res: Response, q: string) {
  const query = (q ?? "").trim();
  if (!query) return { tracks: { items: [] } };

  // IMPORTANT: use either-mode so anonymous works, logged-in still works
  const token = await getSpotifyToken(req, res, "either");

  const params = new URLSearchParams({
    q: query,
    type: "track",
    limit: "10",
  });

  // Optional (can improve results + sometimes preview availability)
  // params.set("market", "US");

  const r = await fetch(
    `https://api.spotify.com/v1/search?${params.toString()}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  // bubble up Spotify errors cleanly
  const text = await r.text();
  if (!r.ok) {
    throw Object.assign(new Error(text || r.statusText), { status: r.status });
  }
  return text ? JSON.parse(text) : { tracks: { items: [] } };
}

export async function spotifyProfile(req: Request) {
  const access = getCookieAccessToken(req);
  if (!access) return null;

  const r = await fetch("https://api.spotify.com/v1/me", {
    headers: { Authorization: `Bearer ${access}` },
  });

  if (r.status === 401) return null;

  if (!r.ok) {
    const text = await r.text();
    throw Object.assign(new Error(text || "Failed to load profile"), {
      status: r.status,
    });
  }
  return r.json();
}
