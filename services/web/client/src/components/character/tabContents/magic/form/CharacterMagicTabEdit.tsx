"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import {
  Controller,
  useFieldArray,
  useFormState,
  useWatch,
  type Path,
  type PathValue,
  type UseFormReturn,
} from "react-hook-form";
import { useTranslations } from "next-intl";
import { BookOpen, BookOpenCheck, BookPlus, Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { AbilityScores, Character, Spell, Spellcasting } from "@/types/character";
import { Accordion } from "@/components/ui/accordion";
import { Button, toggleButtonPressedClassName } from "@/components/ui/button";
import { calculateAbilityBonus, isPlayer } from "@/utils/global.utils";
import {
  calculateSpellAttackBonus,
  calculateSpellSaveDC,
  classWithSpellPrepared,
  countPreparedSpellsInList,
  getSpellLevelsFromSpells,
  hasLevel1OrHigherSpells,
  numberSpellsPrepare,
  pruneOrphanSpellSlotsByLevel,
  spellSlotLevelKeysEqual,
  toSpellcastingAbilityKey,
} from "@/utils/magic.utils";
import { ensureSpellDamageEditRows, hydrateSpellDamageDetails } from "@/utils/spell-damage.utils";
import { cn } from "@/lib/utils";
import { useCodexHealth } from "@/hooks/useCodexHealth";
import { useDistanceUnit } from "@/hooks/useDistanceUnit";
import { getSpellIndicesWithErrors } from "@/components/character/characterFormErrors";
import ListCard, { EDIT_LIST_MAX_HEIGHT_CLASS } from "@/components/character/tabContents/shared/listCard/ListCard";
import ListRow from "@/components/character/tabContents/shared/listCard/ListRow";
import ListSelectRow from "@/components/character/tabContents/shared/listCard/ListSelectRow";
import GeneralSectionCard from "@/components/character/tabContents/general/shared/GeneralSectionCard";
import { useIsXlUp } from "@/hooks/use-mobile";
import { LazyCodexSpellSearchDialog as CodexSpellSearchDialog } from "@/components/lazy/lazyCharacterEditForms";
import SpellPreparedPill from "@/components/character/tabContents/magic/SpellPreparedPill";
import SpellEditForm from "@/components/character/tabContents/magic/form/SpellEditForm";
import SpellcastingEditCard from "@/components/character/tabContents/magic/form/SpellcastingEditCard";
import {
  MagicErrorIndicator,
  SpellcastingSelector,
  SpellGroupHeader,
} from "@/components/character/tabContents/magic/shared/SpellcastingParts";
import {
  buildSpellGroups,
  magicBentoGridClass,
  MAGIC_SLOTS,
  magicWideSlots,
  resolveSelectedSpellIndex,
  spellRowValue,
  spellSummaryParts,
  type SpellGroup,
} from "@/components/character/tabContents/magic/shared/spellList";
import {
  useMagicSelection,
  type MagicSelectionState,
} from "@/components/character/tabContents/magic/shared/useMagicSelection";

interface CharacterMagicTabEditProps {
  character: Character;
  accentColor: string;
  form: UseFormReturn<Character>;
  /** Selected block / spell, shared with read mode by the tab container. */
  selectionState?: MagicSelectionState;
}

type CharacterClassInfo = { name?: string; level?: number };
type SpellSlotsByLevel = Spellcasting["spellSlotsByLevel"];

const EMPTY_SPELLS: Spell[] = [];
const EMPTY_ABILITY_SCORES = {} as AbilityScores;
/** Delay before scrolling / focusing a row the accordion just opened (open animation). */
const ROW_OPEN_DELAY_MS = 350;

/** Dynamic RHF paths (template strings) widen to `string`; cast back to Path without changing runtime. */
const charPath = (path: string) => path as Path<Character>;
const setCharValue = (
  form: UseFormReturn<Character>,
  path: string,
  value: unknown,
  options?: Parameters<UseFormReturn<Character>["setValue"]>[2],
) => form.setValue(charPath(path), value as PathValue<Character, Path<Character>>, options);

/** Row element of a spell: accordion item, or the selectable row in wide mode. */
const rowElement = (listId: string, index: number) =>
  document.getElementById(`${listId}-${spellRowValue(index)}`) ?? document.getElementById(`${listId}-trigger-${index}`);

type SpellSlotFieldValue = number | string | null | undefined;

/**
 * Slot total of one level, on its group header (`used` stays driven by casting and rests).
 * @see FR-character-magic-list-card
 */
function SpellSlotTotalInput({
  form,
  spellcastingIndex,
  level,
}: {
  form: UseFormReturn<Character>;
  spellcastingIndex: number;
  level: number;
}) {
  const tMagic = useTranslations("characterDetail.magic");
  const totalPath = charPath(`spellcasting.${spellcastingIndex}.spellSlotsByLevel.${level}.total`);

  return (
    <Controller
      name={totalPath}
      control={form.control}
      render={({ field, fieldState }) => {
        const value = field.value as SpellSlotFieldValue;
        return (
          <span className="flex shrink-0 items-center gap-1.5">
            <Input
              name={field.name}
              ref={field.ref}
              type="number"
              inputMode="numeric"
              min={0}
              className="h-8 w-14 text-center"
              value={value === undefined || value === null ? "" : String(value)}
              aria-invalid={fieldState.invalid}
              aria-label={tMagic("spellSlotsTotalForLevel", { level })}
              onChange={(event) => {
                const raw = event.target.value;
                form.clearErrors(totalPath);
                if (raw === "") return field.onChange("");
                const next = Number(raw);
                if (Number.isFinite(next)) field.onChange(next);
              }}
              onBlur={() => {
                field.onBlur();
                const raw = form.getValues(totalPath) as SpellSlotFieldValue;
                if (raw === "" || raw === undefined || raw === null) form.clearErrors(totalPath);
                else void form.trigger(totalPath);
              }}
            />
            <span
              className="text-xs text-muted-foreground"
              aria-hidden="true">
              {tMagic("slotsLabel")}
            </span>
          </span>
        );
      }}
    />
  );
}

/**
 * Magic tab, edit mode: Spellcasting card + Spells list card; a spell's form opens in its row, or
 * from `xl` in a panel next to the list (wide mode). Focus only moves on Add, Codex import and Delete (FR-character-magic-list-card).
 * @see FR-character-magic-list-card, FR-magic-spell-level-categories
 */
export default function CharacterMagicTabEdit({
  character,
  accentColor,
  form,
  selectionState,
}: CharacterMagicTabEditProps) {
  const tMagic = useTranslations("characterDetail.magic");
  const tClass = useTranslations("classes");
  const tEdit = useTranslations("characterDetail.edit");
  const { convertRange } = useDistanceUnit();
  const { isAvailable: isCodexAvailable } = useCodexHealth();
  const listHeadingId = useId();
  const panelHeadingId = useId();
  const panelId = useId();
  const isWide = useIsXlUp();
  const addButtonRef = useRef<HTMLButtonElement>(null);
  /** Last spell index added from the Codex, focused when the dialog closes. */
  const codexImportedIndex = useRef<number | null>(null);

  /** Block and spell shown (wide panel: null spell = first in display order), shared with read mode. */
  const { selection, setBlock, setSpell: setSelectedSpell } = useMagicSelection(selectionState);
  const selectedSpell = selection.spell;
  // Below `xl`, the spell selected in read mode starts expanded.
  const [openRows, setOpenRows] = useState<string[]>(() =>
    selection.spell === null ? [] : [spellRowValue(selection.spell)],
  );
  const [preparationEditMode, setPreparationEditMode] = useState(false);
  const [isCodexDialogOpen, setIsCodexDialogOpen] = useState(false);
  const { errors, submitCount } = useFormState({ control: form.control });

  const {
    fields: spellcastingFields,
    append: appendSpellcasting,
    remove: removeSpellcasting,
  } = useFieldArray({ control: form.control, name: "spellcasting" });
  const sc = Math.min(selection.block, Math.max(0, spellcastingFields.length - 1));

  const spells: Spell[] =
    (useWatch({ control: form.control, name: charPath(`spellcasting.${sc}.spells`) }) as Spell[] | undefined) ??
    EMPTY_SPELLS;
  const isInnate = Boolean(useWatch({ control: form.control, name: charPath(`spellcasting.${sc}.isInnate`) }));
  const watchedBlocks =
    (useWatch({ control: form.control, name: "spellcasting" }) as Array<Partial<Spellcasting>> | undefined) ?? [];
  const abilityKey =
    toSpellcastingAbilityKey(useWatch({ control: form.control, name: charPath(`spellcasting.${sc}.ability`) })) ?? "";
  const saveDC = useWatch({ control: form.control, name: charPath(`spellcasting.${sc}.saveDC`) }) as number | null;
  const attackBonus = useWatch({ control: form.control, name: charPath(`spellcasting.${sc}.attackBonus`) }) as
    number | null;
  const proficiencyBonus =
    (useWatch({ control: form.control, name: charPath("stats.proficiencyBonus") }) as number | undefined) ?? 2;
  const abilityScores =
    (useWatch({ control: form.control, name: "stats.abilityScores" }) as AbilityScores | undefined) ??
    EMPTY_ABILITY_SCORES;
  const classesList =
    (useWatch({ control: form.control, name: charPath("class") }) as CharacterClassInfo[] | undefined) ?? [];
  const availableClasses = classesList.flatMap((cls) => ((cls?.name?.length ?? 0) > 1 ? [cls.name as string] : []));
  const classNames = watchedBlocks.map((block) => block?.className ?? "");
  const currentClassName = classNames[sc] ?? "";

  // ── Slots: every level ≥ 1 with spells has a slot row; orphans are pruned (FR-magic-spell-level-categories).
  // Innate blocks: every uses-per-day value has its tracker entry.
  useLayoutEffect(() => {
    if (spellcastingFields.length === 0) return;
    if (isInnate) {
      const byUsesPath = `spellcasting.${sc}.spellSlotsByUses`;
      const byUses = (form.getValues(charPath(byUsesPath)) as Record<string, unknown> | undefined) ?? {};
      for (const spell of spells) {
        const uses = spell.usesPerDay ?? null;
        if (uses !== null && !byUses[`k${uses}`]) {
          setCharValue(form, `${byUsesPath}.k${uses}`, { used: 0, total: uses }, { shouldDirty: true });
        }
      }
      return;
    }
    const basePath = `spellcasting.${sc}.spellSlotsByLevel`;
    const slotsNow = (form.getValues(charPath(basePath)) as SpellSlotsByLevel | undefined) ?? {};
    for (const spell of spells) {
      const level = Number(spell.level);
      if (Number.isNaN(level) || level <= 0) continue;
      const entry = slotsNow[String(level)] as { total?: unknown; used?: unknown } | undefined;
      const slotPath = `${basePath}.${level}`;
      if (entry == null || typeof entry !== "object") {
        setCharValue(form, slotPath, { total: 1, used: 0 }, { shouldDirty: true });
        continue;
      }
      const invalid = (value: unknown) =>
        value === undefined || value === null || (value !== "" && Number.isNaN(Number(value)));
      if (invalid(entry.total)) setCharValue(form, `${slotPath}.total`, 1, { shouldDirty: true });
      if (invalid(entry.used)) setCharValue(form, `${slotPath}.used`, 0, { shouldDirty: true });
    }
    const slotsAfter = (form.getValues(charPath(basePath)) as SpellSlotsByLevel | undefined) ?? {};
    const pruned = pruneOrphanSpellSlotsByLevel(slotsAfter, spells);
    if (!spellSlotLevelKeysEqual(slotsAfter, pruned)) {
      setCharValue(form, basePath, pruned, { shouldDirty: true, shouldValidate: false });
    }
  }, [isInnate, sc, spells, form, spellcastingFields.length]);

  // ── PC with a single class: blocks follow that class name (default and rename).
  const singleClassName = isPlayer(character) && availableClasses.length === 1 ? availableClasses[0] : null;
  useEffect(() => {
    if (!singleClassName) return;
    (form.getValues("spellcasting") ?? []).forEach((block, index) => {
      if ((block.className ?? "") !== singleClassName) {
        form.setValue(`spellcasting.${index}.className`, singleClassName, { shouldDirty: true });
      }
    });
  }, [singleClassName, form]);

  // ── Submitting with errors opens the invalid rows and scrolls to the first one (FR-character-list-card).
  useEffect(() => {
    if (submitCount === 0) return;
    const invalid = getSpellIndicesWithErrors(errors, sc).map(spellRowValue);
    if (invalid.length === 0) return;
    if (isWide) {
      const first = getSpellIndicesWithErrors(errors, sc)[0];
      setSelectedSpell(first);
      setTimeout(() => rowElement(listHeadingId, first)?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 0);
      return;
    }
    setOpenRows((prev) => Array.from(new Set([...prev, ...invalid])));
    setTimeout(() => {
      rowElement(listHeadingId, Number(invalid[0].replace("spell-", "")))?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }, ROW_OPEN_DELAY_MS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitCount]);

  const usesPreparedMechanic =
    isPlayer(character) &&
    !isInnate &&
    spellcastingFields.length > 0 &&
    classWithSpellPrepared({ ...(watchedBlocks[sc] as Spellcasting), className: currentClassName });
  const showPreparedToggle =
    usesPreparedMechanic && hasLevel1OrHigherSpells({ ...(watchedBlocks[sc] as Spellcasting), spells });
  useEffect(() => {
    if (!showPreparedToggle && preparationEditMode) setPreparationEditMode(false);
  }, [showPreparedToggle, preparationEditMode]);

  const selectBlock = useCallback(
    (index: number) => {
      setBlock(index);
      setOpenRows([]);
      setPreparationEditMode(false);
    },
    [setBlock],
  );

  /**
   * Opens a row (wide mode: selects it in the panel), scrolls it into view in the bounded list and
   * focuses `focusId`.
   */
  const revealRow = (index: number, focusId: string) => {
    if (isWide) setSelectedSpell(index);
    else {
      const value = spellRowValue(index);
      setOpenRows((prev) => (prev.includes(value) ? prev : [...prev, value]));
    }
    setTimeout(
      () => {
        rowElement(listHeadingId, index)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
        document.getElementById(focusId)?.focus({ preventScroll: true });
      },
      isWide ? 0 : ROW_OPEN_DELAY_MS,
    );
  };

  /** Appends a spell (defaults, prepared flag, slot entries) and returns its index. */
  const appendSpell = (spell: Partial<Spell>): number => {
    const list = (form.getValues(charPath(`spellcasting.${sc}.spells`)) as Spell[] | undefined) ?? [];
    const next: Spell = {
      name: "",
      level: 0,
      school: "",
      description: "",
      components: [],
      castingTime: "",
      duration: "",
      range: "",
      ...spell,
      effectType: spell.effectType || "utility",
      damageDetails: ensureSpellDamageEditRows(hydrateSpellDamageDetails(spell.damageDetails, spell.damage)),
    };
    const block = form.getValues(charPath(`spellcasting.${sc}`)) as Spellcasting | undefined;
    if (
      isPlayer(character) &&
      !block?.isInnate &&
      block &&
      classWithSpellPrepared(block) &&
      Number(next.level) > 0 &&
      next.prepared === undefined
    ) {
      next.prepared = false;
    }
    setCharValue(form, `spellcasting.${sc}.spells`, [...list, next], { shouldDirty: true });
    return list.length;
  };

  const addSpell = () => {
    const levels = getSpellLevelsFromSpells(spells);
    const index = appendSpell({ level: levels[0] ?? 1, usesPerDay: null });
    revealRow(index, `${listHeadingId}-spell-${index}-name`);
  };

  const addSpellFromCodex = (spell: Partial<Spell>) => {
    codexImportedIndex.current = appendSpell(spell);
  };

  const onCodexOpenChange = (open: boolean) => {
    setIsCodexDialogOpen(open);
    if (open || codexImportedIndex.current === null) return;
    const index = codexImportedIndex.current;
    codexImportedIndex.current = null;
    revealRow(index, `${listHeadingId}-trigger-${index}`);
  };

  const removeSpell = (index: number) => {
    const list = (form.getValues(charPath(`spellcasting.${sc}.spells`)) as Spell[] | undefined) ?? [];
    const nextSpells = list.filter((_, i) => i !== index);
    setCharValue(form, `spellcasting.${sc}.spells`, nextSpells, { shouldDirty: true });
    if (!isInnate) {
      const slotsPath = `spellcasting.${sc}.spellSlotsByLevel`;
      const slotsNow = (form.getValues(charPath(slotsPath)) as SpellSlotsByLevel | undefined) ?? {};
      const pruned = pruneOrphanSpellSlotsByLevel(slotsNow, nextSpells);
      if (!spellSlotLevelKeysEqual(slotsNow, pruned)) {
        setCharValue(form, slotsPath, pruned, { shouldDirty: true, shouldValidate: false });
      }
    }
    setOpenRows((prev) =>
      prev
        .filter((value) => value !== spellRowValue(index))
        .map((value) => {
          const i = Number(value.replace("spell-", ""));
          return i > index ? spellRowValue(i - 1) : value;
        }),
    );
    // Next row in display order, else previous, else « Add a spell » (FR-character-list-card).
    const order = buildSpellGroups(list, { isInnate, sort: false }).flatMap((group) => group.indices);
    const position = order.indexOf(index);
    const target = order[position + 1] ?? order[position - 1];
    const shifted = target === undefined ? null : target > index ? target - 1 : target;
    // Wide mode: the deleted spell's panel moves to the spell receiving focus; others keep theirs.
    setSelectedSpell((prev) => {
      const current = resolveSelectedSpellIndex(buildSpellGroups(list, { isInnate, sort: false }), prev);
      if (current === null || current === index) return shifted;
      return current > index ? current - 1 : current;
    });
    setTimeout(() => {
      const next = shifted === null ? null : document.getElementById(`${listHeadingId}-trigger-${shifted}`);
      (next ?? addButtonRef.current)?.focus();
    }, 0);
  };

  const addBlock = () => {
    const taken = new Set(classNames.map((name) => name.toLowerCase()));
    const candidates = isPlayer(character) ? availableClasses : classesList.map((cls) => cls?.name ?? "");
    appendSpellcasting({
      className: candidates.find((name) => name && !taken.has(name.toLowerCase())) ?? "",
      ability: "intelligence",
      saveDC: 10,
      attackBonus: 2,
      isInnate: false,
      spellSlotsByLevel: {},
      totalSlots: 0,
      spells: [],
    });
    selectBlock(spellcastingFields.length);
  };

  const removeBlock = () => {
    removeSpellcasting(sc);
    selectBlock(Math.max(0, Math.min(sc, spellcastingFields.length - 2)));
  };

  if (spellcastingFields.length === 0) {
    const blocked = isPlayer(character) && availableClasses.length === 0;
    return (
      <div
        className="flex w-full flex-col items-center justify-center gap-4 py-12"
        role="region"
        aria-label={tMagic("mainRegion")}>
        <p className="text-center text-base text-muted-foreground">{tMagic("noMagicAbilities")}</p>
        <Button
          type="button"
          variant="primary"
          onClick={addBlock}
          disabled={blocked}>
          <Plus aria-hidden="true" />
          {tMagic("addSpellcasting")}
        </Button>
        {blocked && <p className="text-sm text-muted-foreground">{tMagic("spellcastingClassRequiresClass")}</p>}
      </div>
    );
  }

  const abilityScore = abilityKey ? (abilityScores[abilityKey] ?? 10) : 10;
  const modifier = calculateAbilityBonus(abilityScore);
  const calculatedAttackBonus = calculateSpellAttackBonus(proficiencyBonus, abilityScore);
  const maxPrepared =
    usesPreparedMechanic && isPlayer(character)
      ? numberSpellsPrepare({ ...(watchedBlocks[sc] as Spellcasting), className: currentClassName }, character)
      : 0;
  const preparedCount = usesPreparedMechanic ? countPreparedSpellsInList(spells) : 0;

  const blockLabels = classNames.map((name) => {
    if (!name) return tMagic("newSpellcasting");
    const cls = classesList.find((c) => c?.name?.toLowerCase() === name.toLowerCase());
    return isPlayer(character) && cls?.name ? `${tClass(cls.name)} ${tMagic("level")} ${cls.level}` : name;
  });
  const canAddBlock = isPlayer(character) && availableClasses.length > spellcastingFields.length;
  const invalidBlocks = new Set(
    watchedBlocks.flatMap((_, index) => (form.getFieldState(charPath(`spellcasting.${index}`)).invalid ? [index] : [])),
  );
  const invalidSpells = new Set(getSpellIndicesWithErrors(errors, sc));

  const groups = buildSpellGroups(spells, { isInnate, sort: false });
  const shownSpell = isWide ? resolveSelectedSpellIndex(groups, selectedSpell) : null;
  const showSelectorEarly = blockLabels.length > 1 || canAddBlock;
  const wideSlots = magicWideSlots(showSelectorEarly);
  const groupLabel = (group: SpellGroup) =>
    group.kind === "uses"
      ? group.value === null
        ? tMagic("npc.atWill")
        : tMagic("npc.usesPerDay", { count: group.value })
      : group.value === 0
        ? tMagic("cantrips")
        : tMagic("spellLevelShort", { level: group.value ?? 0 });

  const togglePrepared = (index: number) => {
    const spell = spells[index];
    if (!spell) return;
    const nextPrepared = spell.prepared !== true;
    const others = spells.filter((s, i) => i !== index && Number(s.level) > 0 && s.prepared === true).length;
    if (nextPrepared && maxPrepared > 0 && others >= maxPrepared) return;
    setCharValue(form, `spellcasting.${sc}.spells.${index}.prepared`, nextPrepared, { shouldDirty: true });
  };

  // Group sub-headings and rows are siblings of one list, so a row changing level is moved,
  // not remounted: it stays open and keeps the focus.
  const listItems: ReactNode[] = groups.flatMap((group) => {
    const hasGroupError = group.indices.some((index) => invalidSpells.has(index));
    return [
      <SpellGroupHeader
        key={`group-${group.key}`}
        label={groupLabel(group)}
        accentColor={accentColor}
        error={hasGroupError ? <MagicErrorIndicator label={tMagic("spellCategoryContainsErrors")} /> : undefined}
        trailing={
          group.kind === "level" && (group.value ?? 0) > 0 ? (
            <SpellSlotTotalInput
              form={form}
              spellcastingIndex={sc}
              level={group.value ?? 0}
            />
          ) : undefined
        }
      />,
      ...group.indices.map((index) => {
        const spell = spells[index];
        const value = spellRowValue(index);
        const name = spell?.name || tMagic("newSpell");
        const hasError = invalidSpells.has(index);
        const showPill = usesPreparedMechanic && Number(spell?.level) > 0;
        const others = spells.filter((s, i) => i !== index && Number(s.level) > 0 && s.prepared === true).length;
        const label = hasError
          ? tMagic("spellContainsErrorsAria", { name })
          : tMagic("spellRowLabel", { name, group: groupLabel(group) });
        const trailing = (
          <span className="flex items-center gap-1">
            {showPill && (
              <SpellPreparedPill
                isPrepared={spell?.prepared === true}
                interactive={preparationEditMode}
                prepareBlocked={spell?.prepared !== true && maxPrepared > 0 && others >= maxPrepared}
                onToggle={() => togglePrepared(index)}
                preparedTooltip={tMagic("preparedBookmarkPreparedTooltip")}
                unpreparedTooltip={tMagic("preparedBookmarkUnpreparedTooltip")}
                prepareBlockedTooltip={tMagic("spellPrepareLimitTooltip")}
                ariaPrepared={`${tMagic("preparedPillAriaPrepared")} : ${name}`}
                ariaUnprepared={`${tMagic("preparedPillAriaUnprepared")} : ${name}`}
              />
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-red-500"
              onClick={() => removeSpell(index)}
              aria-label={tMagic("removeSpellWithName", { name })}>
              <Trash2
                className="size-4"
                aria-hidden="true"
              />
            </Button>
          </span>
        );
        if (isWide) {
          return (
            <ListSelectRow
              key={value}
              id={`${listHeadingId}-trigger-${index}`}
              name={name}
              meta={spell ? spellSummaryParts(spell, convertRange) : []}
              metaStyle="pills"
              label={label}
              isSelected={shownSpell === index}
              hasError={hasError}
              onSelect={() => setSelectedSpell(index)}
              controlsId={panelId}
              trailing={trailing}
            />
          );
        }
        return (
          <ListRow
            key={value}
            id={`${listHeadingId}-${value}`}
            value={value}
            triggerId={`${listHeadingId}-trigger-${index}`}
            name={name}
            meta={spell ? spellSummaryParts(spell, convertRange) : []}
            metaStyle="pills"
            triggerLabel={label}
            isOpen={openRows.includes(value)}
            hasError={hasError}
            contentLabel={name}
            trailing={trailing}>
            <SpellEditForm
              form={form}
              spellcastingIndex={sc}
              spellIndex={index}
              idPrefix={`${listHeadingId}-spell-${index}`}
              isInnate={isInnate}
              attackBonus={calculatedAttackBonus}
            />
          </ListRow>
        );
      }),
    ];
  });

  const showSelector = showSelectorEarly;

  return (
    <div className={magicBentoGridClass(showSelector)}>
      {showSelector && (
        <SpellcastingSelector
          className={MAGIC_SLOTS.selector}
          labels={blockLabels}
          selectedIndex={sc}
          onSelect={selectBlock}
          invalidIndices={invalidBlocks}
          errorLabel={tMagic("spellCategoryContainsErrors")}
          trailing={
            canAddBlock ? (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={addBlock}
                aria-label={tMagic("addSpellcasting")}>
                <Plus aria-hidden="true" />
                {tEdit("add")}
              </Button>
            ) : null
          }
        />
      )}

      <SpellcastingEditCard
        form={form}
        accentColor={accentColor}
        className={isWide ? wideSlots.spellcasting : MAGIC_SLOTS.spellcasting}
        isPlayerCharacter={isPlayer(character)}
        spellcastingIndex={sc}
        blockLabel={blockLabels[sc] ?? ""}
        onRemoveBlock={removeBlock}
        availableClasses={availableClasses}
        isInnate={isInnate}
        abilityKey={abilityKey}
        saveDC={saveDC}
        attackBonus={attackBonus}
        calculated={{
          saveDC: calculateSpellSaveDC(proficiencyBonus, abilityScore),
          attackBonus: calculatedAttackBonus,
          proficiency: proficiencyBonus,
          modifier: modifier >= 0 ? `+${modifier}` : `${modifier}`,
        }}
        prepared={usesPreparedMechanic ? { current: preparedCount, max: maxPrepared } : null}
      />

      <ListCard
        headingId={listHeadingId}
        title={tMagic("spells")}
        count={spells.length}
        accentColor={accentColor}
        className={isWide ? wideSlots.spells : MAGIC_SLOTS.spells}
        bounded
        fill
        boundedClassName={EDIT_LIST_MAX_HEIGHT_CLASS}
        actions={
          <>
            <Button
              ref={addButtonRef}
              type="button"
              variant="primary"
              size="sm"
              onClick={addSpell}
              aria-label={tMagic("addSpell")}>
              <Plus aria-hidden="true" />
              <span className="hidden @md:inline">{tMagic("addSpell")}</span>
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsCodexDialogOpen(true)}
              disabled={!isCodexAvailable}
              title={isCodexAvailable ? undefined : tMagic("codexUnavailable")}
              aria-label={isCodexAvailable ? tMagic("addCodexSpell") : tMagic("codexUnavailable")}>
              <BookPlus aria-hidden="true" />
              <span className="hidden @md:inline">{tMagic("addCodexSpellShort")}</span>
            </Button>
          </>
        }
        toolbar={
          showPreparedToggle ? (
            <div className="flex min-w-0 flex-col gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                aria-pressed={preparationEditMode}
                className={cn("self-start", preparationEditMode && toggleButtonPressedClassName)}
                onClick={() => setPreparationEditMode((v) => !v)}>
                {preparationEditMode ? <BookOpenCheck aria-hidden="true" /> : <BookOpen aria-hidden="true" />}
                {preparationEditMode ? tMagic("finishChangingPrepared") : tMagic("changePreparedSpells")}
              </Button>
              {preparationEditMode && (
                <p
                  className="text-sm text-muted-foreground"
                  role="status">
                  {tMagic("preparationModeBanner")}
                </p>
              )}
            </div>
          ) : undefined
        }
        expanded={openRows.length > 0}
        onToggleAll={
          isWide
            ? undefined
            : () => setOpenRows(openRows.length > 0 ? [] : spells.map((_, index) => spellRowValue(index)))
        }
        expandLabel={tMagic("expandAll")}
        collapseLabel={tMagic("collapseAll")}
        emptyLabel={tMagic("noSpells")}>
        {isWide ? (
          <div className="w-full">{listItems}</div>
        ) : (
          <Accordion
            type="multiple"
            value={openRows}
            onValueChange={(next) => {
              const opened = next.find((value) => !openRows.includes(value));
              if (opened) setSelectedSpell(Number(opened.replace("spell-", "")));
              setOpenRows(next);
            }}
            className="w-full">
            {listItems}
          </Accordion>
        )}
      </ListCard>

      {isWide && shownSpell !== null && (
        <GeneralSectionCard
          headingId={panelHeadingId}
          title={spells[shownSpell]?.name || tMagic("newSpell")}
          accentColor={accentColor}
          headingClassName="wrap-break-word"
          className={wideSlots.detail}>
          <div
            id={panelId}
            className="flex min-h-0 flex-1 flex-col overflow-y-auto rounded-[10px] pr-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-scrollbar-thumb [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-scrollbar-track"
            role="group"
            aria-labelledby={panelHeadingId}
            tabIndex={0}>
            <SpellEditForm
              key={`${sc}-${shownSpell}`}
              form={form}
              spellcastingIndex={sc}
              spellIndex={shownSpell}
              idPrefix={`${listHeadingId}-spell-${shownSpell}`}
              isInnate={isInnate}
              attackBonus={calculatedAttackBonus}
            />
          </div>
        </GeneralSectionCard>
      )}

      <CodexSpellSearchDialog
        open={isCodexDialogOpen}
        onOpenChange={onCodexOpenChange}
        onSpellSelected={addSpellFromCodex}
        accentColor={accentColor}
      />
    </div>
  );
}
