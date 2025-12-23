// server/src/index.ts
import express from "express";
import cors, { type CorsOptions } from "cors";
import cookieParser from "cookie-parser";
import { env } from "./env";
import { itunesPreviewLookup } from "./itunes";

import { login, callback, refreshToken, logout, token, getAccessToken } from "./auth";
import { pixabaySearch } from "./pixabay";
import { fetchLyrics } from "./lyrics";
import {
  transfer,
  play,
  pause,
  nextT,
  prevT,
  seek,
  volume,
  shuffle,
  repeat,
  devices,
  state,
} from "./player";

import imagesRouter from "./images";
import demoRouter from "./demoImages";
import { playlistsRouter } from "./playlists";

// ✅ Single source of truth for Spotify API proxying
import { getSpotifyToken, spotifySearch, spotifyProfile } from "./spotifyToken";

const app = express();

app.set("trust proxy", 1);
app.use(express.json());

// ----- CORS (allowlist + credentials) -----
const allowed = (env.ALLOWED_ORIGINS || []).map((s) => s.trim()).filter(Boolean);

const corsOptions: CorsOptions = {
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // allow server-to-server and curl
    if (allowed.includes(origin)) return cb(null, true);
    return cb(new Error(`CORS blocked for ${origin}`));
  },
  credentials: true,
};
app.use(cors(corsOptions));

// ----- Signed cookies -----
app.use(cookieParser(env.SESSION_SECRET));

// ----- Routers / routes -----
app.use("/api", imagesRouter);
app.use("/api/demo", demoRouter);
app.use("/api/spotify", playlistsRouter);

// Health (match your Render health check path)
app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.get("/api/auth/status", (req, res) => {
  res.json({ authenticated: Boolean(req.signedCookies["sp_refresh"]) });
});

// Auth
app.get("/auth/login", login);
app.get("/auth/callback", callback);
app.post("/auth/refresh", refreshToken);
app.post("/auth/logout", logout);
app.post("/auth/token", token); // client calls with credentials included

// --------- Spotify-proxied endpoints (server-side) ---------

// Search via server (anonymous OK)
app.get("/api/search", async (req, res) => {
  try {
    const q = (req.query.q as string) || "";
    const data = await spotifySearch(req, res, q);
    res.json(data);
  } catch (e: any) {
    const status = typeof e?.status === "number" ? e.status : 500;
    res.status(status).json({ error: e?.message ?? "search_failed" });
  }
});

// Track lookup (anonymous OK)
app.get("/api/tracks/:id", async (req, res) => {
  try {
    const access = await getSpotifyToken(req, res, "either");

    const r = await fetch(`https://api.spotify.com/v1/tracks/${req.params.id}`, {
      headers: { Authorization: `Bearer ${access}` },
    });

    const text = await r.text();
    return res.status(r.status).send(text || r.statusText);
  } catch (e: any) {
    res.status(500).json({ error: e?.message ?? "track_failed" });
  }
});

// Current user profile (logged-in only, refresh-aware)
app.get("/api/me", async (req, res) => {
  try {
    const profile = await spotifyProfile(req, res);
    if (!profile) return res.status(401).json({ error: "unauthorized" });
    res.json(profile);
  } catch (e: any) {
    const status = typeof e?.status === "number" ? e.status : 500;
    res.status(status).json({ error: e?.message ?? "profile_failed" });
  }
});

// ----- Playlists (logged-in only; refresh-aware via getAccessToken) -----
async function sfetchWithAuth(req: express.Request, res: express.Response, url: string) {
  const access = await getAccessToken(req, res);
  const r = await fetch(url, { headers: { Authorization: `Bearer ${access}` } });

  if (!r.ok) {
    const text = await r.text();
    throw Object.assign(new Error(`Spotify ${r.status}: ${text}`), { status: r.status });
  }

  return r.json();
}

app.get("/api/me/playlists", async (req, res) => {
  try {
    let url = "https://api.spotify.com/v1/me/playlists?limit=50";
    const items: any[] = [];
    while (url) {
      const page: any = await sfetchWithAuth(req, res, url);
      items.push(...(page.items ?? []));
      url = page.next ?? "";
    }
    res.json({ items });
  } catch (e: any) {
    const status = typeof e?.status === "number" ? e.status : 401;
    res.status(status).json({ error: e?.message ?? "Unauthorized" });
  }
});

app.get("/api/playlists/:id/tracks", async (req, res) => {
  try {
    let url = `https://api.spotify.com/v1/playlists/${req.params.id}/tracks?limit=100`;
    const items: any[] = [];
    while (url) {
      const page: any = await sfetchWithAuth(req, res, url);
      items.push(...(page.items ?? []));
      url = page.next ?? "";
    }
    res.json({ items });
  } catch (e: any) {
    const status = typeof e?.status === "number" ? e.status : 401;
    res.status(status).json({ error: e?.message ?? "Unauthorized" });
  }
});

// Pixabay (server-key)
app.get("/api/pixabay", async (req, res) => {
  const q = (req.query.q as string) || "";
  const data = await pixabaySearch(q);
  res.json(data);
});

// Lyrics (optional)
app.get("/api/lyrics", async (req, res) => {
  const artist = (req.query.artist as string) || "";
  const title = (req.query.title as string) || "";
  const data = await fetchLyrics(artist, title);
  res.json(data);
});

// iTunes preview fallback (no auth)
app.get("/api/itunes/preview", async (req, res) => {
  try {
    const artist = (req.query.artist as string) || "";
    const title = (req.query.title as string) || "";
    const result = await itunesPreviewLookup({ artist, title, country: "US" });
    res.json(result); // { preview_url: string | null }
  } catch (e: any) {
    res.status(500).json({ preview_url: null, error: e?.message ?? "itunes_failed" });
  }
});

// Player controls (logged-in only; player.ts should be updated to refresh tokens)
app.post("/api/player/transfer", transfer);
app.put("/api/player/play", play);
app.put("/api/player/pause", pause);
app.post("/api/player/next", nextT);
app.post("/api/player/previous", prevT);
app.put("/api/player/seek", seek);
app.put("/api/player/volume", volume);
app.put("/api/player/shuffle", shuffle);
app.put("/api/player/repeat", repeat);
app.get("/api/player/devices", devices);
app.get("/api/player/state", state);

// ----- Start -----
const port = Number(env.PORT || 8080);
app.listen(port, () => console.log(`API on :${port}`));
