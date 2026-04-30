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
import type { NPC, Player, Spell, Spellcasting } from "@/types/character";
import {
  getUpcastSlotLevels,
  hasAvailableSpellSlot,
  hasNpcInnateUsesRemaining,
  incrementNpcInnateSpellUses,
  incrementSpellSlotUsedInSpellcastingList,
  canCastSpellWithPreparedRules,
  classWithSpellPrepared,
} from "@/utils/magic.utils";
import { cn } from "@/lib/utils";

type CharacterKind = "players" | "npcs";

interface SpellCastControlsProps {
  characterKind: CharacterKind;
  character: Player | NPC;
  spellcasting: Spellcasting;
  selectedSpell: Spell | null;
  onCharacterUpdate?: (updated: Player | NPC) => void;
}

export default function SpellCastControls({
  characterKind,
  character,
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

  const castSlotsAtLevel = useCallback(
    async (slotLevel: number) => {
      if (!onCharacterUpdate || !selectedSpell || busy) return;
      if (!hasAvailableSpellSlot(spellcasting, slotLevel)) {
        toast.error(tMagic("spellCastNoSlots"));
        return;
      }

      setBusy(true);
      try {
        const list = character.spellcasting ?? [];
        const nextSpellcasting = incrementSpellSlotUsedInSpellcastingList(
          list,
          spellcasting.className,
          slotLevel,
        );
        const updated = (await CharacterService.updateCharacter(characterKind, character._id, {
          spellcasting: nextSpellcasting,
        })) as Player | NPC;
        onCharacterUpdate(updated);
      } catch (e) {
        console.error(e);
        toast.error(tMagic("spellCastError"));
      } finally {
        setBusy(false);
      }
    },
    [
      busy,
      character._id,
      character.spellcasting,
      characterKind,
      onCharacterUpdate,
      selectedSpell,
      spellcasting,
      toast,
      tMagic,
    ],
  );

  const castInnateLimited = useCallback(async () => {
    if (!onCharacterUpdate || !selectedSpell || busy) return;
    if (!hasNpcInnateUsesRemaining(selectedSpell)) {
      toast.error(tMagic("spellCastNoNpcUses"));
      return;
    }

    setBusy(true);
    try {
      const list = character.spellcasting ?? [];
      const nextSpellcasting = incrementNpcInnateSpellUses(list, spellcasting.className, selectedSpell);
      const updated = (await CharacterService.updateCharacter(characterKind, character._id, {
        spellcasting: nextSpellcasting,
      })) as Player | NPC;
      onCharacterUpdate(updated);
    } catch (e) {
      console.error(e);
      toast.error(tMagic("spellCastError"));
    } finally {
      setBusy(false);
    }
  }, [
    busy,
    character._id,
    character.spellcasting,
    characterKind,
    onCharacterUpdate,
    selectedSpell,
    spellcasting.className,
    toast,
    tMagic,
  ]);

  if (!showCast || !selectedSpell || !onCharacterUpdate) {
    return null;
  }

  const isInnate = spellcasting.isInnate ?? false;

  const blockedBecauseNotPrepared =
    selectedSpell &&
    !isInnate &&
    classWithSpellPrepared(spellcasting) &&
    !canCastSpellWithPreparedRules(selectedSpell, spellcasting);

  /* ─── Sorts innés (PNJ / line avec isInnate) : utilisations / jour ─── */
  if (isInnate) {
    if (selectedSpell.usesPerDay == null) {
      return null;
    }

    const canCastInnate = hasNpcInnateUsesRemaining(selectedSpell) && !busy;
    const noUsesLeft = !hasNpcInnateUsesRemaining(selectedSpell);
    const innateTooltip = tMagic("npcSpellUsesExhaustedTooltip");

    const compactInnate = "h-8 gap-1.5 px-3 has-[>svg]:px-2.5 text-sm rounded-[15px]";

    const innateButton = (
      <Button
        type="button"
        variant="outline"
        size="default"
        disabled={noUsesLeft || busy}
        className={compactInnate}
        aria-busy={busy}
        aria-label={tMagic("castSpellNpcInnateAria", { name: selectedSpell.name })}
        onClick={() => void castInnateLimited()}>
        {busy ? <Loader2 className="size-4 animate-spin shrink-0" aria-hidden /> : null}
        {tMagic("castSpell")}
      </Button>
    );

    return (
      <div
        className="flex flex-col items-end gap-1"
        role="group"
        aria-label={tMagic("spellCastRegion")}>
        {noUsesLeft ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex">{innateButton}</span>
            </TooltipTrigger>
            <TooltipContent side="top">{innateTooltip}</TooltipContent>
          </Tooltip>
        ) : (
          innateButton
        )}
      </div>
    );
  }

  if (blockedBecauseNotPrepared) {
    const compactBlocked = "h-8 gap-1.5 px-3 has-[>svg]:px-2.5 text-sm rounded-[15px]";
    const blockedBtn = (
      <Button
        type="button"
        variant="outline"
        disabled
        className={compactBlocked}
        aria-label={tMagic("spellCastNotPreparedAria")}>
        {tMagic("castSpell")}
      </Button>
    );

    return (
      <div
        className="flex flex-col items-end gap-1"
        role="group"
        aria-label={tMagic("spellCastRegion")}>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex">{blockedBtn}</span>
          </TooltipTrigger>
          <TooltipContent side="top">{tMagic("spellNotPreparedTooltip")}</TooltipContent>
        </Tooltip>
      </div>
    );
  }

  /* ─── Emplacements par niveau (PJ ou PNJ non inné) ─── */
  if (baseLevel <= 0) {
    return null;
  }

  const noSlotForBase = !hasAvailableSpellSlot(spellcasting, baseLevel);
  const showUpcastTrigger = upcastLevels.length > 0;
  const allUpcastExhausted =
    upcastLevels.length > 0 && upcastLevels.every((l) => !hasAvailableSpellSlot(spellcasting, l));

  const mainRounded = showUpcastTrigger ? "rounded-l-[15px] rounded-r-none" : "rounded-[15px]";
  const chevronRounded = "rounded-r-[15px] rounded-l-none";
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
        noSlotForBase
          ? tMagic("spellCastNoSlotsAria")
          : tMagic("castSpellAtLevelAria", { level: baseLevel, name: selectedSpell.name })
      }
      onClick={noSlotForBase ? undefined : () => void castSlotsAtLevel(baseLevel)}>
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
                        void castSlotsAtLevel(level);
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
