 import clsx from "clsx";

export function useSectionClass(_isLight: boolean, colNum: number = 2) {
  return clsx(
        // "flex min-w-0 flex-col rounded-[28px] border border-white/10 bg-[#0c1118] shadow-[0_20px_50px_rgba(0,150,136,0.55)] min-h-auto overflow-y-auto",

    "flex min-w-0 flex-col rounded-[28px] border border-white/10 bg-[#0c1118] shadow-[0_20px_50px_rgba(0,150,136,0.55)] min-h-auto",
    colNum === 1 && "max-h-[min(110vw,max(520px,calc(100vh-1rem)))] px-1 py-2",
    colNum === 2 && "max-h-[min(100vw,max(520px,calc(100vh-1rem)))] p-4",
    colNum === 3 && "max-h-fit p-4"
  );
}
