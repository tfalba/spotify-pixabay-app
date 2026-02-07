import clsx from "clsx";
export function useSectionClass(_isLight: boolean, colNum: number = 2) {
  const columnPalette: Record<
    number,
    { base: string; from: string; to: string; via: string }
  > = {
    1: {
      base: "shadow-[0_20px_50px_rgba(118,92,252,0.55)]",
      from: "from-[#765cfc]/5",
      to: "to-[#765cfc]/5",
      via: "via-[#765cfc]/40",
    },
    2: {
      base: "shadow-[0_20px_50px_rgba(110,231,183,0.90)]",
      from: "from-[#6ee7b7]/1",
      to: "to-[#6ee7b7]/2",
      via: "via-[#6ee7b7]/2",
    },
    3: {
      base: "shadow-[0_20px_50px_rgba(35,54,223,0.70)]",
      from: "from-[#2336e7]/10",
      to: "to-[##b270e7]/20",
      via: "via-[#2336e7]/30",
    },
  };

  return clsx(
    `flex min-w-0 flex-col rounded-[28px] border border-white/10 min-h-auto bg-gradient-to-br ${columnPalette[colNum].from} ${columnPalette[colNum].via} ${columnPalette[colNum].to} ${columnPalette[colNum].base}`,
    colNum === 1 && `max-h-[min(200vw,max(520px,calc(100vh-8rem)))] px-1 py-2`,
    colNum === 2 && ` max-h-[min(200vw,max(520px,calc(100vh-8rem)))] p-4`,
    colNum === 3 && `min-h-[calc(100vh-8rem)] max-h-fit p-4`
  );
}
