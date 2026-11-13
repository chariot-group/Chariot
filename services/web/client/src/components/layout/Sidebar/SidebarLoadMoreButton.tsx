"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { Skeleton } from "@/components/ui/skeleton";
import { SKELETON_BAR_CLASS, SkeletonBar } from "@/components/character/skeleton/CharacterSheetSkeleton";
import { cn } from "@/lib/utils";

const ROW_WIDTHS = ["w-3/4", "w-1/2", "w-2/3"];

interface SidebarLoadMoreSkeletonProps {
  /** Avatar circle before the name bar (character rows). */
  withAvatar?: boolean;
  className?: string;
}

/**
 * Stands in for a sidebar « Load more » button while the next page loads (same style as the app shell sidebar skeleton).
 * @see FR-sidebar-navigation
 */
function SidebarLoadMoreSkeleton({ withAvatar = false, className }: SidebarLoadMoreSkeletonProps) {
  const t = useTranslations("sidebar");

  return (
    <div
      role="status"
      aria-busy="true"
      className={cn("flex w-full shrink-0 flex-col gap-3 px-3 py-1.5", className)}>
      <span className="sr-only">{t("loadingMore")}</span>
      {ROW_WIDTHS.map((width) => (
        <div
          key={width}
          aria-hidden="true"
          className="flex items-center gap-3">
          {withAvatar ? <Skeleton className={cn(SKELETON_BAR_CLASS, "size-8 shrink-0 rounded-full")} /> : null}
          <SkeletonBar className={cn("h-4", width)} />
        </div>
      ))}
    </div>
  );
}

interface SidebarLoadMoreButtonProps {
  loading: boolean;
  onLoadMore: () => Promise<unknown> | void;
  label: string;
  ariaLabel: string;
  withAvatar?: boolean;
  className: string;
}

/**
 * « Load more » button swapped for skeleton rows while loading; gives focus back to the button afterwards
 * when it had it (the button unmounts during the load).
 * @see FR-sidebar-navigation
 */
export function SidebarLoadMoreButton({
  loading,
  onLoadMore,
  label,
  ariaLabel,
  withAvatar,
  className,
}: SidebarLoadMoreButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const restoreFocusRef = useRef(false);

  useEffect(() => {
    if (!loading && restoreFocusRef.current) {
      restoreFocusRef.current = false;
      buttonRef.current?.focus();
    }
  }, [loading]);

  if (loading) {
    return <SidebarLoadMoreSkeleton withAvatar={withAvatar} />;
  }

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={(event) => {
        restoreFocusRef.current = document.activeElement === event.currentTarget;
        void Promise.resolve(onLoadMore()).catch(() => undefined);
      }}
      aria-label={ariaLabel}
      className={className}>
      {label}
    </button>
  );
}
