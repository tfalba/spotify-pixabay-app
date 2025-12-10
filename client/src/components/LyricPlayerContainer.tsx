import clsx from "clsx";
import { useTheme } from "@/context/ThemeContext";
import { useCurrentTrack } from "@/context/CurrentTrackContext";
import { useSectionClass } from "@/styleHooks/useStyleHooks";
import { useEffect, useState } from "react";
import { get } from "@/lib/fetcher";

type CachedLyrics = {
  lyrics: string;
  source: string;
};

const lyricsCache = new Map<string, CachedLyrics>();

export default function LyricPlayerContainer() {
  const { current } = useCurrentTrack();
  const [text, setText] = useState<string>("");
  const [source, setSource] = useState<string>("");
  const API = import.meta.env.VITE_API_BASE || "http://127.0.0.1:5174";

  const { theme } = useTheme();
  const isLight = theme === "light";
  const containerClass = useSectionClass(isLight, 2);

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
    "rounded-2xl p-2 shadow-glow my-2 transition-colors duration-300",
    isLight ? "bg-slate-100" : "bg-sapphire/80"
  );
  const trackTitleClass = isLight ? "text-slate-900" : "text-white";
  const trackArtistClass = isLight ? "text-slate-600" : "text-slate-400";

  return (
    <aside className={containerClass}>
      <div className="flex flex-col gap-1">
        <h2
          className={clsx(
            "text-lg font-semibold tracking-tight mb-1",
            isLight ? "text-slate-900" : "text-slate-50"
          )}
        >
          Lyrics
        </h2>
        {!current?.name || !current?.artists[0]?.name ? (
          <p>
            Select a track to view lyrics and image prompts will appear here.
          </p>
        ) : (
          <p
            className={clsx(
              "text-xs uppercase tracking-[0.3em]",
              isLight ? "text-amber-600" : "text-amber/70"
            )}
          >
            Storyboard
          </p>
        )}
      </div>
      {current && (
        <div className={nowPlayingClass}>
          <div
            className={clsx("text-base font-medium truncate", trackTitleClass)}
          >
            {current.name}
          </div>
          <div className={clsx("text-sm truncate", trackArtistClass)}>
            {current.artists[0]?.name}
          </div>
        </div>
      )}
      <div className="mt-4 flex-1 overflow-y-auto pr-1 min-h-0">
        <div
          className={clsx(
            "space-y-4",
            isLight ? "text-slate-700" : "text-slate-200"
          )}
        >
          <div className="whitespace-pre-wrap text-sm leading-relaxed">
            {text || (
              <span
                className={clsx(isLight ? "text-slate-500" : "text-slate-500")}
              >
                Lyrics not available.
              </span>
            )}
            {source && (
              <div
                className={clsx(
                  "mt-3 text-xs uppercase tracking-wide",
                  isLight ? "text-slate-500" : "text-slate-500"
                )}
              >
                Source: {source}
              </div>
            )}
          </div>
        </div>
      </div>
      {/* <LyricsPane
        artist={current?.artists[0]?.name || ""}
        title={current?.name || ""}
      /> */}
    </aside>
  );
}
