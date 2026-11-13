"use client";

import * as React from "react";
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { Select as SelectPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";
import {
  menuItemClassName,
  menuItemIconClassName,
  menuLabelClassName,
  menuSeparatorClassName,
  menuSurfaceClassName,
} from "@/components/ui/menu-styles";
import { useDialogPortalContainer } from "@/components/ui/dialog-portal-container";

function Select({ ...props }: React.ComponentProps<typeof SelectPrimitive.Root>) {
  return (
    <SelectPrimitive.Root
      data-slot="select"
      {...props}
    />
  );
}

function SelectGroup({ ...props }: React.ComponentProps<typeof SelectPrimitive.Group>) {
  return (
    <SelectPrimitive.Group
      data-slot="select-group"
      {...props}
    />
  );
}

function SelectValue({ ...props }: React.ComponentProps<typeof SelectPrimitive.Value>) {
  return (
    <SelectPrimitive.Value
      data-slot="select-value"
      {...props}
    />
  );
}

function SelectTrigger({
  className,
  size = "default",
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger> & {
  size?: "sm" | "default";
}) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size}
      className={cn(
        "data-[placeholder]:text-muted-foreground [&_svg:not([class*='text-'])]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50 flex w-fit cursor-pointer items-center justify-between gap-2 rounded-[15px] bg-gray-middle-light px-3 py-2 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 data-[size=default]:h-9 data-[size=sm]:h-8 *:data-[slot=select-value]:min-w-0 *:data-[slot=select-value]:block *:data-[slot=select-value]:truncate [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}>
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDownIcon className="size-4 opacity-50 text-white" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

/** Tracks whether a scroll container has content hidden above or below its visible area. */
function useScrollOverflow(element: HTMLElement | null) {
  const [overflow, setOverflow] = React.useState({ above: false, below: false });

  const update = React.useCallback(() => {
    if (!element) return;
    const above = element.scrollTop > 1;
    const below = element.scrollTop + element.clientHeight < element.scrollHeight - 1;
    setOverflow((prev) => (prev.above === above && prev.below === below ? prev : { above, below }));
  }, [element]);

  React.useEffect(() => {
    if (!element) return;
    update();
    element.addEventListener("scroll", update, { passive: true });
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(update);
    observer?.observe(element);
    return () => {
      element.removeEventListener("scroll", update);
      observer?.disconnect();
    };
  }, [element, update]);

  return overflow;
}

function SelectOverlayScrollHint({ direction, visible }: { direction: "up" | "down"; visible: boolean }) {
  const Icon = direction === "up" ? ChevronUpIcon : ChevronDownIcon;
  return (
    <div
      aria-hidden="true"
      data-slot={`select-scroll-${direction}-hint`}
      className={cn(
        "pointer-events-none absolute inset-x-0 z-10 flex justify-center transition-opacity duration-150",
        direction === "up"
          ? "top-0 rounded-t-[14px] bg-gradient-to-b from-popover from-60% to-transparent pt-1 pb-3"
          : "bottom-0 rounded-b-[14px] bg-gradient-to-t from-popover from-60% to-transparent pt-3 pb-1",
        visible ? "opacity-100" : "opacity-0",
      )}>
      <Icon className="size-4" />
    </div>
  );
}

function SelectContent({
  className,
  children,
  position = "item-aligned",
  align = "center",
  portalled = true,
  scrollButtons = "inline",
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content> & {
  portalled?: boolean;
  /**
   * "overlay" replaces the Radix scroll buttons with always-mounted, non-interactive hints faded in over the list.
   * Radix buttons shift the items when they mount and, on mount, scroll the focused (selected) item back into view,
   * which makes the list jump while scrolling.
   */
  scrollButtons?: "inline" | "overlay";
}) {
  const dialogPortalContainer = useDialogPortalContainer();
  const resolvedPosition = portalled ? position : "popper";
  const [viewportElement, setViewportElement] = React.useState<HTMLDivElement | null>(null);
  const overflow = useScrollOverflow(scrollButtons === "overlay" ? viewportElement : null);

  const content = (
    <SelectPrimitive.Content
      data-slot="select-content"
      className={cn(
        menuSurfaceClassName,
        "p-0 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 relative z-50 max-h-(--radix-select-content-available-height) min-w-[8rem] origin-(--radix-select-content-transform-origin) overflow-x-hidden overflow-y-auto",
        resolvedPosition === "popper" &&
          "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
        !portalled && "absolute",
        className,
      )}
      position={resolvedPosition}
      align={align}
      {...props}>
      {scrollButtons === "overlay" ? (
        <SelectOverlayScrollHint
          direction="up"
          visible={overflow.above}
        />
      ) : (
        <SelectScrollUpButton />
      )}
      <SelectPrimitive.Viewport
        ref={setViewportElement}
        className={cn(
          "p-1.5",
          resolvedPosition === "popper" &&
            "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)] scroll-my-1",
        )}>
        {children}
      </SelectPrimitive.Viewport>
      {scrollButtons === "overlay" ? (
        <SelectOverlayScrollHint
          direction="down"
          visible={overflow.below}
        />
      ) : (
        <SelectScrollDownButton />
      )}
    </SelectPrimitive.Content>
  );

  if (!portalled) {
    return content;
  }

  return (
    <SelectPrimitive.Portal container={dialogPortalContainer ?? undefined}>{content}</SelectPrimitive.Portal>
  );
}

function SelectLabel({ className, ...props }: React.ComponentProps<typeof SelectPrimitive.Label>) {
  return (
    <SelectPrimitive.Label
      data-slot="select-label"
      className={cn(menuLabelClassName, className)}
      {...props}
    />
  );
}

function SelectItem({ className, children, ...props }: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        menuItemClassName,
        menuItemIconClassName,
        "pr-8 data-[state=checked]:bg-white/15 data-[state=checked]:font-medium *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2",
        className,
      )}
      {...props}>
      <span
        data-slot="select-item-indicator"
        className="absolute right-3 flex size-3.5 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <CheckIcon className="size-4 text-white" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
}

function SelectSeparator({ className, ...props }: React.ComponentProps<typeof SelectPrimitive.Separator>) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn(menuSeparatorClassName, "pointer-events-none", className)}
      {...props}
    />
  );
}

function SelectScrollUpButton({ className, ...props }: React.ComponentProps<typeof SelectPrimitive.ScrollUpButton>) {
  return (
    <SelectPrimitive.ScrollUpButton
      data-slot="select-scroll-up-button"
      className={cn("flex cursor-pointer items-center justify-center py-1", className)}
      {...props}>
      <ChevronUpIcon className="size-4" />
    </SelectPrimitive.ScrollUpButton>
  );
}

function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownButton>) {
  return (
    <SelectPrimitive.ScrollDownButton
      data-slot="select-scroll-down-button"
      className={cn("flex cursor-pointer items-center justify-center py-1", className)}
      {...props}>
      <ChevronDownIcon className="size-4" />
    </SelectPrimitive.ScrollDownButton>
  );
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
};
