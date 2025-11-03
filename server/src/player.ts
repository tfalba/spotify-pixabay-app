import type { Request, Response } from "express";

function access(req: Request) {
  const token = req.signedCookies["sp_access"];
  if (!token) throw Object.assign(new Error("Unauthorized"), { status: 401 });
  return token as string;
}

async function fetchJSON(url: string, init: RequestInit) {
  const r = await fetch(url, init);
  const text = await r.text();
  if (!r.ok) throw Object.assign(new Error(text || r.statusText), { status: r.status });
  return text ? JSON.parse(text) : {};
}

// POST /api/player/transfer  { device_id: string }
export async function transfer(req: Request, res: Response) {
  try {
    const token = access(req);
    const { device_id } = req.body || {};
    const r = await fetch("https://api.spotify.com/v1/me/player", {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ device_ids: [device_id], play: false })
    });
    res.status(r.status).end();
  } catch (e: any) {
    res.status(e.status || 500).send(e.message || "transfer failed");
  }
}

// PUT /api/player/play  { uris?: string[], context_uri?: string, position_ms?: number, offset?: { position?: number } }
export async function play(req: Request, res: Response) {
  try {
    const token = access(req);
    const r = await fetch("https://api.spotify.com/v1/me/player/play", {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(req.body || {})
    });
    res.status(r.status).end();
  } catch (e: any) {
    res.status(e.status || 500).send(e.message || "play failed");
  }
}

// PUT /api/player/pause
export async function pause(req: Request, res: Response) {
  try {
    const token = access(req);
    const r = await fetch("https://api.spotify.com/v1/me/player/pause", {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` }
    });
    res.status(r.status).end();
  } catch (e: any) {
    res.status(e.status || 500).send(e.message || "pause failed");
  }
}

// POST /api/player/next
export async function nextT(req: Request, res: Response) {
  try {
    const token = access(req);
    const r = await fetch("https://api.spotify.com/v1/me/player/next", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }
    });
    res.status(r.status).end();
  } catch (e: any) {
    res.status(e.status || 500).send(e.message || "next failed");
  }
}

// POST /api/player/previous
export async function prevT(req: Request, res: Response) {
  try {
    const token = access(req);
    const r = await fetch("https://api.spotify.com/v1/me/player/previous", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }
    });
    res.status(r.status).end();
  } catch (e: any) {
    res.status(e.status || 500).send(e.message || "previous failed");
  }
}

// PUT /api/player/seek?position_ms=12345
export async function seek(req: Request, res: Response) {
  try {
    const token = access(req);
    const position_ms = String(req.query.position_ms ?? "");
    const r = await fetch(`https://api.spotify.com/v1/me/player/seek?position_ms=${encodeURIComponent(position_ms)}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` }
    });
    res.status(r.status).end();
  } catch (e: any) {
    res.status(e.status || 500).send(e.message || "seek failed");
  }
}

// PUT /api/player/volume?volume_percent=0..100
export async function volume(req: Request, res: Response) {
  try {
    const token = access(req);
    const volume_percent = String(req.query.volume_percent ?? "50");
    const r = await fetch(`https://api.spotify.com/v1/me/player/volume?volume_percent=${encodeURIComponent(volume_percent)}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` }
    });
    res.status(r.status).end();
  } catch (e: any) {
    res.status(e.status || 500).send(e.message || "volume failed");
  }
}

// PUT /api/player/shuffle?state=true|false
export async function shuffle(req: Request, res: Response) {
  try {
    const token = access(req);
    const state = (req.query.state ?? "false").toString();
    const r = await fetch(`https://api.spotify.com/v1/me/player/shuffle?state=${encodeURIComponent(state)}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` }
    });
    res.status(r.status).end();
  } catch (e: any) {
    res.status(e.status || 500).send(e.message || "shuffle failed");
  }
}

// PUT /api/player/repeat?state=off|track|context
export async function repeat(req: Request, res: Response) {
  try {
    const token = access(req);
    const state = (req.query.state ?? "off").toString();
    const r = await fetch(`https://api.spotify.com/v1/me/player/repeat?state=${encodeURIComponent(state)}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` }
    });
    res.status(r.status).end();
  } catch (e: any) {
    res.status(e.status || 500).send(e.message || "repeat failed");
  }
}

// GET /api/player/devices
export async function devices(req: Request, res: Response) {
  try {
    const token = access(req);
    const data = await fetchJSON("https://api.spotify.com/v1/me/player/devices", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` }
    });
    res.json(data);
  } catch (e: any) {
    res.status(e.status || 500).send(e.message || "devices failed");
  }
}

// GET /api/player/state
export async function state(req: Request, res: Response) {
  try {
    const token = access(req);
    const data = await fetchJSON("https://api.spotify.com/v1/me/player", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` }
    });
    res.json(data);
  } catch (e: any) {
    res.status(e.status || 500).send(e.message || "state failed");
  }
}
