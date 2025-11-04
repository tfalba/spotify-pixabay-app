import LyricsPane from "./LyricsPane";
import type { Track } from "../types/types";
import backgroundPlayer from "../assets/IMG_4028.jpg";

export default function LyricPlayerContainer({
  current,
}: {
  current: Track | null;
}) {
  return (
    <aside className="xl:col-span-1 xl:col-start-2
           flex min-w-0 flex-col rounded-3xl border border-aurora/40
           bg-gradient-to-br from-sapphire/90 via-white/10 to-sapphire/70 p-6 shadow-glow max-h-[max(600px,calc(100vh-10rem))]">
      <div className="rounded-2xl border border-white/10 bg-sapphire/60 p-1 shadow-glow">
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
          Now Playing
        </h2>
        <div className="mt-3 overflow-hidden rounded-2xl border border-white/10 bg-black/40 shadow-inner">
          {current && current.preview_url ? (
            <audio controls src={current.preview_url} className="w-full" />
          ) : current ? (
            <iframe
              className="h-18 w-full"
              src={`https://open.spotify.com/embed/track/${current.id}`}
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              title="Spotify Player"
            />
          ) : (
            <img
              src={backgroundPlayer}
              alt="Abstract gradient record"
              className="h-20 w-full object-cover"
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
      <LyricsPane artist={current?.artists || ""} title={current?.name || ""} />
    </aside>
  );
}
