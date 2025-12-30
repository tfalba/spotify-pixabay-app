import type { Request, Response as ExpressResponse } from "express";
import { getAccessToken } from "../auth";

type FetchResponse = globalThis.Response;

export async function spotifyUserFetch(
  req: Request,
  res: ExpressResponse,
  url: string,
  init: RequestInit = {},
): Promise<FetchResponse> {
  const access = await getAccessToken(req, res);
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${access}`);
  return fetch(url, { ...init, headers });
}

export async function spotifyUserJson<T>(
  req: Request,
  res: ExpressResponse,
  url: string,
  init: RequestInit = {},
): Promise<T> {
  const r = await spotifyUserFetch(req, res, url, init);
  const text = await r.text();
  if (!r.ok) {
    throw Object.assign(new Error(`Spotify ${r.status}: ${text}`), {
      status: r.status,
    });
  }
  return text ? (JSON.parse(text) as T) : ({} as T);
}

export async function spotifyUserText(
  req: Request,
  res: ExpressResponse,
  url: string,
  init: RequestInit = {},
): Promise<{ status: number; text: string }> {
  const r = await spotifyUserFetch(req, res, url, init);
  const text = await r.text();
  return { status: r.status, text: text || r.statusText };
}
