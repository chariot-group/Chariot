"use client";

import { Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CharacterSheetSkeletonFrame,
  SKELETON_BAR_CLASS,
  SkeletonBar,
} from "@/components/character/skeleton/CharacterSheetSkeleton";
import { resolveAuthSkeletonContent } from "@/components/layout/authSkeletonContent";
import { cn } from "@/lib/utils";

const SIDEBAR_ROW_WIDTHS = ["w-3/4", "w-1/2", "w-2/3", "w-3/5", "w-1/2", "w-2/3"];

/** Same width and surface as `AppSidebar` (desktop only: off-canvas below `md`). */
function SidebarPlaceholder() {
  return (
    <div
      aria-hidden="true"
      className="hidden h-dvh w-64 shrink-0 flex-col gap-6 border-r border-frame p-4 md:flex">
      <SkeletonBar className="h-8 w-40" />
      <div className="flex flex-1 flex-col gap-4">
        <SkeletonBar className="h-3 w-24" />
        {SIDEBAR_ROW_WIDTHS.map((width, index) => (
          <div
            key={index}
            className="flex items-center gap-3">
            <Skeleton className={cn(SKELETON_BAR_CLASS, "size-8 shrink-0 rounded-full")} />
            <SkeletonBar className={cn("h-4", width)} />
          </div>
        ))}
      </div>
      <Skeleton className={cn(SKELETON_BAR_CLASS, "h-10 w-full rounded-[13px]")} />
    </div>
  );
}

function GenericContentPlaceholder() {
  return (
    <div
      aria-hidden="true"
      className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden px-4 py-4 sm:px-6 md:px-8">
      <SkeletonBar className="h-8 w-48" />
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4 xl:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <div
            key={index}
            className="flex min-h-40 flex-col gap-4 rounded-[24px] bg-card p-4 md:px-6">
            <SkeletonBar className="h-6 w-32" />
            <SkeletonBar className="h-4 w-3/4" />
            <SkeletonBar className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Reads the URL (search params need a Suspense boundary in the root layout). */
function ContentPlaceholder() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const content = resolveAuthSkeletonContent(pathname, searchParams.get("tab"));

  return content.type === "sheet" ? <CharacterSheetSkeletonFrame {...content.variant} /> : <GenericContentPlaceholder />;
}

interface AppShellSkeletonProps {
  /** Escape hatch: a user stuck in authentication can still log out. */
  onLogout: () => void;
  /**
   * The authenticated shell could not be fetched (slow or lost network): the frame stays,
   * the content area shows an alert with a retry instead of the placeholders.
   * @see FR-web-first-load-performance (Slow-network authentication round trip)
   */
  onRetry?: () => void;
}

function ShellLoadFailure({ onRetry }: { onRetry: () => void }) {
  const t = useTranslations("common");

  return (
    <div
      role="alert"
      className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 px-4 text-center text-sm text-white/80">
      <p>{t("lazyLoadError")}</p>
      <button
        type="button"
        onClick={onRetry}
        className="cursor-pointer rounded-md border border-white/40 px-4 py-2 text-sm text-white hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
        {t("retry")}
      </button>
    </div>
  );
}

/**
 * Loading state while Keycloak initializes: skeleton of the app shell (sidebar, header, content).
 * On a character sheet route the content is the sheet skeleton, so it continues seamlessly
 * into the sheet's own loading state.
 * @see FR-auth-loading-skeleton
 */
export default function AppShellSkeleton({ onLogout, onRetry }: AppShellSkeletonProps) {
  const t = useTranslations("auth");
  const failed = Boolean(onRetry);

  return (
    <div
      role={failed ? undefined : "status"}
      aria-busy={failed ? undefined : true}
      className="flex h-dvh min-h-0 w-full overflow-hidden">
      {!failed && <span className="sr-only">{t("loading")}</span>}
      <SidebarPlaceholder />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Same box as `Header`: trigger, centered logo, profile slot (here the log out escape hatch) */}
        <div className="w-full shrink-0 flex flex-row justify-between items-center px-2 sm:px-4">
          <Skeleton
            aria-hidden="true"
            className={cn(SKELETON_BAR_CLASS, "self-start mt-1 size-7")}
          />
          <Skeleton
            aria-hidden="true"
            className={cn(SKELETON_BAR_CLASS, "h-16 w-16 rounded-[15px] sm:h-20 sm:w-20 md:h-22.5 md:w-22.5")}
          />
          <button
            type="button"
            onClick={onLogout}
            className="cursor-pointer rounded-md border border-white/40 px-3 py-2 text-sm text-white hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
            {t("logoutEscape")}
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {onRetry ? (
            <ShellLoadFailure onRetry={onRetry} />
          ) : (
            <Suspense fallback={<GenericContentPlaceholder />}>
              <ContentPlaceholder />
            </Suspense>
          )}
        </div>
      </div>
    </div>
  );
}
