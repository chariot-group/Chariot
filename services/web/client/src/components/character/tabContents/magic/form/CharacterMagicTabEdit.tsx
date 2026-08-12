"use client";

import { Character } from "@/types/character";
import { Controller, UseFormReturn, useWatch, useFieldArray, useFormState } from "react-hook-form";
import { Field, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useTranslations } from "next-intl";
import { useState, useEffect, useLayoutEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  CircleAlert,
  ArrowRightLeft,
  Plus,
  Trash2,
  ListChevronsDownUp,
  ListChevronsUpDown,
  ChevronDown,
  BookPlus,
  ArrowLeft,
  Book,
  BookOpen,
  BookOpenCheck,
} from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { calculateAbilityBonus, isPlayer } from "@/utils/global.utils";
import {
  calculateSpellAttackBonus,
  calculateSpellSaveDC,
  classWithSpellPrepared,
  countPreparedSpellsInList,
  DICE_TYPES,
  getSpellLevelsFromSpells,
  hasLevel1OrHigherSpells,
  numberSpellsPrepare,
  npcUsesKey,
  pruneOrphanSpellSlotsByLevel,
  spellSlotLevelKeysEqual,
  SPELL_SCHOOLS,
} from "@/utils/magic.utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ComboboxInput } from "@/components/ui/combobox-input";
import { Checkbox } from "@/components/ui/checkbox";
import { DamageTypeInput } from "@/components/ui/damage-type-input";
import { parseDamageFormula } from "@/utils/spell-damage.utils";
import { cn } from "@/lib/utils";
import { ButtonGroup, ButtonGroupSeparator } from "@/components/ui/button-group";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { formatSignedBonus } from "@/utils/attack.utils";
import type { Spell, Spellcasting } from "@/types/character";
import { useCodexHealth } from "@/hooks/useCodexHealth";
import CodexSpellSearchDialog from "@/components/character/tabContents/magic/CodexSpellSearchDialog";
import SpellPreparedPill from "@/components/character/tabContents/magic/SpellPreparedPill";
import React from "react";
import {
  getSpellIndicesWithErrors,
  getSpellLevelsWithErrors,
  getSpellUsesGroupsWithErrors,
} from "@/components/character/characterFormErrors";

const ABILITY_KEYS = ["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"] as const;
const EMPTY_SPELLS: Spell[] = [];

interface CharacterMagicTabEditProps {
  character: Character;
  accentColor: string;
  form: UseFormReturn<Character>;
}

type CharacterClassInfo = { name?: string; level?: number };
type SpellcastingFormEntry = Spellcasting & {
  spellSlotsByUses?: Record<string, { used: number; total: number }>;
};

function SyncRow({
  synced,
  syncedLabel,
  mismatchLabel,
  onSync,
  syncButtonLabel,
}: {
  synced: boolean;
  syncedLabel: string;
  mismatchLabel: string;
  onSync: () => void;
  syncButtonLabel: string;
}) {
  if (synced) {
    return (
      <div className="flex items-center gap-2 p-2 bg-green/20 rounded text-xs text-green-600 dark:text-green-400">
        <span>✓ {syncedLabel}</span>
      </div>
    );
  }
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onSync}
          className="text-xs self-start">
          <ArrowRightLeft className="size-3 mr-1" />
          {syncButtonLabel}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{mismatchLabel}</p>
      </TooltipContent>
    </Tooltip>
  );
}

