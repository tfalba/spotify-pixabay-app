import { useEffect, useState } from "react";
import clsx from "clsx";
import { get } from "../lib/fetcher";
import { useTheme } from "@/context/ThemeContext";

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
  const { theme } = useTheme();
  const isLight = theme === "light";

  if (!artist || !title) {
    return (
      <div className={clsx("text-sm", isLight ? "text-slate-600" : "text-slate-400")}>
        Select a track to view lyrics and image prompts will appear here.
      </div>
    );
  }

  return (
    <div
      className={clsx(
        "flex flex-1 min-h-0 flex-col overflow-hidden rounded-2xl p-5 shadow-[0_20px_60px_rgba(124,92,252,0.35)] transition-colors duration-300",
        isLight
          ? "border border-slate-200 bg-white"
          : "bg-slate"
          // : "bg-gradient-to-br from-teal/10 via-aurora/25 to-teal/40",
      )}
    >
      <h2
        className={clsx(
          "text-lg font-semibold tracking-tight mb-1",
          isLight ? "text-slate-900" : "text-slate-50",
        )}
      >
        Lyrics
      </h2>
      <p className={clsx("text-xs uppercase tracking-[0.3em]", isLight ? "text-amber-600" : "text-amber/70")}>
        Storyboard
      </p>
      <div className="mt-4 flex-1 overflow-y-auto pr-1 min-h-0">
        <div className={clsx("space-y-4", isLight ? "text-slate-700" : "text-slate-200")}>
          <div className="whitespace-pre-wrap text-sm leading-relaxed">
            {text || (
              <span className={clsx(isLight ? "text-slate-500" : "text-slate-500")}>
                Lyrics not available.
              </span>
            )}
            {source && (
              <div
                className={clsx(
                  "mt-3 text-xs uppercase tracking-wide",
                  isLight ? "text-slate-500" : "text-slate-500",
                )}
              >
                Source: {source}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
