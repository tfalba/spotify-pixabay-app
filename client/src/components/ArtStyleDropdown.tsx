import { STYLE_CATEGORIES, type StyleCategory } from "../types/types";
import clsx from "clsx";
import { useTheme } from "@/context/ThemeContext";

type ArtStyleDropdownProps = {
  resolvedStyleName: StyleCategory | "Surprise me";
  styleChoice: StyleCategory | "surprise";
  onStyleChange?: (style: StyleCategory | "surprise") => void;
};

export default function ArtStyleDropdown({
  resolvedStyleName,
  styleChoice,
  onStyleChange,
}: ArtStyleDropdownProps) {
  const { theme } = useTheme();
  const isLight = theme === "light";

  return (
    <div
      className={clsx(
        "flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide focus-within:ring-2",
        isLight
          ? "border-slate-300 bg-white text-slate-600 focus-within:ring-lilac"
          : "border-white/30 bg-white/10 text-white focus-within:ring-white"
      )}
    >
      <div className="group relative flex items-center">
        <span className="text-[10px] tracking-[0.2em] text-slate-400">
          Art Style
        </span>
        <span className="pointer-events-none absolute left-1/2 top-full mt-2 w-max -translate-x-1/2 rounded-full bg-black/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white opacity-0 transition-opacity duration-150 sm:hidden group-hover:opacity-100">
          {resolvedStyleName}
        </span>
      </div>
      <select
        value={styleChoice}
        disabled={!onStyleChange}
        onChange={(e) =>
          onStyleChange?.(e.target.value as StyleCategory | "surprise")
        }
        className={clsx(
          "bg-transparent text-xs font-semibold uppercase tracking-wide focus-visible:outline-none text-transparent sm:text-inherit w-[15px] sm:w-auto",
          isLight ? "sm:text-slate-800" : "sm:text-white"
        )}
      >
        <option value="surprise">{"Surprise me"}</option>
        {STYLE_CATEGORIES.map((category) => (
          <option key={category} value={category}>
            {category}
          </option>
        ))}
      </select>
    </div>
  );
}
