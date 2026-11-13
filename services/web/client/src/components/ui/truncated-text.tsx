"use client";

import * as React from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/** Rounding tolerance (sub-pixel layouts report e.g. scrollWidth 201 for clientWidth 200.5). */
const OVERFLOW_TOLERANCE_PX = 1;

type MeasurableElement = Pick<HTMLElement, "scrollWidth" | "clientWidth" | "scrollHeight" | "clientHeight">;

/** True when the element content is cut by `truncate` (width) or `line-clamp-*` (height). */
export function isElementTruncated(element: MeasurableElement | null): boolean {
  if (!element) return false;
  return (
    element.scrollWidth > element.clientWidth + OVERFLOW_TOLERANCE_PX ||
    element.scrollHeight > element.clientHeight + OVERFLOW_TOLERANCE_PX
  );
}

/**
 * Tracks whether the referenced element is visually truncated.
 * Re-measures on resize and whenever `text` changes.
 */
export function useIsTextTruncated<T extends HTMLElement>(text: string) {
  const ref = React.useRef<T>(null);
  const [truncated, setTruncated] = React.useState(false);

  React.useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;

    const measure = () => setTruncated(isElementTruncated(element));
    measure();

    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [text]);

  return { ref, truncated };
}

/** Above dialogs and sidebar menus (z-[100]); long names wrap inside a bounded bubble. */
export const truncatedTextTooltipClassName = "z-[100] max-w-xs break-words text-pretty";

const LINE_CLASS = {
  1: "truncate",
  2: "line-clamp-2 break-words",
} as const;

type TruncatedLines = keyof typeof LINE_CLASS;

/** Classes of the truncated element; `cursor-help` signals the tooltip only when it can open. */
export function getTruncatedTextClassName(lines: TruncatedLines, truncated: boolean, className?: string): string {
  return cn("min-w-0", LINE_CLASS[lines], truncated && "cursor-help", className);
}

interface TruncatedTextProps {
  /** Full text, shown in the tooltip when the rendered content is cut. */
  text: string;
  as?: "span" | "h2" | "p" | "dl" | "dd";
  lines?: TruncatedLines;
  className?: string;
  id?: string;
  side?: React.ComponentProps<typeof TooltipContent>["side"];
  /** Rendered content; defaults to `text`. The full text always stays in the DOM for assistive tech. */
  children?: React.ReactNode;
}

/**
 * Touch screens have no hover: a tap on a truncated, non-interactive text toggles its tooltip.
 * Returns the next open state, or `null` when the tap must keep the default behavior.
 */
export function resolveTouchTooltipToggle({
  pointerType,
  truncated,
  open,
}: {
  pointerType: string | null;
  truncated: boolean;
  open: boolean;
}): boolean | null {
  if (pointerType !== "touch" || !truncated) return null;
  return !open;
}

/**
 * Text cut to `lines` lines that reveals its full value in a tooltip, only when actually truncated:
 * on hover with a mouse, on tap with a touch screen. Meant for non-interactive text (headings, labels).
 * @see docs/design.md §6.4
 */
export function TruncatedText({
  text,
  as: Tag = "span",
  lines = 1,
  className,
  id,
  side = "bottom",
  children,
}: TruncatedTextProps) {
  const { ref, truncated } = useIsTextTruncated<HTMLElement>(text);
  const [open, setOpen] = React.useState(false);
  const pointerTypeRef = React.useRef<string | null>(null);

  // Radix closes the tooltip on trigger pointerdown/click: skip it for touch taps, which toggle instead.
  const handlePointerDown = (event: React.PointerEvent) => {
    pointerTypeRef.current = event.pointerType;
    if (event.pointerType === "touch" && truncated) event.preventDefault();
  };

  const handleClick = (event: React.MouseEvent) => {
    const next = resolveTouchTooltipToggle({ pointerType: pointerTypeRef.current, truncated, open });
    if (next === null) return;
    event.preventDefault();
    setOpen(next);
  };

  // A tap on the trigger is handled by handleClick; it must not count as an outside dismiss.
  const handlePointerDownOutside = (event: Event) => {
    if (event.target instanceof Node && ref.current?.contains(event.target)) event.preventDefault();
  };

  return (
    <Tooltip
      open={truncated && open}
      onOpenChange={setOpen}>
      <TooltipTrigger
        asChild
        onPointerDown={handlePointerDown}
        onClick={handleClick}>
        <Tag
          ref={ref as React.Ref<never>}
          id={id}
          className={getTruncatedTextClassName(lines, truncated, className)}>
          {children ?? text}
        </Tag>
      </TooltipTrigger>
      <TooltipContent
        side={side}
        className={truncatedTextTooltipClassName}
        onPointerDownOutside={handlePointerDownOutside}>
        {text}
      </TooltipContent>
    </Tooltip>
  );
}
