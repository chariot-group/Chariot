import { Card } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Controller,
  UseFormReturn,
  FieldArrayWithId,
  UseFieldArrayAppend,
  UseFieldArrayRemove,
  FieldValues,
} from "react-hook-form";
import { useTranslations } from "next-intl";
import { useEffect, useId, useMemo, useState } from "react";
import { Plus, Trash2, ListChevronsDownUp, ListChevronsUpDown } from "lucide-react";
import { Field, FieldError } from "@/components/ui/field";
import { DamageTypeInput } from "@/components/ui/damage-type-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ActionUsageType, AbilityScores } from "@/types/character";
import {
  AbilityScoreKey,
  ABILITY_SCORE_SHORT_LABELS,
  formatSignedBonus,
  getAttackSuggestionOptions,
  getProficiencyBonusFromChallengeRating,
} from "@/utils/attack.utils";

interface ActionUpdateSectionProps {
  title: string;
  form: UseFormReturn<FieldValues>;
  fieldArrayName: string;
  fields: FieldArrayWithId<FieldValues, string, "id">[];
  append: UseFieldArrayAppend<FieldValues, string>;
  remove: UseFieldArrayRemove;
  accentColor: string;
}

const ACTION_USAGE_OPTIONS: ActionUsageType[] = ["action", "bonus_action", "reaction"];

const normalizeUsageType = (usageType?: string): ActionUsageType => {
  if (usageType === "bonus_action" || usageType === "reaction" || usageType === "action") {
    return usageType;
  }
  return "action";
};

const TRAILING_DAMAGE_BONUS_REGEX = /([+-]\d+)$/;

const stripTrailingDamageBonus = (dice: string): string => {
  return dice.trim().replace(/\s+/g, "").replace(TRAILING_DAMAGE_BONUS_REGEX, "");
};

const applyAbilityModifierToDice = (dice: string, abilityModifier: number): string => {
  const baseDice = stripTrailingDamageBonus(dice);
  if (!baseDice) return "";
  if (abilityModifier === 0) return baseDice;
  return `${baseDice}${formatSignedBonus(abilityModifier)}`;
};

