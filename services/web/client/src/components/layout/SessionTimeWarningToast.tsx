"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { useSessionRemainingSeconds } from "@/hooks/useSessionRemainingSeconds";
import { shouldNotifySessionTimeWarning } from "@/lib/sessionPresenceUi";
import { showToast } from "@/lib/toast";
import { useAppSelector } from "@/store/hooks";
import { selectSessionCode } from "@/store/slices/sessionSlice";

const SESSION_TIME_WARNING_TOAST_MS = 8000;

/** @see FR-session-lobby-navigation */
export default function SessionTimeWarningToast() {
  const remainingSeconds = useSessionRemainingSeconds();
  const previousRemainingRef = useRef<number | null>(null);
  const code = useAppSelector(selectSessionCode);
  const t = useTranslations("sessionTime");

  useEffect(() => {
    previousRemainingRef.current = null;
  }, [code]);

  useEffect(() => {
    const previousRemainingSeconds = previousRemainingRef.current;
    if (
      shouldNotifySessionTimeWarning({
        previousRemainingSeconds,
        currentRemainingSeconds: remainingSeconds,
      })
    ) {
      showToast(t("warningToast"), "warning", {
        autoClose: SESSION_TIME_WARNING_TOAST_MS,
        toastId: code ? `session-time-warning:${code}` : "session-time-warning",
      });
    }
    previousRemainingRef.current = remainingSeconds;
  }, [code, remainingSeconds, t]);

  return null;
}
