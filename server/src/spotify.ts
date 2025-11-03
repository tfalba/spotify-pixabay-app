import type { Request } from "express";
export function getAccessToken(req: Request) {
  return req.signedCookies["sp_access"] as string | undefined;
}
export async function spotifySearch(req: Request, q: string) {
  const access = getAccessToken(req);
  if (!access) return { error: "unauthorized" };
  const params = new URLSearchParams({ q, type: "track", limit: "10" });
  const res = await fetch(
    `https://api.spotify.com/v1/search?${params.toString()}`,
    {
      headers: { Authorization: `Bearer ${access}` },
    }
  );
  return res.json();
}
