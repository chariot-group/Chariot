"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ComponentType } from "react";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { showToast } from "@/lib/toast";
import { reportClientIssue } from "@/logger/reportClientIssue";
import {
  createLazyComponentLoader,
  shouldMountLazyDialog,
  type LazyComponentLoader,
  type LazyModuleLoader,
} from "@/lib/lazyComponentLoader";

const LAZY_LOAD_ERROR_TOAST_ID = "lazy-load-error";
const RETURN_FOCUS_TIMEOUT_MS = 3000;
const RETURN_FOCUS_POLL_MS = 25;

type LazyStatus = "idle" | "loading" | "ready" | "error";

/**
 * @param keepFailure - true keeps the "error" status until `retry()`; false lets the next
 * `enabled` cycle (e.g. reopening a dialog) fetch again.
 */
function useLazyComponent<P>(
  lazy: LazyComponentLoader<P>,
  enabled: boolean,
  onError: (error: unknown) => void,
  keepFailure: boolean,
) {
  const [Component, setComponent] = useState<ComponentType<P> | null>(() => lazy.getLoaded());
  const [failed, setFailed] = useState(false);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onErrorRef.current = onError;
  });

  useEffect(() => {
    if (!enabled || Component || failed) return;

    let cancelled = false;
    lazy
      .load()
      .then((loaded) => {
        if (!cancelled) setComponent(() => loaded);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        reportClientIssue("error", "On-demand component failed to load", "Navigation", error);
        if (keepFailure) setFailed(true);
        onErrorRef.current(error);
      });

    return () => {
      cancelled = true;
    };
  }, [lazy, enabled, Component, failed, keepFailure]);

  const status: LazyStatus = Component ? "ready" : failed ? "error" : enabled ? "loading" : "idle";

  return { Component, status, retry: () => setFailed(false) };
}

function LazyLoadingStatus({ overlay }: { overlay?: boolean }) {
  const t = useTranslations("common");

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={
        overlay
          ? "fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          : "flex min-h-40 w-full items-center justify-center"
      }>
      <Loader2
        className="size-8 animate-spin text-white"
        aria-hidden="true"
      />
      <span className="sr-only">{t("lazyLoading")}</span>
    </div>
  );
}

/**
 * Controlled dialogs have no Radix `DialogTrigger`, so Radix cannot return focus on close:
 * remember the element focused when the dialog opens and focus it again when it closes.
 */
function useReturnFocusOnClose(open: boolean) {
  const returnFocusRef = useRef<HTMLElement | null>(null);

  useLayoutEffect(() => {
    if (open) {
      const active = document.activeElement;
      returnFocusRef.current = active instanceof HTMLElement && active !== document.body ? active : null;
      return;
    }

    const target = returnFocusRef.current;
    returnFocusRef.current = null;
    if (!target) return;

    // Radix keeps focus trapped until the exit animation ends, then drops it on <body>:
    // restore once that happens, unless the user has moved focus elsewhere meanwhile.
    // Polled with timers rather than animation frames, which pause when the tab is not painted.
    const startedAt = Date.now();
    let timer = setTimeout(function restoreWhenReleased() {
      const active = document.activeElement;
      if (active === null || active === document.body) {
        if (target.isConnected) target.focus({ preventScroll: true });
        return;
      }
      if (!active.closest("[role='dialog'], [role='alertdialog']")) return;
      if (Date.now() - startedAt < RETURN_FOCUS_TIMEOUT_MS) {
        timer = setTimeout(restoreWhenReleased, RETURN_FOCUS_POLL_MS);
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [open]);
}

export interface LazyDialogProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
}

export type LazyComponent<P> = ComponentType<P> & { preload: () => void };

/**
 * Dialog whose code is fetched on first open (or on `preload()` from its trigger).
 * A failed fetch shows a toast and closes the dialog so the trigger can retry.
 * Focus returns to the element that opened it.
 * @see FR-web-first-load-performance
 */
export function createLazyDialog<P extends LazyDialogProps>(loader: LazyModuleLoader<P>): LazyComponent<P> {
  const lazy = createLazyComponentLoader(loader);

  function LazyDialog(props: P) {
    const t = useTranslations("common");
    const [hasBeenOpened, setHasBeenOpened] = useState(props.open);
    if (props.open && !hasBeenOpened) setHasBeenOpened(true);

    useReturnFocusOnClose(props.open);

    const mounted = shouldMountLazyDialog(props.open, hasBeenOpened);
    const { Component, status } = useLazyComponent(
      lazy,
      mounted,
      () => {
        showToast(t("lazyLoadError"), "error", { toastId: LAZY_LOAD_ERROR_TOAST_ID });
        // Unmount and close so the trigger can retry on the next open.
        setHasBeenOpened(false);
        props.onOpenChange?.(false);
      },
      false,
    );

    if (!mounted) return null;
    if (Component) return <Component {...props} />;
    return props.open && status === "loading" ? <LazyLoadingStatus overlay /> : null;
  }

  return Object.assign(LazyDialog, { preload: lazy.preload });
}

/**
 * Inline component (e.g. an edit form) fetched when first rendered.
 * Shows an accessible spinner while loading and an inline retry on failure.
 * @see FR-web-first-load-performance
 */
export function createLazyComponent<P extends object>(loader: LazyModuleLoader<P>): LazyComponent<P> {
  const lazy = createLazyComponentLoader(loader);

  function LazyInline(props: P) {
    const t = useTranslations("common");
    const { Component, status, retry } = useLazyComponent(
      lazy,
      true,
      () => showToast(t("lazyLoadError"), "error", { toastId: LAZY_LOAD_ERROR_TOAST_ID }),
      true,
    );

    if (Component) return <Component {...props} />;
    if (status === "error") {
      return (
        <div
          role="alert"
          className="flex min-h-40 w-full flex-col items-center justify-center gap-3 text-sm text-white/80">
          <p>{t("lazyLoadError")}</p>
          <Button
            type="button"
            variant="outline"
            onClick={retry}>
            {t("retry")}
          </Button>
        </div>
      );
    }
    return <LazyLoadingStatus />;
  }

  return Object.assign(LazyInline, { preload: lazy.preload });
}
