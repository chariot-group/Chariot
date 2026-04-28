"use client";

import { useEffect, useState } from "react";
import { Timer } from "lucide-react";
import { useAppSelector } from "@/store/hooks";
import { selectSessionStatus, selectSessionExpiresAt } from "@/store/slices/sessionSlice";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import React from "react";

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
    <div
      className={`flex items-center gap-1.5 text-sm font-mono font-semibold ${isLow ? "text-red-500" : "text-muted-foreground"}`}>
      <Tooltip>
        <TooltipTrigger>
          <React.Fragment>
            <Timer className="w-4 h-4 shrink-0" />
            <span>{formatDuration(remaining)}</span>
          </React.Fragment>
        </TooltipTrigger>
        <TooltipContent>
          Une session est actuellement en cours. Elle à une validité de 8 heures. Il se clôt automatiquement à
          l'expiration de ce délai ou après 5 minutes si tous les participants l'ont quittée.
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
