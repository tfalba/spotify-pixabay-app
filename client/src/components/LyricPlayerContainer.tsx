import LyricsPane from "./LyricsPane";
import type { Track } from "../types/types";
import backgroundPlayer from "../assets/IMG_4028.jpg";
import NowPlayingTestBar from "./NowPlayingTestbar";
import { NowPlayingPanel } from "./NowPlayingPanel";

export default function LyricPlayerContainer({
  current,
}: {
  current: Track | null;
}) {

    async function getAccessToken() {
  const token = localStorage.getItem("spotify_access_token");
  const expiresAt = Number(localStorage.getItem("spotify_expires_at") || 0);
  if (!token) throw new Error("No Spotify token");
  if (Date.now() > expiresAt) {
    // you’ll need a refresh here; see Option B
    throw new Error("Spotify token expired");
  }
  return token;
}

  return (
    <aside className="xl:col-span-1 xl:col-start-2
           flex min-w-0 flex-col rounded-3xl border border-[pink]/80
            p-6 shadow-glow max-h-[max(600px,calc(100vh-10rem))]">
      <div className="rounded-2xl border border-white/10 bg-[sapphire]/60 p-1 shadow-glow">
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
      <LyricsPane artist={current?.artists || ""} title={current?.name || ""} />
    </aside>
  );
}
