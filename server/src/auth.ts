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

function sha256(buffer: string) {
  return crypto.createHash("sha256").update(buffer).digest();
}

export async function login(req: Request, res: Response) {
  const state = base64URLEncode(crypto.randomBytes(16));
  const codeVerifier = base64URLEncode(crypto.randomBytes(64));
  const codeChallenge = base64URLEncode(sha256(codeVerifier));

  res.cookie("sp_state", state, cookieOpts);
  res.cookie("sp_cv", codeVerifier, cookieOpts);

  const params = new URLSearchParams({
    client_id: env.SPOTIFY_CLIENT_ID,
    response_type: "code",
    redirect_uri: env.SPOTIFY_REDIRECT_URI,
    code_challenge_method: "S256",
    code_challenge: codeChallenge,
    scope: env.SPOTIFY_SCOPES,
    state,
  });

  res.redirect(`${SPOTIFY_ACCOUNTS}/authorize?${params.toString()}`);
}

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

  const tokenRes = await fetch(`${SPOTIFY_ACCOUNTS}/api/token`, {
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
  ensureOk(tokenRes, "token exchange");
  const json = await parseJson<SpotifyTokenResponse>(tokenRes);
  // const json: any = await tokenRes.json();

  if (!tokenRes.ok) {
    console.error(json);
    return res.status(400).send("Failed to exchange token");
  }

  // Store in signed cookies

  const maxAge = json.expires_in * 1000;

  res.cookie("sp_access", json.access_token, { ...cookieOpts, maxAge });
  res.cookie("sp_refresh", json.refresh_token, cookieOpts);
  res.cookie("sp_last_seen", Date.now().toString(), cookieOpts);

  // optional: clear one-time OAuth cookies now that they’re used
  res.clearCookie("sp_state", cookieOpts);
  res.clearCookie("sp_cv", cookieOpts);

  res.redirect(env.CLIENT_ORIGIN + "/");
}

export async function refreshToken(req: Request, res: Response) {
  const refresh = req.signedCookies["sp_refresh"];
  if (!refresh) return res.status(401).json({ error: "No refresh token" });

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refresh,
    client_id: env.SPOTIFY_CLIENT_ID,
  });

  const tokenRes = await fetch(`${SPOTIFY_ACCOUNTS}/api/token`, {
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

  ensureOk(tokenRes, "refresh token");
  const json = await parseJson<SpotifyTokenResponse>(tokenRes);

  // const json: any = await tokenRes.json();
  if (!tokenRes.ok) return res.status(400).json(json);

  res.cookie("sp_access", json.access_token, {
    ...cookieOpts,
    maxAge: json.expires_in * 1000,
  });
  res.cookie("sp_last_seen", Date.now().toString(), cookieOpts);

  // rotate refresh if provided
  if (json.refresh_token) {
    res.cookie("sp_refresh", json.refresh_token, cookieOpts);
  }

  res.json({ ok: true });
}

export function logout(req: Request, res: Response) {
  res.clearCookie("sp_access", cookieOpts);
  res.clearCookie("sp_refresh", cookieOpts);
  res.clearCookie("sp_last_seen", cookieOpts);
  res.redirect(env.CLIENT_ORIGIN + "/");
}

export async function token(req: Request, res: Response) {
  try {
    const lastSeenRaw = req.signedCookies["sp_last_seen"] as string | undefined;
    const lastSeen = lastSeenRaw ? Number(lastSeenRaw) : null;
    const inactiveTooLong =
      lastSeen !== null ? Date.now() - lastSeen > 60 * 60 * 1000 : false;
    const current = req.signedCookies["sp_access"] as string | undefined;
    const refresh = req.signedCookies["sp_refresh"] as string | undefined;
    if (!refresh) {
      return res.status(401).json({ error: "not_authenticated" });
    }

    if (current && !inactiveTooLong) {
      res.cookie("sp_last_seen", Date.now().toString(), {
        httpOnly: true,
        sameSite: "lax",
        signed: true,
      });
      return res.json({ access_token: current });
    }

    // Refresh the access token using the refresh token cookie
    const body = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refresh,
      client_id: env.SPOTIFY_CLIENT_ID,
    });

    const r = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        // If your app is set as a Confidential client, keep Basic auth:
        Authorization:
          "Basic " +
          Buffer.from(
            `${env.SPOTIFY_CLIENT_ID}:${env.SPOTIFY_CLIENT_SECRET}`
          ).toString("base64"),
      },
      body,
    });

    // const json = await r.json();
    ensureOk(r, "token exchange");
    const json = await parseJson<SpotifyTokenResponse>(r);
    const { access_token, refresh_token, expires_in } = json;
    if (!r.ok) {
      return res.status(400).json(json);
    }

    // Persist refreshed token in cookie and return it
    const maxAge = (json.expires_in ?? 3600) * 1000;
    res.cookie("sp_access", json.access_token, { ...cookieOpts, maxAge });
    res.cookie("sp_last_seen", Date.now().toString(), cookieOpts);

    // Some refresh responses return a new refresh_token; if so, rotate it.
    if (json.refresh_token) {
      res.cookie("sp_refresh", json.refresh_token, cookieOpts);
    }

    return res.json({
      access_token: json.access_token,
      expires_in: json.expires_in,
      token_type: json.token_type,
    });
  } catch (e: any) {
    console.error("auth/token error:", e);
    return res.status(500).json({ error: "token_exchange_failed" });
  }
}
