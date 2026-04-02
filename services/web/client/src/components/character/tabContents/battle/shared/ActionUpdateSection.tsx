import { Card } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Controller, UseFormReturn, FieldArrayWithId, UseFieldArrayAppend, UseFieldArrayRemove } from "react-hook-form";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Plus, Trash2, ListChevronsDownUp, ListChevronsUpDown } from "lucide-react";
import { Field, FieldError } from "@/components/ui/field";
import { DamageTypeInput } from "@/components/ui/damage-type-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ActionUsageType, AbilityScores } from "@/types/character";
import {
  ABILITY_SCORE_SHORT_LABELS,
  ATTACK_ABILITY_SCORE_KEYS,
  formatSignedBonus,
  getAttackSuggestionOptions,
  getProficiencyBonusFromChallengeRating,
} from "@/utils/attack.utils";

interface ActionUpdateSectionProps {
  title: string;
  form: UseFormReturn<any>;
  fieldArrayName: string;
  fields: FieldArrayWithId<any, any, "id">[];
  append: UseFieldArrayAppend<any, any>;
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

  const [openAccordionValues, setOpenAccordionValues] = useState<string[]>([]);
  const [selectedAttackAbilityKeys, setSelectedAttackAbilityKeys] = useState<Record<number, string | null>>({});

  const watchedActions = form.watch(fieldArrayName) as Array<{ damage?: Array<{ type?: string }> }> | undefined;
  const watchedAbilityScores = form.watch("stats.abilityScores") as Partial<AbilityScores> | undefined;
  const watchedProficiencyBonus = Number(form.watch("stats.proficiencyBonus") ?? 0);
  const watchedChallengeRating = Number(form.watch("challenge.challengeRating") ?? 0);
  const proficiencyBonus = watchedProficiencyBonus > 0
    ? watchedProficiencyBonus
    : getProficiencyBonusFromChallengeRating(watchedChallengeRating);
  const attackSuggestions = useMemo(
    () => getAttackSuggestionOptions(watchedAbilityScores, proficiencyBonus),
    [proficiencyBonus, watchedAbilityScores],
  );
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

