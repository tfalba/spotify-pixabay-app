import clsx from "clsx";
import { useCurrentTrackData } from "@/context/CurrentTrackContext";
import { useSectionClass } from "@/styleHooks/useStyleHooks";
import { useEffect, useState } from "react";
import { get } from "@/lib/fetcher";

type CachedLyrics = {
  lyrics: string;
  source: string;
};

const lyricsCache = new Map<string, CachedLyrics>();

export default function LyricPlayerContainer() {
  const { current } = useCurrentTrackData();
  const [text, setText] = useState<string>("");
  const [source, setSource] = useState<string>("");
  const API = import.meta.env.VITE_API_BASE || "http://127.0.0.1:5174";

  const containerClass = clsx(useSectionClass(false, 2), "relative");

  useEffect(() => {
    if (!current?.artists[0].name || !current?.name) {
      setText("");
      setSource("");
      return;
    }
    const key = `${current.artists[0].name}::${current.name}`;
    const cached = lyricsCache.get(key);
    if (cached) {
      setText(cached.lyrics);
      setSource(cached.source);
      return;
    }
    setText("Loading lyrics...");
    setSource("");
    get<{ lyrics: string; source: string }>(
      `${API}/api/lyrics?artist=${encodeURIComponent(
        current.artists[0].name,
      )}&title=${encodeURIComponent(current.name)}`,
    )
      .then((d) => {
        const payload = { lyrics: d.lyrics || "", source: d.source || "" };
        lyricsCache.set(key, payload);
        setText(payload.lyrics);
        setSource(payload.source);
      })
      .catch(() => {
        const fallback = { lyrics: "Lyrics not available.", source: "" };
        lyricsCache.set(key, fallback);
        setText(fallback.lyrics);
        setSource(fallback.source);
      });
  }, [current, API]);

  const nowPlayingClass = clsx(
    "rounded-2xl mr-auto max-w-full border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-amber-500/10 py-2 px-6 shadow-[0_14px_30px_rgba(88,92,107,0.55)] overflow-x-hidden",
  );
  const trackTitleClass = "text-white";
  const trackArtistClass = "text-slate-400";

  return (
    <aside className={containerClass}>
      <div className="flex flex-col justify-end align-end gap-2 mb-2 mr-8 ">
        <h2
          className={clsx(
            "text-[12px] uppercase tracking-[0.3em] font-semibold ml-auto",
          )}
        >
          Lyrics
        </h2>
        {current && (
          <div className={nowPlayingClass}>
            <div
              className={clsx(
                "text-base font-medium truncate",
                trackTitleClass,
              )}
            >
              {current.name}
            </div>
            <div className={clsx("text-[15px] truncate", trackArtistClass)}>
              {current.artists[0]?.name}
            </div>
          </div>
        )}
      </div>
      {!current?.name || !current?.artists[0]?.name ? (
        <p className="text-[14px] text-slate-400 text-right">
          Select a track to view lyrics and image prompts will appear here.
        </p>
      ) : null}
      <div className="mt-2 flex-1 overflow-y-auto pr-1 min-h-0">
        <div className={clsx("space-y-4 text-slate-200")}>
          <div className="whitespace-pre-wrap text-[1rem] leading-relaxed px-2 lg:px-1">
            {text ||
              (current?.name && (
                <span className="text-slate-500">Lyrics not available.</span>
              ))}
            {source && (
              <div
                className={clsx(
                  "mt-3 text-[0.9rem] uppercase tracking-wide text-slate-500",
                )}
              >
                Source: {source}
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
