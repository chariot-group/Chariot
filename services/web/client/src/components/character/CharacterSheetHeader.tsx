"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const tabsScrollClassName =
  "min-w-0 w-full overflow-x-auto overflow-y-hidden [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/80 [&::-webkit-scrollbar-thumb]:hover:bg-gray-middle-light [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-gray-dark/30";

type CharacterSheetHeaderProps = {
  identity: React.ReactNode;
  tabs: React.ReactNode;
  avatar?: React.ReactNode;
  className?: string;
};

/** Character sheet header: identity + optional avatar on one row, tabs full width below. */
export function CharacterSheetHeader({ identity, tabs, avatar, className }: CharacterSheetHeaderProps) {
  return (
    <div className={cn("flex w-full flex-col gap-4 pb-2", className)}>
      <div className="flex w-full items-start gap-3">
        <div className="min-w-0 flex-1">{identity}</div>
        {avatar ? <div className="shrink-0 self-start">{avatar}</div> : null}
      </div>
      <div className={tabsScrollClassName}>{tabs}</div>
    </div>
  );
}
