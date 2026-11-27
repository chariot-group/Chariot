"use client";

import { useId, useState } from "react";
import { BookOpen, PenLine, Pencil, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { TAB_COLORS } from "@/components/character/CharacterTabs";
import CodexSpellSearchDialog from "@/components/character/tabContents/magic/CodexSpellSearchDialog";
import { BuilderFieldFrame } from "@/components/characterBuilder/BuilderCard";
import { BuilderFieldMessages } from "@/components/characterBuilder/BuilderFieldMessages";
import { ManualSpellDialog } from "@/components/characterBuilder/fields/ManualSpellDialog";
import { fieldMessageIds, type BuilderFieldProps } from "@/components/characterBuilder/builderFieldTypes";
import { useCodexHealth } from "@/hooks/useCodexHealth";
import {
  addSpellChoices,
  codexClassFilter,
  codexLevelFilter,
  isOutsideLevelRange,
  readSpellChoices,
  removeSpellChoice,
  replaceSpellChoice,
  toSpellChoice,
} from "@/lib/characterBuilder/spellChoices";
import type { Spell } from "@/types/character";

const numberOr = (value: unknown, fallback: number) =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

/**
 * `spellSelect`: spells chosen from the Codex (Magic tab search, pre-filtered on the field) or entered manually
 * (Magic tab spell fields), with a counter and the level range of the field as a hint.
 * @see FR-ruleset-character-builder — Web builder UI (Spells, lot B)
 */
export function SpellSelectField({
  field,
  answer,
  issues,
  domId,
  onAnswer,
  evaluation,
  entryLabel,
  embedded,
}: BuilderFieldProps) {
  const t = useTranslations("characterBuilder.spells");
  const tBuilder = useTranslations("characterBuilder");
  const tMagic = useTranslations("characterDetail.magic");
  const { isAvailable: isCodexAvailable } = useCodexHealth();
  const [codexOpen, setCodexOpen] = useState(false);
  const [manual, setManual] = useState<{ open: boolean; index?: number }>({ open: false });
  const codexUnavailableId = `${useId()}-codex-unavailable`;

  const spells = readSpellChoices(answer);
  const filter = field.spellFilter;
  const minLevel = numberOr(filter?.minLevel, 0);
  const maxLevel = numberOr(filter?.maxLevel, minLevel);
  const className = typeof filter?.className === "string" ? entryLabel(filter.className) : null;
  const describedBy = fieldMessageIds(domId, issues, field.help);
  const blocks = Array.isArray(evaluation.sheet.spellcasting)
    ? (evaluation.sheet.spellcasting as { attackBonus?: number }[])
    : [];
  const attackBonus = numberOr(blocks[0]?.attackBonus, 0);

  const save = (next: typeof spells) => onAnswer(next.length ? next : undefined);
  const levelLabel = (level: number) => (level === 0 ? t("cantrip") : t("level", { level }));

  const hint = [
    className,
    minLevel === maxLevel ? levelLabel(minLevel) : t("levelRange", { min: minLevel, max: maxLevel }),
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <BuilderFieldFrame
      embedded={embedded}
      headingId={`${domId}-title`}
      describedBy={describedBy}
      title={field.label}
      subtitle={hint}
      aside={
        field.expectedCount !== undefined ? (
          <span aria-label={tBuilder("counterLabel", { count: spells.length, expected: field.expectedCount })}>
            {tBuilder("counter", { count: spells.length, expected: field.expectedCount })}
          </span>
        ) : undefined
      }>
      {/* Always the same order; without the Codex, manual entry is the main action and stays fully available. */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="secondary"
              aria-disabled={!isCodexAvailable || undefined}
              aria-describedby={!isCodexAvailable ? codexUnavailableId : undefined}
              className={cn(!isCodexAvailable && "cursor-not-allowed opacity-50 hover:bg-gray-middle-light")}
              onClick={() => isCodexAvailable && setCodexOpen(true)}>
              <BookOpen aria-hidden="true" />
              {t("searchCodex")}
            </Button>
          </TooltipTrigger>
          {!isCodexAvailable ? (
            <TooltipContent>
              {tMagic("codexUnavailable")}. {t("codexUnavailableManual")}
            </TooltipContent>
          ) : null}
        </Tooltip>
        <Button
          type="button"
          variant={isCodexAvailable ? "secondary" : "accent"}
          onClick={() => setManual({ open: true })}>
          <PenLine aria-hidden="true" />
          {t("addManually")}
        </Button>
      </div>
      {!isCodexAvailable ? (
        <span
          id={codexUnavailableId}
          className="sr-only">
          {tMagic("codexUnavailable")}. {t("codexUnavailableManual")}
        </span>
      ) : null}

      {spells.length ? (
        <ul className="flex flex-col gap-2">
          {spells.map((spell, index) => {
            const outside = isOutsideLevelRange(spell, filter);
            return (
              <li
                key={`${spell.name}-${spell.level}`}
                className="flex min-w-0 flex-wrap items-center gap-2 rounded-[13px] border border-input bg-gray-middle-light px-3 py-2">
                <span className="min-w-0 flex-1 break-words text-sm font-medium text-white">{spell.name}</span>
                <span className="text-xs text-muted-foreground">{levelLabel(spell.level)}</span>
                <Badge variant="secondary">{spell.source === "codex" ? t("sourceCodex") : t("sourceManual")}</Badge>
                {outside ? <span className="w-full text-xs text-yellow">{t("outOfRange")}</span> : null}
                <div className="flex gap-1">
                  {spell.source === "manual" ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={t("edit", { name: spell.name })}
                      onClick={() => setManual({ open: true, index })}>
                      <Pencil aria-hidden="true" />
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={t("remove", { name: spell.name })}
                    onClick={() => save(removeSpellChoice(spells, index))}>
                    <Trash2 aria-hidden="true" />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      )}

      <BuilderFieldMessages
        domId={domId}
        help={field.help}
        issues={issues}
        counts={field.expectedCount !== undefined ? { count: spells.length, expected: field.expectedCount } : undefined}
      />

      {/* Mounted only while open: a closed dialog must not query the Codex in the background. */}
      {codexOpen ? (
        <CodexSpellSearchDialog
          open={codexOpen}
          onOpenChange={setCodexOpen}
          accentColor={TAB_COLORS.magic}
          initialClasses={codexClassFilter(filter)}
          initialLevel={codexLevelFilter(filter)}
          onSpellSelected={(spell: Partial<Spell>) => {
            const choice = toSpellChoice(spell, "codex", minLevel);
            // Several spells can be confirmed at once (queue): read the latest answer each time.
            if (choice) onAnswer((current: unknown) => addSpellChoices(readSpellChoices(current), [choice]));
          }}
        />
      ) : null}
      <ManualSpellDialog
        open={manual.open}
        initialSpell={manual.index !== undefined ? spells[manual.index] : undefined}
        defaultLevel={minLevel}
        attackBonus={attackBonus}
        onOpenChange={(open) => setManual(open ? manual : { open: false })}
        onSave={(spell) => {
          const choice = toSpellChoice(spell, "manual", minLevel);
          if (choice) {
            save(
              manual.index !== undefined
                ? replaceSpellChoice(spells, manual.index, choice)
                : addSpellChoices(spells, [choice]),
            );
          }
          setManual({ open: false });
        }}
      />
    </BuilderFieldFrame>
  );
}
