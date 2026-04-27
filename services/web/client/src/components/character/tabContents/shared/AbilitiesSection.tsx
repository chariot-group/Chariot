import { Card } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ListChevronsDownUp, ListChevronsUpDown, Loader2 } from "lucide-react";
import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import type { Ability, NPC, Player } from "@/types/character";
import CharacterService from "@/services/CharacterService";
import { useToast } from "@/hooks/useToast";
import { useAppSelector } from "@/store/hooks";
import { selectIsInSession } from "@/store/slices/sessionSlice";

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
  const [loadingIndex, setLoadingIndex] = useState<number | null>(null);

  const showUseControls = isInSession && Boolean(onAfterAbilityUse);

  const [openAccordionValues, setOpenAccordionValues] = useState<string[]>([]);
  const hasAbilities = abilities.length > 0;

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
        })) as Player | NPC;
        onAfterAbilityUse?.(updated);
      } catch (e) {
        console.error(e);
        toast.error(t("abilityUseError"));
      } finally {
        setLoadingIndex(null);
      }
    },
    [abilities, characterId, characterKind, onAfterAbilityUse, toast, t]
  );

  return (
    <Card
      className={`gap-0.5 p-4 md:px-6 h-fit ${className}`}
      role="region"
      aria-labelledby={headingId}>
      <div className="flex flex-row justify-between">
        <h2
          id={headingId}
          className={`text-xl sm:text-2xl font-semibold truncate ${accentColor}`}>
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
      <Accordion
        type="multiple"
        value={openAccordionValues}
        onValueChange={setOpenAccordionValues}
        className="w-full">
        {abilities.map((ability, index) => {
          const current = ability.counterCurrent ?? 0;
          const hasCounter = ability.hasCounter === true;
          const max = ability.counterMax;
          const atLimit = hasCounter && typeof max === "number" && current >= max;
          const canPressUse = hasCounter && typeof max === "number" && !atLimit;
          const useBusy = loadingIndex === index;

          return (
            <AccordionItem
              key={`${ability.name}-${index}`}
              value={`${ability.name}-${index}`}
              className="border-b border-gray py-1.5">
              <AccordionTrigger
                className="text-left py-1.5 hover:no-underline gap-2"
                aria-label={`${t("details")} ${ability.name}`}>
                <span className="text-sm sm:text-lg font-semibold text-clip min-w-0 flex-1">{ability.name}</span>
                {hasCounter && typeof max === "number" && (
                  <span
                    className="text-xs sm:text-sm font-medium text-muted-foreground tabular-nums shrink-0"
                    aria-label={t("abilityCounterShort", { current, max })}>
                    {t("abilityCounterShort", { current, max })}
                  </span>
                )}
              </AccordionTrigger>
              <AccordionContent
                className="text-sm sm:text-base pb-3 space-y-3"
                role="region"
                aria-label={`${t("descriptionPrefix")} ${ability.name}`}>
                <p className="whitespace-pre-wrap wrap-break-word">{ability.description}</p>
                {showUseControls && hasCounter && typeof max === "number" && (
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2"
                      disabled={!canPressUse || useBusy}
                      aria-busy={useBusy}
                      aria-label={t("abilityUseAria", { name: ability.name, current, max })}
                      onClick={() => handleUse(index)}>
                      {useBusy ? (
                        <Loader2
                          className="size-4 animate-spin shrink-0"
                          aria-hidden
                        />
                      ) : null}
                      {t("abilityUse")}
                    </Button>
                    {atLimit && !useBusy && (
                      <p
                        className="text-xs text-muted-foreground sm:text-right"
                        role="status">
                        {t("abilityUseLimitReached")}
                      </p>
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
