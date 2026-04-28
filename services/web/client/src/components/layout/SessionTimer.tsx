"use client";

import { useEffect, useState } from "react";
import { Timer } from "lucide-react";
import { useAppSelector } from "@/store/hooks";
import { selectSessionStatus, selectSessionExpiresAt, selectCurrentSession } from "@/store/slices/sessionSlice";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import Link from "next/link";
import { useSessionData } from "@/hooks/useSessionData";

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
  const session = useAppSelector(selectCurrentSession);

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
      <TooltipTrigger className="flex items-center gap-1.5">
        <Link
          href={`/campaign/${session.campaignId}/session/${session.code}`}
          className={`flex items-center gap-1.5 text-sm font-mono font-semibold ${isLow ? "text-red-500" : "text-muted-foreground"}`}>
          <Timer className="w-4 h-4 shrink-0" />
          <span>{formatDuration(remaining)}</span>
        </Link>
      </TooltipTrigger>
      <TooltipContent>
        Une session est actuellement en cours. Elle à une validité de 8 heures. Elle se clôt automatiquement à
        l'expiration de ce délai ou après 5 minutes si tous les participants l'ont quittée.
      </TooltipContent>
    </Tooltip>
  );
}
