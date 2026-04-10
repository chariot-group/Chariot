"use client";

import { Character } from "@/types/character";
import { Controller, UseFormReturn, useWatch, useFieldArray } from "react-hook-form";
import { Field, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useTranslations } from "next-intl";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  ArrowRightLeft,
  Plus,
  Trash2,
  ListChevronsDownUp,
  ListChevronsUpDown,
  ChevronDown,
  BookPlus,
  ArrowLeft,
} from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { calculateAbilityBonus, isPlayer } from "@/utils/global.utils";
import {
  calculatePreparedSpells,
  calculateSpellAttackBonus,
  calculateSpellSaveDC,
  DICE_TYPES,
  SPELL_SCHOOLS,
  getNpcUsesGroups,
  getSpellsByUses,
  npcUsesKey,
} from "@/utils/magic.utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ComboboxInput } from "@/components/ui/combobox-input";
import { Checkbox } from "@/components/ui/checkbox";
import { DamageTypeInput } from "@/components/ui/damage-type-input";
import { parseDamageFormula } from "@/utils/spell-damage.utils";
import { ButtonGroup, ButtonGroupSeparator } from "@/components/ui/button-group";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { Spell } from "@/types/character";
import { useCodexHealth } from "@/hooks/useCodexHealth";
import CodexSpellSearchDialog from "@/components/character/tabContents/magic/CodexSpellSearchDialog";
import React from "react";

const ABILITY_KEYS = ["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"] as const;

interface CharacterMagicTabEditProps {
  character: Character;
  accentColor: string;
  form: UseFormReturn<any>;
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

  const { isAvailable: isCodexAvailable } = useCodexHealth();

  // Reset selected spell when switching spellcasting class
  useEffect(() => {
    setSelectedSpellIndex(null);
    setShowMobileDetails(false);
  }, [selectedSpellcastingIndex]);

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

  const spellcastingList = spellcastingFields as any[];

  // Observer les spells du spellcasting sélectionné avec useWatch
  const currentSpells: any[] =
    useWatch({
      control: form.control,
      name: `spellcasting.${selectedSpellcastingIndex}.spells`,
    }) ?? [];

  // Fonctions pour manipuler les spells directement
  const addSpell = useCallback(
    (spell: Partial<Spell>) => {
      const currentSpells = form.getValues(`spellcasting.${selectedSpellcastingIndex}.spells`) || [];
      form.setValue(`spellcasting.${selectedSpellcastingIndex}.spells`, [...currentSpells, spell], {
        shouldDirty: true,
      });

      const spellLevel = Number(spell.level || 0);
      if (spellLevel > 0) {
        const currentSlots = form.getValues(`spellcasting.${selectedSpellcastingIndex}.spellSlotsByLevel`) || {};
        if (!currentSlots[spellLevel]) {
          form.setValue(
            `spellcasting.${selectedSpellcastingIndex}.spellSlotsByLevel.${spellLevel}`,
            { total: 2, used: 0 },
            { shouldDirty: true },
          );
        }
      }

      const uses = spell.usesPerDay ?? null;
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
      const accordionKey = !isInnate ? `level-${spell.level || 0}` : npcUsesKey((spell as any).usesPerDay ?? null);
      if (!openAccordionValues.includes(accordionKey)) {
        setOpenAccordionValues([...openAccordionValues, accordionKey]);
      }

      setSelectedSpellIndex(currentSpells.length);
    },
    [form, selectedSpellcastingIndex, openAccordionValues, character],
  );

  const removeSpell = useCallback(
    (index: number) => {
      const currentSpells = form.getValues(`spellcasting.${selectedSpellcastingIndex}.spells`) || [];
      const newSpells = currentSpells.filter((_: any, i: number) => i !== index);
      form.setValue(`spellcasting.${selectedSpellcastingIndex}.spells`, newSpells, { shouldDirty: true });
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
    const levels: number[] = [];
    if (currentSpells.some((s: any) => Number(s.level) === 0)) levels.push(0);
    const selectedSpellcasting = spellcastingList[selectedSpellcastingIndex];
    if (selectedSpellcasting?.spellSlotsByLevel) {
      Object.keys(selectedSpellcasting.spellSlotsByLevel).forEach((l) => {
        const n = Number(l);
        if (!levels.includes(n)) levels.push(n);
      });
    }
    currentSpells.forEach((spell: any) => {
      const n = Number(spell.level);
      if (!levels.includes(n)) levels.push(n);
    });
    levels.sort((a, b) => a - b);

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
  }, [currentSpells, spellcastingList, selectedSpellcastingIndex, addSpell, character]);

