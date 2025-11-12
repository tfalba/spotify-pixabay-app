import { useEffect, useState } from "react";
import { get } from "../lib/fetcher";

export default function LyricsPane({
  artist,
  title,
}: {
  artist: string;
  title: string;
}) {
  const [text, setText] = useState<string>("");
  const [source, setSource] = useState<string>("");

  const API = import.meta.env.VITE_API_BASE || "http://127.0.0.1:5174";

  // hook that calls POST /api/lyrics-to-images and stores results
  // const { fetchImages, keywords, images, loading, error } = useLyricsImages();

  // fetch lyrics when artist/title change
  useEffect(() => {
    if (!artist || !title) {
      setText("");
      setSource("");
      return;
    }
    setText("Loading lyrics...");
    setSource("");
    get<{ lyrics: string; source: string }>(
      `${API}/api/lyrics?artist=${encodeURIComponent(
        artist
      )}&title=${encodeURIComponent(title)}`
    )
      .then((d) => {
        setText(d.lyrics || "");
        setSource(d.source || "");
      })
      .catch(() => {
        setText("Lyrics not available.");
        setSource("");
      });
  }, [artist, title]);

  if (!artist || !title) {
    return (
      <div className="text-sm text-slate-400">
        Select a track to view lyrics and image prompts will appear here.
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-hidden rounded-2xl bg-gradient-to-br from-teal/10 via-aurora/25 to-teal/40 p-5 shadow-[0_20px_60px_rgba(124,92,252,0.35)]">
      <h2 className="text-lg font-semibold tracking-tight text-slate-50 mb-1">
        Lyrics
      </h2>
      <p className="text-xs uppercase tracking-[0.3em] text-amber/70">
        Storyboard
      </p>
      <div className="mt-4 max-h-[max(360px,calc(100vh-5rem))] overflow-y-scroll pr-1">
        <div className="space-y-4 text-slate-200">
          {/* Lyrics */}
          <div className="whitespace-pre-wrap text-sm leading-relaxed">
            {text || (
              <span className="text-slate-500">Lyrics not available.</span>
            )}
            {source && (
              <div className="mt-3 text-xs uppercase tracking-wide text-slate-500">
                Source: {source}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
