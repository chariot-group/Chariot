import { Accordion } from "@/components/ui/accordion";
import { Loader2, Moon, Clock } from "lucide-react";
import ListCard from "@/components/character/tabContents/shared/listCard/ListCard";
import ListRow from "@/components/character/tabContents/shared/listCard/ListRow";
import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { Ability, NPC, Player } from "@/types/character";
import CharacterService from "@/services/CharacterService";
import { useToast } from "@/hooks/useToast";
import { useAppSelector } from "@/store/hooks";
import { selectIsInSession } from "@/store/slices/sessionSlice";
import { useActiveSessionCode } from "@/hooks/useActiveSessionCode";

type CharacterTypeFilter = "players" | "npcs";

interface AbilitiesSectionProps {
  abilities: Ability[];
  accentColor: string;
  title: string;
  headingId: string;
  className?: string;
  characterId: string;
  characterKind: CharacterTypeFilter;
  /** Personnage retourné par l’API — mise à jour locale sans rechargement global */
  onAfterAbilityUse?: (updated: Player | NPC) => void;
  /** Caps the list height and scrolls inside the card (General tab). @see FR-character-general-bento-layout */
  boundedList?: boolean;
}

const AbilitiesSection = ({
  abilities,
  accentColor,
  title,
  headingId,
  className = "",
  characterId,
  characterKind,
  onAfterAbilityUse,
  boundedList = false,
}: AbilitiesSectionProps) => {
  const tMagic = useTranslations("characterDetail.magic");
  const t = useTranslations("characterDetail.battle");
  const toast = useToast();
  const isInSession = useAppSelector(selectIsInSession);
  const sessionCode = useActiveSessionCode();
  const [loadingIndex, setLoadingIndex] = useState<number | null>(null);

  const showUseControls = isInSession && Boolean(onAfterAbilityUse);
  const [openAccordionValues, setOpenAccordionValues] = useState<string[]>([]);
  const hasAbilities = abilities.length > 0;
  const hasShortRestReset = abilities.some((ability) => ability.counterResetsOnShortRest === true);
  const hasLongRestReset = abilities.some((ability) => ability.counterResetsOnLongRest === true);
  const showRestLegend = hasShortRestReset || hasLongRestReset;

  const handleUse = useCallback(
    async (index: number) => {
      if (!onAfterAbilityUse) return;
      const ability = abilities[index];
      if (!ability.hasCounter) return;
      if (ability.counterMax === undefined || ability.counterMax === null) return;
      const current = ability.counterCurrent ?? 0;
      if (current >= ability.counterMax) return;

      setLoadingIndex(index);
      try {
        const next = abilities.map((a, i) =>
          i === index
            ? {
                ...a,
                counterCurrent: current + 1,
              }
            : a,
        );
        const type = characterKind === "npcs" ? "npcs" : "players";
        const updated = (await CharacterService.updateCharacter(
          type,
          characterId,
          {
            abilities: next,
          },
          sessionCode,
        )) as Player | NPC;
        onAfterAbilityUse?.(updated);
      } catch (e) {
        console.error(e);
        toast.error(t("abilityUseError"));
      } finally {
        setLoadingIndex(null);
      }
    },
    [abilities, characterId, characterKind, onAfterAbilityUse, sessionCode, toast, t],
  );

  const restLegend = showRestLegend ? (
    <div
      className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground sm:text-xs"
      aria-label={t("abilityCounterResetLegend")}>
      {hasShortRestReset && (
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
          <Clock
            className="size-3.5 shrink-0 text-white sm:size-4"
            aria-hidden
          />
          <span>{t("abilityCounterResetShortRestShort")}</span>
        </span>
      )}
      {hasLongRestReset && (
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
          <Moon
            className="size-3.5 shrink-0 text-white sm:size-4"
            aria-hidden
          />
          <span>{t("abilityCounterResetLongRestShort")}</span>
        </span>
      )}
    </div>
  ) : undefined;

  return (
    <ListCard
      headingId={headingId}
      title={title}
      count={abilities.length}
      accentColor={accentColor}
      className={className}
      toolbar={restLegend}
      expanded={openAccordionValues.length > 0}
      onToggleAll={() => {
        if (!hasAbilities) return;
        setOpenAccordionValues(
          openAccordionValues.length > 0 ? [] : abilities.map((ability, index) => `${ability.name}-${index}`),
        );
      }}
      expandLabel={tMagic("expandAll")}
      collapseLabel={tMagic("collapseAll")}
      emptyLabel={t("noAbilities")}
      bounded={boundedList}>
      <Accordion
        type="multiple"
        value={openAccordionValues}
        onValueChange={setOpenAccordionValues}
        className="w-full">
        {abilities.map((ability, index) => {
          const current = ability.counterCurrent ?? 0;
          const hasCounter = ability.hasCounter === true;
          const max = ability.counterMax;
          const remaining = typeof max === "number" ? max - current : 0;
          const atLimit = hasCounter && typeof max === "number" && current >= max;
          const canPressUse = hasCounter && typeof max === "number" && !atLimit;
          const useBusy = loadingIndex === index;
          const value = `${ability.name}-${index}`;
          const meta = [
            ability.counterResetsOnShortRest === true && (
              <Clock
                key="short"
                role="img"
                className="inline size-3.5 text-white sm:size-4"
                aria-label={t("abilityCounterResetShortRest")}
              />
            ),
            ability.counterResetsOnLongRest === true && (
              <Moon
                key="long"
                role="img"
                className="inline size-3.5 text-white sm:size-4"
                aria-label={t("abilityCounterResetLongRest")}
              />
            ),
            hasCounter && typeof max === "number" && (
              <span
                key="counter"
                className="tabular-nums font-medium"
                aria-label={t("abilityCounterShort", { current: remaining, max })}>
                {t("abilityCounterShort", { current: remaining, max })}
              </span>
            ),
          ].filter(Boolean);

          return (
            <ListRow
              key={value}
              value={value}
              name={ability.name}
              meta={meta}
              triggerLabel={[
                t("details"),
                ability.name,
                ability.counterResetsOnShortRest === true ? t("abilityCounterResetShortRest") : null,
                ability.counterResetsOnLongRest === true ? t("abilityCounterResetLongRest") : null,
              ]
                .filter(Boolean)
                .join(" ")}
              isOpen={openAccordionValues.includes(value)}
              contentClassName="space-y-3"
              contentLabel={`${t("descriptionPrefix")} ${ability.name}`}>
              <p className="whitespace-pre-wrap wrap-break-word">{ability.description}</p>
              {showUseControls && hasCounter && typeof max === "number" && (
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
                  {atLimit && !useBusy ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="inline-flex w-full sm:w-auto sm:justify-end">
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2"
                            disabled
                            aria-label={`${t("abilityUseAria", { name: ability.name, current: remaining, max })}. ${t("abilityUseLimitReached")}`}>
                            {t("abilityUse")}
                          </Button>
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>{t("abilityUseLimitReached")}</TooltipContent>
                    </Tooltip>
                  ) : (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2"
                      disabled={!canPressUse || useBusy}
                      aria-busy={useBusy}
                      aria-label={t("abilityUseAria", { name: ability.name, current: remaining, max })}
                      onClick={() => handleUse(index)}>
                      {useBusy ? (
                        <Loader2
                          className="size-4 animate-spin shrink-0"
                          aria-hidden
                        />
                      ) : null}
                      {t("abilityUse")}
                    </Button>
                  )}
                </div>
              )}
            </ListRow>
          );
        })}
      </Accordion>
    </ListCard>
  );
};

export default AbilitiesSection;
