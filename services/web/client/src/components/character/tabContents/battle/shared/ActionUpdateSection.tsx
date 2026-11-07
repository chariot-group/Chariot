import { Accordion } from "@/components/ui/accordion";
import ListCard, { EDIT_LIST_MAX_HEIGHT_CLASS } from "@/components/character/tabContents/shared/listCard/ListCard";
import ListRow from "@/components/character/tabContents/shared/listCard/ListRow";
import ListFormSection from "@/components/character/tabContents/shared/listCard/ListFormSection";
import {
  ACTION_USAGE_OPTIONS,
  formatActionAttack,
  formatActionDamage,
  normalizeUsageType,
} from "@/components/character/tabContents/battle/shared/actionSummary";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StoredUnitFeetRangeInput } from "@/components/ui/stored-unit-feet-range-input";
import { Textarea } from "@/components/ui/textarea";
import {
  Controller,
  UseFormReturn,
  FieldArrayWithId,
  UseFieldArrayAppend,
  UseFieldArrayRemove,
  FieldValues,
  useFormState,
} from "react-hook-form";
import { useTranslations } from "next-intl";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Plus, X, Trash2 } from "lucide-react";
import { Field, FieldError } from "@/components/ui/field";
import { DamageTypeInput } from "@/components/ui/damage-type-input";
import { DiceHelp } from "@/components/ui/dice-help";
import { DiceInput } from "@/components/ui/dice-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AbilityScores } from "@/types/character";
import {
  AbilityScoreKey,
  formatSignedBonus,
  getAttackSuggestionOptions,
  getProficiencyBonusFromChallengeRating,
} from "@/utils/attack.utils";
import { useDistanceUnit } from "@/hooks/useDistanceUnit";
import {
  formatStoredFeetDualRange,
  parseStoredFeetDualRange,
  parseStoredFeetRange,
  formatStoredFeetRange,
} from "@/utils/unit.utils";