const ActionUpdateSection = ({
  title,
  form,
  fieldArrayName,
  fields,
  append,
  remove,
  accentColor,
}: ActionUpdateSectionProps) => {
  const t = useTranslations("characterDetail.battle");
  const tMagic = useTranslations("characterDetail.magic");
  const tEdit = useTranslations("characterDetail.edit");
  const tCommon = useTranslations("common");
  const tAbilities = useTranslations("characterDetail.player.general.abilities");
  const sectionId = useId();
  const headingId = `${sectionId}-heading`;

  const [openAccordionValues, setOpenAccordionValues] = useState<string[]>([]);
  const hasActions = fields.length > 0;

  const watchedActions = form.watch(fieldArrayName) as
    | Array<{
        attackAbility?: AbilityScoreKey;
        attackBonus?: number;
        damage?: Array<{ dice?: string; type?: string; applyAbilityBonus?: boolean }>;
      }>
    | undefined;
  const watchedAbilityScores = form.watch("stats.abilityScores") as Partial<AbilityScores> | undefined;
  const watchedProficiencyBonus = Number(form.watch("stats.proficiencyBonus") ?? 0);
  const watchedChallengeRating = Number(form.watch("challenge.challengeRating") ?? 0);
  const proficiencyBonus =
    watchedProficiencyBonus > 0
      ? watchedProficiencyBonus
      : getProficiencyBonusFromChallengeRating(watchedChallengeRating);
  const attackSuggestions = useMemo(
    () => getAttackSuggestionOptions(watchedAbilityScores, proficiencyBonus),
    [proficiencyBonus, watchedAbilityScores],
  );

  useEffect(() => {
    (watchedActions ?? []).forEach((action, index) => {
      const selectedAbilityKey = action?.attackAbility;
      if (!selectedAbilityKey) return;

      const matchingSuggestion = attackSuggestions.find((suggestion) => suggestion.key === selectedAbilityKey);
      if (!matchingSuggestion) return;

      if (action.attackBonus !== matchingSuggestion.attackBonus) {
        form.setValue(`${fieldArrayName}.${index}.attackBonus`, matchingSuggestion.attackBonus, { shouldDirty: false });
      }

      (action.damage ?? []).forEach((damage, damageIndex) => {
        if (!damage?.applyAbilityBonus) return;

        const currentDice = `${damage.dice ?? ""}`;
        const syncedDice = applyAbilityModifierToDice(currentDice, matchingSuggestion.damageBonus);

        if (currentDice !== syncedDice) {
          form.setValue(`${fieldArrayName}.${index}.damage.${damageIndex}.dice`, syncedDice, { shouldDirty: false });
        }
      });
    });
  }, [attackSuggestions, fieldArrayName, form, watchedActions]);

  useEffect(() => {
    (watchedActions ?? []).forEach((action, index) => {
      if (action?.attackAbility) return;

      const damages = action?.damage ?? [];
      const hasAutoAbilityBonus = damages.some((damage) => damage?.applyAbilityBonus);
      if (!hasAutoAbilityBonus) return;

      const normalizedDamages = damages.map((damage) => {
        if (!damage?.applyAbilityBonus) return damage;

        return {
          ...damage,
          applyAbilityBonus: false,
          dice: stripTrailingDamageBonus(damage.dice ?? ""),
        };
      });

      form.setValue(`${fieldArrayName}.${index}.damage`, normalizedDamages, { shouldDirty: false });
    });
  }, [fieldArrayName, form, watchedActions]);

  const existingDamageTypes = useMemo(() => {
    const uniqueByNormalizedType = new Map<string, string>();

    (watchedActions ?? []).forEach((action) => {
      (action?.damage ?? []).forEach((damage) => {
        const normalizedType = (damage?.type ?? "").trim().toLowerCase();
        if (!normalizedType) return;

        if (!uniqueByNormalizedType.has(normalizedType)) {
          uniqueByNormalizedType.set(normalizedType, (damage?.type ?? "").trim());
        }
      });
    });

    return Array.from(uniqueByNormalizedType.values());
  }, [watchedActions]);

  const clearAutoDamageBonusForAction = (actionIndex: number, shouldDirty: boolean) => {
    const currentDamages = form.getValues(`${fieldArrayName}.${actionIndex}.damage`) as
      | Array<{ dice?: string; type?: string; applyAbilityBonus?: boolean }>
      | undefined;

    if (!currentDamages?.length) return;

    const hasAutoAbilityBonus = currentDamages.some((damage) => damage?.applyAbilityBonus);
    if (!hasAutoAbilityBonus) return;

    const normalizedDamages = currentDamages.map((damage) => {
      if (!damage?.applyAbilityBonus) return damage;

      return {
        ...damage,
        applyAbilityBonus: false,
        dice: stripTrailingDamageBonus(damage.dice ?? ""),
      };
    });

    form.setValue(`${fieldArrayName}.${actionIndex}.damage`, normalizedDamages, { shouldDirty });
  };

  return (
    <section
      className="flex flex-col gap-2 w-full"
      aria-labelledby={headingId}>
      <Card className="gap-3 p-4 md:px-6 h-fit flex-row items-center justify-between">
        <h2
          id={headingId}
          className={`min-w-0 flex-1 text-xl sm:text-2xl font-semibold ${accentColor}`}>
          {title}
        </h2>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              append({
                name: "",
                usageType: "action",
                attackAbility: undefined,
                description: "",
                attackBonus: 0,
                damage: [{ dice: "", type: "", applyAbilityBonus: false }],
                range: "",
              });
              // Attendre le prochain rendu pour que le nouvel élément soit présent
              setTimeout(() => {
                const lastAction = fields.length > 0 ? document.getElementById(`action-${fields.length - 1}`) : null;
                if (lastAction) {
                  lastAction.scrollIntoView({ behavior: "smooth", block: "center" });
                }
              }, 100);
            }}
            aria-label={t("addActionToSection", { section: title })}
            className="flex items-center gap-2">
            <Plus
              className="size-4"
              aria-hidden="true"
            />
            <span className="hidden sm:block">{tEdit("add")}</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => {
              if (!hasActions) return;
              if (openAccordionValues.length > 0) {
                setOpenAccordionValues([]);
              } else {
                setOpenAccordionValues(fields.map((_, index) => `action-${index}`));
              }
            }}
            disabled={!hasActions}
            className={accentColor}
            aria-label={
              openAccordionValues.length > 0
                ? t("collapseSectionActions", { section: title })
                : t("expandSectionActions", { section: title })
            }
            aria-expanded={openAccordionValues.length > 0}>
            {openAccordionValues.length > 0 ? (
              <ListChevronsDownUp aria-hidden="true" />
            ) : (
              <ListChevronsUpDown aria-hidden="true" />
            )}
            <span className="sr-only">
              {openAccordionValues.length > 0 ? tMagic("collapseAll") : tMagic("expandAll")}
            </span>
          </Button>
        </div>
      </Card>
      {fields.length > 0 && (
        <Accordion
          type="multiple"
          value={openAccordionValues}
          onValueChange={setOpenAccordionValues}
          className="w-full flex flex-col gap-2">
          {fields.map((field, index) => {
            const actionName = form.watch(`${fieldArrayName}.${index}.name`);
            const usageType = normalizeUsageType(form.watch(`${fieldArrayName}.${index}.usageType`));
            const selectedAbilityKey = form.watch(`${fieldArrayName}.${index}.attackAbility`) as
              | AbilityScoreKey
              | undefined;
            const selectedAttackSuggestion = selectedAbilityKey
              ? attackSuggestions.find((suggestion) => suggestion.key === selectedAbilityKey)
              : undefined;
            const selectedDamageModifier = selectedAttackSuggestion?.damageBonus ?? 0;
            const hasSelectedAttackAbility = Boolean(selectedAttackSuggestion);

            // Vérifie si au moins un champ de l'action courante est invalide
            const nameError = form.getFieldState(`${fieldArrayName}.${index}.name`).invalid;
            const attackBonusError = form.getFieldState(`${fieldArrayName}.${index}.attackBonus`).invalid;
            const damageError = form.getFieldState(`${fieldArrayName}.${index}.damage`).invalid;
            const rangeError = form.getFieldState(`${fieldArrayName}.${index}.range`).invalid;
            const descriptionError = form.getFieldState(`${fieldArrayName}.${index}.description`).invalid;
            const hasError = nameError || attackBonusError || damageError || rangeError || descriptionError;
            const actionItemId = `${sectionId}-action-${index}`;
            const triggerId = `${actionItemId}-trigger`;
            const contentId = `${actionItemId}-content`;
            const actionNameLabelId = `${actionItemId}-name-label`;
            const usageTypeLabelId = `${actionItemId}-usage-type-label`;
            const attackLabelId = `${actionItemId}-attack-label`;
            const damageLabelId = `${actionItemId}-damage-label`;
            const rangeLabelId = `${actionItemId}-range-label`;
            const descriptionLabelId = `${actionItemId}-description-label`;

            return (
              <AccordionItem
                id={`action-${index}`}
                key={field.id}
                value={`action-${index}`}
                className="flex flex-col gap-2">
                <Card className={`gap-2 p-0 flex-col ${hasError ? "ring-destructive ring" : ""}`}>
                  <div className="relative py-3 px-3 md:py-2 md:px-6">
                    <AccordionTrigger
                      id={triggerId}
                      className="w-full items-center gap-2 pr-10"
                      aria-label={t("actionDetailsForIndex", { index: index + 1 })}>
                      <div className="truncate flex items-center gap-1">
                        <span className={`text-base md:text-lg font-medium text-left truncate`}>{actionName}</span>
                        <span className="text-base md:text-lg font-medium text-left">
                          {` (${t(`usageTypeOptions.${usageType}`)})`}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        remove(index);
                      }}
                      aria-label={t("removeActionFromSection", { section: title, index: index + 1 })}
                      className="text-red-500 shrink-0 absolute right-3 md:right-6 top-1/2 -translate-y-1/2">
                      <Trash2
                        className="size-4"
                        aria-hidden="true"
                      />
                    </Button>
                  </div>
                </Card>
                <AccordionContent>
                  <div
                    id={contentId}
                    className="flex flex-wrap gap-2 items-start"
                    role="region"
                    aria-labelledby={triggerId}>
                    <Card className="sm:items-center flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2 py-3 px-3 md:py-4 md:px-6 w-full">
                      <label
                        id={actionNameLabelId}
                        htmlFor={`${actionItemId}-name`}
                        className={`${accentColor} font-semibold text-sm md:text-base shrink-0`}>
                        {t("name")}
                      </label>
                      <Controller
                        name={`${fieldArrayName}.${index}.name`}
                        control={form.control}
                        render={({ field: nameField, fieldState }) => (
                          <Field
                            data-invalid={fieldState.invalid}
                            orientation="vertical">
                            <Input
                              {...nameField}
                              id={`${actionItemId}-name`}
                              className="text-sm"
                              required
                              aria-invalid={fieldState.invalid}
                              aria-labelledby={actionNameLabelId}
                              aria-describedby={fieldState.error ? `${actionItemId}-name-error` : undefined}
                              placeholder={t("name")}
                            />
                            {fieldState.error && (
                              <FieldError
                                id={`${actionItemId}-name-error`}
                                errors={[fieldState.error]}
                              />
                            )}
                          </Field>
                        )}
                      />
                    </Card>
                    <Card className="flex flex-col gap-2 py-3 px-3 md:py-4 md:px-6 w-full">
                      <span
                        id={usageTypeLabelId}
                        className={`${accentColor} font-semibold text-sm md:text-base shrink-0`}>
                        {t("usageType")}
                      </span>
                      <Controller
                        name={`${fieldArrayName}.${index}.usageType`}
                        control={form.control}
                        render={({ field: usageTypeField }) => (
                          <Select
                            value={normalizeUsageType(usageTypeField.value)}
                            onValueChange={usageTypeField.onChange}>
                            <SelectTrigger
                              className="w-full sm:max-w-45"
                              aria-labelledby={usageTypeLabelId}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ACTION_USAGE_OPTIONS.map((option) => (
                                <SelectItem
                                  key={option}
                                  value={option}>
                                  {t(`usageTypeOptions.${option}`)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </Card>
                    <Card className="sm:items-center grid grid-rows-2 sm:justify-between gap-1 sm:gap-2 py-3 px-3 md:py-4 md:px-6">
                      <div className="flex flex-row items-center justify-between gap-2">
                        <label
                          id={attackLabelId}
                          htmlFor={`${actionItemId}-attack-bonus`}
                          className={`${accentColor} font-semibold text-sm md:text-base shrink-0`}>
                          {t("attackDC")}
                        </label>
                        <div className="flex flex-col gap-2 w-full sm:w-auto">
                          <Controller
                            name={`${fieldArrayName}.${index}.attackAbility`}
                            control={form.control}
                            render={({ field: attackAbilityField }) => (
                              <input
                                type="hidden"
                                value={attackAbilityField.value ?? ""}
                                onChange={attackAbilityField.onChange}
                              />
                            )}
                          />
                          <Controller
                            name={`${fieldArrayName}.${index}.attackBonus`}
                            control={form.control}
                            render={({ field: attackField, fieldState }) => (
                              <Field
                                data-invalid={fieldState.invalid}
                                orientation="vertical">
                                <Input
                                  {...attackField}
                                  value={attackField.value ?? ""}
                                  type="number"
                                  aria-invalid={fieldState.invalid}
                                  aria-describedby={
                                    fieldState.error ? `${fieldArrayName}-${index}-attack-bonus-error` : undefined
                                  }
                                  onChange={(event) => {
                                    form.setValue(`${fieldArrayName}.${index}.attackAbility`, undefined, {
                                      shouldDirty: true,
                                    });

                                    clearAutoDamageBonusForAction(index, true);

                                    attackField.onChange(event);
                                  }}
                                  placeholder={tEdit("zeroPlaceholder")}
                                />
                                {fieldState.error && (
                                  <FieldError
                                    id={`${fieldArrayName}-${index}-attack-bonus-error`}
                                    errors={[fieldState.error]}
                                  />
                                )}
                              </Field>
                            )}
                          />
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {attackSuggestions.map((suggestion) => {
                          const isSelected = selectedAbilityKey === suggestion.key;

                          return (
                            <Button
                              key={suggestion.key}
                              type="button"
                              variant={isSelected ? "default" : "outline"}
                              size="sm"
                              onClick={() => {
                                clearAutoDamageBonusForAction(index, true);
                                form.setValue(`${fieldArrayName}.${index}.attackBonus`, suggestion.attackBonus, {
                                  shouldDirty: true,
                                });
                                form.setValue(`${fieldArrayName}.${index}.attackAbility`, suggestion.key, {
                                  shouldDirty: true,
                                });
                              }}
                              title={`${tAbilities(suggestion.key)} ${formatSignedBonus(suggestion.attackBonus)}`}
                              aria-pressed={isSelected}
                              aria-label={t("attackSuggestionAria", {
                                ability: tAbilities(suggestion.key),
                                bonus: formatSignedBonus(suggestion.attackBonus),
                                selected: isSelected ? t("selected") : t("notSelected"),
                              })}
                              className="h-7 px-2 text-xs">
                              {ABILITY_SCORE_SHORT_LABELS[suggestion.key]} {formatSignedBonus(suggestion.attackBonus)}
                            </Button>
                          );
                        })}
                      </div>
                    </Card>
                    <Card className="flex flex-col gap-2 py-3 px-3 md:py-4 md:px-6 w-full">
                      <span
                        id={damageLabelId}
                        className={`${accentColor} font-semibold text-sm md:text-base shrink-0`}>
                        {t("damageType")}
                      </span>
                      <Controller
                        name={`${fieldArrayName}.${index}.damage`}
                        control={form.control}
                        render={({ field: damageField }) => {
                          const damages = Array.isArray(damageField.value) ? damageField.value : [];

                          const updateDamage = (damageIndex: number, key: "dice" | "type", value: string) => {
                            const updatedDamages = [...damages];
                            const currentDamage = updatedDamages[damageIndex] ?? {
                              dice: "",
                              type: "",
                              applyAbilityBonus: false,
                            };
                            const normalizedValue =
                              key === "type"
                                ? value.trim()
                                : currentDamage.applyAbilityBonus && hasSelectedAttackAbility
                                  ? applyAbilityModifierToDice(value, selectedDamageModifier)
                                  : value;

                            if (key === "type" && normalizedValue) {
                              const duplicatedType = updatedDamages.some((damage, indexInList) => {
                                if (indexInList === damageIndex) return false;
                                return (damage?.type ?? "").trim().toLowerCase() === normalizedValue.toLowerCase();
                              });

                              // Keep one damage type per entry and avoid duplicates within the same action.
                              if (duplicatedType) return;
                            }
                            updatedDamages[damageIndex] = {
                              ...currentDamage,
                              [key]: normalizedValue,
                            };
                            damageField.onChange(updatedDamages);
                          };

                          return (
                            <div className="flex flex-col gap-3 w-full min-w-0">
                              {damages.map((damage, damageIndex) => {
                                const damageTypePath = `${fieldArrayName}.${index}.damage.${damageIndex}.type`;
                                const damageTypeState = form.getFieldState(damageTypePath, form.formState);
                                const damageTypeErrorId = `${fieldArrayName}-${index}-damage-${damageIndex}-type-error`;

                                return (
                                  <div
                                    key={damageIndex}
                                    className="flex flex-col gap-3 w-full min-w-0 rounded-[20px] border border-white/10 bg-white/3 p-3">
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="text-xs font-medium text-muted-foreground">
                                        {`${t("type")} ${damageIndex + 1}`}
                                      </span>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => {
                                          damageField.onChange(
                                            damages.filter((_: unknown, i: number) => i !== damageIndex),
                                          );
                                        }}
                                        aria-label={`${tCommon("delete")} ${damageIndex + 1}`}
                                        className="text-red-500 shrink-0">
                                        <Trash2 className="size-4" />
                                      </Button>
                                    </div>
                                    <div className="grid grid-cols-[minmax(0,1fr)_5.5rem] items-end gap-3">
                                      <div className="flex flex-col gap-1 min-w-0">
                                        <span className="text-xs font-medium text-muted-foreground">
                                          {tEdit("spellDamage")}
                                        </span>
                                        <Input
                                          value={damage?.dice ?? ""}
                                          onChange={(event) => updateDamage(damageIndex, "dice", event.target.value)}
                                          placeholder="1d6"
                                          className="w-full"
                                        />
                                      </div>
                                      <Button
                                        type="button"
                                        variant={damage?.applyAbilityBonus ? "default" : "outline"}
                                        size="sm"
                                        disabled={!hasSelectedAttackAbility}
                                        onClick={() => {
                                          const updatedDamages = [...damages];
                                          const currentDamage = updatedDamages[damageIndex] ?? {
                                            dice: "",
                                            type: "",
                                            applyAbilityBonus: false,
                                          };
                                          const applyAbilityBonus = !Boolean(currentDamage.applyAbilityBonus);
                                          const nextDice =
                                            applyAbilityBonus && hasSelectedAttackAbility
                                              ? applyAbilityModifierToDice(
                                                  currentDamage.dice ?? "",
                                                  selectedDamageModifier,
                                                )
                                              : stripTrailingDamageBonus(currentDamage.dice ?? "");

                                          updatedDamages[damageIndex] = {
                                            ...currentDamage,
                                            applyAbilityBonus,
                                            dice: nextDice,
                                          };
                                          damageField.onChange(updatedDamages);
                                        }}
                                        title={
                                          hasSelectedAttackAbility && selectedAttackSuggestion
                                            ? `${tAbilities(selectedAttackSuggestion.key)} ${formatSignedBonus(selectedDamageModifier)}`
                                            : t("attackDC")
                                        }
                                        className="h-9 w-22 px-0 text-xs shrink-0 justify-center self-end">
                                        AUTO {hasSelectedAttackAbility ? formatSignedBonus(selectedDamageModifier) : ""}
                                      </Button>
                                    </div>
                                    <Field
                                      data-invalid={damageTypeState.invalid}
                                      orientation="vertical"
                                      className="w-full min-w-0">
                                      <span className="mb-1 block text-xs font-medium text-muted-foreground">
                                        {tEdit("damageType")}
                                      </span>
                                      <DamageTypeInput
                                        id={damageTypePath}
                                        value={damage?.type ?? ""}
                                        onChange={(value) => updateDamage(damageIndex, "type", value)}
                                        placeholder={tEdit("damageTypePlaceholder")}
                                        aria-invalid={damageTypeState.invalid}
                                        aria-describedby={damageTypeState.error ? damageTypeErrorId : undefined}
                                        customDamageTypes={existingDamageTypes}
                                      />
                                      {damageTypeState.error && (
                                        <FieldError
                                          id={damageTypeErrorId}
                                          errors={[damageTypeState.error]}
                                        />
                                      )}
                                    </Field>
                                  </div>
                                );
                              })}
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  damageField.onChange([...damages, { dice: "", type: "", applyAbilityBonus: false }])
                                }
                                aria-label={t("addDamageToAction", { index: index + 1 })}
                                className="w-fit flex items-center gap-2">
                                <Plus
                                  className="size-4"
                                  aria-hidden="true"
                                />
                                {tEdit("add")}
                              </Button>
                            </div>
                          );
                        }}
                      />
                    </Card>
                    <Card className="sm:items-center flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2 py-3 px-3 md:py-4 md:px-6">
                      <label
                        id={rangeLabelId}
                        htmlFor={`${actionItemId}-range`}
                        className={`${accentColor} font-semibold text-sm md:text-base shrink-0`}>
                        {t("range")}
                      </label>
                      <Controller
                        name={`${fieldArrayName}.${index}.range`}
                        control={form.control}
                        render={({ field: rangeField }) => (
                          <Input
                            {...rangeField}
                            id={`${actionItemId}-range`}
                            aria-labelledby={rangeLabelId}
                            placeholder={t("range")}
                          />
                        )}
                      />
                    </Card>
                    <Card className="flex flex-col gap-2 py-3 px-3 md:py-4 md:px-6 w-full">
                      <label
                        id={descriptionLabelId}
                        htmlFor={`${actionItemId}-description`}
                        className={`${accentColor} font-semibold text-sm md:text-base`}>
                        {t("description")}
                      </label>
                      <Controller
                        name={`${fieldArrayName}.${index}.description`}
                        control={form.control}
                        render={({ field: descField }) => (
                          <Textarea
                            {...descField}
                            id={`${actionItemId}-description`}
                            value={descField.value || ""}
                            aria-labelledby={descriptionLabelId}
                            placeholder={t("description")}
                          />
                        )}
                      />
                    </Card>
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}
    </section>
  );
};

export default ActionUpdateSection;
