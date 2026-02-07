import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { motion } from "framer-motion";
import type { StyleCategory } from "@/types/types";
import { NowPlayingPanel } from "./NowPlayingPanel";
import ArtStyleDropdown from "./ArtStyleDropdown";
import { useCurrentTrackData } from "@/context/CurrentTrackContext";

type StyleChoice = StyleCategory | "surprise";

type HeroProps = {
  resolvedStyleName: StyleCategory | "Surprise me";
  styleChoice: StyleChoice;
  onStyleChange: (choice: StyleChoice) => void;
  heroBanner: string;
  onTrackFinished?: () => void;
};

export default function HeroBar({
  heroBanner,
  resolvedStyleName,
  styleChoice,
  onStyleChange,
  onTrackFinished,
}: HeroProps) {
  const { current } = useCurrentTrackData();
  const [activeTab, setActiveTab] = useState<"song" | "style">("song");
  const [panelOpen, setPanelOpen] = useState(false);
  const lastTrackKeyRef = useRef<string | null>(null);
  const panelLabel = activeTab === "song" ? "Now Playing" : "Art Style";

  useEffect(() => {
    const trackKey = current?.uri ?? current?.id ?? null;
    if (!trackKey || trackKey === lastTrackKeyRef.current) return;

    lastTrackKeyRef.current = trackKey;
    setActiveTab("song");
    setPanelOpen(true);
  }, [current?.uri, current?.id]);

  return (
    <motion.section
      initial={{ height: "600px" }}
      animate={{ height: "296px", minHeight: "296px" }}
      transition={{ duration: 1.1, ease: "easeOut" }}
      className="relative min-h[296px] h-[296px] overflow-hidden rounded-[32px] border border-black/90 bg-contain bg-center px-4 py-6 mb-4 shadow-[0_20px_50px_rgba(124,92,252,0.25)]"
      style={{ backgroundImage: heroBanner ? `url(${heroBanner})` : undefined }}
    >
      <div
        className={clsx(
          "pointer-events-none absolute inset-0",
          panelOpen ? "opacity-80" : "opacity-5",
          "bg-gradient-to-r from-[#0b0f14]/80 via-[#0f1722]/80 to-[#0f2a2a]/70",
        )}
      />
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <div className="absolute -left-24 top-0 h-56 w-56 rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="absolute right-0 -bottom-24 h-56 w-56 rounded-full bg-amber-300/10 blur-3xl" />
      </div>

      <div className="absolute inset-x-0 flex justify-end">
        <div
          className="w-full max-w-xl transition-transform duration-300"
          style={{
            transform: panelOpen
              ? "translateX(0)"
              : "translateX(calc(100% - 3rem))",
          }}
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 170, damping: 18 }}
            className={clsx(
              "relative rounded-3xl border px-5 py-5 pl-16 shadow-[0_35px_65px_rgba(0,0,0,0.55)] backdrop-blur-xl",
              "bg-[#0b1118]/85 border-white/10",
            )}
          >
            <button
              type="button"
              onClick={() => setPanelOpen((open) => !open)}
              aria-expanded={panelOpen}
              className={clsx(
                "absolute left-0 top-0 flex h-full w-12 items-center justify-center rounded-l-3xl border-r text-[11px] font-semibold uppercase tracking-[0.35em] transition-colors",
                "border-white/10 bg-black/40 text-white/60 hover:text-white",
              )}
            >
              <span style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}>
                {panelLabel}
              </span>
            </button>

            <div className="flex gap-3 pb-4">
              {[
                { key: "song" as const, label: "Now Playing" },
                { key: "style" as const, label: "Art Style" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={clsx(
                    "flex-1 rounded-t-xl px-2 md:px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] transition",
                    activeTab === tab.key
                      ? "bg-emerald-300/90 text-slate-900"
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
                  Now Playing
                </p>
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
                    <p className="mt-2 text-sm text-slate-400">
                      Swap styles anytime—your next PNG will take on a whole new mood.
                    </p>
                  </div>
                <div className="flex flex-col gap-3 md:flex-row justify-end items-end">
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
      </div>
    </motion.section>
  );
}
