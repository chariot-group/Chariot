"use client";

import { useEffect, useState } from "react";
import { Timer } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  selectSessionStatus,
  selectSessionExpiresAt,
  openSessionLobby,
} from "@/store/slices/sessionSlice";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useTranslations } from "next-intl";

function formatDuration(seconds: number): string {
  if (seconds <= 0) return "00:00:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
}

export default function SessionTimer() {
  const status = useAppSelector(selectSessionStatus);
  const expiresAt = useAppSelector(selectSessionExpiresAt);
  const [remaining, setRemaining] = useState<number | null>(null);
  const dispatch = useAppDispatch();
  const t = useTranslations("sessionTime");

  useEffect(() => {
    if (status !== "launched" || !expiresAt) return;

    const compute = () => {
      const diff = Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000);
      setRemaining(diff);
    };

    compute();
    const interval = setInterval(compute, 1000);
    return () => clearInterval(interval);
  }, [status, expiresAt]);

  if (status !== "launched" || !expiresAt || remaining === null) return null;

  const isLow = remaining <= 300;

  return (
    <Tooltip>
      <TooltipTrigger
        asChild
        className="absolute right-full mr-1.5">
        <button
          type="button"
          onClick={() => dispatch(openSessionLobby())}
          className={`flex items-center gap-1.5 text-sm font-mono font-semibold cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ring rounded ${isLow ? "text-red-500" : "text-muted-foreground"}`}>
          <Timer className="w-4 h-4 shrink-0" />
          <span className="sm:hidden">{formatDuration(remaining).slice(0, 5)}</span>
          <span className="hidden sm:inline">{formatDuration(remaining)}</span>
        </button>
      </TooltipTrigger>
      <TooltipContent className="w-100">{t("tooltip")}</TooltipContent>
    </Tooltip>
  );
}
