"use client";

import * as React from "react";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { cn } from "@/lib/utils";

export type CharacterSheetHeaderIdentityProps = {
  fullName: string;
  surname?: string | null;
  /** Shown when fullName is empty */
  emptyNameFallback?: string;
  subtitle: React.ReactNode;
  avatar?: React.ReactNode;
  tooltipContent?: React.ReactNode;
};

function CharacterSheetHeaderNameBlock({
  displayName,
  trimmedSurname,
  withTooltipCursor,
}: {
  displayName: string;
  trimmedSurname?: string;
  withTooltipCursor?: boolean;
}) {
  return (
    <div className={cn("min-w-0 w-full text-left", withTooltipCursor && "cursor-help")}>
      <h1 className="w-full min-w-0 truncate text-left text-2xl font-bold text-white sm:text-3xl">{displayName}</h1>
      {trimmedSurname ? (
        <p className="mt-0.5 w-full min-w-0 truncate text-left text-sm italic text-gray-light sm:text-base">
          ({trimmedSurname})
        </p>
      ) : null}
    </div>
  );
}

export function CharacterSheetHeaderIdentity({
  fullName,
  surname,
  emptyNameFallback,
  subtitle,
  avatar,
  tooltipContent,
}: CharacterSheetHeaderIdentityProps) {
  const trimmedSurname = surname?.trim() || undefined;
  const displayName = fullName.trim() || emptyNameFallback || "";

  const nameBlock = (
    <CharacterSheetHeaderNameBlock
      displayName={displayName}
      trimmedSurname={trimmedSurname}
      withTooltipCursor={tooltipContent != null}
    />
  );

  return (
    <div
      className={cn(
        "grid w-full min-w-0 items-start gap-x-3 gap-y-2",
        avatar ? "grid-cols-[minmax(0,1fr)_auto]" : "grid-cols-1",
      )}>
      <div className="col-start-1 row-start-1 min-w-0">
        {tooltipContent != null ? (
          <InfoTooltip
            className="flex w-full min-w-0 items-start gap-0.5"
            content={tooltipContent}
            side="bottom"
            align="start">
            <div className="min-w-0 w-full flex-1">{nameBlock}</div>
          </InfoTooltip>
        ) : (
          nameBlock
        )}
      </div>

      {avatar ? <div className="col-start-2 row-start-1 shrink-0 self-start">{avatar}</div> : null}

      <div className="col-start-1 row-start-2 min-w-0 w-full text-left text-sm">{subtitle}</div>
    </div>
  );
}
