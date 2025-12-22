// server/src/spotifyToken.ts
import type { Request, Response } from "express";
import { getAccessToken as getUserAccessToken } from "./auth";
import { getAppAccessToken } from "./spotifyAppAuth";

/**
 * Get a token for Spotify requests.
 * - mode "user"   => requires logged-in cookies (refreshable via auth.ts)
 * - mode "app"    => client credentials
 * - mode "either" => prefer user token if present, else app token
 */
export async function getSpotifyToken(
  req: Request,
  res: Response,
  mode: "user" | "app" | "either",
): Promise<string> {
  if (mode === "app") return getAppAccessToken();
  if (mode === "user") return getUserAccessToken(req, res);

  // either: try user token first, fall back to app token
  try {
    return await getUserAccessToken(req, res);
  } catch {
    return getAppAccessToken();
  }
}

function isLoggedIn(req: Request) {
  // In your auth.ts, refresh cookie existing == user has actually logged in
  return Boolean(req.signedCookies["sp_refresh"]);
}

async function fetchSpotifyText(url: string, token: string) {
  const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const text = await r.text();
  return { r, text };
}

export async function spotifySearch(req: Request, res: Response, q: string) {
  const query = (q ?? "").trim();
  if (!query) return { tracks: { items: [] } };

  // anonymous OK, logged-in OK
  const token = await getSpotifyToken(req, res, "either");

  // market:
  // - user token: "from_token" gives best locale correctness
  // - app token: must use explicit market (US is a good default)
  const market = isLoggedIn(req) ? "from_token" : "US";

  const params = new URLSearchParams({
    q: query,
    type: "track",
    limit: "10",
    market,
  });

  // 1) search
  const { r, text } = await fetchSpotifyText(
    `https://api.spotify.com/v1/search?${params.toString()}`,
    token,
  );

  if (!r.ok) {
    throw Object.assign(new Error(text || r.statusText), { status: r.status });
  }

  const searchJson: any = text ? JSON.parse(text) : { tracks: { items: [] } };

  // 2) optional enrichment: /v1/tracks sometimes returns a “fuller” track object
  try {
    const ids = (searchJson?.tracks?.items ?? [])
      .map((t: any) => t?.id)
      .filter(Boolean)
      .slice(0, 10);

    if (ids.length) {
      const { r: rr, text: t2 } = await fetchSpotifyText(
        `https://api.spotify.com/v1/tracks?ids=${encodeURIComponent(
          ids.join(","),
        )}&market=${encodeURIComponent(market)}`,
        token,
      );

      if (rr.ok) {
        const tracksJson: any = t2 ? JSON.parse(t2) : { tracks: [] };
        const byId = new Map(
          (tracksJson?.tracks ?? []).map((t: any) => [t.id, t]),
        );

        searchJson.tracks.items = (searchJson.tracks.items ?? []).map(
          (t: any) => byId.get(t.id) ?? t,
        );
      }
    }
  } catch {
    // ignore enrichment failures; base search results are still fine
  }

  return searchJson;
}

/**
 * Logged-in profile (refresh-aware).
 * Returns null if not logged in / unauthorized.
 */
export async function spotifyProfile(req: Request, res: Response) {
  let token: string;
  try {
    token = await getSpotifyToken(req, res, "user");
  } catch {
    return null;
  }

  const { r, text } = await fetchSpotifyText("https://api.spotify.com/v1/me", token);

  if (r.status === 401) return null;

  if (!r.ok) {
    throw Object.assign(new Error(text || "Failed to load profile"), {
      status: r.status,
    });
  }

  return text ? JSON.parse(text) : null;
}