interface ActionUpdateSectionProps {
  title: string;
  form: UseFormReturn<FieldValues>;
  fieldArrayName: string;
  fields: FieldArrayWithId<FieldValues, string, "id">[];
  append: UseFieldArrayAppend<FieldValues, string>;
  remove: UseFieldArrayRemove;
  accentColor: string;
  /** Layout classes of the section (bento slot). @see FR-character-battle-bento-layout */
  className?: string;
}

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
  className,
}: ActionUpdateSectionProps) => {
  const t = useTranslations("characterDetail.battle");
  const tEdit = useTranslations("characterDetail.edit");
  const tCommon = useTranslations("common");
  const tAbilities = useTranslations("characterDetail.player.general.abilities");
  const tAbilitiesAbbr = useTranslations("characterDetail.player.general.abilitiesAbbr");
  const { displayFt, toFeet, unitLabel, convertRange } = useDistanceUnit();
  const sectionId = useId();
  const headingId = `${sectionId}-heading`;

  const addButtonRef = useRef<HTMLButtonElement>(null);
  const [openAccordionValues, setOpenAccordionValues] = useState<string[]>([]);
  const [expandedLongRanges, setExpandedLongRanges] = useState<Set<string>>(new Set());
  const hasActions = fields.length > 0;
  const { submitCount } = useFormState({ control: form.control });

  // Submitting with errors opens the invalid rows (FR-character-list-card).
  useEffect(() => {
    if (submitCount === 0) return;
    const invalid = fields
      .map((_, index) => (form.getFieldState(`${fieldArrayName}.${index}`).invalid ? `action-${index}` : null))
      .filter((value): value is string => value !== null);
    if (invalid.length === 0) return;
    setOpenAccordionValues((prev) => Array.from(new Set([...prev, ...invalid])));
    setTimeout(() => {
      document.getElementById(invalid[0])?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 350);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitCount]);

  const addAction = () => {
    append({
      name: "",
      usageType: "action",
      attackAbility: undefined,
      description: "",
      attackBonus: 0,
      damage: [{ dice: "", type: "", applyAbilityBonus: false }],
      range: "",
    });
    const newIndex = fields.length;
    setOpenAccordionValues((prev) => [...prev, `action-${newIndex}`]);
    // Wait for render + accordion open before scrolling within the sheet container
    setTimeout(() => {
      const newAction = document.getElementById(`action-${newIndex}`);
      if (newAction) {
        newAction.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
      document.getElementById(`${sectionId}-action-${newIndex}-name`)?.focus({ preventScroll: true });
    }, 350);
  };

  const removeAction = (index: number) => {
    remove(index);
    setOpenAccordionValues((prev) =>
      prev
        .filter((value) => value !== `action-${index}`)
        .map((value) => {
          const i = Number(value.replace("action-", ""));
          return i > index ? `action-${i - 1}` : value;
        }),
    );
    setTimeout(() => {
      const next = document.getElementById(`${sectionId}-action-${Math.min(index, fields.length - 2)}-trigger`);
      (next ?? addButtonRef.current)?.focus();
    }, 0);
  };

  const watchedActions = form.watch(fieldArrayName) as
    | Array<{
        attackAbility?: AbilityScoreKey;
        attackBonus?: number;
        damage?: Array<{
          dice?: string;
          type?: string;
          applyAbilityBonus?: boolean;
        }>;
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
      Array<{ dice?: string; type?: string; applyAbilityBonus?: boolean }> | undefined;

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
    <ListCard
      headingId={headingId}
      title={title}
      count={fields.length}
      accentColor={accentColor}
      className={className}
      bounded
      boundedClassName={EDIT_LIST_MAX_HEIGHT_CLASS}
      actions={
        <Button
          ref={addButtonRef}
          type="button"
          variant="ghost"
          size="sm"
          onClick={addAction}
          aria-label={t("addActionToSection", { section: title })}
          className="flex items-center gap-2">
          <Plus
            className="size-4"
            aria-hidden="true"
          />
          <span className="hidden @md:inline">{tEdit("add")}</span>
        </Button>
      }
      expanded={openAccordionValues.length > 0}
      onToggleAll={() => {
        if (!hasActions) return;
        setOpenAccordionValues(openAccordionValues.length > 0 ? [] : fields.map((_, index) => `action-${index}`));
      }}
      expandLabel={t("expandSectionActions", { section: title })}
      collapseLabel={t("collapseSectionActions", { section: title })}
      emptyLabel={t("noActions")}>
      <Accordion
        type="multiple"
        value={openAccordionValues}
        onValueChange={setOpenAccordionValues}
        className="w-full">
        {fields.map((field, index) => {
          const actionName = form.watch(`${fieldArrayName}.${index}.name`);
          const usageType = normalizeUsageType(form.watch(`${fieldArrayName}.${index}.usageType`));
          const selectedAbilityKey = form.watch(`${fieldArrayName}.${index}.attackAbility`) as
            AbilityScoreKey | undefined;
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
          const watchedAction = (watchedActions ?? [])[index] as
            { attackBonus?: number; damage?: Array<{ dice?: string; type?: string }>; range?: string } | undefined;
          const summaryRange = watchedAction?.range ? convertRange(watchedAction.range) : null;
          const meta = [
            t(`usageTypeOptions.${usageType}`),
            formatActionAttack(watchedAction ?? {}),
            formatActionDamage(watchedAction?.damage),
            summaryRange,
          ].filter(Boolean);

          return (
            <ListRow
              key={field.id}
              id={`action-${index}`}
              value={`action-${index}`}
              triggerId={triggerId}
              name={actionName || "—"}
              meta={meta}
              triggerLabel={t("actionDetailsForIndex", { index: index + 1 })}
              isOpen={openAccordionValues.includes(`action-${index}`)}
              hasError={hasError}
              trailing={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeAction(index)}
                  aria-label={t("removeActionFromSection", { section: title, index: index + 1 })}
                  className="text-red-500">
                  <Trash2
                    className="size-4"
                    aria-hidden="true"
                  />
                </Button>
              }>
              <div
                id={contentId}
                className="flex min-w-0 flex-col gap-4 pt-1">
                <ListFormSection title={t("formSections.general")}>
                  <div className="grid min-w-0 gap-3 @md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                    <div className="flex min-w-0 flex-col gap-1">
                      <label
                        id={actionNameLabelId}
                        htmlFor={`${actionItemId}-name`}
                        className="text-sm font-medium">
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
                    </div>
                    <div className="flex min-w-0 flex-col gap-1">
                      <span
                        id={usageTypeLabelId}
                        className="text-sm font-medium">
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
                              className="w-full"
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
                    </div>
                  </div>
                </ListFormSection>
                <ListFormSection title={t("formSections.attack")}>
                  <div className="grid min-w-0 gap-3 @md:grid-cols-2">
                    <div className="flex min-w-0 flex-col gap-1">
                      <label
                        id={attackLabelId}
                        htmlFor={`${actionItemId}-attack-bonus`}
                        className="text-sm font-medium">
                        {t("attackDC")}
                      </label>
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
                              id={`${actionItemId}-attack-bonus`}
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
                      <span className="mt-1 text-xs text-muted-foreground">{t("attackSuggestions")}</span>
                      <div className="flex flex-wrap gap-1">
                        {attackSuggestions.map((suggestion) => {
                          const isSelected = selectedAbilityKey === suggestion.key;

                          return (
                            <Button
                              key={suggestion.key}
                              type="button"
                              variant={isSelected ? "primary" : "secondary"}
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
                              className="h-9 rounded-[15px] px-3 text-xs">
                              {tAbilitiesAbbr(suggestion.key)} {formatSignedBonus(suggestion.attackBonus)}
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                    <div className="flex min-w-0 flex-col gap-1">
                      <label
                        id={rangeLabelId}
                        htmlFor={`${actionItemId}-range`}
                        className="text-sm font-medium">
                        {t("range")}
                      </label>
                      <Controller
                        name={`${fieldArrayName}.${index}.range`}
                        control={form.control}
                        render={({ field: rangeField }) => {
                          const storedRange = rangeField.value ?? "";
                          const dual = parseStoredFeetDualRange(storedRange);
                          const normalStored = dual ? formatStoredFeetRange(dual[0]) : storedRange;
                          const longStored = dual ? formatStoredFeetRange(dual[1]) : "";
                          const isLongExpanded = longStored !== "" || expandedLongRanges.has(field.id);

                          const handleNormalChange = (newNormal: string) => {
                            // User typed "X/Y" directly — parse as dual range using current unit
                            const dualFreeText = newNormal.match(/^(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/);
                            if (dualFreeText) {
                              rangeField.onChange(
                                formatStoredFeetDualRange(
                                  toFeet(parseFloat(dualFreeText[1])),
                                  toFeet(parseFloat(dualFreeText[2])),
                                ),
                              );
                              return;
                            }
                            const longFt = parseStoredFeetRange(longStored);
                            const normalFt = parseStoredFeetRange(newNormal);
                            if (normalFt != null && longFt != null) {
                              rangeField.onChange(formatStoredFeetDualRange(normalFt, longFt));
                            } else {
                              rangeField.onChange(newNormal);
                            }
                          };

                          const handleLongChange = (newLong: string) => {
                            if (!newLong) {
                              rangeField.onChange(normalStored);
                              setExpandedLongRanges((prev) => {
                                const next = new Set(prev);
                                next.delete(field.id);
                                return next;
                              });
                              return;
                            }
                            const normalFt = parseStoredFeetRange(normalStored);
                            const longFt = parseStoredFeetRange(newLong);
                            if (normalFt != null && longFt != null) {
                              rangeField.onChange(formatStoredFeetDualRange(normalFt, longFt));
                            }
                          };

                          return (
                            <div className="flex min-w-0 w-full flex-col gap-1">
                              <div className="flex min-w-0 items-center gap-1">
                                <StoredUnitFeetRangeInput
                                  id={`${actionItemId}-range`}
                                  aria-labelledby={rangeLabelId}
                                  aria-label={t("rangeNormal")}
                                  placeholder={t("range")}
                                  storedValue={normalStored}
                                  onStoredChange={handleNormalChange}
                                  onBlur={rangeField.onBlur}
                                  toDisplay={displayFt}
                                  toStored={toFeet}
                                  unitLabel={isLongExpanded ? undefined : unitLabel}
                                  type="text"
                                  containerClassName="min-w-0 flex-1"
                                />
                                {isLongExpanded && (
                                  <>
                                    <span
                                      className="shrink-0 px-0.5 text-sm text-muted-foreground"
                                      aria-hidden="true">
                                      /
                                    </span>
                                    <StoredUnitFeetRangeInput
                                      aria-label={t("rangeLong")}
                                      placeholder={t("rangeLong")}
                                      storedValue={longStored}
                                      onStoredChange={handleLongChange}
                                      onBlur={rangeField.onBlur}
                                      toDisplay={displayFt}
                                      toStored={toFeet}
                                      unitLabel={unitLabel}
                                      type="text"
                                      containerClassName="min-w-0 flex-1"
                                    />
                                  </>
                                )}
                              </div>
                              {isLongExpanded ? (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    rangeField.onChange(normalStored);
                                    setExpandedLongRanges((prev) => {
                                      const next = new Set(prev);
                                      next.delete(field.id);
                                      return next;
                                    });
                                  }}
                                  className="h-7 self-start gap-1 px-2 text-xs text-muted-foreground hover:text-foreground">
                                  <X
                                    className="size-3.5"
                                    aria-hidden="true"
                                  />
                                  {t("removeLongRange")}
                                </Button>
                              ) : (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setExpandedLongRanges((prev) => new Set([...prev, field.id]))}
                                  className="h-7 self-start gap-1 px-2 text-xs text-muted-foreground hover:text-foreground">
                                  <Plus
                                    className="size-3.5"
                                    aria-hidden="true"
                                  />
                                  {t("addLongRange")}
                                </Button>
                              )}
                            </div>
                          );
                        }}
                      />
                    </div>
                  </div>
                </ListFormSection>
                <ListFormSection title={t("formSections.damage")}>
                  <div className="flex min-w-0 flex-col gap-2">
                    <span
                      id={damageLabelId}
                      className="sr-only">
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
                          <div className="flex w-full min-w-0 flex-col gap-3">
                            {damages.map((damage, damageIndex) => {
                              const damageTypePath = `${fieldArrayName}.${index}.damage.${damageIndex}.type`;
                              const damageTypeState = form.getFieldState(damageTypePath, form.formState);
                              const damageTypeErrorId = `${fieldArrayName}-${index}-damage-${damageIndex}-type-error`;

                              return (
                                <div
                                  key={damageIndex}
                                  className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto_auto] items-end gap-2 @2xl:grid-cols-[minmax(0,10rem)_auto_minmax(0,1fr)_auto]">
                                  <div className="flex min-w-0 flex-col gap-1">
                                    <div className="flex items-center gap-1">
                                      <label
                                        htmlFor={`${actionItemId}-damage-${damageIndex}-dice`}
                                        className="text-xs font-medium text-muted-foreground">
                                        {tEdit("spellDamage")}
                                      </label>
                                      {damageIndex === 0 && <DiceHelp />}
                                    </div>
                                    <DiceInput
                                      id={`${actionItemId}-damage-${damageIndex}-dice`}
                                      value={damage?.dice ?? ""}
                                      onChange={(value) => updateDamage(damageIndex, "dice", value)}
                                      placeholder="1d6"
                                      className="w-full"
                                      suggestionsLabel={tEdit("diceSuggestionsLabel")}
                                    />
                                  </div>
                                  <Button
                                    type="button"
                                    variant={damage?.applyAbilityBonus ? "primary" : "secondary"}
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
                                          ? applyAbilityModifierToDice(currentDamage.dice ?? "", selectedDamageModifier)
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
                                    aria-pressed={Boolean(damage?.applyAbilityBonus)}
                                    className="h-9 w-22 shrink-0 self-end px-0 text-xs">
                                    AUTO {hasSelectedAttackAbility ? formatSignedBonus(selectedDamageModifier) : ""}
                                  </Button>
                                  <Field
                                    data-invalid={damageTypeState.invalid}
                                    orientation="vertical"
                                    className="order-last col-span-full min-w-0 gap-1 @2xl:order-none @2xl:col-span-1">
                                    <label
                                      htmlFor={damageTypePath}
                                      className="text-xs font-medium text-muted-foreground">
                                      {tEdit("damageType")}
                                    </label>
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
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      damageField.onChange(
                                        damages.filter((_: unknown, i: number) => i !== damageIndex),
                                      );
                                    }}
                                    aria-label={`${tCommon("delete")} ${tEdit("spellDamage")} ${damageIndex + 1}`}
                                    className="text-red-500 shrink-0">
                                    <Trash2
                                      className="size-4"
                                      aria-hidden="true"
                                    />
                                  </Button>
                                </div>
                              );
                            })}
                            <Button
                              type="button"
                              variant="secondary"
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
                  </div>
                </ListFormSection>
                <ListFormSection title={t("formSections.description")}>
                  <div className="flex min-w-0 flex-col gap-1">
                    <label
                      id={descriptionLabelId}
                      htmlFor={`${actionItemId}-description`}
                      className="sr-only">
                      {t("description")}
                    </label>
                    <Controller
                      name={`${fieldArrayName}.${index}.description`}
                      control={form.control}
                      render={({ field: descField }) => (
                        <Textarea
                          {...descField}
                          id={`${actionItemId}-description`}
                          rows={3}
                          value={descField.value || ""}
                          aria-labelledby={descriptionLabelId}
                          placeholder={t("description")}
                        />
                      )}
                    />
                  </div>
                </ListFormSection>
              </div>
            </ListRow>
          );
        })}
      </Accordion>
    </ListCard>
  );
};

export default ActionUpdateSection;
