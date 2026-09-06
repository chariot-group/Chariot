import { cn } from "@/lib/utils";

export type ManualCharacterOptionAccent = "player" | "npc";

export function getManualCharacterButtonClasses(accent: ManualCharacterOptionAccent) {
  return cn(
    "group h-auto w-full flex-col gap-2 rounded-[12px] border border-white/10 bg-background/40 px-3 py-3.5",
    "text-sm font-semibold text-white/85 hover:text-white",
    "hover:bg-gray-middle-light hover:shadow-sm hover:shadow-black/20",
    accent === "player" && "hover:border-blue/40",
    accent === "npc" && "hover:border-pink/40",
  );
}

export const CREATE_CHARACTER_LIBRARY_STRIP = cn(
  "flex flex-col gap-3 rounded-[12px] border border-white/10 bg-gray-middle-light/90 p-3",
);
