import clsx from "clsx";
import LyricsPane from "./LyricsPane";
import { NowPlayingPanel } from "./NowPlayingPanel";
import { useTheme } from "@/context/ThemeContext";
import { useCurrentTrack } from "@/context/CurrentTrackContext";
import { useSectionClass } from "@/styleHooks/useStyleHooks";

export default function LyricPlayerContainer({
  onTrackFinished,
}: {
  onTrackFinished?: () => void;
}) {
  const { current } = useCurrentTrack();
  const { theme } = useTheme();
  const isLight = theme === "light";
  const containerClass = useSectionClass(isLight, 2);
  const nowPlayingClass = clsx(
    "rounded-2xl p-3 shadow-glow mb-4 transition-colors duration-300",
    isLight ? "bg-slate-100" : "bg-sapphire/80",
  );
  const trackTitleClass = isLight ? "text-slate-900" : "text-white";
  const trackArtistClass = isLight ? "text-slate-600" : "text-slate-400";

  return (
    <aside className={containerClass}>
      <div className={nowPlayingClass}>
        <NowPlayingPanel onTrackFinished={onTrackFinished} />
        {current && (
          <div className="mt-3">
            <div className={clsx("text-base font-medium truncate", trackTitleClass)}>
              {current.name}
            </div>
            <div className={clsx("text-sm truncate", trackArtistClass)}>
              {current.artists[0]?.name}
            </div>
          </div>
        )}
      </div>
      <LyricsPane
        artist={current?.artists[0]?.name || ""}
        title={current?.name || ""}
      />
    </aside>
  );
}
