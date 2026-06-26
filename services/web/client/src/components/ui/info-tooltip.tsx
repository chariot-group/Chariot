"use client";

import * as React from "react";
import { CircleHelp } from "lucide-react";

import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface InfoTooltipProps {
  /** Contenu affiché dans le tooltip (desktop) et le popover (mobile/tablette). */
  content: React.ReactNode;
  /** Élément déclencheur sur lequel le tooltip s'affiche au survol. */
  children: React.ReactElement;
  side?: "top" | "bottom" | "left" | "right";
  align?: "start" | "center" | "end";
  /** Classes CSS supplémentaires sur le conteneur wrappant children + bouton "?". */
  className?: string;
  /** Libellé accessible du bouton "?" (visible sur mobile). */
  moreInfoLabel?: string;
}

/**
 * Wraps an element with a Tooltip on desktop (hover) and adds a "?" button
 * that opens a Popover on touch devices (mobile / tablet).
 *
 * The "?" button is hidden on devices that support hover (`@media(hover:hover)`).
 *
 * **Inline usage (default):** `<InfoTooltip content="..."><SomeIcon /></InfoTooltip>`
 *
 * **Block/grid usage** (e.g. inside a CSS grid cell):
 * ```tsx
 * <InfoTooltip content="..." className="w-full">
 *   <div className="flex-1 min-w-0 ...">...</div>
 * </InfoTooltip>
 * ```
 * Pass `className="w-full"` on InfoTooltip and `flex-1 min-w-0` on the child
 * so the child fills available space and the "?" button doesn't overflow.
 */
export function InfoTooltip({
  content,
  children,
  side = "top",
  align = "center",
  className,
  moreInfoLabel = "Plus d'informations",
}: InfoTooltipProps) {
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)}>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent
          side={side}
          align={align}>
          {content}
        </TooltipContent>
      </Tooltip>

      {/* Visible only on touch/coarse-pointer devices — hidden on desktop */}
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="[@media(hover:hover)]:hidden inline-flex items-center justify-center rounded-full size-4 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring shrink-0"
            aria-label={moreInfoLabel}>
            <CircleHelp
              className="size-3.5"
              aria-hidden="true"
            />
          </button>
        </PopoverTrigger>
        <PopoverContent
          side={side}
          align={align}
          className="text-sm">
          {content}
        </PopoverContent>
      </Popover>
    </span>
  );
}
