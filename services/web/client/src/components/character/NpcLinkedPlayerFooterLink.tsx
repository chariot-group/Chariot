"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NpcLinkedPlayerFooterLinkProps {
  href: string;
  playerName: string | null;
  className?: string;
}

/** @see FR-npc-player-link — same outline footer treatment as Export PDF */
export function NpcLinkedPlayerFooterLink({ href, playerName, className }: NpcLinkedPlayerFooterLinkProps) {
  const t = useTranslations("characterDetail");
  const displayName = playerName?.trim() || "…";
  const label = t("npc.linkedTo", { name: displayName });

  return (
    <Button
      asChild
      type="button"
      variant="outline"
      className={cn("max-w-full min-w-0 lg:text-sm text-xs font-semibold", className)}>
      <Link
        href={href}
        className="inline-flex min-w-0 items-center gap-1.5"
        title={playerName ?? undefined}
        aria-label={label}>
        <UserRound
          className="lg:size-5 size-4 shrink-0"
          aria-hidden="true"
        />
        <span className="truncate">{label}</span>
      </Link>
    </Button>
  );
}
