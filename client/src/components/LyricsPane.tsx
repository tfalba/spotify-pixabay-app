import { useEffect, useState } from "react";
import { get } from "../lib/fetcher";
import { useLyricsImages } from "../hooks/useLyricsImages"; // ⬅️ add this

export default function LyricsPane({
  artist,
  title,
}: {
  artist: string;
  title: string;
}) {
  const [text, setText] = useState<string>("");
  const [source, setSource] = useState<string>("");

  // hook that calls POST /api/lyrics-to-images and stores results
  // const { fetchImages, keywords, images, loading, error } = useLyricsImages();

  // fetch lyrics when artist/title change
  useEffect(() => {
    if (!artist || !title) {
      setText("");
      setSource("");
      return;
    }
    get<{ lyrics: string; source: string }>(
      `/api/lyrics?artist=${encodeURIComponent(artist)}&title=${encodeURIComponent(title)}`
    )
      .then((d) => {
        setText(d.lyrics || "");
        setSource(d.source || "");
        // fetchImages(d.lyrics);
      })
      .catch(() => {
        setText("Lyrics not available.");
        setSource("");
      });
  }, [artist, title]);


  if (!artist || !title) {
    return <div className="text-sm text-slate-500">Select a track to view lyrics.</div>;
  }

  return (
    <div className="space-y-4">
      {/* Lyrics */}
      <div className="whitespace-pre-wrap text-sm leading-relaxed">
        {text || <span className="text-slate-500">Lyrics not available.</span>}
        {source && (
          <div className="mt-3 text-xs text-slate-400">Source: {source}</div>
        )}
      </div>

      {/* Status for image generation */}
      {/* {loading && (
        <div className="text-xs text-slate-500">Finding images…</div>
      )}
      {error && (
        <div className="text-xs text-red-600">Image search error: {error}</div>
      )} */}

      {/* Keywords */}
      {/* {keywords?.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400">Keywords:</span>
          {keywords.map((k) => (
            <span
              key={k}
              className="text-xs px-2 py-1 rounded-full bg-slate-800/50 text-slate-200 border border-slate-700"
            >
              {k}
            </span>
          ))}
        </div>
      )} */}

      {/* Image grid (12 total, shuffled by server) */}
      {/* {images?.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {images.map((img) => (
            <a
              key={img.id}
              href={img.pageURL}
              target="_blank"
              rel="noreferrer"
              className="group block rounded overflow-hidden border border-slate-800"
              title={img.alt}
            >
              <img
                src={img.thumb}
                alt={img.alt}
                className="w-full h-32 object-cover transition-transform duration-150 group-hover:scale-[1.03]"
                loading="lazy"
              />
            </a>
          ))}
        </div>
      )} */}
    </div>
  );
}
