"use client";

import { Timer } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSessionRemainingSeconds } from "@/hooks/useSessionRemainingSeconds";
import {
  formatSessionRemainingDuration,
  resolveSessionLiveTone,
  shouldShowSessionTimer,
} from "@/lib/sessionPresenceUi";
import { useAppSelector } from "@/store/hooks";
import { selectSessionExpiresAt, selectSessionStatus } from "@/store/slices/sessionSlice";
import { cn } from "@/lib/utils";

export default function SessionTimer() {
  const status = useAppSelector(selectSessionStatus);
  const expiresAt = useAppSelector(selectSessionExpiresAt);
  const remaining = useSessionRemainingSeconds();
  const t = useTranslations("sessionTime");

  if (!shouldShowSessionTimer(status, expiresAt) || remaining === null) return null;

  const formatted = formatSessionRemainingDuration(remaining);
  const tone = resolveSessionLiveTone(remaining);
  const remainingAriaKey =
    tone === "critical"
      ? "remainingAriaLabelCritical"
      : tone === "warning"
        ? "remainingAriaLabelWarning"
        : "remainingAriaLabel";

  return (
    <div
      role="timer"
      aria-label={t(remainingAriaKey, { time: formatted })}
      className={cn(
        "flex shrink-0 items-center gap-1.5 whitespace-nowrap font-mono text-sm font-semibold tabular-nums",
        tone === "critical" && "text-red",
        tone === "warning" && "text-yellow",
        tone === "live" && "text-muted-foreground",
      )}>
      <Timer
        className="size-4 shrink-0"
        aria-hidden
      />
      <span>{formatted}</span>
    </div>
  );
}
