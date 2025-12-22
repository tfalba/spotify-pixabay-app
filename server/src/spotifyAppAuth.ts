import { env } from "./env";
import { ensureOk, parseJson } from "./lib/http";

const SPOTIFY_ACCOUNTS = "https://accounts.spotify.com";

let cached:
  | { access_token: string; expires_at: number }
  | null = null;

export async function getAppAccessToken(): Promise<string> {
  const now = Date.now();

  // refresh 60s early
  if (cached && cached.expires_at - now > 60_000) {
    return cached.access_token;
  }

  const body = new URLSearchParams({ grant_type: "client_credentials" });

  const r = await fetch(`${SPOTIFY_ACCOUNTS}/api/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization:
        "Basic " +
        Buffer.from(
          `${env.SPOTIFY_CLIENT_ID}:${env.SPOTIFY_CLIENT_SECRET}`
        ).toString("base64"),
    },
    body,
  });

  ensureOk(r, "client_credentials token");
  const json = await parseJson<{ access_token: string; expires_in: number }>(r);

  cached = {
    access_token: json.access_token,
    expires_at: now + json.expires_in * 1000,
  };

  return json.access_token;
}
