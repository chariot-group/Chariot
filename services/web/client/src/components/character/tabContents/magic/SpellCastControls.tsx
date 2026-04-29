"use client";

import { useCallback, useState } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { ButtonGroup, ButtonGroupSeparator } from "@/components/ui/button-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAppSelector } from "@/store/hooks";
import { selectIsInSession } from "@/store/slices/sessionSlice";
import CharacterService from "@/services/CharacterService";
import { useToast } from "@/hooks/useToast";
import type { Player, Spell, Spellcasting } from "@/types/character";
import {
  getUpcastSlotLevels,
  hasAvailableSpellSlot,
  incrementSpellSlotUsedInSpellcastingList,
} from "@/utils/magic.utils";
import { cn } from "@/lib/utils";

interface SpellCastControlsProps {
  player: Player;
  spellcasting: Spellcasting;
  selectedSpell: Spell | null;
  /** Mise à jour locale après PATCH (comme AbilitiesSection) */
  onCharacterUpdate?: (updated: Player) => void;
}

export default function SpellCastControls({
  player,
  spellcasting,
  selectedSpell,
  onCharacterUpdate,
}: SpellCastControlsProps) {
  const tMagic = useTranslations("characterDetail.magic");
  const toast = useToast();
  const isInSession = useAppSelector(selectIsInSession);
  const [busy, setBusy] = useState(false);

  const showCast = isInSession && Boolean(onCharacterUpdate);

  const baseLevel = selectedSpell?.level ?? -1;
  const upcastLevels = selectedSpell ? getUpcastSlotLevels(spellcasting, baseLevel) : [];

  const castAtLevel = useCallback(
    async (slotLevel: number) => {
      if (!onCharacterUpdate || !selectedSpell || busy) return;
      if (!hasAvailableSpellSlot(spellcasting, slotLevel)) {
        toast.error(tMagic("spellCastNoSlots"));
        return;
      }

      setBusy(true);
      try {
        const list = player.spellcasting ?? [];
        const nextSpellcasting = incrementSpellSlotUsedInSpellcastingList(
          list,
          spellcasting.className,
          slotLevel,
        );
        const updated = (await CharacterService.updateCharacter("players", player._id, {
          spellcasting: nextSpellcasting,
        })) as Player;
        onCharacterUpdate(updated);
      } catch (e) {
        console.error(e);
        toast.error(tMagic("spellCastError"));
      } finally {
        setBusy(false);
      }
    },
    [busy, onCharacterUpdate, player._id, player.spellcasting, selectedSpell, spellcasting, toast, tMagic],
  );

  if (!showCast || !selectedSpell || baseLevel <= 0 || (spellcasting.isInnate ?? false)) {
    return null;
  }

  const noSlotForBase = !hasAvailableSpellSlot(spellcasting, baseLevel);
  const showUpcastTrigger = upcastLevels.length > 0;
  const allUpcastExhausted =
    upcastLevels.length > 0 && upcastLevels.every((l) => !hasAvailableSpellSlot(spellcasting, l));

  const mainRounded = showUpcastTrigger
    ? "rounded-l-[15px] rounded-y-[15px] rounded-r-none"
    : "rounded-[15px]";
  const chevronRounded = "rounded-r-[15px] rounded-y-[15px] rounded-l-none";

  const compactBtn = "h-8 gap-1.5 px-3 has-[>svg]:px-2.5 text-sm";

  const slotTooltip = tMagic("spellSlotExhaustedTooltip");

  const mainButton = (
    <Button
      type="button"
      variant="outline"
      size="default"
      disabled={noSlotForBase || busy}
      className={cn(compactBtn, mainRounded)}
      aria-busy={busy}
      aria-label={
        noSlotForBase ? tMagic("spellCastNoSlotsAria") : tMagic("castSpellAtLevelAria", { level: baseLevel, name: selectedSpell.name })
      }
      onClick={noSlotForBase ? undefined : () => void castAtLevel(baseLevel)}>
      {busy ? <Loader2 className="size-4 animate-spin shrink-0" aria-hidden /> : null}
      {tMagic("castSpell")}
    </Button>
  );

  const chevronDisabled = busy || allUpcastExhausted;

  const chevronButton = (
    <Button
      type="button"
      variant="outline"
      size="default"
      className={cn(compactBtn, "border", chevronRounded, "px-2.5")}
      disabled={chevronDisabled}
      aria-label={tMagic("spellCastMoreOptionsAria")}>
      <ChevronDown className="size-4" aria-hidden />
    </Button>
  );

  return (
    <div
      className="flex flex-col items-end gap-1"
      role="group"
      aria-label={tMagic("spellCastRegion")}>
      <ButtonGroup>
        {noSlotForBase ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex">{mainButton}</span>
            </TooltipTrigger>
            <TooltipContent side="top">{slotTooltip}</TooltipContent>
          </Tooltip>
        ) : (
          mainButton
        )}
        {showUpcastTrigger && (
          <>
            <ButtonGroupSeparator />
            <DropdownMenu>
              {allUpcastExhausted && !busy ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex">
                      <DropdownMenuTrigger asChild>{chevronButton}</DropdownMenuTrigger>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top">{slotTooltip}</TooltipContent>
                </Tooltip>
              ) : (
                <DropdownMenuTrigger asChild>{chevronButton}</DropdownMenuTrigger>
              )}
              <DropdownMenuContent
                align="end"
                className="min-w-48 rounded-[15px] p-1">
                {upcastLevels.map((level) => {
                  const available = hasAvailableSpellSlot(spellcasting, level) && !busy;
                  const label = tMagic("castAtLevelOption", { level });
                  if (!available) {
                    return (
                      <Tooltip key={level}>
                        <TooltipTrigger asChild>
                          <span className="block w-full">
                            <DropdownMenuItem
                              disabled
                              className="pointer-events-none rounded-[15px] w-full"
                              onSelect={(e) => e.preventDefault()}
                              aria-label={label}>
                              {label}
                            </DropdownMenuItem>
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="left">{slotTooltip}</TooltipContent>
                      </Tooltip>
                    );
                  }
                  return (
                    <DropdownMenuItem
                      key={level}
                      className="rounded-[15px]"
                      onSelect={(e) => {
                        e.preventDefault();
                        void castAtLevel(level);
                      }}>
                      {label}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
      </ButtonGroup>
    </div>
  );
}
