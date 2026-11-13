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

/** Splits the translated label around the name so only the name truncates (« Lié à » stays visible). */
export function splitLinkedToLabel(label: string, name: string): { prefix: string; name: string; suffix: string } {
  const index = label.lastIndexOf(name);
  if (index < 0) return { prefix: "", name: label, suffix: "" };
  return { prefix: label.slice(0, index), name, suffix: label.slice(index + name.length) };
}

/** @see FR-npc-player-link — same outline footer treatment as Export PDF */
export function NpcLinkedPlayerFooterLink({ href, playerName, className }: NpcLinkedPlayerFooterLinkProps) {
  const t = useTranslations("characterDetail");
  const displayName = playerName?.trim() || "…";
  const label = t("npc.linkedTo", { name: displayName });
  const parts = splitLinkedToLabel(label, displayName);

  return (
    <Button
      asChild
      type="button"
      variant="secondary"
      // Base button is shrink-0 with no width cap: bound it so long names truncate
      className={cn("min-w-0 max-w-56 shrink sm:max-w-72 lg:text-sm text-xs font-semibold", className)}>
      <Link
        href={href}
        className="inline-flex min-w-0 items-center gap-1.5"
        title={label}
        aria-label={label}>
        <UserRound
          className="lg:size-5 size-4 shrink-0"
          aria-hidden="true"
        />
        <span className="flex min-w-0 items-baseline">
          {parts.prefix ? <span className="shrink-0 whitespace-pre">{parts.prefix}</span> : null}
          <span className="min-w-0 truncate">{parts.name}</span>
          {parts.suffix ? <span className="shrink-0 whitespace-pre">{parts.suffix}</span> : null}
        </span>
      </Link>
    </Button>
  );
}
