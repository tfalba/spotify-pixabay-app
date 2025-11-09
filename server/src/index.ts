import express from "express";
import cors, { CorsOptions } from "cors";
import cookieParser from "cookie-parser";
import { env } from "./env";

import { login, callback, refreshToken, logout, token, getAccessToken } from "./auth";
import { spotifySearch, spotifyProfile } from "./spotify";
import { pixabaySearch } from "./pixabay";
import { fetchLyrics } from "./lyrics";
import {
  transfer, play, pause, nextT, prevT,
  seek, volume, shuffle, repeat, devices, state
} from "./player";
import imagesRouter from "./images";

const app = express();

app.set("trust proxy", 1);
app.use(express.json());

// ----- CORS (allowlist + credentials) -----
const allowed = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);

const corsOptions: CorsOptions = {
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);           // allow server-to-server and curl
    if (allowed.includes(origin)) return cb(null, true);
    return cb(new Error(`CORS blocked for ${origin}`));
  },
  credentials: true,
};
app.use(cors(corsOptions));

// ----- Signed cookies -----
app.use(cookieParser(process.env.SESSION_SECRET));

// ----- Routers / routes -----
app.use("/api", imagesRouter);

// Health (match your Render health check path)
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// Auth
app.get("/auth/login", login);
app.get("/auth/callback", callback);
app.post("/auth/refresh", refreshToken);
app.post("/auth/logout", logout);
app.post("/auth/token", token);  // <-- POST so client can call with credentials

// --------- Spotify-proxied endpoints (server-side) ---------

// Search via server (uses cookies → getAccessToken)
app.get("/api/search", async (req, res) => {
  try {
    const q = (req.query.q as string) || "";
    const data = await spotifySearch(req, q);
    res.json(data);
  } catch (e: any) {
    const status = typeof e?.status === "number" ? e.status : 401;
    res.status(status).json({ error: e?.message ?? "search_failed" });
  }
});

// Current user profile
app.get("/api/me", async (req, res) => {
  try {
    const profile = await spotifyProfile(req);
    if (!profile) return res.status(401).json({ error: "unauthorized" });
    res.json(profile);
  } catch (e: any) {
    const status = typeof e?.status === "number" ? e.status : 500;
    res.status(status).json({ error: e?.message ?? "profile_failed" });
  }
});

// Example: playlists (auto-pagination) using a local helper
async function sfetchWithAuth(req: express.Request, res: express.Response, url: string) {
  const access = await getAccessToken(req, res);
  const r = await fetch(url, { headers: { Authorization: `Bearer ${access}` } });
  if (!r.ok) {
    const text = await r.text();
    throw new Error(`Spotify ${r.status}: ${text}`);
  }
  return r.json();
}

app.get("/api/me/playlists", async (req, res) => {
  try {
    let url = "https://api.spotify.com/v1/me/playlists?limit=50";
    const items: any[] = [];
    while (url) {
      const page: any = await sfetchWithAuth(req, res, url);
      items.push(...page.items);
      url = page.next ?? "";
    }
    res.json({ items });
  } catch (e: any) {
    res.status(401).json({ error: e?.message ?? "Unauthorized" });
  }
});

app.get("/api/playlists/:id/tracks", async (req, res) => {
  try {
    let url = `https://api.spotify.com/v1/playlists/${req.params.id}/tracks?limit=100`;
    const items: any[] = [];
    while (url) {
      const page: any = await sfetchWithAuth(req, res, url);
      items.push(...page.items);
      url = page.next ?? "";
    }
    res.json({ items });
  } catch (e: any) {
    res.status(401).json({ error: e?.message ?? "Unauthorized" });
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

// Player controls (your existing handlers)
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
const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`API on :${port}`));
