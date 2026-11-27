"use client";

import { useId, useState } from "react";
import { AlertCircle, Check, ChevronDown, Circle, CircleDot } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { BreadcrumbStep } from "@/lib/characterBuilder/builderNavigation";

const STATE_ICON = { current: CircleDot, complete: Check, error: AlertCircle, unvisited: Circle } as const;

/**
 * Breadcrumb of the builder pages: an ordered list, current step marked `aria-current="step"`, each state given by an
 * icon and a text. On mobile it collapses into « Step n of N » with a toggle.
 * @see FR-ruleset-character-builder — Web builder UI (Pages and breadcrumb, Accessibility)
 */
export function BuilderBreadcrumb({ steps, onSelect }: { steps: BreadcrumbStep[]; onSelect: (key: string) => void }) {
  const t = useTranslations("characterBuilder");
  const [open, setOpen] = useState(false);
  const listId = useId();
  const currentIndex = steps.findIndex((step) => step.state === "current");

  return (
    <nav
      aria-label={t("breadcrumbLabel")}
      className="min-w-0">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-2 rounded-[13px] border border-input bg-gray-middle-light px-3 py-2 text-sm font-medium text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:hidden"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((value) => !value)}>
        <span>
          {t("stepOf", { current: currentIndex + 1, total: steps.length })}
          <span className="sr-only">, {open ? t("hideSteps") : t("showSteps")}</span>
        </span>
        <ChevronDown
          className={cn("size-4 transition-transform", open && "rotate-180")}
          aria-hidden="true"
        />
      </button>
      <ol
        id={listId}
        className={cn(
          "mt-2 flex-col gap-1 md:mt-0 md:flex md:flex-row md:flex-wrap md:gap-2",
          open ? "flex" : "hidden",
        )}>
        {steps.map((step, index) => {
          const Icon = STATE_ICON[step.state];
          return (
            <li
              key={step.key}
              className="min-w-0">
              <button
                type="button"
                disabled={!step.reachable}
                aria-current={step.state === "current" ? "step" : undefined}
                onClick={() => {
                  onSelect(step.key);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full min-w-0 items-center gap-2 rounded-[13px] px-3 py-1.5 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed",
                  step.state === "current" && "bg-primary text-white",
                  step.state === "complete" && "text-white hover:bg-white/10",
                  step.state === "error" && "text-destructive hover:bg-white/10",
                  step.state === "unvisited" && "text-muted-foreground",
                )}>
                <Icon
                  className="size-4 shrink-0"
                  aria-hidden="true"
                />
                <span className="truncate">
                  <span className="sr-only">{index + 1}. </span>
                  {step.label}
                </span>
                <span className="sr-only">({t(`stepState.${step.state}`)})</span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
