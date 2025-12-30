import { STYLE_CATEGORIES, type StyleCategory } from "../types/types";
import clsx from "clsx";

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
  return (
    <div
      className={clsx(
        "flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] focus-within:ring-2",
        "border-white/15 bg-white/10 text-white focus-within:ring-emerald-200/60"
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
          "bg-transparent text-xs font-semibold uppercase tracking-[0.2em] focus-visible:outline-none text-inherit w-auto text-white"
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