  return (
    <section className="flex flex-col gap-2 w-full">
      <Card className="gap-3 p-4 md:px-6 h-fit justify-between flex-row items-center">
        <h2 className={`text-xl sm:text-2xl font-semibold ${accentColor}`}>{title}</h2>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              append({
                name: "",
                usageType: "action",
                description: "",
                attackBonus: 0,
                damage: [{ dice: "", type: "" }],
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
            className="flex items-center gap-2">
            <Plus className="size-4" />
            <span className="hidden sm:block">{tEdit("add")}</span>
          </Button>
          <button
            type="button"
            onClick={() => {
              if (openAccordionValues.length > 0) {
                setOpenAccordionValues([]);
              } else {
                setOpenAccordionValues(fields.map((_, index) => `action-${index}`));
              }
            }}
            className={`cursor-pointer text-sm p-2 hover:underline focus:outline-none focus:underline ${accentColor}`}
            aria-label={openAccordionValues.length > 0 ? tMagic("collapseAll") : tMagic("expandAll")}
            aria-expanded={openAccordionValues.length > 0}>
            {openAccordionValues.length > 0 ? <ListChevronsDownUp /> : <ListChevronsUpDown />}
          </button>
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
            const selectedAbilityKey = selectedAttackAbilityKeys[index];

            // Vérifie si au moins un champ de l'action courante est invalide
            const nameError = form.getFieldState(`${fieldArrayName}.${index}.name`).invalid;
            const attackBonusError = form.getFieldState(`${fieldArrayName}.${index}.attackBonus`).invalid;
            const damageBonusError = form.getFieldState(`${fieldArrayName}.${index}.damageBonus`).invalid;
            const damageError = form.getFieldState(`${fieldArrayName}.${index}.damage`).invalid;
            const rangeError = form.getFieldState(`${fieldArrayName}.${index}.range`).invalid;
            const descriptionError = form.getFieldState(`${fieldArrayName}.${index}.description`).invalid;
            const hasError = nameError || attackBonusError || damageBonusError || damageError || rangeError || descriptionError;

            return (
              <AccordionItem
                id={`action-${index}`}
                key={field.id}
                value={`action-${index}`}
                className="flex flex-col gap-2">
                <Card className={`gap-2 p-0 flex-col ${hasError ? "ring-destructive ring" : ""}`}>
                  <div className="relative py-3 px-3 md:py-2 md:px-6">
                    <AccordionTrigger
                      className="w-full items-center gap-2 pr-10"
                      aria-label={`Détails de l'action ${index + 1}`}>
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
                      className="text-red-500 shrink-0 absolute right-3 md:right-6 top-1/2 -translate-y-1/2">
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </Card>
                <AccordionContent>
                  <div className="flex flex-wrap gap-2 items-start">
                    <Card className="sm:items-center flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2 py-3 px-3 md:py-4 md:px-6 w-full">
                      <span className={`${accentColor} font-semibold text-sm md:text-base shrink-0`}>{t("name")}</span>
                      <Controller
                        name={`${fieldArrayName}.${index}.name`}
                        control={form.control}
                        render={({ field: nameField, fieldState }) => (
                          <Field
                            data-invalid={fieldState.invalid}
                            orientation="vertical">
                            <Input
                              {...nameField}
                              className="text-sm"
                              required
                              aria-invalid={fieldState.invalid}
                              placeholder={t("name")}
                            />
                            {fieldState.error && <FieldError errors={[fieldState.error]} />}
                          </Field>
                        )}
                      />
                    </Card>
                    <Card className="sm:items-center flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2 py-3 px-3 md:py-4 md:px-6">
                      <span className={`${accentColor} font-semibold text-sm md:text-base shrink-0`}>{t("usageType")}</span>
                      <Controller
                        name={`${fieldArrayName}.${index}.usageType`}
                        control={form.control}
                        render={({ field: usageTypeField }) => (
                          <Select
                            value={normalizeUsageType(usageTypeField.value)}
                            onValueChange={usageTypeField.onChange}>
                            <SelectTrigger className="w-full sm:w-45">
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
                    <Card className="sm:items-center flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2 py-3 px-3 md:py-4 md:px-6">
                      <span className={`${accentColor} font-semibold text-sm md:text-base shrink-0`}>
                        {t("attackDC")}
                      </span>
                      <div className="flex flex-col gap-2 w-full sm:w-auto sm:min-w-80">
                        <Controller
                          name={`${fieldArrayName}.${index}.attackBonus`}
                          control={form.control}
                          render={({ field: attackField }) => (
                            <Input
                              {...attackField}
                              value={attackField.value ?? ""}
                              type="number"
                              onChange={(event) => {
                                setSelectedAttackAbilityKeys((current) => ({ ...current, [index]: null }));
                                attackField.onChange(event);
                              }}
                              placeholder={tEdit("zeroPlaceholder")}
                            />
                          )}
                        />
                        <div className="flex flex-wrap gap-1">
                          {attackSuggestions.map((suggestion) => {
                            const isSelected = selectedAttackAbilityKeys[index] === suggestion.key;

                            return (
                              <Button
                                key={suggestion.key}
                                type="button"
                                variant={isSelected ? "default" : "outline"}
                                size="sm"
                                onClick={() => {
                                  form.setValue(`${fieldArrayName}.${index}.attackBonus`, suggestion.attackBonus, { shouldDirty: true });
                                  form.setValue(`${fieldArrayName}.${index}.damageBonus`, suggestion.damageBonus, { shouldDirty: true });
                                  setSelectedAttackAbilityKeys((current) => ({ ...current, [index]: suggestion.key }));
                                }}
                                title={`${tAbilities(suggestion.key)} ${formatSignedBonus(suggestion.attackBonus)}`}
                                className="h-7 px-2 text-xs">
                                {ABILITY_SCORE_SHORT_LABELS[suggestion.key]} {formatSignedBonus(suggestion.attackBonus)}
                              </Button>
                            );
                          })}
                        </div>
                      </div>
                    </Card>
                    <Card className="sm:items-center flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2 py-3 px-3 md:py-4 md:px-6">
                      <span className={`${accentColor} font-semibold text-sm md:text-base shrink-0`}>
                        {t("damageType")}
                      </span>
                      <Controller
                        name={`${fieldArrayName}.${index}.damage`}
                        control={form.control}
                        render={({ field: damageField }) => {
                          const damages = Array.isArray(damageField.value) ? damageField.value : [];

                          const updateDamage = (damageIndex: number, key: "dice" | "type", value: string) => {
                            const updatedDamages = [...damages];
                            const currentDamage = updatedDamages[damageIndex] ?? { dice: "", type: "" };
                            const normalizedValue = key === "type" ? value.trim() : value;

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
                            <div className="flex flex-col gap-2 w-full sm:w-auto sm:min-w-80">
                              {damages.map((damage, damageIndex) => (
                                <div
                                  key={damageIndex}
                                  className="flex items-center gap-2 w-full">
                                  <Input
                                    value={damage?.dice ?? ""}
                                    onChange={(event) => updateDamage(damageIndex, "dice", event.target.value)}
                                    placeholder="1d6"
                                    className="w-24"
                                  />
                                  <DamageTypeInput
                                    id={`${fieldArrayName}.${index}.damage.${damageIndex}.type`}
                                    value={damage?.type ?? ""}
                                    onChange={(value) => updateDamage(damageIndex, "type", value)}
                                    placeholder={tEdit("damageTypePlaceholder")}
                                    customDamageTypes={existingDamageTypes}
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      damageField.onChange(damages.filter((_: unknown, i: number) => i !== damageIndex));
                                    }}
                                    aria-label={`${tCommon("delete")} ${damageIndex + 1}`}
                                    className="text-red-500 shrink-0">
                                    <Trash2 className="size-4" />
                                  </Button>
                                </div>
                              ))}
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => damageField.onChange([...damages, { dice: "", type: "" }])}
                                className="w-fit flex items-center gap-2">
                                <Plus className="size-4" />
                                {tEdit("add")}
                              </Button>
                            </div>
                          );
                        }}
                      />
                    </Card>
                    <Card className="sm:items-center flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2 py-3 px-3 md:py-4 md:px-6">
                      <span className={`${accentColor} font-semibold text-sm md:text-base shrink-0`}>
                        {tEdit("bonus")}
                      </span>
                      <div className="flex flex-col gap-2 w-full sm:w-auto sm:min-w-80">
                        <Controller
                          name={`${fieldArrayName}.${index}.damageBonus`}
                          control={form.control}
                          render={({ field: damageBonusField }) => (
                            <Input
                              {...damageBonusField}
                              value={damageBonusField.value ?? ""}
                              type="number"
                              onChange={(event) => {
                                setSelectedAttackAbilityKeys((current) => ({ ...current, [index]: null }));
                                damageBonusField.onChange(event);
                              }}
                              placeholder={tEdit("zeroPlaceholder")}
                            />
                          )}
                        />
                        <div className="flex flex-wrap gap-1">
                          {attackSuggestions.map((suggestion) => {
                            const isSelected = selectedAttackAbilityKeys[index] === suggestion.key;

                            return (
                              <Button
                                key={`damage-${suggestion.key}`}
                                type="button"
                                variant={isSelected ? "default" : "outline"}
                                size="sm"
                                onClick={() => {
                                  form.setValue(`${fieldArrayName}.${index}.attackBonus`, suggestion.attackBonus, { shouldDirty: true });
                                  form.setValue(`${fieldArrayName}.${index}.damageBonus`, suggestion.damageBonus, { shouldDirty: true });
                                  setSelectedAttackAbilityKeys((current) => ({ ...current, [index]: suggestion.key }));
                                }}
                                title={`${tAbilities(suggestion.key)} ${formatSignedBonus(suggestion.damageBonus)}`}
                                className="h-7 px-2 text-xs">
                                {ABILITY_SCORE_SHORT_LABELS[suggestion.key]} {formatSignedBonus(suggestion.damageBonus)}
                              </Button>
                            );
                          })}
                        </div>
                      </div>
                    </Card>
                    <Card className="sm:items-center flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2 py-3 px-3 md:py-4 md:px-6">
                      <span className={`${accentColor} font-semibold text-sm md:text-base shrink-0`}>
                        {t("range")}
                      </span>
                      <Controller
                        name={`${fieldArrayName}.${index}.range`}
                        control={form.control}
                        render={({ field: rangeField }) => (
                          <Input
                            {...rangeField}
                            placeholder={t("range")}
                          />
                        )}
                      />
                    </Card>
                    <Card className="flex flex-col gap-2 py-3 px-3 md:py-4 md:px-6 w-full">
                      <span className={`${accentColor} font-semibold text-sm md:text-base`}>{t("description")}</span>
                      <Controller
                        name={`${fieldArrayName}.${index}.description`}
                        control={form.control}
                        render={({ field: descField }) => (
                          <Textarea
                            {...descField}
                            value={descField.value || ""}
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
