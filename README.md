# Spotify + Pixabay Visualizer

This repository contains a full-stack TypeScript app that lets you search Spotify, fetch lyrics, and generate matching imagery using OpenAI‑powered keywords and the Pixabay API. The project is split into a Vite/React client and an Express server.

## Project Structure

```
spotify-pixabay-app/
├── client/         # Vite + React + Tailwind frontend
│   ├── src/
│   │   ├── components/     # UI pieces (track list, player panel, headers, etc.)
│   │   ├── pages/          # Home + MyStuff views
│   │   ├── hooks/          # Custom hooks (Spotify playback, lyrics/images)
│   │   ├── context/        # SpotifyPlayerProvider for shared SDK state
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
  - shadcn/ui select + scroll components
  - Spotify Web Playback SDK via a shared context provider

- **Server**
  - Express + TypeScript
  - Spotify REST proxy for search, playlists, and player control
  - OpenAI Responses API (`gpt-4o-mini`) for keyword extraction with throttling and caching
  - Pixabay API integration for imagery

## Features

- Search Spotify tracks, preview playlists, and pick songs from the My Stuff view.
- Automatically fetch lyrics for the current track and display them with a radiant accent gradient.
- Generate descriptive keywords via OpenAI (lyrics → keywords) and retrieve matching images from Pixabay.
- Rich playback controls powered by Spotify’s Web Playback SDK, with global state so music continues across routes.
- Responsive, portfolio-styled UI with dimensional gradient panels.

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

The app produces a live, interactive dashboard:

- Column 1: search box or playlist selector for picking tracks.
- Column 2: lyrics panel + Spotify playback controls.
- Column 3: dynamic Pixabay image grid that updates based on the selected track’s lyrics.

This README serves as a high-level guide; see the code comments and component files for implementation details.
