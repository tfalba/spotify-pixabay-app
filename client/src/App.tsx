import { useEffect, useState } from "react";
import type { Track } from "./types/types";
import { get } from "./lib/fetcher";
import { useLyricsImages } from "./hooks/useLyricsImages";
import backgroundPlayer from "./assets/IMG_4028.jpg";
import HeaderBar from "./components/HeaderBar";
import SpotifySearch from "./components/SpotifySearch";
import PixabayGrid from "./components/PixabayGrid";
import LyricsPane from "./components/LyricsPane";

export default function App() {
  const [current, setCurrent] = useState<Track | null>(null);

  // hook that calls POST /api/lyrics-to-images and stores results
  const {
    fetchImages,
    keywords,
    setKeywords,
    images,
    setImages,
    loading,
    error,
  } = useLyricsImages();

  // fetch lyrics when artist/title change
  useEffect(() => {
    if (!current?.artists || !current?.name) {
      console.log("stuck in here");
      setKeywords([]);
      setImages([]);
      return;
    }
    setImages([]);
    setKeywords([]);
    get<{ lyrics: string; source: string }>(
      `/api/lyrics?artist=${encodeURIComponent(
        current.artists
      )}&title=${encodeURIComponent(current.name)}`
    )
      .then((d) => {
        fetchImages(d.lyrics);
      })
      .catch(() => {
        setImages([]);
      });
  }, [current]);

  return (
    <div className="min-h-screen w-full bg-portfolio-gradient text-slate-100">
      <div className="mx-auto flex min-h-screen w-full max-w-8xl flex-col px-6 pb-12 pt-8 lg:px-10">
        <HeaderBar />

        <main className="mt-10 flex flex-1 flex-col gap-6 lg:grid lg:grid-cols-12">
          <section className="col-span-4 flex min-w-0 flex-col rounded-3xl border border-white/10 bg-aurora/60 p-6 backdrop-blur-sm shadow-soft">
            <div className="flex items-center gap-3 pb-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-card-glow text-2xl text-accent shadow-glow">
                ♪
              </span>
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-slate-50">
                  Discover Tracks
                </h2>
                <p className="text-sm text-slate-400">
                  Search Spotify, audition previews, and set the tone.
                </p>
              </div>
            </div>
            <SpotifySearch onPick={setCurrent} />
          </section>

          <aside className="col-span-4 flex min-w-0 flex-col gap-4 rounded-3xl border border-white/10 bg-aurora/70 p-6 backdrop-blur-sm shadow-soft">
            <div className="rounded-2xl border border-white/10 bg-sapphire/60 p-4 shadow-glow">
              <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                Now Playing
              </h2>
              <div className="mt-3 overflow-hidden rounded-2xl border border-white/10 bg-black/40 shadow-inner">
                {current && current.preview_url ? (
                  <audio controls src={current.preview_url} className="w-full" />
                ) : current ? (
                  <iframe
                    className="h-20 w-full"
                    src={`https://open.spotify.com/embed/track/${current.id}`}
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy"
                    title="Spotify Player"
                  />
                ) : (
                  <img
                    src={backgroundPlayer}
                    alt="Abstract gradient record"
                    className="h-24 w-full object-cover"
                  />
                )}
              </div>
              {current && (
                <div className="mt-3">
                  <div className="text-base font-medium text-white truncate">
                    {current.name}
                  </div>
                  <div className="text-sm text-slate-400 truncate">
                    {current.artists}
                  </div>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-hidden rounded-2xl border border-white/10 bg-sapphire/70 p-5 shadow-glow">
              <h2 className="text-lg font-semibold tracking-tight text-slate-50">
                Lyrics
              </h2>
              <p className="text-xs uppercase tracking-[0.3em] text-amber/70">
                Storyboard
              </p>
              <div className="mt-4 max-h-[360px] overflow-y-auto pr-1">
                <LyricsPane
                  artist={current?.artists || ""}
                  title={current?.name || ""}
                />
              </div>
            </div>
          </aside>

          <section className="col-span-4 flex min-w-0 flex-col rounded-3xl border border-teal/40 bg-gradient-to-br from-sapphire/90 via-aurora/80 to-sapphire/70 p-6 shadow-glow">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-slate-50">
                Visual Moodboard
              </h2>
              <p className="text-sm text-slate-400">
                Curated image prompts from your selected lyrics.
              </p>
            </div>

            <div className="mt-4 flex flex-col gap-4">
              <PixabayGrid images={images} />

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-xs text-slate-300 shadow-inner">
                {loading && (
                  <div className="flex items-center gap-2 text-teal">
                    <span className="h-2 w-2 animate-ping rounded-full bg-teal" />
                    Finding imagery…
                  </div>
                )}
                {error && (
                  <div className="text-red-400">
                    Image search error: {error}
                  </div>
                )}
                {images?.length === 0 && !loading && !error && (
                  <div>No images yet. Pick a track to get inspired.</div>
                )}
                {keywords?.length > 0 && (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="text-slate-400">Keywords:</span>
                    {keywords.map((k) => (
                      <span
                        key={k}
                        className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] uppercase tracking-wide text-slate-200"
                      >
                        {k}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
