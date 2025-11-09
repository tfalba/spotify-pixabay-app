import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import fetch from "node-fetch";
import session from "express-session";
import { env } from "./env";
import { login, callback, refreshToken, logout, token } from "./auth";
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

const allowed = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map(s => s.trim());

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowed.includes(origin)) return cb(null, true);
      return cb(new Error("CORS blocked"), false);
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser(env.COOKIE_SECRET));
app.use(
  session({
    name: process.env.COOKIE_NAME || "spx_auth",
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === "true",
      sameSite: (process.env.COOKIE_SAMESITE as any) || "lax",
      domain: process.env.COOKIE_DOMAIN || undefined,
    },
  })
);

type TokenSet = {
  access_token: string;
  refresh_token?: string;
  expires_at: number; // epoch ms
};

// cookie names
const ACCESS = "sp_access";
const REFRESH = "sp_refresh";
const EXPIRES = "sp_expires";

app.use("/api", imagesRouter);

// Health
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// Auth
app.get("/auth/login", login);
app.get("/auth/callback", callback);
app.post("/auth/refresh", refreshToken);
app.post("/auth/logout", logout);
app.get("/auth/token", token);

// read tokens from signed cookies
function readTokens(req: express.Request): TokenSet | null {
  const { signedCookies } = req;
  const access_token = signedCookies[ACCESS];
  const refresh_token = signedCookies[REFRESH];
  const expires_at = Number(signedCookies[EXPIRES] || 0);
  if (!access_token) return null;
  return { access_token, refresh_token, expires_at };
}

async function refreshIfNeeded(req: express.Request, res: express.Response): Promise<string> {
  const tok = readTokens(req);
  if (!tok) throw new Error("Not authenticated");

  const now = Date.now() + 10_000; // 10s skew
  if (tok.expires_at > now) return tok.access_token;

  if (!tok.refresh_token) throw new Error("Missing refresh token");

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: tok.refresh_token,
    client_id: process.env.SPOTIFY_CLIENT_ID!,
    client_secret: process.env.SPOTIFY_CLIENT_SECRET!,
  });

  const r = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!r.ok) {
    const text = await r.text();
    throw new Error(`Refresh failed: ${r.status} ${text}`);
  }
  const json = await r.json() as {
    access_token: string;
    expires_in: number;
    refresh_token?: string;
  };

  // update cookies
  const expires_at = Date.now() + json.expires_in * 1000;
  res.cookie(ACCESS, json.access_token, { httpOnly: true, signed: true, sameSite: "lax", secure: false });
  if (json.refresh_token) {
    res.cookie(REFRESH, json.refresh_token, { httpOnly: true, signed: true, sameSite: "lax", secure: false });
  }
  res.cookie(EXPIRES, String(expires_at), { httpOnly: true, signed: true, sameSite: "lax", secure: false });

  return json.access_token;
}

async function sfetch(accessToken: string, url: string) {
  const r = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!r.ok) {
    const text = await r.text();
    throw new Error(`Spotify ${r.status}: ${text}`);
  }
  return r.json();
}

// API: Spotify search (requires auth cookie)
app.get("/api/search", async (req, res) => {
  const q = (req.query.q as string) || "";
  const data = await spotifySearch(req, q);
  res.json(data);
});

// API: Current Spotify user profile
app.get("/api/me", async (req, res) => {
  try {
    const profile = await spotifyProfile(req);
    if (!profile) {
      res.status(401).json({ error: "unauthorized" });
      return;
    }
    res.json(profile);
  } catch (e: any) {
    const status = typeof e?.status === "number" ? e.status : 500;
    res.status(status).json({ error: e?.message ?? "profile_fetch_failed" });
  }
});

// ------- API: playlists & tracks (auto-pagination) -------

app.get("/api/me/playlists", async (req, res) => {
  try {
    const token = await refreshIfNeeded(req, res);
    let url = "https://api.spotify.com/v1/me/playlists?limit=50";
    const items: any[] = [];
    while (url) {
      const page: any = await sfetch(token, url);
      items.push(...page.items);
      url = page.next ?? "";
    }
    res.json({ items });
  } catch (e: any) {
    res.status(401).json({ error: e.message ?? "Unauthorized" });
  }
});

app.get("/api/playlists/:id/tracks", async (req, res) => {
  try {
    const token = await refreshIfNeeded(req, res);
    let url = `https://api.spotify.com/v1/playlists/${req.params.id}/tracks?limit=100`;
    const items: any[] = [];
    while (url) {
      const page: any = await sfetch(token, url);
      items.push(...page.items);
      url = page.next ?? "";
    }
    res.json({ items });
  } catch (e: any) {
    res.status(401).json({ error: e.message ?? "Unauthorized" });
  }
});


// API: Pixabay images (no auth beyond server-side key)
app.get("/api/pixabay", async (req, res) => {
  const q = (req.query.q as string) || "";
  const data = await pixabaySearch(q);
  res.json(data);
});

// API: Lyrics (optional)
app.get("/api/lyrics", async (req, res) => {
  const artist = (req.query.artist as string) || "";
  const title = (req.query.title as string) || "";
  const data = await fetchLyrics(artist, title);
  res.json(data);
});


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

// const PORT = 5174;
// app.listen(PORT, () =>
//   console.log(`Server listening on http://127.0.0.1:${PORT}`)
// );

const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`API on :${port}`));


