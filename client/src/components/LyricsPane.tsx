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

    </div>
  );
}
