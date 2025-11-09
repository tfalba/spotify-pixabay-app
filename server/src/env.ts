import dotenv from "dotenv";
dotenv.config();

export const env = {
  SPOTIFY_CLIENT_ID: process.env.SPOTIFY_CLIENT_ID || "",
  SPOTIFY_CLIENT_SECRET: process.env.SPOTIFY_CLIENT_SECRET || "",
  SPOTIFY_REDIRECT_URI:
    process.env.SPOTIFY_REDIRECT_URI || "http://127.0.0.1:5174/auth/callback",
  SPOTIFY_SCOPES:
    process.env.SPOTIFY_SCOPES || "user-read-email user-read-private",
  SESSION_SECRET: process.env.SESSION_SECRET || "dev_secret_change_me",
    CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || "http://127.0.0.1:5173",

  PIXABAY_API_KEY: process.env.PIXABAY_API_KEY || "",
  LYRICS_PROVIDER: process.env.LYRICS_PROVIDER || "",
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || "",
  COOKIE_SECRET: process.env.COOKIE_SECRET || "super-secret",
  PORT: process.env.PORT || 4000,
};
