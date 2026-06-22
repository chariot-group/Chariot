import { Card } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ListChevronsDownUp, ListChevronsUpDown, Loader2, Moon, Clock } from "lucide-react";
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
            : a
        );
        const type = characterKind === "npcs" ? "npcs" : "players";
        const updated = (await CharacterService.updateCharacter(type, characterId, {
          abilities: next,
        }, sessionCode)) as Player | NPC;
        onAfterAbilityUse?.(updated);
      } catch (e) {
        console.error(e);
        toast.error(t("abilityUseError"));
      } finally {
        setLoadingIndex(null);
      }
    },
    [abilities, characterId, characterKind, onAfterAbilityUse, sessionCode, toast, t]
  );

  return (
    <Card
      className={`gap-0.5 p-4 md:px-6 h-fit min-w-0 w-full ${className}`}
      role="region"
      aria-labelledby={headingId}>
      <div className="flex min-w-0 flex-row justify-between gap-2">
        <h2
          id={headingId}
          className={`min-w-0 flex-1 truncate text-xl sm:text-2xl font-semibold ${accentColor}`}>
          {title}
        </h2>
        <div className="flex justify-end shrink-0">
          <button
            type="button"
            onClick={() => {
              if (!hasAbilities) return;
              if (openAccordionValues.length > 0) {
                setOpenAccordionValues([]);
              } else {
                setOpenAccordionValues(abilities.map((ability, index) => `${ability.name}-${index}`));
              }
            }}
            disabled={!hasAbilities}
            className={`text-sm pr-3 py-2 focus:outline-none ${hasAbilities ? "cursor-pointer hover:underline focus:underline" : "cursor-not-allowed opacity-45"} ${accentColor}`}
            aria-label={openAccordionValues.length > 0 ? tMagic("collapseAll") : tMagic("expandAll")}
            aria-expanded={openAccordionValues.length > 0}>
            {openAccordionValues.length > 0 ? <ListChevronsDownUp /> : <ListChevronsUpDown />}
          </button>
        </div>
      </div>
      {showRestLegend && (
        <div
          className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground sm:text-xs"
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
      )}
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
          const isOpen = openAccordionValues.includes(`${ability.name}-${index}`);

          return (
            <AccordionItem
              key={`${ability.name}-${index}`}
              value={`${ability.name}-${index}`}
              className="border-b border-gray py-1.5">
              <AccordionTrigger
                className="min-w-0 w-full items-start py-1.5 text-left hover:no-underline gap-2 [&>svg]:mt-1 [&>svg]:self-start"
                aria-label={[
                  t("details"),
                  ability.name,
                  ability.counterResetsOnShortRest === true ? t("abilityCounterResetShortRest") : null,
                  ability.counterResetsOnLongRest === true ? t("abilityCounterResetLongRest") : null,
                ]
                  .filter(Boolean)
                  .join(" ")}>
                <span className="flex min-w-0 min-h-0 flex-1 flex-col gap-1.5 overflow-hidden">
                  <span className={`min-w-0 leading-tight text-sm font-semibold sm:text-lg ${isOpen ? "whitespace-normal break-words" : "truncate"}`}>
                    {ability.name}
                  </span>
                  {((ability.counterResetsOnShortRest === true ||
                    ability.counterResetsOnLongRest === true) ||
                    (hasCounter && typeof max === "number")) && (
                    <span
                      className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground sm:text-sm">
                      {(ability.counterResetsOnShortRest === true ||
                        ability.counterResetsOnLongRest === true) && (
                        <span
                          className="flex min-w-0 flex-wrap items-center gap-1"
                          role="group"
                          aria-label={t("abilityCounterResetLegend")}>
                          {ability.counterResetsOnShortRest === true && (
                            <span
                              className="inline-flex rounded-md p-0.5 text-muted-foreground"
                              aria-label={t("abilityCounterResetShortRest")}>
                              <Clock
                                className="size-3.5 shrink-0 text-white sm:size-4"
                                aria-hidden
                              />
                            </span>
                          )}
                          {ability.counterResetsOnLongRest === true && (
                            <span
                              className="inline-flex rounded-md p-0.5 text-muted-foreground"
                              aria-label={t("abilityCounterResetLongRest")}>
                              <Moon
                                className="size-3.5 shrink-0 text-white sm:size-4"
                                aria-hidden
                              />
                            </span>
                          )}
                        </span>
                      )}
                      {hasCounter && typeof max === "number" && (
                        <span
                          className="tabular-nums font-medium whitespace-nowrap"
                          aria-label={t("abilityCounterShort", { current: remaining, max })}>
                          {t("abilityCounterShort", { current: remaining, max })}
                        </span>
                      )}
                    </span>
                  )}
                </span>
              </AccordionTrigger>
              <AccordionContent
                className="text-sm sm:text-base pb-3 space-y-3"
                role="region"
                aria-label={`${t("descriptionPrefix")} ${ability.name}`}>
                <p className="whitespace-pre-wrap wrap-break-word">{ability.description}</p>
                {showUseControls && hasCounter && typeof max === "number" && (
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
                    {atLimit && !useBusy ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="inline-flex w-full sm:w-auto sm:justify-end">
                            <Button
                              type="button"
                              variant="outline"
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
                        variant="outline"
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
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </Card>
  );
};

export default AbilitiesSection;
