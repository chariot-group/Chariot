import { cn } from "@/lib/utils";

export function getCharacterTypeOptionClasses(disabled = false) {
  return cn(
    "group relative flex h-40 w-full flex-col items-center justify-center gap-3 rounded-[12px] border border-white/10 bg-gray-middle-light/90 px-4 py-5",
    "transition-[transform,background-color,border-color,box-shadow,color] duration-200 ease-out",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/45 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    disabled
      ? "cursor-not-allowed opacity-50 pointer-events-none"
      : cn(
          "cursor-pointer",
          "hover:-translate-y-0.5 hover:border-white/25 hover:bg-gray-middle-light hover:shadow-lg hover:shadow-black/35",
          "active:translate-y-0 active:shadow-md",
        ),
  );
}

export const CHARACTER_TYPE_OPTION_ICON_WRAPPER = cn(
  "flex size-14 items-center justify-center rounded-full bg-background/70 ring-1 ring-white/12",
  "transition-[background-color,box-shadow,transform] duration-200",
  "group-hover:bg-white/5 group-hover:ring-white/20 group-hover:scale-105",
);

export const CHARACTER_TYPE_OPTION_ICON =
  "size-8 text-white/80 transition-colors duration-200 group-hover:text-white";

export const CHARACTER_TYPE_OPTION_LABEL = cn(
  "px-2 text-center text-sm font-semibold leading-snug text-white/85 transition-colors duration-200 sm:text-base",
  "group-hover:text-white",
);
