import { useState } from "react";
import clsx from "clsx";
import { motion } from "framer-motion";
import { useTheme } from "@/context/ThemeContext";
import type { StyleCategory } from "@/types/types";
import { NowPlayingPanel } from "./NowPlayingPanel";
import ArtStyleDropdown from "./ArtStyleDropdown";

type StyleChoice = StyleCategory | "surprise";

type HeroProps = {
  resolvedStyleName: StyleCategory | "Surprise me";
  styleChoice: StyleChoice;
  onStyleChange: (choice: StyleChoice) => void;
  heroBanner: string;
  onTrackFinished?: () => void;
  onToggleTheme: () => void;
};

export default function HeroBar({
  heroBanner,
  resolvedStyleName,
  styleChoice,
  onStyleChange,
  onTrackFinished,
  onToggleTheme,
}: HeroProps) {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [activeTab, setActiveTab] = useState<"song" | "style">("song");

  return (
    <section
      className="relative mb-4 min-h-[calc(max(40vh,320px))] overflow-hidden bg-contain bg-center px-4 py-6"
      style={{ backgroundImage: heroBanner ? `url(${heroBanner})` : undefined }}
    >
      <div
        className={clsx(
          "pointer-events-none absolute inset-0 opacity-80 mix-blend-screen",
          isLight
            ? "bg-gradient-to-r from-lilac/30 via-white/60 to-teal/30"
            : "bg-gradient-to-r from-teal/30 via-midnight/75 to-purple-900/45",
        )}
      />
      <div className="pointer-events-none absolute inset-0 opacity-40 mix-blend-screen">
        <div className="absolute -left-24 top-0 h-48 w-48 rounded-full bg-teal/40 blur-3xl" />
        <div className="absolute right-0 -bottom-24 h-48 w-48 rounded-full bg-lilac/40 blur-3xl" />
      </div>

      <div className="absolute inset-x-0 bottom-6 flex justify-end px-4">
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 170, damping: 18 }}
          className={clsx(
            "w-full max-w-xl rounded-3xl border px-5 py-5 shadow-[0_35px_65px_rgba(15,23,42,0.45)] backdrop-blur-xl",
            isLight ? "bg-white/85 border-white/60" : "bg-slate-950/80 border-white/20",
          )}
        >
          <div className="flex gap-3 pb-4">
            {[
              { key: "song" as const, label: "Song → Visual" },
              { key: "style" as const, label: "Art Style" },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={clsx(
                  "flex-1 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] transition",
                  activeTab === tab.key
                    ? isLight
                      ? "bg-teal/50 text-midnight"
                      : "bg-teal text-midnight"
                    : isLight
                      ? "bg-white/70 text-slate-500"
                      : "bg-white/10 text-white/60",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "song" ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
                Song → Visual
              </p>
              {/* <p
                className={clsx(
                  "mt-2 text-base md:text-lg font-semibold",
                  isLight ? "text-slate-900" : "text-white",
                )}
              >
                Turn any track into cinematic mood art.
              </p> */}
              {onTrackFinished && (
                <div className="mt-4">
                  <NowPlayingPanel onTrackFinished={onTrackFinished} />
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
                  Art Style
                </p>
                {/* <p className="mt-2 text-sm md:text-base">
                  Current style: {" "}
                  <span
                    className={clsx(
                      "font-semibold",
                      isLight ? "text-teal-700" : "text-teal-200",
                    )}
                  >
                    {resolvedStyleName}
                  </span>
                </p> */}
                <p className="mt-2 text-sm md:text-base">
                  Swap styles anytime—your next PNG will take on a whole new mood.
                </p>
              </div>
              <div className="flex flex-col gap-3 md:flex-row">
                <button
                  type="button"
                  onClick={onToggleTheme}
                  className={clsx(
                    "inline-flex items-center justify-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wide transition-colors",
                    isLight
                      ? "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                      : "border-white/30 bg-white/10 text-white hover:bg-white/20",
                  )}
                >
                  {isLight ? "Dark Mode" : "Light Mode"}
                </button>
                <ArtStyleDropdown
                  resolvedStyleName={resolvedStyleName}
                  styleChoice={styleChoice}
                  onStyleChange={onStyleChange}
                />
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
