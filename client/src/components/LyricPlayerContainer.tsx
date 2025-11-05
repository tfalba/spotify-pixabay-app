import LyricsPane from "./LyricsPane";
import type { Track } from "../types/types";
import { NowPlayingPanel } from "./NowPlayingPanel";

export default function LyricPlayerContainer({
  current,
}: {
  current: Track | null;
}) {
  return (
    <aside className="xl:col-span-1 xl:col-start-2 flex min-w-0 flex-col rounded-3xl border border-aurora/60 bg-black/30 p-6 shadow-glow max-h-[max(600px,calc(100vh-10rem))]">
      <div className="rounded-2xl border border-white/10 bg-sapphire/60 p-4 shadow-glow">
        <NowPlayingPanel current={current} />
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
      <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-4 shadow-inner">
        <LyricsPane artist={current?.artists || ""} title={current?.name || ""} />
      </div>
    </aside>
  );
}
