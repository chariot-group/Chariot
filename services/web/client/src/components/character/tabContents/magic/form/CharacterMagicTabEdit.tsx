"use client";

import { Character } from "@/types/character";
import { Controller, UseFormReturn, useWatch, useFieldArray } from "react-hook-form";
import { Field, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useTranslations } from "next-intl";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRightLeft, Plus, Trash2, ListChevronsDownUp, ListChevronsUpDown } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Textarea } from "@/components/ui/textarea";
import { TagInput } from "@/components/ui/tag-input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { calculateAbilityBonus, isPlayer } from "@/utils/global.utils";
import { calculatePreparedSpells, calculateSpellAttackBonus, calculateSpellSaveDC, classWithSpellPrepared } from "@/utils/magic.utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

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

  // Reset selected spell when switching spellcasting class
  useEffect(() => {
    setSelectedSpellIndex(null);
  }, [selectedSpellcastingIndex]);

  const spellcastingList = character.spellcasting || [];

  // ── Use useFieldArray for spells array management ──
  const { fields: spellFields, append, remove } = useFieldArray({
    control: form.control,
    name: `spellcasting.${selectedSpellcastingIndex}.spells`,
  });

  // ── Reactive watches (must be at top level) ──
  const proficiencyBonus: number = useWatch({ control: form.control, name: "stats.proficiencyBonus" }) ?? 2;
  const abilityScores: Record<string, number> = useWatch({ control: form.control, name: "stats.abilityScores" }) ?? {};
  const classesList: any[] = useWatch({ control: form.control, name: "class" }) ?? [];

  const currentAbilityKey: string = useWatch({ control: form.control, name: `spellcasting.${selectedSpellcastingIndex}.ability` }) ?? "";
  const currentSaveDC: number | null = useWatch({ control: form.control, name: `spellcasting.${selectedSpellcastingIndex}.saveDC` });
  const currentAttackBonus: number | null = useWatch({ control: form.control, name: `spellcasting.${selectedSpellcastingIndex}.attackBonus` });

  const abilityScore: number = currentAbilityKey ? (abilityScores[currentAbilityKey] ?? 10) : 10;
  const abilityMod: number = calculateAbilityBonus(abilityScore);
  const calculatedSaveDC: number = calculateSpellSaveDC(proficiencyBonus, abilityScore);
  const calculatedAttackBonus: number = calculateSpellAttackBonus(proficiencyBonus, abilityScore);

  if (spellcastingList.length === 0) {
    return (
      <div className="w-full flex flex-col gap-2 md:gap-4 px-2 sm:px-0" role="region" aria-labelledby="magic-tab-edit">
        <h2 id="magic-tab-edit" className="sr-only">{tMagic("spells")}</h2>
        <p className="text-center text-muted-foreground py-8">{tMagic("noMagicAbilities")}</p>
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

  // Build sorted level list
  const levels: number[] = [];
  if (spellFields.some((s: any) => Number(s.level) === 0)) levels.push(0);
  if (selectedSpellcasting.spellSlotsByLevel) {
    Object.keys(selectedSpellcasting.spellSlotsByLevel).forEach((l) => {
      const n = Number(l);
      if (!levels.includes(n)) levels.push(n);
    });
  }
  spellFields.forEach((spell: any) => {
    const n = Number(spell.level);
    if (!levels.includes(n)) levels.push(n);
  });
  levels.sort((a, b) => a - b);

  const spellIndicesByLevel = levels.reduce<Record<number, number[]>>((acc, level) => {
    acc[level] = spellFields.reduce<number[]>((indices, spell, index) => {
      if (Number((spell as any).level) === level) indices.push(index);
      return indices;
    }, []);
    return acc;
  }, {});

  const addSpell = () => {
    const defaultLevel = levels.length > 0 ? levels[0] : 1;
    append({ name: "", level: defaultLevel, school: "", description: "", components: [], castingTime: "", duration: "", range: "", effectType: "utility" });
    const newIndex = spellFields.length;
    setSelectedSpellIndex(newIndex);
    const levelKey = `level-${defaultLevel}`;
    if (!openAccordionValues.includes(levelKey)) {
      setOpenAccordionValues([...openAccordionValues, levelKey]);
    }
  };

  const removeSpell = (index: number) => {
    remove(index);
    if (selectedSpellIndex === index) {
      setSelectedSpellIndex(null);
    } else if (selectedSpellIndex !== null && selectedSpellIndex > index) {
      setSelectedSpellIndex(selectedSpellIndex - 1);
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
          <Button type="button" variant="outline" size="sm" onClick={onSync} className="text-xs self-start">
            <ArrowRightLeft className="size-3 mr-1" />
            {syncButtonLabel}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{mismatchLabel}</p>
        </TooltipContent>
      </Tooltip>);
  };
  return (
    <div
      className="w-full flex flex-col gap-2 md:gap-4 px-2 sm:px-0 max-h-[calc(100vh-20rem)] relative"
      role="main"
      aria-labelledby="magic-tab-edit">
      <h2 id="magic-tab-edit" className="sr-only">{tMagic("spells")}</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 md:gap-4 h-full overflow-hidden">

        {/* ══ Left column ══ */}
        <div className="flex flex-col gap-2 md:gap-4 h-full overflow-hidden">

          {/* Spellcasting class tabs */}
          {spellcastingList.length > 1 && (
            <nav className="flex flex-wrap gap-2 shrink-0" aria-label={tMagic("spellcastingClass")}>
              {spellcastingList.map((sc, index) => {
                let label = sc.className;
                if (isPlayer(character)) {
                  const cls = (character as any).class?.find(
                    (c: any) => c.name.toLowerCase() === sc.className.toLowerCase(),
                  );
                  label = cls ? `${tClass(cls.name)} ${tMagic("level")} ${cls.level}` : sc.className;
                }
                const isSelected = selectedSpellcastingIndex === index;
                return (
                  <Card
                    key={index}
                    className={`gap-3 p-4 md:px-6 cursor-pointer transition-all duration-200 hover:shadow-md ${isSelected ? `bg-${accentColor}` : ""}`}
                    onClick={() => { setSelectedSpellcastingIndex(index); }}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelectedSpellcastingIndex(index); } }}
                    role="button"
                    tabIndex={0}
                    aria-pressed={isSelected}>
                    <span className={`${isSelected ? "text-black" : accentColor} text-sm md:text-2xl font-semibold`}>{label}</span>
                  </Card>
                );
              })}
            </nav>
          )}

          {/* Spellcasting stats card */}
          <Card className="gap-4 p-4 md:px-6 shrink-0">
            <h3 className={`text-base md:text-lg font-semibold ${accentColor}`}>{tEdit("spellcastingStats")}</h3>

            {/* Row 1 : Ability select + computed prepared spells */}
            <div className="grid grid-cols-2 gap-3">
              {/* Ability */}
              <Controller
                name={`spellcasting.${selectedSpellcastingIndex}.ability`}
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid} orientation="vertical">
                    <label htmlFor={`sc-ability-${selectedSpellcastingIndex}`} className="text-sm font-medium">
                      {tEdit("spellcastingAbility")}
                    </label>
                    <Select value={field.value ?? ""} onValueChange={field.onChange}>
                      <SelectTrigger id={`sc-ability-${selectedSpellcastingIndex}`} className="w-44">
                        <SelectValue placeholder={tEdit("spellcastingAbility")} />
                      </SelectTrigger>
                      <SelectContent position="item-aligned">
                        <SelectGroup>
                          {ABILITY_KEYS.map((key) => (
                            <SelectItem key={key} value={key}>
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
              {/* Save DC */}
              <div className="flex flex-row gap-2">
                <Controller
                  name={`spellcasting.${selectedSpellcastingIndex}.saveDC`}
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid} orientation="vertical">
                      <label htmlFor={`sc-savedc-${selectedSpellcastingIndex}`} className="text-sm font-medium">
                        {tEdit("spellSaveDC")}
                      </label>
                      <Input
                        {...field}
                        onChange={(e) => field.onChange(e.target.value === "" ? null : Number(e.target.value))}
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
                  <div className="self-end mb-0.5">
                    <SyncRow
                      synced={saveDCSynced}
                      syncedLabel={tMagic("saveDCSynced")}
                      mismatchLabel={tMagic("saveDCMismatch", { calculated: calculatedSaveDC, prof: proficiencyBonus, mod: modSign })}
                      onSync={() => form.setValue(`spellcasting.${selectedSpellcastingIndex}.saveDC`, calculatedSaveDC, { shouldDirty: true })}
                      syncButtonLabel={tMagic("syncSaveDC", { dc: calculatedSaveDC })}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Row 2 : Save DC + Attack Bonus with auto-calc */}
            <div className="grid grid-cols-2 gap-4">
              {/* Prepared spells info (editable field) */}
              {isPlayer(character) && classWithSpellPrepared(selectedSpellcasting) && classLevel > 0 && (
                <Controller
                  name={`spellcasting.${selectedSpellcastingIndex}.preparedSpells`}
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid} orientation="vertical">
                      <label htmlFor={`sc-prepared-${selectedSpellcastingIndex}`} className="text-sm font-medium">
                        {tMagic("preparedSpells")}
                      </label>
                      <Input
                        {...field}
                        onChange={(e) => field.onChange(e.target.value === "" ? null : Number(e.target.value))}
                        id={`sc-prepared-${selectedSpellcastingIndex}`}
                        aria-invalid={fieldState.invalid}
                        placeholder={String(calculatedPrepared)}
                        type="number"
                      />
                      {fieldState.error && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
              )}
              {/* Attack Bonus */}
              <div className="flex flex-row items-center gap-2">
                <Controller
                  name={`spellcasting.${selectedSpellcastingIndex}.attackBonus`}
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid} orientation="vertical">
                      <label htmlFor={`sc-atk-${selectedSpellcastingIndex}`} className="text-sm font-medium">
                        {tEdit("spellAttackBonus")}
                      </label>
                      <Input
                        {...field}
                        onChange={(e) => field.onChange(e.target.value === "" ? null : Number(e.target.value))}
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
                  <div className="self-end mb-0.5">
                    <SyncRow
                      synced={attackBonusSynced}
                      syncedLabel={tMagic("attackBonusSynced")}
                      mismatchLabel={tMagic("attackBonusMismatch", { calculated: calculatedAttackBonus, prof: proficiencyBonus, mod: modSign })}
                      onSync={() => form.setValue(`spellcasting.${selectedSpellcastingIndex}.attackBonus`, calculatedAttackBonus, { shouldDirty: true })}
                      syncButtonLabel={tMagic("syncAttackBonus", { bonus: calculatedAttackBonus })}
                    />
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Spell list */}
          <div className="flex flex-col gap-2 flex-1 overflow-hidden">
            <Card className="gap-2 p-4 md:px-6 flex-row justify-between items-center shrink-0">
              <h3 className={`text-xl sm:text-2xl font-semibold ${accentColor}`}>{tMagic("spells")}</h3>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={addSpell}
                  className="flex items-center gap-2">
                  <Plus className="size-4" />
                  <span className="hidden sm:block">{tMagic("addSpell")}</span>
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    const allKeys = levels.map((l) => `level-${l}`);
                    setOpenAccordionValues(openAccordionValues.length > 0 ? [] : allKeys);
                  }}
                  className={`cursor-pointer text-sm p-2 hover:underline focus:outline-none focus:underline ${accentColor}`}
                  aria-label={openAccordionValues.length > 0 ? tMagic("collapseAll") : tMagic("expandAll")}
                  aria-expanded={openAccordionValues.length > 0}>
                  {openAccordionValues.length > 0 ? <ListChevronsDownUp /> : <ListChevronsUpDown />}
                </button>
              </div>
            </Card>

            <nav
              className="flex flex-col gap-2 flex-1 overflow-y-auto pr-2 scroll-smooth [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-400/60 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-50 [&::-webkit-scrollbar-thumb]:rounded-full"
              aria-label={tMagic("spellListRegion")}>
              {levels.length > 0 ? (
                <Accordion
                  type="multiple"
                  value={openAccordionValues}
                  onValueChange={setOpenAccordionValues}
                  className="w-full flex flex-col gap-2">
                  {levels.map((level) => {
                    const indices = spellIndicesByLevel[level] ?? [];
                    const hasSlots = level > 0 && selectedSpellcasting.spellSlotsByLevel?.[level] !== undefined;

                    return (
                      <AccordionItem key={level} value={`level-${level}`} className="flex flex-col gap-2">
                        <Card className="gap-0 p-0 overflow-hidden">
                          <div className="flex items-center">
                            {/* Accordion trigger takes remaining space */}
                            <AccordionTrigger className="flex-1 py-4 px-4 md:px-6 hover:no-underline">
                              <h3 className={`text-base md:text-lg font-medium ${accentColor}`}>
                                {level === 0 ? tMagic("cantrips") : tMagic("spellLevel", { level })}
                              </h3>
                            </AccordionTrigger>

                            {/* Spell slot total (beside the trigger, level 1+) */}
                            {hasSlots && (
                              <div
                                className="flex items-center gap-1.5 pr-10 shrink-0"
                                onClick={(e) => e.stopPropagation()}
                                onKeyDown={(e) => e.stopPropagation()}>
                                <Controller
                                  name={`spellcasting.${selectedSpellcastingIndex}.spellSlotsByLevel.${level}.total`}
                                  control={form.control}
                                  render={({ field }) => (
                                    <Input
                                      {...field}
                                      onChange={(e) => field.onChange(e.target.value === "" ? 0 : Number(e.target.value))}
                                      className="w-14 text-center h-8 text-sm"
                                      type="number"
                                      min={0}
                                      onClick={(e) => e.stopPropagation()}
                                      aria-label={`${tMagic("spellLevel", { level })} ${tEdit("slotsTotal")}`}
                                    />
                                  )}
                                />
                                <span className="text-xs text-muted-foreground">{tMagic("slotsLabel")}</span>
                              </div>
                            )}
                          </div>
                        </Card>

                        <AccordionContent className="pb-2">
                          <div className="flex flex-wrap gap-2" role="list">
                            {indices.length === 0 ? (
                              <p className="text-sm text-muted-foreground px-2">{tMagic("noSpellsInLevel")}</p>
                            ) : (
                              indices.map((spellIndex) => {
                                const spell = spellFields[spellIndex] as any;
                                const spellName = spell?.name;
                                const isSelected = selectedSpellIndex === spellIndex;

                                return (
                                  <Card
                                    key={spell?.id || spellIndex}
                                    onClick={() => {

                                      setSelectedSpellIndex(spellIndex);
                                    }}
                                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelectedSpellIndex(spellIndex); } }}
                                    className={`border ${isSelected ? `border-${accentColor}` : "border-transparent"} gap-3 p-2 md:px-4 flex-col cursor-pointer hover:border-${accentColor} pr-10`}
                                    role="button"
                                    tabIndex={0}
                                    aria-pressed={isSelected}>
                                    <span className={`truncate text-sm md:text-base ${isSelected ? "font-bold" : ""}`}>
                                      {spellName || tMagic("newSpell")}
                                    </span>
                                  </Card>
                                );
                              })
                            )}
                          </div>
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
          className="flex flex-col gap-2 h-full overflow-hidden"
          role="region"
          aria-label={tMagic("spellDetailRegion")}>
          {selectedSpellIndex === null ? (
            <div className="flex items-center justify-center h-full min-h-48">
              <p className="text-muted-foreground text-sm text-center px-4">{tMagic("selectSpellToEdit")}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2 flex-1 overflow-y-auto pr-2 scroll-smooth [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-400/60 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-50 [&::-webkit-scrollbar-thumb]:rounded-full">

              {/* Name */}
              <Card className="gap-3 py-4 px-4 md:px-6">
                <Controller
                  name={`spellcasting.${selectedSpellcastingIndex}.spells.${selectedSpellIndex}.name`}
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid} orientation="vertical">
                      <label htmlFor={`spell-name-${selectedSpellIndex}`} className={`text-xl sm:text-2xl font-semibold ${accentColor}`}>
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
              <div className="flex flex-wrap gap-2 items-start">

                {/* Level */}
                <Card className="flex flex-col gap-1 py-3 px-3 md:py-4 md:px-6">
                  <Controller
                    name={`spellcasting.${selectedSpellcastingIndex}.spells.${selectedSpellIndex}.level`}
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid} orientation="vertical">
                        <label htmlFor={`spell-level-${selectedSpellIndex}`} className={`font-semibold text-sm md:text-base shrink-0 ${accentColor}`}>
                          {tEdit("spellLevelLabel")}
                        </label>
                        <Input
                          {...field}
                          onChange={(e) => field.onChange(e.target.value === "" ? 0 : Number(e.target.value))}
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

                {/* School */}
                <Card className="flex flex-col gap-1 py-3 px-3 md:py-4 md:px-6">
                  <Controller
                    name={`spellcasting.${selectedSpellcastingIndex}.spells.${selectedSpellIndex}.school`}
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid} orientation="vertical">
                        <label htmlFor={`spell-school-${selectedSpellIndex}`} className={`font-semibold text-sm md:text-base shrink-0 ${accentColor}`}>
                          {tMagic("spellDetails.school")}
                        </label>
                        <Input
                          {...field}
                          value={field.value ?? ""}
                          id={`spell-school-${selectedSpellIndex}`}
                          aria-invalid={fieldState.invalid}
                          placeholder={tMagic("spellDetails.school")}
                          type="text"
                        />
                        {fieldState.error && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />
                </Card>

                {/* Effect Type */}
                <Card className="flex flex-col gap-1 py-3 px-3 md:py-4 md:px-6">
                  <Controller
                    name={`spellcasting.${selectedSpellcastingIndex}.spells.${selectedSpellIndex}.effectType`}
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid} orientation="vertical">
                        <label className={`font-semibold text-sm md:text-base shrink-0 ${accentColor}`}>
                          {tEdit("spellEffectType")}
                        </label>
                        <Select value={field.value ?? "utility"} onValueChange={field.onChange}>
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
                <Card className="flex flex-col gap-1 py-3 px-3 md:py-4 md:px-6">
                  <Controller
                    name={`spellcasting.${selectedSpellcastingIndex}.spells.${selectedSpellIndex}.castingTime`}
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid} orientation="vertical">
                        <label htmlFor={`spell-casting-time-${selectedSpellIndex}`} className={`font-semibold text-sm md:text-base shrink-0 ${accentColor}`}>
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
                <Card className="flex flex-col gap-1 py-3 px-3 md:py-4 md:px-6">
                  <Controller
                    name={`spellcasting.${selectedSpellcastingIndex}.spells.${selectedSpellIndex}.range`}
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid} orientation="vertical">
                        <label htmlFor={`spell-range-${selectedSpellIndex}`} className={`font-semibold text-sm md:text-base shrink-0 ${accentColor}`}>
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
                <Card className="flex flex-col gap-1 py-3 px-3 md:py-4 md:px-6">
                  <Controller
                    name={`spellcasting.${selectedSpellcastingIndex}.spells.${selectedSpellIndex}.duration`}
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid} orientation="vertical">
                        <label htmlFor={`spell-duration-${selectedSpellIndex}`} className={`font-semibold text-sm md:text-base shrink-0 ${accentColor}`}>
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

                {/* Damage */}
                <Card className="flex flex-col gap-1 py-3 px-3 md:py-4 md:px-6">
                  <Controller
                    name={`spellcasting.${selectedSpellcastingIndex}.spells.${selectedSpellIndex}.damage`}
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid} orientation="vertical">
                        <label htmlFor={`spell-damage-${selectedSpellIndex}`} className={`font-semibold text-sm md:text-base shrink-0 ${accentColor}`}>
                          {tEdit("spellDamage")}
                        </label>
                        <Input
                          {...field}
                          value={field.value ?? ""}
                          id={`spell-damage-${selectedSpellIndex}`}
                          aria-invalid={fieldState.invalid}
                          placeholder="2d6 fire…"
                          type="text"
                        />
                        {fieldState.error && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />
                </Card>

                {/* Healing */}
                <Card className="flex flex-col gap-1 py-3 px-3 md:py-4 md:px-6">
                  <Controller
                    name={`spellcasting.${selectedSpellcastingIndex}.spells.${selectedSpellIndex}.healing`}
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid} orientation="vertical">
                        <label htmlFor={`spell-healing-${selectedSpellIndex}`} className={`font-semibold text-sm md:text-base shrink-0 ${accentColor}`}>
                          {tEdit("spellHealing")}
                        </label>
                        <Input
                          {...field}
                          value={field.value ?? ""}
                          id={`spell-healing-${selectedSpellIndex}`}
                          aria-invalid={fieldState.invalid}
                          placeholder="1d8+3…"
                          type="text"
                        />
                        {fieldState.error && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />
                </Card>

                {/* Components */}
                <Card className="flex flex-col gap-2 py-3 px-3 md:py-4 md:px-6 w-full">
                  <Controller
                    name={`spellcasting.${selectedSpellcastingIndex}.spells.${selectedSpellIndex}.components`}
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid} orientation="vertical">
                        <label htmlFor={`spell-components-${selectedSpellIndex}`} className={`font-semibold text-sm md:text-base ${accentColor}`}>
                          {tMagic("spellDetails.components")}
                        </label>
                        <TagInput
                          id={`spell-components-${selectedSpellIndex}`}
                          value={field.value ?? []}
                          onChange={field.onChange}
                          suggestions={["V", "S", "M"]}
                          placeholder="V, S, M…"
                          aria-invalid={fieldState.invalid}
                        />
                        {fieldState.error && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />
                </Card>
              </div>

              {/* Description */}
              <Card className="flex flex-col gap-2 py-3 px-3 md:py-4 md:px-6">
                <Controller
                  name={`spellcasting.${selectedSpellcastingIndex}.spells.${selectedSpellIndex}.description`}
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid} orientation="vertical">
                      <label htmlFor={`spell-description-${selectedSpellIndex}`} className={`font-semibold text-sm md:text-base ${accentColor}`}>
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
                description={tMagic("removeSpellDescription", { name: (spellFields[selectedSpellIndex] as any)?.name || tMagic("newSpell") })}
                confirmLabel={tMagic("removeSpellConfirm")}
                cancelLabel={tCommon("cancel")}
                onConfirm={() => removeSpell(selectedSpellIndex)}>
                <Card className="px-3.5 py-3 w-fit">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-red-500 size-9 hover:border-none">
                    <Trash2 className="size-5" />
                  </Button>
                </Card>
              </ConfirmDialog>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
