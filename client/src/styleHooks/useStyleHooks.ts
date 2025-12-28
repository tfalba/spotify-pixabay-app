 import clsx from "clsx";

 export function useSectionClass(isLight: boolean, colNum: number = 2) {
  return clsx(
    "xl:col-span-1 flex min-w-0 flex-col rounded-3xl md:border-thick p-4 shadow-glow min-h-auto lg:min-h-content overflow-y-scroll",
    isLight ? " bg-white text-slate-900" : "text-slate-100",
    colNum === 2 && !isLight ? "border-amber/60" : "border-slate-200/50",
    colNum === 1 && "xl:col-start-1 max-h-[max(600px,calc(100vh-4rem))]",
    colNum === 2 && "xl:col-start-2 max-h-[max(600px,calc(100vh-4rem))]",
    colNum === 3 && "xl:col-start-3 max-h-fit",
    colNum === 1 && !isLight && "bg-gradient-to-br from-midnight/80 via-sapphire/50 to-accent/10",
    colNum === 2 && !isLight && "bg-gradient-to-br from-lilac/20 via-sapphire/50 to-midnight/40",
    colNum === 3 && !isLight && "bg-black/30",
  );
};