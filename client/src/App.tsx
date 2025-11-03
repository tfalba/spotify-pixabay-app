import { useEffect, useMemo, useState } from "react";
import HeaderBar from "./components/HeaderBar";
import SpotifySearch from "./components/SpotifySearch";
import PixabayGrid from "./components/PixabayGrid";
import LyricsPane from "./components/LyricsPane";
import type { Track } from "./types/types";
import { get } from "./lib/fetcher";
import { useLyricsImages } from "./hooks/useLyricsImages";

export default function App() {
  const [current, setCurrent] = useState<Track | null>(null);
  const [text, setText] = useState<string>("");
  const [source, setSource] = useState<string>("");

  // hook that calls POST /api/lyrics-to-images and stores results
  const { fetchImages, keywords, images, setImages, loading, error } =
    useLyricsImages();

  // fetch lyrics when artist/title change
  useEffect(() => {
    if (!current?.artists || !current?.name) {
      console.log("stuck in here");
      setText("");
      setSource("");
      setImages([]);
      return;
    }
    get<{ lyrics: string; source: string }>(
      `/api/lyrics?artist=${encodeURIComponent(
        current.artists
      )}&title=${encodeURIComponent(current.name)}`
    )
      .then((d) => {
        setText(d.lyrics || "");
        setSource(d.source || "");
        fetchImages(d.lyrics);
      })
      .catch(() => {
        setText("Lyrics not available.");
        setSource("");
        setImages([]);
      });
  }, [current]);

  // const pixabayQuery = useMemo(() => {
  //   console.log("Current track changed:", current);
  //   if (!current) return "";
  //   return `${current.name} ${current.artists}`;
  // }, [current]);

  return (
    <div className="min-h-screen flex flex-col">
      <HeaderBar />

      <main className="max-w-8xl w-full mx-auto p-4 grid grid-cols-3 gap-4">
        {/* Left column: 2/3 width */}
        <section className="col-span-2 md:col-span-1 space-y-4">
          {/* Top section: search + playback + title/artist */}
          <div className="p-4 rounded-2xl border bg-white">
            {current && (
              <div className="flex items-center gap-3 p-3">
                {/* {current.image && (
                  <img
                    src={current.image}
                    className="w-20 h-20 rounded-xl object-cover"
                    alt="art"
                  />
                )} */}
                <div className="min-w-0">
                  {/* <div className="font-semibold truncate">{current.name}</div>
                  <div className="text-sm text-slate-500 truncate">
                    {current.artists}
                  </div> */}

                  {/* Playback: prefer preview_url, fallback to Spotify embed */}
                  {current.preview_url ? (
                    <audio
                      controls
                      src={current.preview_url}
                      className="mt-2 w-full"
                    />
                  ) : (
                    <iframe
                      className="mt-2 rounded-lg"
                      src={`https://open.spotify.com/embed/track/${current.id}`}
                      width="100%"
                      height="80"
                      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                      loading="lazy"
                      title="Spotify Player"
                    />
                  )}
                </div>
              </div>
            )}
            <div className="mb-4">
              <SpotifySearch onPick={setCurrent} />
            </div>
          </div>
        </section>

        {/* Right column: 1/3 width for lyrics */}
        <aside className="col-span-2 md:col-span-1 p-4 rounded-2xl border bg-white">
          <h2 className="text-sm font-semibold mb-2">Lyrics</h2>
          <LyricsPane
            artist={current?.artists || ""}
            title={current?.name || ""}
          />
        </aside>
        {/* Bottom section: Pixabay placeholder */}
        <div className="col-span-2 md:col-span-1 p-4 rounded-2xl border bg-white">
          <h2 className="text-sm font-semibold mb-2">Pixabay Images</h2>
          <PixabayGrid
            keywords={keywords}
            images={images}
            loading={loading}
            error={error}
          />
        </div>
      </main>
    </div>
  );
}
