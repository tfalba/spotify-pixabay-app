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

export async function spotifyProfile(req: Request) {
  const access = getAccessToken(req);
  if (!access) return null;

  const res = await fetch("https://api.spotify.com/v1/me", {
    headers: { Authorization: `Bearer ${access}` },
  });

  if (res.status === 401) {
    return null;
  }

  if (!res.ok) {
    const text = await res.text();
    throw Object.assign(new Error(text || "Failed to load profile"), {
      status: res.status,
    });
  }

  return res.json();
}
