// server/src/player.ts
import type { Request, Response as ExpressResponse } from "express";
import { getAccessToken } from "./auth";

type FetchResponse = globalThis.Response;

async function access(req: Request, res: ExpressResponse) {
  // Refresh-aware: uses sp_refresh when sp_access is missing/expired
  try {
    return await getAccessToken(req, res as any);
  } catch {
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  }
}

async function passthrough(res: ExpressResponse, r: FetchResponse) {
  const text = await r.text();
  res.status(r.status).send(text || r.statusText);
}

type ProxyOpts = {
  method: "GET" | "POST" | "PUT";
  url: string;
  body?: Record<string, unknown>;
  errorMessage: string;
};

async function proxySpotify(req: Request, res: ExpressResponse, opts: ProxyOpts) {
  try {
    const token = await access(req, res);
    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
    };
    const body =
      opts.body !== undefined ? JSON.stringify(opts.body) : undefined;
    if (body) headers["Content-Type"] = "application/json";

    const r = await fetch(opts.url, {
      method: opts.method,
      headers,
      body,
    });

    return passthrough(res, r);
  } catch (e: any) {
    res.status(e.status || 500).send(e.message || opts.errorMessage);
  }
}

// POST /api/player/transfer  { device_id: string }
export async function transfer(req: Request, res: ExpressResponse) {
  const { device_id, play } = req.body || {};
  if (!device_id) return res.status(400).send("device_id is required");
  return proxySpotify(req, res, {
    method: "PUT",
    url: "https://api.spotify.com/v1/me/player",
    body: { device_ids: [device_id], play: Boolean(play) },
    errorMessage: "transfer failed",
  });
}

// PUT /api/player/play
// Body: { uris?: string[], context_uri?: string, position_ms?: number, offset?: { position?: number }, device_id?: string }
export async function play(req: Request, res: ExpressResponse) {
  const body = (req.body || {}) as {
    uris?: string[];
    context_uri?: string;
    position_ms?: number;
    offset?: { position?: number };
    device_id?: string;
  };

  const q = body.device_id
    ? `?device_id=${encodeURIComponent(body.device_id)}`
    : "";

  return proxySpotify(req, res, {
    method: "PUT",
    url: `https://api.spotify.com/v1/me/player/play${q}`,
    body: {
      uris: body.uris,
      context_uri: body.context_uri,
      position_ms: body.position_ms,
      offset: body.offset,
    },
    errorMessage: "play failed",
  });
}

// PUT /api/player/pause
export async function pause(req: Request, res: ExpressResponse) {
  return proxySpotify(req, res, {
    method: "PUT",
    url: "https://api.spotify.com/v1/me/player/pause",
    errorMessage: "pause failed",
  });
}

// POST /api/player/next
export async function nextT(req: Request, res: ExpressResponse) {
  return proxySpotify(req, res, {
    method: "POST",
    url: "https://api.spotify.com/v1/me/player/next",
    errorMessage: "next failed",
  });
}

// POST /api/player/previous
export async function prevT(req: Request, res: ExpressResponse) {
  return proxySpotify(req, res, {
    method: "POST",
    url: "https://api.spotify.com/v1/me/player/previous",
    errorMessage: "previous failed",
  });
}

// PUT /api/player/seek?position_ms=12345
export async function seek(req: Request, res: ExpressResponse) {
  const position_ms = String(req.query.position_ms ?? "");
  if (!position_ms) return res.status(400).send("position_ms is required");
  return proxySpotify(req, res, {
    method: "PUT",
    url: `https://api.spotify.com/v1/me/player/seek?position_ms=${encodeURIComponent(
      position_ms
    )}`,
    errorMessage: "seek failed",
  });
}

// PUT /api/player/volume?volume_percent=0..100
export async function volume(req: Request, res: ExpressResponse) {
  const volume_percent = String(req.query.volume_percent ?? "50");
  return proxySpotify(req, res, {
    method: "PUT",
    url: `https://api.spotify.com/v1/me/player/volume?volume_percent=${encodeURIComponent(
      volume_percent
    )}`,
    errorMessage: "volume failed",
  });
}

// PUT /api/player/shuffle?state=true|false
export async function shuffle(req: Request, res: ExpressResponse) {
  const state = (req.query.state ?? "false").toString();
  return proxySpotify(req, res, {
    method: "PUT",
    url: `https://api.spotify.com/v1/me/player/shuffle?state=${encodeURIComponent(
      state
    )}`,
    errorMessage: "shuffle failed",
  });
}

// PUT /api/player/repeat?state=off|track|context
export async function repeat(req: Request, res: ExpressResponse) {
  const state = (req.query.state ?? "off").toString();
  return proxySpotify(req, res, {
    method: "PUT",
    url: `https://api.spotify.com/v1/me/player/repeat?state=${encodeURIComponent(
      state
    )}`,
    errorMessage: "repeat failed",
  });
}
