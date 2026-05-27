import * as React from "react";
import {
  Biohazard,
  Brain,
  EarOff,
  EyeOff,
  Ghost,
  Hand,
  Heart,
  Icon as LucideIcon,
  Moon,
  PersonStanding,
  Sparkles,
  Sprout,
  Stone,
  ZapOff,
} from "lucide-react";
import type { LucideProps } from "lucide-react";
import { spiderWeb } from "@lucide/lab";
import type { ActiveInitiativeTrackerCondition } from "./types";

export type ConditionMeta = {
  Icon: React.ComponentType<LucideProps>;
  badgeClassName: string;
  optionClassName: string;
};

const SpiderWebIcon = (props: LucideProps) => <LucideIcon iconNode={spiderWeb} {...props} />;
SpiderWebIcon.displayName = "SpiderWebIcon";

export const CONDITION_META: Record<ActiveInitiativeTrackerCondition, ConditionMeta> = {
  prone: {
    Icon: Sprout,
    badgeClassName: "border-sky-300/35 bg-sky-500/20 text-sky-100",
    optionClassName: "text-sky-100 ring-sky-300/25",
  },
  grappled: {
    Icon: Hand,
    badgeClassName: "border-orange-300/35 bg-orange-500/20 text-orange-100",
    optionClassName: "text-orange-100 ring-orange-300/25",
  },
  deafened: {
    Icon: EarOff,
    badgeClassName: "border-zinc-300/35 bg-zinc-500/20 text-zinc-100",
    optionClassName: "text-zinc-100 ring-zinc-300/25",
  },
  blinded: {
    Icon: EyeOff,
    badgeClassName: "border-slate-300/35 bg-slate-500/25 text-slate-100",
    optionClassName: "text-slate-100 ring-slate-300/25",
  },
  charmed: {
    Icon: Heart,
    badgeClassName: "border-pink-300/40 bg-pink-500/20 text-pink-100",
    optionClassName: "text-pink-100 ring-pink-300/25",
  },
  frightened: {
    Icon: Ghost,
    badgeClassName: "border-violet-300/40 bg-violet-500/20 text-violet-100",
    optionClassName: "text-violet-100 ring-violet-300/25",
  },
  poisoned: {
    Icon: Biohazard,
    badgeClassName: "border-lime-300/40 bg-lime-500/20 text-lime-100",
    optionClassName: "text-lime-100 ring-lime-300/25",
  },
  restrained: {
    Icon: SpiderWebIcon,
    badgeClassName: "border-amber-300/45 bg-amber-500/20 text-amber-100",
    optionClassName: "text-amber-100 ring-amber-300/25",
  },
  stunned: {
    Icon: ZapOff,
    badgeClassName: "border-yellow-300/45 bg-yellow-500/20 text-yellow-100",
    optionClassName: "text-yellow-100 ring-yellow-300/25",
  },
  incapacitated: {
    Icon: Brain,
    badgeClassName: "border-fuchsia-300/40 bg-fuchsia-500/20 text-fuchsia-100",
    optionClassName: "text-fuchsia-100 ring-fuchsia-300/25",
  },
  unconscious: {
    Icon: Moon,
    badgeClassName: "border-indigo-300/40 bg-indigo-500/20 text-indigo-100",
    optionClassName: "text-indigo-100 ring-indigo-300/25",
  },
  invisible: {
    Icon: Sparkles,
    badgeClassName: "border-cyan-300/40 bg-cyan-500/20 text-cyan-100",
    optionClassName: "text-cyan-100 ring-cyan-300/25",
  },
  paralyzed: {
    Icon: PersonStanding,
    badgeClassName: "border-red-300/40 bg-red-500/20 text-red-100",
    optionClassName: "text-red-100 ring-red-300/25",
  },
  petrified: {
    Icon: Stone,
    badgeClassName: "border-stone-300/45 bg-stone-500/25 text-stone-100",
    optionClassName: "text-stone-100 ring-stone-300/25",
  },
};
