"use client";

import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const triggerClass =
  "inline-flex size-4 shrink-0 items-center justify-center rounded-full text-muted-foreground cursor-help hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function KpiInfo({ label, description }: { label: string; description: string }) {
  const ariaLabel = `Explication du KPI ${label}`;

  return (
    <span className="inline-flex items-center">
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={cn(triggerClass, "hidden [@media(hover:hover)]:inline-flex")}
            aria-label={ariaLabel}>
            <Info
              className="size-3.5"
              aria-hidden="true"
            />
          </button>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="text-left font-normal normal-case tracking-normal">
          {description}
        </TooltipContent>
      </Tooltip>
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(triggerClass, "[@media(hover:hover)]:hidden")}
            aria-label={ariaLabel}>
            <Info
              className="size-3.5"
              aria-hidden="true"
            />
          </button>
        </PopoverTrigger>
        <PopoverContent
          side="top"
          className="text-left">
          {description}
        </PopoverContent>
      </Popover>
    </span>
  );
}

export function KpiTitle({
  children,
  info,
  className,
}: {
  children: string;
  info: string;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex min-w-0 items-center gap-1", className)}>
      <span className="min-w-0">{children}</span>
      <KpiInfo
        label={children}
        description={info}
      />
    </span>
  );
}
