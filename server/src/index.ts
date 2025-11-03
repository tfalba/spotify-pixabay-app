import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { env } from "./env";
import { login, callback, refreshToken, logout, token } from "./auth";
import { spotifySearch, spotifyProfile } from "./spotify";
import { pixabaySearch } from "./pixabay";
import { fetchLyrics } from "./lyrics";
import {
  transfer, play, pause, nextT, prevT,
  seek, volume, shuffle, repeat, devices, state
} from "./player";

const app = express();
app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
  ],
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser(env.SESSION_SECRET));

// Health
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// Auth
app.get("/auth/login", login);
app.get("/auth/callback", callback);
app.post("/auth/refresh", refreshToken);
app.post("/auth/logout", logout);
app.get("/auth/token", token);

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

const PORT = 5174;
app.listen(PORT, () =>
  console.log(`Server listening on http://127.0.0.1:${PORT}`)
);