export default function CharacterMagicTabEdit({ character, accentColor, form }: CharacterMagicTabEditProps) {
  const tMagic = useTranslations("characterDetail.magic");
  const tEdit = useTranslations("characterDetail.edit");
  const tCommon = useTranslations("characterDetail");
  const tClass = useTranslations("classes");
  const tAbilities = useTranslations("characterDetail.player.general.abilities");

  const [selectedSpellcastingIndex, setSelectedSpellcastingIndex] = useState(0);
  const [selectedSpellIndex, setSelectedSpellIndex] = useState<number | null>(null);
  const [openAccordionValues, setOpenAccordionValues] = useState<string[]>([]);
  const [openSpellDetailsAccordion, setOpenSpellDetailsAccordion] = useState<string[]>([]);
  const [isCodexDialogOpen, setIsCodexDialogOpen] = useState(false);
  const [showMobileDetails, setShowMobileDetails] = useState(false);
  const [preparationEditMode, setPreparationEditMode] = useState(false);
  const { errors } = useFormState({ control: form.control });

  const { isAvailable: isCodexAvailable } = useCodexHealth();

  const selectSpellcasting = useCallback((index: number) => {
    setSelectedSpellcastingIndex(index);
    setSelectedSpellIndex(null);
    setShowMobileDetails(false);
    setPreparationEditMode(false);
  }, []);

  // Manage focus when showing mobile details
  useEffect(() => {
    if (showMobileDetails && selectedSpellIndex !== null) {
      const spellNameInput = document.getElementById(`spell-name-${selectedSpellIndex}`);
      if (spellNameInput) {
        spellNameInput.focus();
      }
    }
  }, [showMobileDetails, selectedSpellIndex]);

  // ── Use useFieldArray for spellcasting array management ──
  const {
    fields: spellcastingFields,
    append: appendSpellcasting,
    remove: removeSpellcasting,
  } = useFieldArray({
    control: form.control,
    name: "spellcasting",
  });

  const spellcastingList = spellcastingFields as SpellcastingFormEntry[];

  // Observer les spells du spellcasting sélectionné avec useWatch
  const watchedSpells = useWatch({
    control: form.control,
    name: `spellcasting.${selectedSpellcastingIndex}.spells`,
  });
  const currentSpells: Spell[] = watchedSpells ?? EMPTY_SPELLS;
  const spellIndicesWithErrors = new Set(getSpellIndicesWithErrors(errors, selectedSpellcastingIndex));

  const isInnate: boolean =
    useWatch({
      control: form.control,
      name: `spellcasting.${selectedSpellcastingIndex}.isInnate`,
    }) ?? false;

  /**
   * Tout niveau > 0 représenté par un sort doit avoir une ligne d’emplacements.
   * Les clés orphelines (plus aucun sort à ce niveau) sont purgées — FR-magic-spell-level-categories.
   */
  useLayoutEffect(() => {
    if (isInnate || spellcastingList.length === 0) return;
    const basePath = `spellcasting.${selectedSpellcastingIndex}.spellSlotsByLevel`;
    const slotsNow = ((form.getValues(basePath) ?? {}) as Spellcasting["spellSlotsByLevel"]) ?? {};

    for (const s of currentSpells) {
      const L = Number(s.level);
      if (Number.isNaN(L) || L <= 0) continue;
      const key = String(L);
      const slotPath = `${basePath}.${key}`;
      const entry = slotsNow[key];

      if (entry == null || typeof entry !== "object") {
        form.setValue(slotPath, { total: 1, used: 0 }, { shouldDirty: true });
        continue;
      }
      const t = entry.total;
      const u = entry.used;
      if (t === undefined || t === null) {
        form.setValue(`${slotPath}.total`, 1, { shouldDirty: true });
      } else if (t !== "" && Number.isNaN(Number(t))) {
        form.setValue(`${slotPath}.total`, 1, { shouldDirty: true });
      }
      if (u === undefined || u === null) {
        form.setValue(`${slotPath}.used`, 0, { shouldDirty: true });
      } else if (u !== "" && Number.isNaN(Number(u))) {
        form.setValue(`${slotPath}.used`, 0, { shouldDirty: true });
      }
    }

    const slotsAfterEnsure =
      ((form.getValues(basePath) ?? {}) as Spellcasting["spellSlotsByLevel"]) ?? {};
    const pruned = pruneOrphanSpellSlotsByLevel(slotsAfterEnsure, currentSpells);
    if (!spellSlotLevelKeysEqual(slotsAfterEnsure, pruned)) {
      form.setValue(basePath, pruned, { shouldDirty: true, shouldValidate: false });
    }
  }, [isInnate, selectedSpellcastingIndex, currentSpells, form, spellcastingList.length]);

  // Fonctions pour manipuler les spells directement
  const addSpell = useCallback(
    (spell: Partial<Spell>) => {
      const spellWithDefaults: Partial<Spell> = {
        ...spell,
        effectType: spell.effectType || "utility",
      };

      const spellLevel = Number(spellWithDefaults.level ?? 0);
      const scRow = form.getValues(`spellcasting.${selectedSpellcastingIndex}`) as Spellcasting | undefined;
      const innateRow = form.getValues(`spellcasting.${selectedSpellcastingIndex}.isInnate`) ?? false;
      if (
        isPlayer(character) &&
        !innateRow &&
        scRow &&
        classWithSpellPrepared(scRow) &&
        spellLevel > 0 &&
        spellWithDefaults.prepared === undefined
      ) {
        spellWithDefaults.prepared = false;
      }

      const currentSpells = form.getValues(`spellcasting.${selectedSpellcastingIndex}.spells`) || [];
      form.setValue(`spellcasting.${selectedSpellcastingIndex}.spells`, [...currentSpells, spellWithDefaults], {
        shouldDirty: true,
      });

      const spellLevelAfter = Number(spellWithDefaults.level || 0);
      if (spellLevelAfter > 0) {
        const currentSlots = form.getValues(`spellcasting.${selectedSpellcastingIndex}.spellSlotsByLevel`) || {};
        if (!currentSlots[spellLevelAfter]) {
          form.setValue(
            `spellcasting.${selectedSpellcastingIndex}.spellSlotsByLevel.${spellLevelAfter}`,
            { total: 1, used: 0 },
            { shouldDirty: true },
          );
        }
      }

      const uses = spellWithDefaults.usesPerDay ?? null;
      if (uses !== null) {
        const currentByUses = form.getValues(`spellcasting.${selectedSpellcastingIndex}.spellSlotsByUses`) || {};
        if (!currentByUses[`k${uses}`]) {
          form.setValue(
            `spellcasting.${selectedSpellcastingIndex}.spellSlotsByUses.k${uses}`,
            { used: 0, total: uses },
            { shouldDirty: true },
          );
        }
      }

      // Open the accordion for the new spell based on display mode
      const accordionKey = !isInnate
        ? `level-${spellWithDefaults.level || 0}`
        : npcUsesKey(spellWithDefaults.usesPerDay ?? null);
      if (!openAccordionValues.includes(accordionKey)) {
        setOpenAccordionValues([...openAccordionValues, accordionKey]);
      }

      setSelectedSpellIndex(currentSpells.length);
    },
    [form, selectedSpellcastingIndex, openAccordionValues, isInnate, character],
  );

  const removeSpell = useCallback(
    (index: number) => {
      const currentSpells = form.getValues(`spellcasting.${selectedSpellcastingIndex}.spells`) || [];
      const newSpells = currentSpells.filter((_, i: number) => i !== index);
      form.setValue(`spellcasting.${selectedSpellcastingIndex}.spells`, newSpells, { shouldDirty: true });

      const slotsPath = `spellcasting.${selectedSpellcastingIndex}.spellSlotsByLevel`;
      const slotsNow =
        (form.getValues(slotsPath) as Spellcasting["spellSlotsByLevel"] | undefined) ?? {};
      const pruned = pruneOrphanSpellSlotsByLevel(slotsNow, newSpells);
      if (!spellSlotLevelKeysEqual(slotsNow, pruned)) {
        form.setValue(slotsPath, pruned, { shouldDirty: true, shouldValidate: false });
      }

      if (selectedSpellIndex === index) {
        setSelectedSpellIndex(null);
        setShowMobileDetails(false);
      } else if (selectedSpellIndex !== null && selectedSpellIndex > index) {
        setSelectedSpellIndex(selectedSpellIndex - 1);
      }
    },
    [form, selectedSpellcastingIndex, selectedSpellIndex],
  );

  const appendSpellHelper = useCallback(() => {
    const levels = getSpellLevelsFromSpells(currentSpells);
    const defaultLevel = levels.length > 0 ? levels[0] : 1;
    addSpell({
      name: "",
      level: defaultLevel,
      school: "",
      description: "",
      components: [],
      castingTime: "",
      duration: "",
      range: "",
      effectType: "utility",
      usesPerDay: null,
    });
  }, [currentSpells, addSpell]);

  const addSpellFromCodex = useCallback(
    (spell: Partial<Spell>) => {
      addSpell(spell);
    },
    [addSpell],
  );

  // ── Reactive watches (must be at top level) ──
  const proficiencyBonus: number = useWatch({ control: form.control, name: "stats.proficiencyBonus" }) ?? 2;
  const abilityScores: Record<string, number> = useWatch({ control: form.control, name: "stats.abilityScores" }) ?? {};
  const classesList: CharacterClassInfo[] = useWatch({ control: form.control, name: "class" }) ?? [];
  const availableSpellcastingClasses = classesList.filter(
    (cls): cls is CharacterClassInfo & { name: string } => (cls?.name?.length ?? 0) > 1,
  );
  const hasAvailableSpellcastingClasses = availableSpellcastingClasses.length > 0;

  const watchedSpellcastingClassNames =
    (
      useWatch({
        control: form.control,
        name: "spellcasting",
      }) as Array<{ className?: string }> | undefined
    )?.map((sc) => sc?.className ?? "") ?? [];

  const currentClassName: string = watchedSpellcastingClassNames[selectedSpellcastingIndex] ?? "";
  const currentAbilityKey: string =
    useWatch({ control: form.control, name: `spellcasting.${selectedSpellcastingIndex}.ability` }) ?? "";
  const currentSaveDC: number | null = useWatch({
    control: form.control,
    name: `spellcasting.${selectedSpellcastingIndex}.saveDC`,
  });
  const currentAttackBonus: number | null = useWatch({
    control: form.control,
    name: `spellcasting.${selectedSpellcastingIndex}.attackBonus`,
  });

  // Watch current spell damage and healing details
  const watchPath =
    selectedSpellIndex !== null
      ? `spellcasting.${selectedSpellcastingIndex}.spells.${selectedSpellIndex}`
      : `spellcasting.${selectedSpellcastingIndex}.spells.0`;

  const currentDamageDetails = useWatch({
    control: form.control,
    name: `${watchPath}.damageDetails`,
  });
  const currentHealingDetails = useWatch({
    control: form.control,
    name: `${watchPath}.healingDetails`,
  });
  const currentDamage = useWatch({
    control: form.control,
    name: `${watchPath}.damage`,
  });
  const currentHealing = useWatch({
    control: form.control,
    name: `${watchPath}.healing`,
  });
  const currentEffectType = useWatch({
    control: form.control,
    name: `${watchPath}.effectType`,
  });
  const currentUsesPerDay = useWatch({
    control: form.control,
    name: `${watchPath}.usesPerDay`,
  });

  // Sync spellcasting className when the player has a single class
  // – covers: setting the default when className is blank, and propagating a class rename.
  useEffect(() => {
    if (!isPlayer(character)) return;
    if (availableSpellcastingClasses.length !== 1) return;
    const singleClassName = availableSpellcastingClasses[0].name;
    const currentList = form.getValues("spellcasting") ?? [];
    currentList.forEach((sc, i) => {
      if ((sc.className ?? "") !== singleClassName) {
        form.setValue(`spellcasting.${i}.className`, singleClassName, { shouldDirty: true });
      }
    });
  }, [availableSpellcastingClasses, character, form]);

  // NPC: sync spellSlotsByUses when usesPerDay changes on the selected spell
  useEffect(() => {
    if (!isInnate || selectedSpellIndex === null) return;
    const uses: number | null = currentUsesPerDay ?? null;
    if (uses === null) return;
    const currentByUses = form.getValues(`spellcasting.${selectedSpellcastingIndex}.spellSlotsByUses`) || {};
    if (!currentByUses[`k${uses}`]) {
      form.setValue(
        `spellcasting.${selectedSpellcastingIndex}.spellSlotsByUses.k${uses}`,
        { used: 0, total: uses },
        { shouldDirty: true },
      );
    }
  }, [currentUsesPerDay, selectedSpellIndex, selectedSpellcastingIndex, form, isInnate]);

  // Auto-parse old damage/healing formulas when spell is selected
  useEffect(() => {
    if (selectedSpellIndex === null) {
      return;
    }

    // Parse and fill damage fields if old damage exists but damageDetails is empty
    if (currentDamage && currentDamage.trim() !== "") {
      const hasDamageDetails =
        currentDamageDetails &&
        (currentDamageDetails.diceCount ||
          currentDamageDetails.diceType ||
          (currentDamageDetails.bonus !== null && currentDamageDetails.bonus !== undefined) ||
          currentDamageDetails.damageType);

      if (!hasDamageDetails) {
        const parsed = parseDamageFormula(currentDamage);
        if (parsed.diceCount || parsed.diceType) {
          form.setValue(
            `spellcasting.${selectedSpellcastingIndex}.spells.${selectedSpellIndex}.damageDetails`,
            {
              diceCount: parsed.diceCount,
              diceType: parsed.diceType,
              bonus: parsed.bonus,
              damageType: parsed.damageType,
            },
            { shouldDirty: true },
          );
        }
      }
    }

    // Parse and fill healing fields if old healing exists but healingDetails is empty
    if (currentHealing && currentHealing.trim() !== "") {
      const hasHealingDetails =
        currentHealingDetails &&
        (currentHealingDetails.diceCount ||
          currentHealingDetails.diceType ||
          (currentHealingDetails.bonus !== null && currentHealingDetails.bonus !== undefined));

      if (!hasHealingDetails) {
        const parsed = parseDamageFormula(currentHealing);
        if (parsed.diceCount || parsed.diceType) {
          form.setValue(
            `spellcasting.${selectedSpellcastingIndex}.spells.${selectedSpellIndex}.healingDetails`,
            {
              diceCount: parsed.diceCount,
              diceType: parsed.diceType,
              bonus: parsed.bonus,
            },
            { shouldDirty: true },
          );
        }
      }
    }
  }, [
    selectedSpellIndex,
    currentDamage,
    currentHealing,
    currentDamageDetails,
    currentHealingDetails,
    form,
    selectedSpellcastingIndex,
  ]);

  const abilityScore: number = currentAbilityKey ? (abilityScores[currentAbilityKey] ?? 10) : 10;
  const abilityMod: number = calculateAbilityBonus(abilityScore);
  const calculatedSaveDC: number = calculateSpellSaveDC(proficiencyBonus, abilityScore);
  const calculatedAttackBonus: number = calculateSpellAttackBonus(proficiencyBonus, abilityScore);

  // ── Functions to manage spellcasting ──
  const addSpellcasting = () => {
    if (isPlayer(character) && !hasAvailableSpellcastingClasses) {
      return;
    }

    const candidateClasses = isPlayer(character) ? availableSpellcastingClasses : classesList;

    // Find a class that doesn't have spellcasting yet
    const classWithoutSpellcasting = candidateClasses.find((cls) => {
      const className = cls?.name?.toLowerCase();
      if (!className) return false;
      return !spellcastingList.some((sc) => {
        const scClassName = sc?.className?.toLowerCase();
        return scClassName === className;
      });
    });

    const newSpellcasting = {
      className: classWithoutSpellcasting?.name || "",
      ability: "intelligence",
      saveDC: 10,
      attackBonus: 2,
      isInnate: false,
      spellSlotsByLevel: {},
      totalSlots: 0,
      spells: [],
    };

    appendSpellcasting(newSpellcasting);
    selectSpellcasting(spellcastingList.length);
  };

  const removeCurrentSpellcasting = () => {
    if (spellcastingList.length > 0) {
      removeSpellcasting(selectedSpellcastingIndex);
      if (selectedSpellcastingIndex >= spellcastingList.length - 1) {
        setSelectedSpellcastingIndex(Math.max(0, spellcastingList.length - 2));
        setSelectedSpellIndex(null);
        setShowMobileDetails(false);
      }
    }
  };

  const selectedSpellcastingEarly = spellcastingList[selectedSpellcastingIndex];
  const usesPreparedMechanicEarly =
    isPlayer(character) &&
    !isInnate &&
    !!selectedSpellcastingEarly &&
    classWithSpellPrepared({ ...(selectedSpellcastingEarly as Spellcasting), className: currentClassName });
  const hasPrepEligibleSpellsEarly = hasLevel1OrHigherSpells({
    ...(selectedSpellcastingEarly as Spellcasting),
    spells: currentSpells,
  });
  const showPreparedSpellsButtonEarly = usesPreparedMechanicEarly && hasPrepEligibleSpellsEarly;

  useEffect(() => {
    if (!showPreparedSpellsButtonEarly && preparationEditMode) {
      setPreparationEditMode(false);
    }
  }, [showPreparedSpellsButtonEarly, preparationEditMode]);

  // If no spellcasting, show interface to create first one
  if (spellcastingList.length === 0) {
    return (
      <div
        className="w-full flex flex-col gap-4 md:gap-6 px-2 sm:px-0 items-center justify-center py-12"
        role="region"
        aria-labelledby="magic-tab-edit">
        <h2
          id="magic-tab-edit"
          className="sr-only">
          {tMagic("spells")}
        </h2>
        <p className="text-center text-muted-foreground text-base">{tMagic("noMagicAbilities")}</p>
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <Button
                type="button"
                onClick={addSpellcasting}
                variant="outline"
                size="lg"
                disabled={isPlayer(character) && !hasAvailableSpellcastingClasses}
                className="flex items-center gap-2">
                <Plus className="size-4" />
                {tMagic("addSpellcasting")}
              </Button>
            </span>
          </TooltipTrigger>
          {isPlayer(character) && !hasAvailableSpellcastingClasses && (
            <TooltipContent>
              <p>{tMagic("spellcastingClassRequiresClass")}</p>
            </TooltipContent>
          )}
        </Tooltip>
      </div>
    );
  }

  const selectedSpellcasting = spellcastingList[selectedSpellcastingIndex];

  const usesPreparedMechanic =
    isPlayer(character) &&
    !isInnate &&
    !!selectedSpellcasting &&
    classWithSpellPrepared({ ...(selectedSpellcasting as Spellcasting), className: currentClassName });

  const maxPreparedSlots =
    usesPreparedMechanic && isPlayer(character)
      ? numberSpellsPrepare(selectedSpellcasting as Spellcasting, character)
      : 0;

  const preparedSpellsCounted = usesPreparedMechanic ? countPreparedSpellsInList(currentSpells) : 0;

  const atPreparedLimit = usesPreparedMechanic && maxPreparedSlots > 0 && preparedSpellsCounted >= maxPreparedSlots;

  const hasPrepEligibleSpells = hasLevel1OrHigherSpells({
    ...(selectedSpellcasting as Spellcasting),
    spells: currentSpells,
  });
  const showPreparedSpellsButton = usesPreparedMechanic && hasPrepEligibleSpells;

  // ── Prepared spells (calculated) ──
  const modSign = abilityMod >= 0 ? `+${abilityMod}` : `${abilityMod}`;

  const saveDCSynced = isPlayer(character) && currentSaveDC === calculatedSaveDC;
  const attackBonusSynced = isPlayer(character) && currentAttackBonus === calculatedAttackBonus;

  // Build sorted level list from spells only (byLevel) or uses-per-day groups (byUses).
  // @see FR-magic-spell-level-categories
  const levels: number[] = !isInnate ? getSpellLevelsFromSpells(currentSpells) : [];
  const npcUsesGroups: Array<number | null> = [];

  if (isInnate) {
    const seen = new Set<number | null>();
    currentSpells.forEach((spell) => {
      seen.add(spell.usesPerDay ?? null);
    });
    const groups = Array.from(seen);
    groups.sort((a, b) => {
      if (a === null) return -1;
      if (b === null) return 1;
      return a - b;
    });
    npcUsesGroups.push(...groups);
  }

  const spellIndicesByLevel = levels.reduce<Record<number, number[]>>((acc, level) => {
    acc[level] = currentSpells.reduce<number[]>((indices, spell, index) => {
      if (Number(spell.level) === level) indices.push(index);
      return indices;
    }, []);
    return acc;
  }, {});
  const spellLevelsWithErrors = getSpellLevelsWithErrors(errors, selectedSpellcastingIndex, currentSpells);

  if (usesPreparedMechanic) {
    for (const lvl of levels) {
      const idxList = spellIndicesByLevel[lvl];
      if (!idxList?.length) continue;
      idxList.sort((ai, bi) => {
        const a = currentSpells[ai];
        const b = currentSpells[bi];
        if (lvl > 0) {
          const pa = a.prepared === true ? 0 : 1;
          const pb = b.prepared === true ? 0 : 1;
          if (pa !== pb) return pa - pb;
        }
        return (a.name || "").localeCompare(b.name || "", undefined, { sensitivity: "base" });
      });
    }
  } else {
    for (const lvl of levels) {
      const idxList = spellIndicesByLevel[lvl];
      if (!idxList?.length) continue;
      idxList.sort((ai, bi) =>
        (currentSpells[ai].name || "").localeCompare(currentSpells[bi].name || "", undefined, {
          sensitivity: "base",
        }),
      );
    }
  }

  // NPC: spell indices grouped by usesPerDay, sorted alphabetically within each group
  const npcSpellIndicesByUses = npcUsesGroups.reduce<Record<string, number[]>>((acc, uses) => {
    const key = npcUsesKey(uses);
    acc[key] = currentSpells
      .map((spell, index: number) => ({ spell, index }))
      .filter(({ spell }) => (spell.usesPerDay ?? null) === uses)
      .sort(({ spell: a }, { spell: b }) => (a.name || "").localeCompare(b.name || ""))
      .map(({ index }: { index: number }) => index);
    return acc;
  }, {});
  const spellUsesGroupsWithErrors = getSpellUsesGroupsWithErrors(
    errors,
    selectedSpellcastingIndex,
    currentSpells,
    npcUsesKey,
  );

  const allSpellAccordionKeys = !isInnate
    ? levels.filter((level) => (spellIndicesByLevel[level] ?? []).length > 0).map((level) => `level-${level}`)
    : npcUsesGroups.filter((uses) => (npcSpellIndicesByUses[npcUsesKey(uses)] ?? []).length > 0).map(npcUsesKey);
  const hasSpellAccordions = allSpellAccordionKeys.length > 0;
  const allSpellAccordionKeysSignature = allSpellAccordionKeys.join("|");

  useEffect(() => {
    const allowed = new Set(allSpellAccordionKeysSignature ? allSpellAccordionKeysSignature.split("|") : []);
    setOpenAccordionValues((prev) => {
      const next = prev.filter((key) => allowed.has(key));
      return next.length === prev.length ? prev : next;
    });
  }, [allSpellAccordionKeysSignature]);

  // ── Keyboard navigation for tabs ──
  const handleTabKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      const nextIndex = (index + 1) % spellcastingList.length;
      selectSpellcasting(nextIndex);
      // Focus next tab
      setTimeout(() => {
        document.getElementById(`spellcasting-tab-${nextIndex}`)?.focus();
      }, 0);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      const prevIndex = (index - 1 + spellcastingList.length) % spellcastingList.length;
      selectSpellcasting(prevIndex);
      // Focus previous tab
      setTimeout(() => {
        document.getElementById(`spellcasting-tab-${prevIndex}`)?.focus();
      }, 0);
    } else if (e.key === "Home") {
      e.preventDefault();
      selectSpellcasting(0);
      setTimeout(() => {
        document.getElementById(`spellcasting-tab-0`)?.focus();
      }, 0);
    } else if (e.key === "End") {
      e.preventDefault();
      const lastIndex = spellcastingList.length - 1;
      selectSpellcasting(lastIndex);
      setTimeout(() => {
        document.getElementById(`spellcasting-tab-${lastIndex}`)?.focus();
      }, 0);
    }
  };

  const renderErrorIndicator = (label: string) => (
    <span className="inline-flex items-center text-red shrink-0">
      <CircleAlert
        className="size-4"
        aria-hidden="true"
      />
      <span className="sr-only">{label}</span>
    </span>
  );

  const errorCardClassName = "border-red/75 bg-red/8";

  return (
    <div
      className="w-full flex flex-col gap-2 md:gap-4 px-2 sm:px-0 min-h-0 max-xl:max-h-none xl:flex-1 xl:min-h-0 xl:h-full xl:max-h-full relative"
      role="main"
      aria-labelledby="magic-tab-edit">
      <h2
        id="magic-tab-edit"
        className="sr-only">
        {tMagic("spells")}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-[1fr] xl:grid-cols-[1fr_1fr] 2xl:grid-cols-[1.35fr_1fr] min-[1920px]:grid-cols-[1.5fr_1fr] min-[2560px]:grid-cols-[1.65fr_1fr] gap-2 md:gap-4 min-h-0 max-xl:h-auto xl:flex-1 xl:min-h-0 xl:h-full xl:overflow-hidden">
        {/* ══ Left column ══ */}
        <div
          className={`flex flex-col gap-2 md:gap-4 min-h-0 max-xl:h-auto max-xl:overflow-visible xl:h-full xl:overflow-hidden ${showMobileDetails ? "hidden xl:flex" : "flex"}`}>
          {/* Spellcasting class tabs */}
          {isPlayer(character) && spellcastingList.length > 0 && (
            <div className="flex flex-col gap-2 shrink-0">
              <div
                className="flex flex-wrap gap-2"
                role="tablist"
                aria-label={tMagic("spellcastingClass")}>
                {spellcastingList.map((sc, index) => {
                  const liveClassName = watchedSpellcastingClassNames[index] ?? sc?.className ?? "";
                  let label = liveClassName || tMagic("newSpellcasting");
                  if (isPlayer(character) && liveClassName) {
                    const cls = classesList.find((c) => c?.name?.toLowerCase() === liveClassName.toLowerCase());
                    label = cls?.name ? `${tClass(cls.name)} ${tMagic("level")} ${cls.level}` : liveClassName;
                  }
                  const isSelected = selectedSpellcastingIndex === index;
                  return (
                    <Card
                      key={sc.id || index}
                      className={`gap-3 p-3 sm:p-4 md:px-6 cursor-pointer transition-all duration-200 hover:shadow-md ${isSelected ? `bg-${accentColor}` : ""}`}
                      onClick={() => {
                        selectSpellcasting(index);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          selectSpellcasting(index);
                        } else {
                          handleTabKeyDown(e, index);
                        }
                      }}
                      role="tab"
                      tabIndex={isSelected ? 0 : -1}
                      aria-selected={isSelected}
                      aria-controls={`spellcasting-panel-${index}`}
                      id={`spellcasting-tab-${index}`}>
                      <span
                        className={`${isSelected ? "text-black" : accentColor} text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-semibold`}>
                        {label}
                      </span>
                    </Card>
                  );
                })}
                {availableSpellcastingClasses.length > spellcastingList.length && (
                  <Card
                    className="gap-3 p-4 md:px-6 cursor-pointer transition-all duration-200 hover:shadow-md border-dashed"
                    onClick={addSpellcasting}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        addSpellcasting();
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    aria-label={tMagic("addSpellcasting")}>
                    <Plus
                      className={`size-5 md:size-6 ${accentColor}`}
                      aria-hidden="true"
                    />
                  </Card>
                )}
              </div>
            </div>
          )}

          {/* Spellcasting stats card */}
          <Card className="gap-3 sm:gap-4 p-3 sm:p-4 md:px-6 shrink-0">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <h3 className={`text-sm sm:text-base md:text-lg font-semibold ${accentColor}`}>
                  {tEdit("spellcastingStats")}
                </h3>
                {!isPlayer(character) && (
                  <Controller
                    name={`spellcasting.${selectedSpellcastingIndex}.isInnate`}
                    control={form.control}
                    defaultValue={isInnate}
                    render={({ field }) => (
                      <div className="flex items-center gap-1.5">
                        <Checkbox
                          id={`sc-displaymode-${selectedSpellcastingIndex}`}
                          checked={field.value ?? isInnate}
                          onCheckedChange={(checked) => field.onChange(!!checked)}
                        />
                        <label
                          htmlFor={`sc-displaymode-${selectedSpellcastingIndex}`}
                          className="text-xs text-muted-foreground cursor-pointer select-none">
                          {tMagic("displayMode.byUses")}
                        </label>
                      </div>
                    )}
                  />
                )}
              </div>
              {spellcastingList.length > 0 && (
                <ConfirmDialog
                  title={tMagic("removeSpellcastingTitle")}
                  description={tMagic("removeSpellcastingDescription", {
                    className: selectedSpellcasting?.className || "",
                  })}
                  confirmLabel={tMagic("removeSpellcastingConfirm")}
                  cancelLabel={tCommon("cancel")}
                  onConfirm={removeCurrentSpellcasting}>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-600"
                    aria-label={tMagic("removeSpellcasting")}>
                    <Trash2
                      className="size-4"
                      aria-hidden="true"
                    />
                  </Button>
                </ConfirmDialog>
              )}
            </div>

            {/* Row 1 : Class name + Ability select */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Class name */}

              {isPlayer(character) && (
                <Controller
                  name={`spellcasting.${selectedSpellcastingIndex}.className`}
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field
                      data-invalid={fieldState.invalid}
                      orientation="vertical">
                      <label
                        htmlFor={`sc-classname-${selectedSpellcastingIndex}`}
                        className="text-sm font-medium">
                        {tEdit("className")}
                      </label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="w-full">
                            <Select
                              value={field.value ?? ""}
                              onValueChange={field.onChange}
                              disabled={!hasAvailableSpellcastingClasses}>
                              <SelectTrigger
                                id={`sc-classname-${selectedSpellcastingIndex}`}
                                className="w-full">
                                <SelectValue placeholder={tEdit("selectClass")} />
                              </SelectTrigger>
                              <SelectContent position="item-aligned">
                                <SelectGroup>
                                  {availableSpellcastingClasses.map((cls, index: number) => (
                                    <SelectItem
                                      key={`${cls.name}-${index}`}
                                      value={cls.name}>
                                      {tClass(cls.name)}
                                    </SelectItem>
                                  ))}
                                </SelectGroup>
                              </SelectContent>
                            </Select>
                          </span>
                        </TooltipTrigger>
                        {!hasAvailableSpellcastingClasses && (
                          <TooltipContent>
                            <p>{tMagic("spellcastingClassRequiresClass")}</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                      {fieldState.error && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
              )}
              {/* Ability */}
              <Controller
                name={`spellcasting.${selectedSpellcastingIndex}.ability`}
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    orientation="vertical">
                    <label
                      htmlFor={`sc-ability-${selectedSpellcastingIndex}`}
                      className="text-sm font-medium">
                      {tEdit("spellcastingAbility")}
                    </label>
                    <Select
                      value={field.value ?? ""}
                      onValueChange={field.onChange}>
                      <SelectTrigger
                        id={`sc-ability-${selectedSpellcastingIndex}`}
                        className="w-full">
                        <SelectValue placeholder={tEdit("spellcastingAbility")} />
                      </SelectTrigger>
                      <SelectContent position="item-aligned">
                        <SelectGroup>
                          {ABILITY_KEYS.map((key) => (
                            <SelectItem
                              key={key}
                              value={key}>
                              {tAbilities(key)}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    {fieldState.error && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </div>

            {/* Row 2 : Save DC + Attack Bonus with auto-calc */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Save DC */}
              <div className="flex flex-col sm:flex-row gap-2">
                <Controller
                  name={`spellcasting.${selectedSpellcastingIndex}.saveDC`}
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field
                      data-invalid={fieldState.invalid}
                      orientation="vertical">
                      <label
                        htmlFor={`sc-savedc-${selectedSpellcastingIndex}`}
                        className="text-sm font-medium">
                        {tEdit("spellSaveDC")}
                      </label>
                      <Input
                        {...field}
                        id={`sc-savedc-${selectedSpellcastingIndex}`}
                        aria-invalid={fieldState.invalid}
                        placeholder={String(calculatedSaveDC)}
                        type="number"
                      />
                      {fieldState.error && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />

                {isPlayer(character) && currentAbilityKey && (
                  <div className="self-start sm:self-end mb-0 sm:mb-0.5">
                    <SyncRow
                      synced={saveDCSynced}
                      syncedLabel={tMagic("saveDCSynced")}
                      mismatchLabel={tMagic("saveDCMismatch", {
                        calculated: calculatedSaveDC,
                        prof: proficiencyBonus,
                        mod: modSign,
                      })}
                      onSync={() =>
                        form.setValue(`spellcasting.${selectedSpellcastingIndex}.saveDC`, calculatedSaveDC, {
                          shouldDirty: true,
                        })
                      }
                      syncButtonLabel={tMagic("syncSaveDC", { dc: calculatedSaveDC })}
                    />
                  </div>
                )}
              </div>

              {/* Attack Bonus */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <Controller
                  name={`spellcasting.${selectedSpellcastingIndex}.attackBonus`}
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field
                      data-invalid={fieldState.invalid}
                      orientation="vertical">
                      <label
                        htmlFor={`sc-atk-${selectedSpellcastingIndex}`}
                        className="text-sm font-medium">
                        {tEdit("spellAttackBonus")}
                      </label>
                      <Input
                        {...field}
                        id={`sc-atk-${selectedSpellcastingIndex}`}
                        aria-invalid={fieldState.invalid}
                        placeholder={`+${calculatedAttackBonus}`}
                        type="number"
                      />
                      {fieldState.error && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
                {isPlayer(character) && currentAbilityKey && (
                  <div className="self-start sm:self-end mb-0 sm:mb-0.5">
                    <SyncRow
                      synced={attackBonusSynced}
                      syncedLabel={tMagic("attackBonusSynced")}
                      mismatchLabel={tMagic("attackBonusMismatch", {
                        calculated: calculatedAttackBonus,
                        prof: proficiencyBonus,
                        mod: modSign,
                      })}
                      onSync={() =>
                        form.setValue(`spellcasting.${selectedSpellcastingIndex}.attackBonus`, calculatedAttackBonus, {
                          shouldDirty: true,
                        })
                      }
                      syncButtonLabel={tMagic("syncAttackBonus", { bonus: calculatedAttackBonus })}
                    />
                  </div>
                )}
              </div>
            </div>

            {usesPreparedMechanic && (
              <div className="flex flex-col gap-1 pt-1">
                {atPreparedLimit ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-2 rounded-md border border-input px-3 py-2 text-sm cursor-default">
                        <Book
                          className="size-4 shrink-0"
                          aria-hidden
                        />
                        <span>
                          {tMagic("preparedSpells")}:{" "}
                          <strong>
                            {tMagic("preparedSpellsUsage", {
                              current: preparedSpellsCounted,
                              max: maxPreparedSlots,
                            })}
                          </strong>
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{tMagic("preparedSpellsLimitReachedTooltip")}</p>
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <div className="flex items-center gap-2 rounded-md border border-input px-3 py-2 text-sm">
                    <Book
                      className="size-4 shrink-0"
                      aria-hidden
                    />
                    <span>
                      {tMagic("preparedSpells")}:{" "}
                      <strong>
                        {tMagic("preparedSpellsUsage", {
                          current: preparedSpellsCounted,
                          max: maxPreparedSlots,
                        })}
                      </strong>
                    </span>
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Spell list */}
          <div className="flex flex-col gap-2 max-xl:flex-none xl:flex-1 xl:min-h-0 xl:overflow-hidden">
            <Card className="gap-2 p-3 sm:p-4 md:px-6 flex-row flex-wrap justify-between items-center shrink-0">
              <h3 className={`text-xl sm:text-2xl font-semibold ${accentColor}`}>{tMagic("spells")}</h3>
              <div className="flex items-center gap-2 flex-wrap justify-end">
                {showPreparedSpellsButton ? (
                  <Button
                    type="button"
                    variant={preparationEditMode ? "default" : "outline"}
                    size="sm"
                    className={cn(
                      "rounded-[15px] text-xs sm:text-sm gap-1.5",
                      preparationEditMode && "ring-2 ring-ring ring-offset-2 ring-offset-background",
                    )}
                    onClick={() => setPreparationEditMode((v) => !v)}>
                    {preparationEditMode ? (
                      <BookOpenCheck className="size-4 shrink-0" />
                    ) : (
                      <BookOpen className="size-4 shrink-0" />
                    )}
                    <span>
                      {preparationEditMode ? tMagic("finishChangingPrepared") : tMagic("changePreparedSpells")}
                    </span>
                  </Button>
                ) : null}
                <ButtonGroup>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setIsCodexDialogOpen(true)}
                          disabled={!isCodexAvailable}
                          className="flex items-center gap-2 border rounded-r-none">
                          <BookPlus className="size-4" />
                          <span className="hidden sm:block">{tMagic("addCodexSpell")}</span>
                        </Button>
                      </span>
                    </TooltipTrigger>
                    {!isCodexAvailable && (
                      <TooltipContent>
                        <p>{tMagic("codexUnavailable")}</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                  <ButtonGroupSeparator />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="border"
                        aria-label={tMagic("moreSpellOptions")}>
                        <ChevronDown className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="min-w-40 border-none bg-transparent">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={appendSpellHelper}
                        className="flex items-center gap-2 border hover:bg-card">
                        <Plus className="size-4" />
                        <span className="hidden sm:block">{tMagic("addSpell")}</span>
                      </Button>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </ButtonGroup>
                <button
                  type="button"
                  onClick={() => {
                    if (!hasSpellAccordions) return;
                    setOpenAccordionValues(openAccordionValues.length > 0 ? [] : allSpellAccordionKeys);
                  }}
                  disabled={!hasSpellAccordions}
                  className={`text-sm p-2 focus:outline-none ${hasSpellAccordions ? "cursor-pointer hover:underline focus:underline" : "cursor-not-allowed opacity-45"} ${accentColor}`}
                  aria-label={
                    openAccordionValues.length > 0 ? tMagic("collapseAllSpellLevels") : tMagic("expandAllSpellLevels")
                  }
                  aria-expanded={openAccordionValues.length > 0}>
                  {openAccordionValues.length > 0 ? <ListChevronsDownUp /> : <ListChevronsUpDown />}
                </button>
              </div>
            </Card>

            {showPreparedSpellsButton && preparationEditMode ? (
              <div
                className="rounded-[15px] border border-border bg-muted/40 px-3 py-2.5 sm:px-4 text-sm"
                role="status">
                <div className="flex gap-2.5 items-start">
                  <BookOpen
                    className="size-4 shrink-0 text-muted-white mt-0.5"
                    aria-hidden
                  />
                  <p className="leading-snug text-white">{tMagic("preparationModeBanner")}</p>
                </div>
              </div>
            ) : null}

            <nav
              className="flex flex-col gap-2 max-xl:min-h-[min(50svh,32rem)] max-xl:overflow-visible max-xl:flex-none xl:min-h-0 xl:flex-1 xl:overflow-y-auto pr-2 scroll-smooth [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-400/60 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-50 [&::-webkit-scrollbar-thumb]:rounded-full"
              aria-label={tMagic("spellListRegion")}>
              {!isInnate ? (
                /* ── Accordion by level ── */
                levels.length > 0 ? (
                  <Accordion
                    type="multiple"
                    value={openAccordionValues}
                    onValueChange={setOpenAccordionValues}
                    className="w-full flex flex-col gap-2">
                    {levels.map((level) => {
                      const indices = spellIndicesByLevel[level] ?? [];
                      /** On n’affiche une section que si `indices.length > 0` : dès qu’un sort existe à ce niveau > 0, il faut pouvoir régler les emplacements. */
                      const hasSlots = level > 0;
                      const hasLevelError = Boolean(spellLevelsWithErrors[level]);

                      return (
                        spellIndicesByLevel[level].length > 0 && (
                          <AccordionItem
                            key={level}
                            value={`level-${level}`}
                            className="flex flex-col gap-2 w-full content-center">
                            <Card
                              data-invalid={hasLevelError || undefined}
                              aria-invalid={hasLevelError || undefined}
                              className={cn(
                                "flex flex-row justify-between gap-0 p-0 overflow-hidden",
                                hasLevelError && errorCardClassName,
                              )}>
                              <div className="relative w-full">
                                <AccordionTrigger className="flex-1 py-4 px-4 md:px-6 hover:no-underline w-full">
                                  <h3
                                    className={`inline-flex items-center gap-1.5 text-base md:text-lg font-medium ${accentColor}`}>
                                    <span>{level === 0 ? tMagic("cantrips") : tMagic("spellLevel", { level })}</span>
                                    {hasLevelError ? renderErrorIndicator(tMagic("spellCategoryContainsErrors")) : null}
                                  </h3>
                                </AccordionTrigger>
                                {hasSlots && (
                                  <div
                                    className="flex items-center gap-1 sm:gap-1.5 shrink-0 absolute right-12 sm:right-14 top-1/2 -translate-y-1/2"
                                    onClick={(e) => e.stopPropagation()}
                                    onKeyDown={(e) => e.stopPropagation()}>
                                    <Controller
                                      name={`spellcasting.${selectedSpellcastingIndex}.spellSlotsByLevel.${level}.total`}
                                      control={form.control}
                                      render={({ field, fieldState }) => {
                                        const slotTotalPath =
                                          `spellcasting.${selectedSpellcastingIndex}.spellSlotsByLevel.${level}.total` as const;
                                        return (
                                          <Input
                                            name={field.name}
                                            ref={field.ref}
                                            value={
                                              field.value === undefined || field.value === null || field.value === ""
                                                ? ""
                                                : String(field.value)
                                            }
                                            className="w-14 min-w-14 text-center h-9 text-sm"
                                            type="number"
                                            inputMode="numeric"
                                            aria-invalid={fieldState.invalid}
                                            onClick={(e) => e.stopPropagation()}
                                            aria-label={tMagic("spellSlotsTotalForLevel", { level })}
                                            onChange={(e) => {
                                              const raw = e.target.value;
                                              if (raw === "") {
                                                field.onChange("");
                                                form.clearErrors(slotTotalPath);
                                                return;
                                              }
                                              const next = Number(raw);
                                              if (!Number.isFinite(next)) return;
                                              field.onChange(next);
                                              form.clearErrors(slotTotalPath);
                                            }}
                                            onBlur={() => {
                                              const raw = form.getValues(slotTotalPath);
                                              if (raw === "" || raw === undefined || raw === null) {
                                                form.clearErrors(slotTotalPath);
                                                field.onBlur();
                                                return;
                                              }
                                              field.onBlur();
                                              void form.trigger(slotTotalPath);
                                            }}
                                          />
                                        );
                                      }}
                                    />
                                    <span className="text-[10px] sm:text-xs text-muted-foreground hidden sm:inline">
                                      {tMagic("slotsLabel")}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </Card>

                            <AccordionContent className="pb-2">
                              <ul className="flex flex-wrap gap-2">
                                {indices.length === 0 ? (
                                  <li className="text-sm text-muted-foreground px-2">{tMagic("noSpellsInLevel")}</li>
                                ) : (
                                  indices.map((spellIndex) => {
                                    const spell = currentSpells[spellIndex];
                                    const spellName = spell?.name;
                                    const isSelected = selectedSpellIndex === spellIndex;
                                    const hasSpellError = spellIndicesWithErrors.has(spellIndex);
                                    const spellLabel = spellName || tMagic("newSpell");
                                    const showBookmarks = usesPreparedMechanic && level > 0;
                                    const prepEditRow = preparationEditMode && showBookmarks;

                                    const openSpellDetail = () => {
                                      setSelectedSpellIndex(spellIndex);
                                      setShowMobileDetails(true);
                                    };

                                    if (!showBookmarks) {
                                      return (
                                        <li key={spellIndex}>
                                          <Card
                                            onClick={openSpellDetail}
                                            onKeyDown={(e) => {
                                              if (e.key === "Enter" || e.key === " ") {
                                                e.preventDefault();
                                                openSpellDetail();
                                              }
                                            }}
                                            data-invalid={hasSpellError || undefined}
                                            className={cn(
                                              `border ${isSelected ? `border-${accentColor}` : "border-transparent"} gap-2 p-2 sm:px-3 md:px-4 flex-row items-center cursor-pointer hover:border-${accentColor} pr-8 sm:pr-10`,
                                              hasSpellError && errorCardClassName,
                                            )}
                                            role="button"
                                            tabIndex={0}
                                            aria-label={
                                              hasSpellError
                                                ? tMagic("spellContainsErrorsAria", { name: spellLabel })
                                                : spellLabel
                                            }>
                                            <span
                                              className={`truncate text-xs sm:text-sm md:text-base flex-1 min-w-0 ${isSelected ? "font-bold" : ""}`}
                                              aria-hidden="true">
                                              {spellLabel}
                                            </span>
                                            {hasSpellError ? renderErrorIndicator(tMagic("spellContainsErrors")) : null}
                                          </Card>
                                        </li>
                                      );
                                    }

                                    const countExcl = currentSpells.reduce((acc, s, i) => {
                                      if (i === spellIndex) return acc;
                                      if (Number(s.level) > 0 && s.prepared === true) return acc + 1;
                                      return acc;
                                    }, 0);
                                    const prepareBlockedBookmark =
                                      spell?.prepared !== true && maxPreparedSlots > 0 && countExcl >= maxPreparedSlots;

                                    const toggleLocalPrepared = () => {
                                      if (!prepEditRow || !spell) return;
                                      const currentlyPrepared = spell.prepared === true;
                                      const nextPrepared = !currentlyPrepared;
                                      if (nextPrepared) {
                                        const cx = currentSpells.reduce((acc, s, i) => {
                                          if (i === spellIndex) return acc;
                                          if (Number(s.level) > 0 && s.prepared === true) return acc + 1;
                                          return acc;
                                        }, 0);
                                        if (maxPreparedSlots > 0 && cx >= maxPreparedSlots) return;
                                      }
                                      form.setValue(
                                        `spellcasting.${selectedSpellcastingIndex}.spells.${spellIndex}.prepared`,
                                        nextPrepared ? true : false,
                                        { shouldDirty: true },
                                      );
                                    };

                                    return (
                                      <li key={spellIndex}>
                                        <Card
                                          onClick={openSpellDetail}
                                          onKeyDown={(e) => {
                                            if (e.key === "Enter" || e.key === " ") {
                                              e.preventDefault();
                                              openSpellDetail();
                                            }
                                          }}
                                          data-invalid={hasSpellError || undefined}
                                          className={cn(
                                            `border ${isSelected ? `border-${accentColor}` : "border-transparent"} gap-2 py-2 pl-2 pr-2 sm:pl-3 sm:pr-3 md:px-3 flex-row items-center cursor-pointer hover:border-${accentColor} pr-8 sm:pr-10`,
                                            hasSpellError && errorCardClassName,
                                          )}
                                          role="button"
                                          tabIndex={0}
                                          aria-label={
                                            hasSpellError
                                              ? tMagic("spellContainsErrorsAria", { name: spellLabel })
                                              : spellLabel
                                          }>
                                          <div className="flex flex-row items-center gap-2 min-w-0 flex-1">
                                            <SpellPreparedPill
                                              isPrepared={spell?.prepared === true}
                                              interactive={prepEditRow}
                                              prepareBlocked={prepareBlockedBookmark}
                                              onToggle={() => toggleLocalPrepared()}
                                              preparedTooltip={tMagic("preparedBookmarkPreparedTooltip")}
                                              unpreparedTooltip={tMagic("preparedBookmarkUnpreparedTooltip")}
                                              prepareBlockedTooltip={tMagic("spellPrepareLimitTooltip")}
                                              ariaPrepared={tMagic("preparedPillAriaPrepared")}
                                              ariaUnprepared={tMagic("preparedPillAriaUnprepared")}
                                            />
                                            <span
                                              className={cn(
                                                "truncate text-xs sm:text-sm md:text-base flex-1 min-w-0",
                                                isSelected && "font-bold",
                                              )}
                                              aria-hidden="true">
                                              {spellLabel}
                                            </span>
                                            {hasSpellError ? renderErrorIndicator(tMagic("spellContainsErrors")) : null}
                                          </div>
                                        </Card>
                                      </li>
                                    );
                                  })
                                )}
                              </ul>
                            </AccordionContent>
                          </AccordionItem>
                        )
                      );
                    })}
                  </Accordion>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">{tMagic("noMagicAbilities")}</p>
                )
              ) : /* ── Accordion by uses per day ── */
              npcUsesGroups.length > 0 ? (
                <Accordion
                  type="multiple"
                  value={openAccordionValues}
                  onValueChange={setOpenAccordionValues}
                  className="w-full flex flex-col gap-2">
                  {npcUsesGroups.map((uses) => {
                    const key = npcUsesKey(uses);
                    const indices = npcSpellIndicesByUses[key] ?? [];
                    const hasUsesGroupError = Boolean(spellUsesGroupsWithErrors[key]);

                    return (
                      <AccordionItem
                        key={key}
                        value={key}
                        className="flex flex-col gap-2 w-full content-center">
                        <Card
                          data-invalid={hasUsesGroupError || undefined}
                          aria-invalid={hasUsesGroupError || undefined}
                          className={cn(
                            "flex flex-row justify-between gap-0 p-0 overflow-hidden",
                            hasUsesGroupError && errorCardClassName,
                          )}>
                          <div className="relative w-full">
                            <AccordionTrigger className="flex-1 py-4 px-4 md:px-6 hover:no-underline w-full">
                              <h3
                                className={`inline-flex items-center gap-1.5 text-base md:text-lg font-medium ${accentColor}`}>
                                <span>
                                  {uses === null ? tMagic("npc.atWill") : tMagic("npc.usesPerDay", { count: uses })}
                                </span>
                                {hasUsesGroupError ? renderErrorIndicator(tMagic("spellCategoryContainsErrors")) : null}
                              </h3>
                            </AccordionTrigger>
                          </div>
                        </Card>

                        <AccordionContent className="pb-2">
                          <ul className="flex flex-wrap gap-2">
                            {indices.length === 0 ? (
                              <li className="text-sm text-muted-foreground px-2">{tMagic("noSpellsInLevel")}</li>
                            ) : (
                              indices.map((spellIndex) => {
                                const spell = currentSpells[spellIndex];
                                const spellName = spell?.name;
                                const isSelected = selectedSpellIndex === spellIndex;
                                const hasSpellError = spellIndicesWithErrors.has(spellIndex);
                                const spellLabel = spellName || tMagic("newSpell");

                                return (
                                  <li key={spellIndex}>
                                    <Card
                                      onClick={() => {
                                        setSelectedSpellIndex(spellIndex);
                                        setShowMobileDetails(true);
                                      }}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter" || e.key === " ") {
                                          e.preventDefault();
                                          setSelectedSpellIndex(spellIndex);
                                          setShowMobileDetails(true);
                                        }
                                      }}
                                      data-invalid={hasSpellError || undefined}
                                      className={cn(
                                        `border ${isSelected ? `border-${accentColor}` : "border-transparent"} gap-2 sm:gap-3 p-2 sm:px-3 md:px-4 flex-col cursor-pointer hover:border-${accentColor} pr-8 sm:pr-10`,
                                        hasSpellError && errorCardClassName,
                                      )}
                                      role="button"
                                      tabIndex={0}
                                      aria-label={
                                        hasSpellError
                                          ? tMagic("spellContainsErrorsAria", { name: spellLabel })
                                          : spellLabel
                                      }>
                                      <div className="flex items-center gap-1.5 min-w-0">
                                        <span
                                          className={`truncate text-xs sm:text-sm md:text-base ${isSelected ? "font-bold" : ""}`}
                                          aria-hidden="true">
                                          {spellLabel}
                                        </span>
                                        {hasSpellError ? renderErrorIndicator(tMagic("spellContainsErrors")) : null}
                                      </div>
                                      {uses !== null && (
                                        <span className="text-[10px] sm:text-xs text-muted-foreground">
                                          {spell?.used ?? 0} / {uses}
                                        </span>
                                      )}
                                    </Card>
                                  </li>
                                );
                              })
                            )}
                          </ul>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">{tMagic("noMagicAbilities")}</p>
              )}
            </nav>
          </div>
        </div>

        {/* ══ Right column: spell detail edit ══ */}
        <div
          className={`flex flex-col gap-2 min-h-0 max-xl:h-auto xl:h-full max-xl:overflow-visible xl:overflow-hidden xl:border-l xl:pl-4 ${showMobileDetails ? "flex" : "hidden xl:flex"}`}
          role="region"
          aria-label={tMagic("spellDetailRegion")}>
          {/* Back button: single-column layouts (mobile through laptop lg) */}
          <Button
            type="button"
            variant="ghost"
            onClick={() => setShowMobileDetails(false)}
            className="xl:hidden self-start shrink-0 h-8 px-2"
            aria-label={tMagic("backToList")}>
            <ArrowLeft className="size-4" />
            {tMagic("backToList")}
          </Button>
          {selectedSpellIndex === null ? (
            <div
              className="flex items-center justify-center h-full min-h-48"
              role="status"
              aria-live="polite">
              <p className="text-muted-foreground text-sm text-center px-4">{tMagic("selectSpellToEdit")}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2 flex-1 overflow-y-auto pr-2 scroll-smooth [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-400/60 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-50 [&::-webkit-scrollbar-thumb]:rounded-full">
              {/* Name */}
              <Card className="gap-2 sm:gap-3 py-3 sm:py-4 px-3 sm:px-4 md:px-6 flex flex-row">
                <Controller
                  name={`spellcasting.${selectedSpellcastingIndex}.spells.${selectedSpellIndex}.name`}
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field
                      data-invalid={fieldState.invalid}
                      orientation="vertical">
                      <div className="flex flex-row items-center justify-between">
                        <label
                          htmlFor={`spell-name-${selectedSpellIndex}`}
                          className={`text-base sm:text-lg md:text-xl lg:text-2xl font-semibold ${accentColor}`}>
                          {tEdit("spellName")}
                        </label>
                        <ConfirmDialog
                          title={tMagic("removeSpellTitle")}
                          description={tMagic("removeSpellDescription", {
                            name: currentSpells[selectedSpellIndex]?.name || tMagic("newSpell"),
                          })}
                          confirmLabel={tMagic("removeSpellConfirm")}
                          cancelLabel={tCommon("cancel")}
                          onConfirm={() => {
                            if (selectedSpellIndex !== null) removeSpell(selectedSpellIndex);
                          }}>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:text-red-600"
                            aria-label={tMagic("removeSpellWithName", {
                              name: currentSpells[selectedSpellIndex]?.name || tMagic("newSpell"),
                            })}>
                            <Trash2
                              className="size-4"
                              aria-hidden="true"
                            />
                          </Button>
                        </ConfirmDialog>
                      </div>
                      <Input
                        {...field}
                        value={field.value ?? ""}
                        id={`spell-name-${selectedSpellIndex}`}
                        aria-invalid={fieldState.invalid}
                        placeholder={tEdit("spellName")}
                        type="text"
                      />
                      {fieldState.error && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
              </Card>

              {/* Spell metadata grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-2 items-start">
                {/* Level */}
                <Card className="flex flex-col gap-1 py-2 px-2 sm:py-3 sm:px-3 md:py-4 md:px-6">
                  <Controller
                    name={`spellcasting.${selectedSpellcastingIndex}.spells.${selectedSpellIndex}.level`}
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field
                        data-invalid={fieldState.invalid}
                        orientation="vertical">
                        <label
                          htmlFor={`spell-level-${selectedSpellIndex}`}
                          className={`font-semibold text-sm md:text-base shrink-0 ${accentColor}`}>
                          {tEdit("spellLevelLabel")}
                        </label>
                        <Input
                          {...field}
                          id={`spell-level-${selectedSpellIndex}`}
                          aria-invalid={fieldState.invalid}
                          type="number"
                          min={0}
                          max={9}
                          className="w-full"
                        />
                        {fieldState.error && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />
                </Card>

                {/* Uses per day (NPC only) */}
                {isInnate && (
                  <React.Fragment>
                    <Card className="flex flex-col gap-1 py-2 px-2 sm:py-3 sm:px-3 md:py-4 md:px-6">
                      <div className="flex flex-col sm:flex-row gap-3 sm:gap-6">
                        <Controller
                          name={`spellcasting.${selectedSpellcastingIndex}.spells.${selectedSpellIndex}.usesPerDay`}
                          control={form.control}
                          render={({ field, fieldState }) => (
                            <Field
                              data-invalid={fieldState.invalid}
                              orientation="vertical">
                              <label
                                htmlFor={`spell-uses-per-day-${selectedSpellIndex}`}
                                className={`font-semibold text-sm md:text-base shrink-0 ${accentColor}`}>
                                {tMagic("npc.usesPerDayLabel")}
                              </label>
                              <Input
                                {...field}
                                value={field.value ?? ""}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  field.onChange(val === "" ? null : Number(val));
                                }}
                                id={`spell-uses-per-day-${selectedSpellIndex}`}
                                aria-invalid={fieldState.invalid}
                                type="number"
                                min={1}
                                placeholder={tMagic("npc.atWill")}
                                className="w-20"
                              />
                              {fieldState.error && <FieldError errors={[fieldState.error]} />}
                            </Field>
                          )}
                        />
                      </div>
                    </Card>
                    <Card className="flex flex-col gap-1 py-2 px-2 sm:py-3 sm:px-3 md:py-4 md:px-6">
                      <div className="flex flex-col sm:flex-row gap-3 sm:gap-6">
                        <Controller
                          name={`spellcasting.${selectedSpellcastingIndex}.spells.${selectedSpellIndex}.used`}
                          control={form.control}
                          render={({ field, fieldState }) => (
                            <Field
                              data-invalid={fieldState.invalid}
                              orientation="vertical">
                              <label
                                htmlFor={`spell-used-${selectedSpellIndex}`}
                                className={`font-semibold text-sm md:text-base shrink-0 ${accentColor}`}>
                                {tMagic("npc.usedSpellLabel")}
                              </label>
                              <Input
                                {...field}
                                value={field.value ?? 0}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                                id={`spell-used-${selectedSpellIndex}`}
                                aria-invalid={fieldState.invalid}
                                type="number"
                                min={0}
                                className="w-20"
                              />
                              {fieldState.error && <FieldError errors={[fieldState.error]} />}
                            </Field>
                          )}
                        />
                      </div>
                    </Card>
                  </React.Fragment>
                )}

                {/* School */}
                <Card className="flex flex-col gap-1 py-2 px-2 sm:py-3 sm:px-3 md:py-4 md:px-6 col-span-2 sm:col-span-1">
                  <Controller
                    name={`spellcasting.${selectedSpellcastingIndex}.spells.${selectedSpellIndex}.school`}
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field
                        data-invalid={fieldState.invalid}
                        orientation="vertical">
                        <label
                          htmlFor={`spell-school-${selectedSpellIndex}`}
                          className={`font-semibold text-sm md:text-base shrink-0 ${accentColor}`}>
                          {tMagic("spellDetails.school")}
                        </label>
                        <ComboboxInput
                          id={`spell-school-${selectedSpellIndex}`}
                          value={field.value ?? ""}
                          onChange={field.onChange}
                          suggestions={SPELL_SCHOOLS}
                          placeholder={tMagic("spellDetails.school")}
                          aria-invalid={fieldState.invalid}
                        />
                        {fieldState.error && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />
                </Card>

                {/* Effect Type */}
                <Card className="flex flex-col gap-1 py-2 px-2 sm:py-3 sm:px-3 md:py-4 md:px-6 col-span-2 sm:col-span-1">
                  <Controller
                    name={`spellcasting.${selectedSpellcastingIndex}.spells.${selectedSpellIndex}.effectType`}
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field
                        data-invalid={fieldState.invalid}
                        orientation="vertical">
                        <label className={`font-semibold text-sm md:text-base shrink-0 ${accentColor}`}>
                          {tEdit("spellEffectType")}
                        </label>
                        <Select
                          value={field.value || "utility"}
                          onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent position="item-aligned">
                            <SelectGroup>
                              <SelectItem value="utility">{tMagic("effectTypes.utility")}</SelectItem>
                              <SelectItem value="attack">{tMagic("effectTypes.attack")}</SelectItem>
                              <SelectItem value="heal">{tMagic("effectTypes.heal")}</SelectItem>
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                        {fieldState.error && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />
                </Card>

                {/* Casting Time */}
                <Card className="flex flex-col gap-1 py-2 px-2 sm:py-3 sm:px-3 md:py-4 md:px-6">
                  <Controller
                    name={`spellcasting.${selectedSpellcastingIndex}.spells.${selectedSpellIndex}.castingTime`}
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field
                        data-invalid={fieldState.invalid}
                        orientation="vertical">
                        <label
                          htmlFor={`spell-casting-time-${selectedSpellIndex}`}
                          className={`font-semibold text-sm md:text-base shrink-0 ${accentColor}`}>
                          {tMagic("spellDetails.castingTime")}
                        </label>
                        <Input
                          {...field}
                          value={field.value ?? ""}
                          id={`spell-casting-time-${selectedSpellIndex}`}
                          aria-invalid={fieldState.invalid}
                          placeholder={tMagic("spellDetails.castingTime")}
                          type="text"
                        />
                        {fieldState.error && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />
                </Card>

                {/* Range */}
                <Card className="flex flex-col gap-1 py-2 px-2 sm:py-3 sm:px-3 md:py-4 md:px-6">
                  <Controller
                    name={`spellcasting.${selectedSpellcastingIndex}.spells.${selectedSpellIndex}.range`}
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field
                        data-invalid={fieldState.invalid}
                        orientation="vertical">
                        <label
                          htmlFor={`spell-range-${selectedSpellIndex}`}
                          className={`font-semibold text-sm md:text-base shrink-0 ${accentColor}`}>
                          {tMagic("spellDetails.range")}
                        </label>
                        <Input
                          {...field}
                          value={field.value ?? ""}
                          id={`spell-range-${selectedSpellIndex}`}
                          aria-invalid={fieldState.invalid}
                          placeholder={tMagic("spellDetails.range")}
                          type="text"
                        />
                        {fieldState.error && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />
                </Card>

                {/* Duration */}
                <Card className="flex flex-col gap-1 py-2 px-2 sm:py-3 sm:px-3 md:py-4 md:px-6">
                  <Controller
                    name={`spellcasting.${selectedSpellcastingIndex}.spells.${selectedSpellIndex}.duration`}
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field
                        data-invalid={fieldState.invalid}
                        orientation="vertical">
                        <label
                          htmlFor={`spell-duration-${selectedSpellIndex}`}
                          className={`font-semibold text-sm md:text-base shrink-0 ${accentColor}`}>
                          {tMagic("spellDetails.duration")}
                        </label>
                        <Input
                          {...field}
                          value={field.value ?? ""}
                          id={`spell-duration-${selectedSpellIndex}`}
                          aria-invalid={fieldState.invalid}
                          placeholder={tMagic("spellDetails.duration")}
                          type="text"
                        />
                        {fieldState.error && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />
                </Card>

                {/* Damage & Healing Accordion */}
                <Accordion
                  type="multiple"
                  value={openSpellDetailsAccordion}
                  onValueChange={setOpenSpellDetailsAccordion}
                  className="w-full col-span-2 sm:col-span-3 lg:col-span-2 xl:col-span-3 flex flex-col gap-2">
                  {/* Damage */}
                  <AccordionItem
                    value="damage"
                    className="flex flex-col gap-2 w-full col-span-2 sm:col-span-3 lg:col-span-2 xl:col-span-3">
                    <Card className="flex flex-row justify-between gap-0 p-0 overflow-hidden">
                      <AccordionTrigger className="flex-1 py-2 sm:py-3 px-3 sm:px-4 md:px-6 hover:no-underline w-full">
                        <h3 className={`text-sm md:text-base font-semibold ${accentColor}`}>{tEdit("spellDamage")}</h3>
                      </AccordionTrigger>
                    </Card>

                    <AccordionContent className="pb-2">
                      <Card className="flex flex-col gap-2 sm:gap-3 py-2 sm:py-3 px-2 sm:px-3 md:py-4 md:px-6 w-full">
                        {currentEffectType === "attack" && (
                          <div className="flex flex-col gap-1 sm:max-w-48">
                            <label
                              htmlFor={`spell-attack-bonus-${selectedSpellIndex}`}
                              className="text-xs font-medium">
                              {tMagic("attackBonus")}
                            </label>
                            <Input
                              id={`spell-attack-bonus-${selectedSpellIndex}`}
                              value={formatSignedBonus(calculatedAttackBonus)}
                              readOnly
                              aria-readonly="true"
                            />
                          </div>
                        )}
                        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-3">
                          {/* Nombre de dés */}
                          <div className="flex flex-col gap-1 sm:flex-1 sm:min-w-20">
                            <Controller
                              name={`spellcasting.${selectedSpellcastingIndex}.spells.${selectedSpellIndex}.damageDetails.diceCount`}
                              control={form.control}
                              render={({ field, fieldState }) => (
                                <Field
                                  data-invalid={fieldState.invalid}
                                  orientation="vertical">
                                  <label
                                    htmlFor={`spell-damage-dice-count-${selectedSpellIndex}`}
                                    className="text-xs font-medium">
                                    {tEdit("diceCount")}
                                  </label>
                                  <Input
                                    {...field}
                                    value={field.value ?? ""}
                                    id={`spell-damage-dice-count-${selectedSpellIndex}`}
                                    type="number"
                                    min={0}
                                    className="w-full"
                                    placeholder={tEdit("damageDiceCountPlaceholder")}
                                  />
                                </Field>
                              )}
                            />
                          </div>

                          {/* Type de dé */}
                          <div className="flex flex-col gap-1 sm:flex-1 sm:min-w-25">
                            <Controller
                              name={`spellcasting.${selectedSpellcastingIndex}.spells.${selectedSpellIndex}.damageDetails.diceType`}
                              control={form.control}
                              render={({ field, fieldState }) => (
                                <Field
                                  data-invalid={fieldState.invalid}
                                  orientation="vertical">
                                  <label className="text-xs font-medium">{tEdit("diceType")}</label>
                                  <Select
                                    value={field.value ?? ""}
                                    onValueChange={field.onChange}>
                                    <SelectTrigger>
                                      <SelectValue placeholder={tEdit("damageDiceTypePlaceholder")} />
                                    </SelectTrigger>
                                    <SelectContent position="item-aligned">
                                      <SelectGroup>
                                        {DICE_TYPES.map((dice) => (
                                          <SelectItem
                                            key={dice}
                                            value={dice}>
                                            {dice}
                                          </SelectItem>
                                        ))}
                                      </SelectGroup>
                                    </SelectContent>
                                  </Select>
                                </Field>
                              )}
                            />
                          </div>

                          {/* Bonus */}
                          <div className="flex flex-col gap-1 sm:flex-1 sm:min-w-20">
                            <Controller
                              name={`spellcasting.${selectedSpellcastingIndex}.spells.${selectedSpellIndex}.damageDetails.bonus`}
                              control={form.control}
                              render={({ field, fieldState }) => (
                                <Field
                                  data-invalid={fieldState.invalid}
                                  orientation="vertical">
                                  <label
                                    htmlFor={`spell-damage-bonus-${selectedSpellIndex}`}
                                    className="text-xs font-medium">
                                    {tEdit("bonus")}
                                  </label>
                                  <Input
                                    {...field}
                                    value={field.value ?? ""}
                                    id={`spell-damage-bonus-${selectedSpellIndex}`}
                                    type="number"
                                    className="w-full"
                                    placeholder={tEdit("zeroPlaceholder")}
                                  />
                                </Field>
                              )}
                            />
                          </div>

                          {/* Type de dégâts */}
                          <div className="flex flex-col gap-1 col-span-2 sm:col-span-1 sm:flex-1 sm:min-w-37.5">
                            <Controller
                              name={`spellcasting.${selectedSpellcastingIndex}.spells.${selectedSpellIndex}.damageDetails.damageType`}
                              control={form.control}
                              render={({ field, fieldState }) => (
                                <Field
                                  data-invalid={fieldState.invalid}
                                  orientation="vertical">
                                  <label
                                    htmlFor={`spell-damage-type-${selectedSpellIndex}`}
                                    className="text-xs font-medium">
                                    {tEdit("damageType")}
                                  </label>
                                  <DamageTypeInput
                                    id={`spell-damage-type-${selectedSpellIndex}`}
                                    value={field.value ?? ""}
                                    onChange={field.onChange}
                                    placeholder={tEdit("damageTypePlaceholder")}
                                  />
                                </Field>
                              )}
                            />
                          </div>
                        </div>
                      </Card>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Healing */}
                  <AccordionItem
                    value="healing"
                    className="flex flex-col gap-2 w-full col-span-2 sm:col-span-3 lg:col-span-2 xl:col-span-3">
                    <Card className="flex flex-row justify-between gap-0 p-0 overflow-hidden">
                      <AccordionTrigger className="flex-1 py-2 sm:py-3 px-3 sm:px-4 md:px-6 hover:no-underline w-full">
                        <h3 className={`text-sm md:text-base font-semibold ${accentColor}`}>{tEdit("spellHealing")}</h3>
                      </AccordionTrigger>
                    </Card>

                    <AccordionContent className="pb-2">
                      <Card className="flex flex-col gap-2 sm:gap-3 py-2 sm:py-3 px-2 sm:px-3 md:py-4 md:px-6 w-full">
                        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-3">
                          {/* Nombre de dés */}
                          <div className="flex flex-col gap-1 sm:flex-1 sm:min-w-20">
                            <Controller
                              name={`spellcasting.${selectedSpellcastingIndex}.spells.${selectedSpellIndex}.healingDetails.diceCount`}
                              control={form.control}
                              render={({ field, fieldState }) => (
                                <Field
                                  data-invalid={fieldState.invalid}
                                  orientation="vertical">
                                  <label
                                    htmlFor={`spell-healing-dice-count-${selectedSpellIndex}`}
                                    className="text-xs font-medium">
                                    {tEdit("diceCount")}
                                  </label>
                                  <Input
                                    {...field}
                                    value={field.value ?? ""}
                                    id={`spell-healing-dice-count-${selectedSpellIndex}`}
                                    type="number"
                                    min={0}
                                    className="w-full"
                                    placeholder={tEdit("healingDiceCountPlaceholder")}
                                  />
                                </Field>
                              )}
                            />
                          </div>

                          {/* Type de dé */}
                          <div className="flex flex-col gap-1 sm:flex-1 sm:min-w-25">
                            <Controller
                              name={`spellcasting.${selectedSpellcastingIndex}.spells.${selectedSpellIndex}.healingDetails.diceType`}
                              control={form.control}
                              render={({ field, fieldState }) => (
                                <Field
                                  data-invalid={fieldState.invalid}
                                  orientation="vertical">
                                  <label className="text-xs font-medium">{tEdit("diceType")}</label>
                                  <Select
                                    value={field.value ?? ""}
                                    onValueChange={field.onChange}>
                                    <SelectTrigger>
                                      <SelectValue placeholder={tEdit("healingDiceTypePlaceholder")} />
                                    </SelectTrigger>
                                    <SelectContent position="item-aligned">
                                      <SelectGroup>
                                        {DICE_TYPES.map((dice) => (
                                          <SelectItem
                                            key={dice}
                                            value={dice}>
                                            {dice}
                                          </SelectItem>
                                        ))}
                                      </SelectGroup>
                                    </SelectContent>
                                  </Select>
                                </Field>
                              )}
                            />
                          </div>

                          {/* Bonus */}
                          <div className="flex flex-col gap-1 col-span-2 sm:col-span-1 sm:flex-1 sm:min-w-20">
                            <Controller
                              name={`spellcasting.${selectedSpellcastingIndex}.spells.${selectedSpellIndex}.healingDetails.bonus`}
                              control={form.control}
                              render={({ field, fieldState }) => (
                                <Field
                                  data-invalid={fieldState.invalid}
                                  orientation="vertical">
                                  <label
                                    htmlFor={`spell-healing-bonus-${selectedSpellIndex}`}
                                    className="text-xs font-medium">
                                    {tEdit("bonus")}
                                  </label>
                                  <Input
                                    {...field}
                                    value={field.value ?? ""}
                                    id={`spell-healing-bonus-${selectedSpellIndex}`}
                                    type="number"
                                    className="w-full"
                                    placeholder={tEdit("zeroPlaceholder")}
                                  />
                                </Field>
                              )}
                            />
                          </div>
                        </div>
                      </Card>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                {/* Components */}
                <Card className="flex flex-col gap-2 py-2 sm:py-3 px-2 sm:px-3 md:py-4 md:px-6 w-full col-span-2 sm:col-span-3 lg:col-span-2 xl:col-span-3">
                  <Controller
                    name={`spellcasting.${selectedSpellcastingIndex}.spells.${selectedSpellIndex}.components`}
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field
                        data-invalid={fieldState.invalid}
                        orientation="vertical">
                        <fieldset>
                          <legend className={`font-semibold text-sm md:text-base ${accentColor}`}>
                            {tMagic("spellDetails.components")}
                          </legend>
                          <div className="flex gap-4 flex-wrap mt-2">
                            {["V", "S", "M"].map((component) => {
                              const isChecked = (field.value ?? []).includes(component);
                              return (
                                <div
                                  key={component}
                                  className="flex items-center gap-2">
                                  <Checkbox
                                    id={`spell-component-${component}-${selectedSpellIndex}`}
                                    checked={isChecked}
                                    onCheckedChange={(checked) => {
                                      const currentValue = field.value ?? [];
                                      if (checked) {
                                        field.onChange([...currentValue, component]);
                                      } else {
                                        field.onChange(currentValue.filter((c: string) => c !== component));
                                      }
                                    }}
                                  />
                                  <label
                                    htmlFor={`spell-component-${component}-${selectedSpellIndex}`}
                                    className="text-sm font-medium cursor-pointer select-none">
                                    {component}
                                  </label>
                                </div>
                              );
                            })}
                          </div>
                        </fieldset>
                        {fieldState.error && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />
                </Card>
              </div>

              {/* Description */}
              <Card className="flex flex-col gap-2 py-2 sm:py-3 px-2 sm:px-3 md:py-4 md:px-6">
                <Controller
                  name={`spellcasting.${selectedSpellcastingIndex}.spells.${selectedSpellIndex}.description`}
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field
                      data-invalid={fieldState.invalid}
                      orientation="vertical">
                      <label
                        htmlFor={`spell-description-${selectedSpellIndex}`}
                        className={`font-semibold text-sm md:text-base ${accentColor}`}>
                        {tMagic("spellDetails.description")}
                      </label>
                      <Textarea
                        {...field}
                        value={field.value ?? ""}
                        id={`spell-description-${selectedSpellIndex}`}
                        aria-invalid={fieldState.invalid}
                        placeholder={tMagic("spellDetails.description")}
                        rows={5}
                      />
                      {fieldState.error && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Dialog de recherche Codex */}
      <CodexSpellSearchDialog
        open={isCodexDialogOpen}
        onOpenChange={setIsCodexDialogOpen}
        onSpellSelected={addSpellFromCodex}
        accentColor={accentColor}
      />
    </div>
  );
}
