import type { Request, Response } from "express";
import crypto from "crypto";
import { env } from "./env";
import { ensureOk, parseJson } from "./lib/http";
import { cookieOpts } from "./lib/cookies";

const SPOTIFY_ACCOUNTS = "https://accounts.spotify.com";

export interface SpotifyTokenResponse {
  access_token: string;
  token_type: "Bearer";
  expires_in: number;
  refresh_token?: string;
  scope?: string;
}

export interface SpotifyProfile {
  id: string;
  display_name?: string | null;
  email?: string;
  images?: { url: string; width?: number; height?: number }[];
}

function base64URLEncode(buf: Buffer) {
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest();
}

/** ---------- OAuth entry ---------- */
export async function login(_req: Request, res: Response) {
  const state = base64URLEncode(crypto.randomBytes(16));
  const codeVerifier = base64URLEncode(crypto.randomBytes(64));
  const codeChallenge = base64URLEncode(sha256(codeVerifier));

  // temporary cookies for PKCE + CSRF state
  res.cookie("sp_state", state, cookieOpts);
  res.cookie("sp_cv", codeVerifier, cookieOpts);

  const params = new URLSearchParams({
    client_id: env.SPOTIFY_CLIENT_ID,
    response_type: "code",
    redirect_uri: env.SPOTIFY_REDIRECT_URI,
    code_challenge_method: "S256",
    code_challenge: codeChallenge,
    scope: env.SPOTIFY_SCOPES ?? "",
    state,
  });

  res.redirect(`${SPOTIFY_ACCOUNTS}/authorize?${params.toString()}`);
}

/** ---------- OAuth callback ---------- */
export async function callback(req: Request, res: Response) {
  const { code, state } = req.query as { code?: string; state?: string };
  const stateCookie = req.signedCookies["sp_state"];
  const codeVerifier = req.signedCookies["sp_cv"];

  if (!code || !state || state !== stateCookie) {
    return res.status(400).send("Invalid OAuth state");
  }

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: env.SPOTIFY_REDIRECT_URI,
    client_id: env.SPOTIFY_CLIENT_ID,
    code_verifier: codeVerifier,
  });

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

  ensureOk(r, "token exchange");
  const json = await parseJson<SpotifyTokenResponse>(r);

  // Persist cookies
  const maxAge = json.expires_in * 1000;
  res.cookie("sp_access", json.access_token, { ...cookieOpts, maxAge });

  // refresh tokens are long-lived; persist them (e.g., 30 days)
  const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
  if (json.refresh_token) {
    res.cookie("sp_refresh", json.refresh_token, { ...cookieOpts, maxAge: THIRTY_DAYS });
  }

  res.cookie("sp_last_seen", Date.now().toString(), cookieOpts);

  // clear one-time cookies
  res.clearCookie("sp_state", cookieOpts);
  res.clearCookie("sp_cv", cookieOpts);

  // back to client
  res.redirect(env.CLIENT_ORIGIN + "/");
}

/** ---------- Explicit refresh endpoint (optional for client) ---------- */
export async function refreshToken(req: Request, res: Response) {
  const refresh = req.signedCookies["sp_refresh"] as string | undefined;
  if (!refresh) return res.status(401).json({ error: "No refresh token" });

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refresh,
    client_id: env.SPOTIFY_CLIENT_ID,
  });

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

  ensureOk(r, "refresh token");
  const json = await parseJson<SpotifyTokenResponse>(r);

  res.cookie("sp_access", json.access_token, {
    ...cookieOpts,
    maxAge: json.expires_in * 1000,
  });
  res.cookie("sp_last_seen", Date.now().toString(), cookieOpts);

  if (json.refresh_token) {
    const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
    res.cookie("sp_refresh", json.refresh_token, { ...cookieOpts, maxAge: THIRTY_DAYS });
  }

  res.json({ ok: true });
}

/** ---------- Logout ---------- */
export function logout(_req: Request, res: Response) {
  res.clearCookie("sp_access", cookieOpts);
  res.clearCookie("sp_refresh", cookieOpts);
  res.clearCookie("sp_last_seen", cookieOpts);
  res.redirect(env.CLIENT_ORIGIN + "/");
}

/** ---------- Core helper used by routes and /auth/token ---------- */
export async function getAccessToken(req: Request, res: Response): Promise<string> {
  const current = req.signedCookies["sp_access"] as string | undefined;
  const refresh = req.signedCookies["sp_refresh"] as string | undefined;
  const lastSeenRaw = req.signedCookies["sp_last_seen"] as string | undefined;
  const lastSeen = lastSeenRaw ? Number(lastSeenRaw) : null;

  if (!refresh) {
    throw new Error("not_authenticated");
  }

  // If we have a token and recent activity, keep using it
  const inactiveTooLong = lastSeen !== null ? Date.now() - lastSeen > 60 * 60 * 1000 : true;
  if (current && !inactiveTooLong) {
    res.cookie("sp_last_seen", Date.now().toString(), cookieOpts);
    return current;
  }

  // Refresh the access token
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refresh,
    client_id: env.SPOTIFY_CLIENT_ID,
  });

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

  ensureOk(r, "token refresh");
  const json = await parseJson<SpotifyTokenResponse>(r);

  const maxAge = (json.expires_in ?? 3600) * 1000;
  res.cookie("sp_access", json.access_token, { ...cookieOpts, maxAge });
  res.cookie("sp_last_seen", Date.now().toString(), cookieOpts);

  if (json.refresh_token) {
    const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
    res.cookie("sp_refresh", json.refresh_token, { ...cookieOpts, maxAge: THIRTY_DAYS });
  }

  return json.access_token;
}

/** ---------- Public endpoint the client calls to get/refresh a token ---------- */
export async function token(req: Request, res: Response) {
  try {
    const access_token = await getAccessToken(req, res);
    return res.json({ access_token, token_type: "Bearer" as const });
  } catch (e: any) {
    const code = e?.message === "not_authenticated" ? 401 : 500;
    return res.status(code).json({ error: e?.message ?? "token_exchange_failed" });
  }
}
