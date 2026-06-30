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

/**
 * Character sheet header.
 * Mobile/tablet: identity + avatar on one row, tabs full width below.
 * lg+ (when avatar present): identity top-left, avatar spanning right column, tabs bottom-left aligned with avatar.
 * @see FR-character-detail-view
 */
export function CharacterSheetHeader({ identity, tabs, avatar, className }: CharacterSheetHeaderProps) {
  const hasAvatarGrid = Boolean(avatar);

  return (
    <div
      className={cn(
        "flex w-full flex-col gap-4 pb-2",
        hasAvatarGrid &&
          "lg:grid lg:grid-cols-[minmax(0,1fr)_auto] lg:grid-rows-[auto_auto] lg:items-end lg:gap-x-3 lg:gap-y-2",
        className,
      )}>
      <div className={cn("flex w-full items-start gap-3", hasAvatarGrid && "lg:contents")}>
        <div className={cn("min-w-0 flex-1", hasAvatarGrid && "lg:col-start-1 lg:row-start-1 lg:self-start")}>
          {identity}
        </div>
        {avatar ? (
          <div
            className={cn(
              "shrink-0 self-start",
              hasAvatarGrid && "lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:self-start",
            )}>
            {avatar}
          </div>
        ) : null}
      </div>
      <div
        className={cn(
          tabsScrollClassName,
          hasAvatarGrid && "lg:col-start-1 lg:row-start-2 lg:w-auto lg:self-end",
        )}>
        {tabs}
      </div>
    </div>
  );
}
