# Spotify + Pixabay Visualizer

This repository contains a full-stack TypeScript app that lets you search Spotify, fetch lyrics, and generate matching imagery using OpenAI‑powered keywords and the Pixabay API. The project is split into a Vite/React client and an Express server, with a logged-out sample experience for previews.

## Project Structure

```
spotify-pixabay-app/
├── client/         # Vite + React + Tailwind frontend
│   ├── src/
│   │   ├── components/     # UI pieces (track list, player panel, headers, etc.)
│   │   ├── pages/          # Home + MyStuff views
│   │   ├── hooks/          # Custom hooks (Spotify playback, lyrics/images)
│   │   ├── context/        # App state (auth, player, playlists, track)
│   │   └── lib/            # Client helpers (Spotify REST wrappers)
│   └── public/             # Static assets
└── server/        # Express API
    ├── src/
    │   ├── auth.ts         # Spotify OAuth + cookie handling
    │   ├── player.ts       # Spotify playback proxy routes
    │   ├── lyrics.ts       # Lyrics provider abstraction
    │   ├── lib/            # OpenAI keyword extractor + Pixabay helpers
    │   └── images.ts       # /api/lyrics-to-images router
    └── dist/               # Compiled server output
```

## Key Tools & Libraries

- **Client**
  - [Vite](https://vitejs.dev/) + React 19
  - TailwindCSS with custom palette/gradients
  - Spotify Web Playback SDK via a shared context provider

- **Server**
  - Express + TypeScript
  - Spotify REST proxy for search, playlists, and player control
- OpenAI Responses API (`gpt-5-mini`) for keyword extraction with throttling and caching
  - Pixabay API integration for imagery

## Features

- Search Spotify tracks, browse playlists, and pick songs in a unified Manage panel.
- Logged-out experience includes a sample playlist with preview playback.
- Automatically fetch lyrics for the current track and display them alongside the player.
- Generate descriptive keywords via OpenAI (lyrics → keywords) and retrieve matching images from Pixabay.
- Moodboard grid with a hero image, flipping cards, and fullscreen view for larger browsing.
- Rich playback controls powered by Spotify’s Web Playback SDK, with global state so music continues across routes.
- Responsive, portfolio-styled UI with dimensional gradient panels.

## Server Routes

- Auth
  - `GET /auth/login`
  - `GET /auth/callback`
  - `POST /auth/refresh`
  - `POST /auth/logout`
  - `POST /auth/token`
  - `GET /api/auth/status`
- Spotify data (server-proxied)
  - `GET /api/search`
  - `GET /api/tracks/:id`
  - `GET /api/me`
  - `GET /api/me/playlists`
  - `GET /api/playlists/:id/tracks`
  - `POST /api/spotify/move-track`
- Player controls
  - `POST /api/player/transfer`
  - `PUT /api/player/play`
  - `PUT /api/player/pause`
  - `POST /api/player/next`
  - `POST /api/player/previous`
  - `PUT /api/player/seek`
  - `PUT /api/player/volume`
  - `PUT /api/player/shuffle`
  - `PUT /api/player/repeat`
- Lyrics + imagery
  - `POST /api/lyrics-to-images`
  - `GET /api/demo`
  - `GET /api/pixabay`
  - `GET /api/lyrics`
  - `GET /api/itunes/preview`

## Getting Started

1. **Install dependencies**
   ```bash
   cd client && npm install
   cd ../server && npm install
   ```
2. **Environment variables**  
   Supply Spotify, OpenAI, and Pixabay credentials in `client/.env`, `server/.env`.
3. **Run dev servers**
   ```bash
   # Terminal 1
   cd server && npm run dev

   # Terminal 2
   cd client && npm run dev
   ```
4. Visit the Vite dev URL (default `http://127.0.0.1:5173`) and log in with Spotify.

## Output

The app produces a live, interactive dashboard that is collapsable and expandable in sections:

- Column 1: manage playlists or search to pick tracks (sample playlist shown when logged out).
- Column 2: lyrics panel (playback controls and image art-type chooser appear as a slideout in the header banner)
- Column 3: dynamic Pixabay image grid that updates based on the selected track’s lyrics, with fullscreen support.

This README serves as a high-level guide; see the code comments and component files for implementation details.
