"use client";

import { useEffect, useState } from "react";
import { Timer } from "lucide-react";
import { useAppSelector } from "@/store/hooks";
import { selectSessionStatus, selectSessionExpiresAt } from "@/store/slices/sessionSlice";
import { useTranslations } from "next-intl";
import {
  computeSessionRemainingSeconds,
  formatSessionRemainingDuration,
  isSessionTimerLow,
  shouldShowSessionTimer,
} from "@/lib/sessionPresenceUi";
import { cn } from "@/lib/utils";

export default function SessionTimer() {
  const status = useAppSelector(selectSessionStatus);
  const expiresAt = useAppSelector(selectSessionExpiresAt);
  const [remaining, setRemaining] = useState<number | null>(null);
  const t = useTranslations("sessionTime");

  useEffect(() => {
    if (!shouldShowSessionTimer(status, expiresAt) || !expiresAt) return;

    const compute = () => {
      setRemaining(computeSessionRemainingSeconds(expiresAt, Date.now()));
    };

    compute();
    const interval = setInterval(compute, 1000);
    return () => clearInterval(interval);
  }, [status, expiresAt]);

  if (!shouldShowSessionTimer(status, expiresAt) || remaining === null) return null;

  const formatted = formatSessionRemainingDuration(remaining);

  return (
    <div
      role="timer"
      aria-label={t("remainingAriaLabel", { time: formatted })}
      className={cn(
        "flex shrink-0 items-center gap-1.5 whitespace-nowrap font-mono text-sm font-semibold tabular-nums",
        isSessionTimerLow(remaining) ? "text-red" : "text-muted-foreground",
      )}>
      <Timer
        className="size-4 shrink-0"
        aria-hidden
      />
      <span>{formatted}</span>
    </div>
  );
}