  const addSpellFromCodex = useCallback(
    (spell: Partial<Spell>) => {
      addSpell(spell);
    },
    [addSpell],
  );

  // ── Reactive watches (must be at top level) ──
  const proficiencyBonus: number = useWatch({ control: form.control, name: "stats.proficiencyBonus" }) ?? 2;
  const abilityScores: Record<string, number> = useWatch({ control: form.control, name: "stats.abilityScores" }) ?? {};
  const classesList: any[] = useWatch({ control: form.control, name: "class" }) ?? [];

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

  const isInnate: boolean =
    useWatch({
      control: form.control,
      name: `spellcasting.${selectedSpellcastingIndex}.isInnate`,
    }) ?? false;

  // Watch current spell damage and healing details
  const watchPath =
    selectedSpellIndex !== null
      ? `spellcasting.${selectedSpellcastingIndex}.spells.${selectedSpellIndex}`
      : `spellcasting.${selectedSpellcastingIndex}.spells.0`;

  const currentDamageDetails = useWatch({
    control: form.control,
    name: `${watchPath}.damageDetails` as any,
  });
  const currentHealingDetails = useWatch({
    control: form.control,
    name: `${watchPath}.healingDetails` as any,
  });
  const currentDamage = useWatch({
    control: form.control,
    name: `${watchPath}.damage` as any,
  });
  const currentHealing = useWatch({
    control: form.control,
    name: `${watchPath}.healing` as any,
  });
  const currentUsesPerDay = useWatch({
    control: form.control,
    name: `${watchPath}.usesPerDay` as any,
  });

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
  }, [currentUsesPerDay, selectedSpellIndex, selectedSpellcastingIndex, form, character]);

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

  // Auto-open damage/healing accordions if they have values
  useEffect(() => {
    if (selectedSpellIndex === null) {
      setOpenSpellDetailsAccordion([]);
      return;
    }

    const newOpenAccordions: string[] = [];

    // Check damage
    const hasDamageDetails =
      currentDamageDetails &&
      (currentDamageDetails.diceCount ||
        currentDamageDetails.diceType ||
        (currentDamageDetails.bonus !== null && currentDamageDetails.bonus !== undefined) ||
        currentDamageDetails.damageType);
    const hasOldDamage = currentDamage && currentDamage.trim() !== "";

    if (hasDamageDetails || hasOldDamage) {
      newOpenAccordions.push("damage");
    }

    // Check healing
    const hasHealingDetails =
      currentHealingDetails &&
      (currentHealingDetails.diceCount ||
        currentHealingDetails.diceType ||
        (currentHealingDetails.bonus !== null && currentHealingDetails.bonus !== undefined));
    const hasOldHealing = currentHealing && currentHealing.trim() !== "";

    if (hasHealingDetails || hasOldHealing) {
      newOpenAccordions.push("healing");
    }

    setOpenSpellDetailsAccordion(newOpenAccordions);
  }, [selectedSpellIndex, currentDamageDetails, currentHealingDetails, currentDamage, currentHealing]);

  const abilityScore: number = currentAbilityKey ? (abilityScores[currentAbilityKey] ?? 10) : 10;
  const abilityMod: number = calculateAbilityBonus(abilityScore);
  const calculatedSaveDC: number = calculateSpellSaveDC(proficiencyBonus, abilityScore);
  const calculatedAttackBonus: number = calculateSpellAttackBonus(proficiencyBonus, abilityScore);

  // ── Functions to manage spellcasting ──
  const addSpellcasting = () => {
    // Find a class that doesn't have spellcasting yet
    const classWithoutSpellcasting = classesList.find((cls: any) => {
      const className = cls?.name?.toLowerCase();
      if (!className) return false;
      return !spellcastingList.some((sc: any) => {
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
      spellSlotsByLevel: { "1": { total: 2, used: 0 } },
      totalSlots: 2,
      spells: [],
    };

    appendSpellcasting(newSpellcasting);
    setSelectedSpellcastingIndex(spellcastingList.length);
  };

  const removeCurrentSpellcasting = () => {
    if (spellcastingList.length > 0) {
      removeSpellcasting(selectedSpellcastingIndex);
      if (selectedSpellcastingIndex >= spellcastingList.length - 1) {
        setSelectedSpellcastingIndex(Math.max(0, spellcastingList.length - 2));
      }
    }
  };

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
        <Button
          type="button"
          onClick={addSpellcasting}
          variant="outline"
          size="lg"
          className="flex items-center gap-2">
          <Plus className="size-4" />
          {tMagic("addSpellcasting")}
        </Button>
      </div>
    );
  }

  const selectedSpellcasting = spellcastingList[selectedSpellcastingIndex];

  // ── Prepared spells (calculated) ──
  const selectedClassName = selectedSpellcasting?.className?.toLowerCase() ?? "";
  const classObj = classesList.find((cls: any) => cls?.name?.toLowerCase() === selectedClassName);
  const classLevel: number = classObj?.level ?? 0;
  const calculatedPrepared: number = calculatePreparedSpells(selectedClassName, classLevel, abilityScores);
  const modSign = abilityMod >= 0 ? `+${abilityMod}` : `${abilityMod}`;

  const saveDCSynced = isPlayer(character) && currentSaveDC === calculatedSaveDC;
  const attackBonusSynced = isPlayer(character) && currentAttackBonus === calculatedAttackBonus;

  // Build sorted level list (byLevel mode) or uses-per-day groups (byUses mode)
  const levels: number[] = [];
  const npcUsesGroups: Array<number | null> = [];

  if (!isInnate) {
    if (currentSpells.some((s: any) => Number(s.level) === 0)) levels.push(0);
    if (selectedSpellcasting?.spellSlotsByLevel) {
      Object.keys(selectedSpellcasting.spellSlotsByLevel).forEach((l) => {
        const n = Number(l);
        if (!levels.includes(n)) levels.push(n);
      });
    }
    currentSpells.forEach((spell: any) => {
      const n = Number(spell.level);
      if (!levels.includes(n)) levels.push(n);
    });
    levels.sort((a, b) => a - b);
  } else {
    // byUses: group by usesPerDay
    const seen = new Set<number | null>();
    currentSpells.forEach((spell: any) => {
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

  // NPC: spell indices grouped by usesPerDay, sorted alphabetically within each group
  const npcSpellIndicesByUses = npcUsesGroups.reduce<Record<string, number[]>>((acc, uses) => {
    const key = npcUsesKey(uses);
    acc[key] = currentSpells
      .map((spell: any, index: number) => ({ spell, index }))
      .filter(({ spell }: { spell: any }) => (spell.usesPerDay ?? null) === uses)
      .sort(({ spell: a }: { spell: any }, { spell: b }: { spell: any }) => (a.name || "").localeCompare(b.name || ""))
      .map(({ index }: { index: number }) => index);
    return acc;
  }, {});

  // ── Keyboard navigation for tabs ──
  const handleTabKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      const nextIndex = (index + 1) % spellcastingList.length;
      setSelectedSpellcastingIndex(nextIndex);
      // Focus next tab
      setTimeout(() => {
        document.getElementById(`spellcasting-tab-${nextIndex}`)?.focus();
      }, 0);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      const prevIndex = (index - 1 + spellcastingList.length) % spellcastingList.length;
      setSelectedSpellcastingIndex(prevIndex);
      // Focus previous tab
      setTimeout(() => {
        document.getElementById(`spellcasting-tab-${prevIndex}`)?.focus();
      }, 0);
    } else if (e.key === "Home") {
      e.preventDefault();
      setSelectedSpellcastingIndex(0);
      setTimeout(() => {
        document.getElementById(`spellcasting-tab-0`)?.focus();
      }, 0);
    } else if (e.key === "End") {
      e.preventDefault();
      const lastIndex = spellcastingList.length - 1;
      setSelectedSpellcastingIndex(lastIndex);
      setTimeout(() => {
        document.getElementById(`spellcasting-tab-${lastIndex}`)?.focus();
      }, 0);
    }
  };

  // ── Auto-calc sync widget ──
  const SyncRow = ({
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
  }) => {
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
  };
  return (
    <div
      className="w-full flex flex-col gap-2 md:gap-4 px-2 sm:px-0 max-h-[calc(100vh-20rem)] relative"
      role="main"
      aria-labelledby="magic-tab-edit">
      <h2
        id="magic-tab-edit"
        className="sr-only">
        {tMagic("spells")}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-[1fr] lg:grid-cols-[1fr_1fr] xl:grid-cols-[1.2fr_1fr] gap-2 md:gap-4 h-full overflow-hidden">
        {/* ══ Left column ══ */}
        <div
          className={`flex flex-col gap-2 md:gap-4 h-full overflow-hidden ${showMobileDetails ? "hidden lg:flex" : "flex"}`}>
          {/* Spellcasting class tabs */}
          {isPlayer(character) && spellcastingList.length > 0 && (
            <div className="flex flex-col gap-2 shrink-0">
              <div
                className="flex flex-wrap gap-2"
                role="tablist"
                aria-label={tMagic("spellcastingClass")}>
                {spellcastingList.map((sc, index) => {
                  let label = sc?.className || tMagic("newSpellcasting");
                  if (isPlayer(character) && sc?.className) {
                    const cls = (character as any).class?.find(
                      (c: any) => c?.name?.toLowerCase() === sc.className?.toLowerCase(),
                    );
                    label = cls ? `${tClass(cls.name)} ${tMagic("level")} ${cls.level}` : sc.className;
                  }
                  const isSelected = selectedSpellcastingIndex === index;
                  return (
                    <Card
                      key={sc.id || index}
                      className={`gap-3 p-3 sm:p-4 md:px-6 cursor-pointer transition-all duration-200 hover:shadow-md ${isSelected ? `bg-${accentColor}` : ""}`}
                      onClick={() => {
                        setSelectedSpellcastingIndex(index);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setSelectedSpellcastingIndex(index);
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
                {classesList.length > spellcastingList.length && (
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
                      <Select
                        value={field.value ?? ""}
                        onValueChange={field.onChange}>
                        <SelectTrigger
                          id={`sc-classname-${selectedSpellcastingIndex}`}
                          className="w-full">
                          <SelectValue placeholder={tEdit("selectClass")} />
                        </SelectTrigger>
                        <SelectContent position="item-aligned">
                          <SelectGroup>
                            {classesList.map((cls: any, index: number) => (
                              <React.Fragment key={index}>
                                {cls.name.length > 1 && (
                                  <SelectItem
                                    key={cls.name}
                                    value={cls.name}>
                                    {tClass(cls.name)}
                                  </SelectItem>
                                )}
                              </React.Fragment>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
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
          </Card>

          {/* Spell list */}
          <div className="flex flex-col gap-2 flex-1 overflow-hidden">
            <Card className="gap-2 p-3 sm:p-4 md:px-6 flex-row justify-between items-center shrink-0">
              <h3 className={`text-xl sm:text-2xl font-semibold ${accentColor}`}>{tMagic("spells")}</h3>
              <div className="flex items-center gap-2">
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
                    const allKeys = !isInnate
                      ? levels.map((l) => `level-${l}`)
                      : npcUsesGroups.map((u) => npcUsesKey(u));
                    setOpenAccordionValues(openAccordionValues.length > 0 ? [] : allKeys);
                  }}
                  className={`cursor-pointer text-sm p-2 hover:underline focus:outline-none focus:underline ${accentColor}`}
                  aria-label={
                    openAccordionValues.length > 0 ? tMagic("collapseAllSpellLevels") : tMagic("expandAllSpellLevels")
                  }
                  aria-expanded={openAccordionValues.length > 0}>
                  {openAccordionValues.length > 0 ? <ListChevronsDownUp /> : <ListChevronsUpDown />}
                </button>
              </div>
            </Card>

            <nav
              className="flex flex-col gap-2 flex-1 overflow-y-auto pr-2 scroll-smooth [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-400/60 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-50 [&::-webkit-scrollbar-thumb]:rounded-full"
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
                      const hasSlots = level > 0 && selectedSpellcasting.spellSlotsByLevel?.[level] !== undefined;

                      return (
                        <AccordionItem
                          key={level}
                          value={`level-${level}`}
                          className="flex flex-col gap-2 w-full content-center">
                          <Card className="flex flex-row justify-between gap-0 p-0 overflow-hidden">
                            <div className="relative w-full">
                              <AccordionTrigger className="flex-1 py-4 px-4 md:px-6 hover:no-underline w-full">
                                <h3 className={`text-base md:text-lg font-medium ${accentColor}`}>
                                  {level === 0 ? tMagic("cantrips") : tMagic("spellLevel", { level })}
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
                                    render={({ field }) => (
                                      <Input
                                        {...field}
                                        className="w-12 sm:w-14 text-center h-7 sm:h-8 text-xs sm:text-sm"
                                        type="number"
                                        min={1}
                                        onClick={(e) => e.stopPropagation()}
                                        aria-label={tMagic("spellSlotsTotalForLevel", { level })}
                                      />
                                    )}
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
                                        className={`border ${isSelected ? `border-${accentColor}` : "border-transparent"} gap-2 sm:gap-3 p-2 sm:px-3 md:px-4 flex-col cursor-pointer hover:border-${accentColor} pr-8 sm:pr-10`}
                                        role="button"
                                        tabIndex={0}
                                        aria-selected={isSelected}
                                        aria-label={spellName || tMagic("newSpell")}>
                                        <span
                                          className={`truncate text-xs sm:text-sm md:text-base ${isSelected ? "font-bold" : ""}`}
                                          aria-hidden="true">
                                          {spellName || tMagic("newSpell")}
                                        </span>
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

                    return (
                      <AccordionItem
                        key={key}
                        value={key}
                        className="flex flex-col gap-2 w-full content-center">
                        <Card className="flex flex-row justify-between gap-0 p-0 overflow-hidden">
                          <div className="relative w-full">
                            <AccordionTrigger className="flex-1 py-4 px-4 md:px-6 hover:no-underline w-full">
                              <h3 className={`text-base md:text-lg font-medium ${accentColor}`}>
                                {uses === null ? tMagic("npc.atWill") : tMagic("npc.usesPerDay", { count: uses })}
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
                                      className={`border ${isSelected ? `border-${accentColor}` : "border-transparent"} gap-2 sm:gap-3 p-2 sm:px-3 md:px-4 flex-col cursor-pointer hover:border-${accentColor} pr-8 sm:pr-10`}
                                      role="button"
                                      tabIndex={0}
                                      aria-selected={isSelected}
                                      aria-label={spellName || tMagic("newSpell")}>
                                      <span
                                        className={`truncate text-xs sm:text-sm md:text-base ${isSelected ? "font-bold" : ""}`}
                                        aria-hidden="true">
                                        {spellName || tMagic("newSpell")}
                                      </span>
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
          className={`flex flex-col gap-2 h-full overflow-hidden md:border-l md:pl-2 lg:pl-4 ${showMobileDetails ? "flex" : "hidden lg:flex"}`}
          role="region"
          aria-label={tMagic("spellDetailRegion")}>
          {/* Back button for mobile */}
          <button
            onClick={() => setShowMobileDetails(false)}
            className="lg:hidden flex items-center gap-2 py-3 px-4 text-sm font-medium hover:bg-muted rounded-lg transition-colors shrink-0"
            aria-label={tMagic("backToList")}>
            <ArrowLeft className="w-4 h-4" />
            <span>{tMagic("backToList")}</span>
          </button>
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
              <Card className="gap-2 sm:gap-3 py-3 sm:py-4 px-3 sm:px-4 md:px-6">
                <Controller
                  name={`spellcasting.${selectedSpellcastingIndex}.spells.${selectedSpellIndex}.name`}
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field
                      data-invalid={fieldState.invalid}
                      orientation="vertical">
                      <label
                        htmlFor={`spell-name-${selectedSpellIndex}`}
                        className={`text-base sm:text-lg md:text-xl lg:text-2xl font-semibold ${accentColor}`}>
                        {tEdit("spellName")}
                      </label>
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
                          className="w-20"
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
                          value={field.value ?? "utility"}
                          onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent position="item-aligned">
                            <SelectGroup>
                              <SelectItem value="attack">{tMagic("effectTypes.attack")}</SelectItem>
                              <SelectItem value="heal">{tMagic("effectTypes.heal")}</SelectItem>
                              <SelectItem value="utility">{tMagic("effectTypes.utility")}</SelectItem>
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
                  className="w-full flex flex-col gap-2">
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
                <Card className="px-3.5 py-3 w-fit">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-red-500 size-9 hover:border-none"
                    aria-label={tMagic("removeSpellWithName", {
                      name: currentSpells[selectedSpellIndex]?.name || tMagic("newSpell"),
                    })}>
                    <Trash2
                      className="size-5"
                      aria-hidden="true"
                    />
                  </Button>
                </Card>
              </ConfirmDialog>
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
