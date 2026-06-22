import { Card } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Controller,
  UseFormReturn,
  FieldArrayWithId,
  UseFieldArrayAppend,
  UseFieldArrayRemove,
  FieldValues,
} from "react-hook-form";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Plus, Trash2, ListChevronsDownUp, ListChevronsUpDown, Moon, Clock } from "lucide-react";
import { Field, FieldError } from "@/components/ui/field";
import { useAppSelector } from "@/store/hooks";
import { selectIsInSession } from "@/store/slices/sessionSlice";

type AbilityCounterMode = "player" | "npc";

interface AbilitiesUpdateSectionProps {
  title: string;
  form: UseFormReturn<FieldValues>;
  fieldArrayName: string;
  fields: FieldArrayWithId<FieldValues, string, "id">[];
  append: UseFieldArrayAppend<FieldValues, string>;
  remove: UseFieldArrayRemove;
  accentColor: string;
  /** Joueur : l'ajustement de l'usage courant n'est proposé qu'en session (MJ / joueur) */
  abilityCounterMode: AbilityCounterMode;
}

const AbilitiesUpdateSection = ({
  title,
  form,
  fieldArrayName,
  fields,
  append,
  remove,
  accentColor,
  abilityCounterMode,
}: AbilitiesUpdateSectionProps) => {
  const tMagic = useTranslations("characterDetail.magic");
  const tEdit = useTranslations("characterDetail.edit");
  const tBattle = useTranslations("characterDetail.battle");
  const isInSession = useAppSelector(selectIsInSession);
  const showCurrentCounter = abilityCounterMode === "npc" || (abilityCounterMode === "player" && isInSession);

  const [openAccordionValues, setOpenAccordionValues] = useState<string[]>([]);
  const hasAbilities = fields.length > 0;

  return (
    <Card
      className="gap-3 p-4 md:px-6 h-fit min-w-0 w-full"
      role="region"
      aria-label={title}>
      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className={`min-w-0 truncate text-xl sm:text-2xl font-semibold ${accentColor}`}>{title}</h2>
        <div className="flex shrink-0 items-center gap-2 self-end sm:self-center">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            ref={undefined}
            onClick={() => {
              append({ name: "", description: "", hasCounter: false });
              const newIndex = fields.length;
              setOpenAccordionValues([...openAccordionValues, `ability-${newIndex}`]);
              setTimeout(() => {
                const newAbility = document.getElementById(`ability-${newIndex}`);
                if (newAbility) {
                  newAbility.scrollIntoView({ behavior: "smooth", block: "nearest" });
                }
              }, 350);
            }}
            className="flex items-center gap-2">
            <Plus className="size-4" />
            <span className="hidden xl:inline">{tEdit("add")}</span>
          </Button>
          <button
            type="button"
            onClick={() => {
              if (!hasAbilities) return;
              if (openAccordionValues.length > 0) {
                setOpenAccordionValues([]);
              } else {
                setOpenAccordionValues(fields.map((_, index) => `ability-${index}`));
              }
            }}
            disabled={!hasAbilities}
            className={`text-sm p-2 focus:outline-none ${hasAbilities ? "cursor-pointer hover:underline focus:underline" : "cursor-not-allowed opacity-45"} ${accentColor}`}
            aria-label={openAccordionValues.length > 0 ? tMagic("collapseAll") : tMagic("expandAll")}
            aria-expanded={openAccordionValues.length > 0}>
            {openAccordionValues.length > 0 ? <ListChevronsDownUp /> : <ListChevronsUpDown />}
          </button>
        </div>
      </div>
      {fields.length > 0 && (
        <Accordion
          type="multiple"
          value={openAccordionValues}
          onValueChange={setOpenAccordionValues}
          className="w-full flex flex-col gap-3">
          {fields.map((field, index) => {
            const abilityName = form.watch(`${fieldArrayName}.${index}.name`);
            const hasCounter = form.watch(`${fieldArrayName}.${index}.hasCounter`) === true;
            const counterMaxVal = form.watch(`${fieldArrayName}.${index}.counterMax`);
            const counterCurrentVal = form.watch(`${fieldArrayName}.${index}.counterCurrent`) ?? 0;

            const nameError = form.getFieldState(`${fieldArrayName}.${index}.name`).invalid;
            const descriptionError = form.getFieldState(`${fieldArrayName}.${index}.description`).invalid;
            const hasError = nameError || descriptionError;

            return (
              <AccordionItem
                key={field.id}
                id={`ability-${index}`}
                value={`ability-${index}`}
                className="border-b border-gray">
                <div className="relative">
                  <AccordionTrigger
                    className={`min-w-0 w-full items-center text-left hover:no-underline pr-10 gap-2 ${hasError ? "ring-destructive ring" : ""}`}
                    aria-label={`Détails de la capacité ${index + 1}`}>
                    <span className="min-w-0 min-h-0 flex-1 overflow-hidden truncate font-medium">
                      {abilityName || "—"}
                    </span>
                    {hasCounter && counterMaxVal !== undefined && counterMaxVal !== null && (
                      <span
                        className="text-xs sm:text-sm font-normal text-muted-foreground tabular-nums shrink-0 whitespace-nowrap"
                        aria-label={tBattle("abilityCounterShort", { current: counterCurrentVal, max: counterMaxVal })}>
                        {tBattle("abilityCounterShort", { current: counterCurrentVal, max: counterMaxVal })}
                      </span>
                    )}
                  </AccordionTrigger>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      remove(index);
                    }}
                    className="text-red-500 shrink-0 absolute right-0 top-1/2 -translate-y-1/2"
                    aria-label={tBattle("abilityRemove")}>
                    <Trash2 className="size-4" />
                  </Button>
                </div>
                <AccordionContent className="text-sm sm:text-base pb-3">
                  <Controller
                    name={`${fieldArrayName}.${index}.name`}
                    control={form.control}
                    render={({ field: nameField, fieldState }) => (
                      <Field
                        data-invalid={fieldState.invalid}
                        orientation="vertical"
                        className="mb-3">
                        <label
                          htmlFor={`${fieldArrayName}-name-${index}`}
                          className="text-sm font-medium">
                          {tBattle("name")}
                        </label>
                        <Input
                          {...nameField}
                          id={`${fieldArrayName}-name-${index}`}
                          className="text-sm"
                          aria-invalid={fieldState.invalid}
                          placeholder={tBattle("name")}
                        />
                        {fieldState.error && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />
                  <Controller
                    name={`${fieldArrayName}.${index}.description`}
                    control={form.control}
                    render={({ field: descField, fieldState }) => (
                      <Field
                        data-invalid={fieldState.invalid}
                        orientation="vertical"
                        className="mb-3">
                        <label
                          htmlFor={`${fieldArrayName}-description-${index}`}
                          className="text-sm font-medium">
                          {tBattle("description")}
                        </label>
                        <Textarea
                          {...descField}
                          id={`${fieldArrayName}-description-${index}`}
                          placeholder={tBattle("description")}
                          rows={3}
                          className="text-sm"
                        />
                        {fieldState.error && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />

                  <div className="mb-3 rounded-[15px] border border-border/80 p-3 space-y-3">
                    <Controller
                      name={`${fieldArrayName}.${index}.hasCounter`}
                      control={form.control}
                      render={({ field: hcField }) => (
                        <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3">
                          <div className="flex items-center gap-2 min-h-8">
                            <Checkbox
                              id={`${fieldArrayName}-hasCounter-${index}`}
                              checked={hcField.value === true}
                              onCheckedChange={(c) => {
                                const on = c === true;
                                hcField.onChange(on);
                                if (on) {
                                  const prevMax = form.getValues(`${fieldArrayName}.${index}.counterMax`);
                                  const prevCur = form.getValues(`${fieldArrayName}.${index}.counterCurrent`);
                                  form.setValue(
                                    `${fieldArrayName}.${index}.counterMax`,
                                    typeof prevMax === "number" && !Number.isNaN(prevMax) ? prevMax : 1,
                                    { shouldDirty: true },
                                  );
                                  form.setValue(
                                    `${fieldArrayName}.${index}.counterCurrent`,
                                    typeof prevCur === "number" && !Number.isNaN(prevCur) ? prevCur : 0,
                                    { shouldDirty: true },
                                  );
                                } else {
                                  form.setValue(`${fieldArrayName}.${index}.counterMax`, undefined, {
                                    shouldDirty: true,
                                  });
                                  form.setValue(`${fieldArrayName}.${index}.counterCurrent`, undefined, {
                                    shouldDirty: true,
                                  });
                                  form.setValue(`${fieldArrayName}.${index}.counterResetsOnShortRest`, undefined, {
                                    shouldDirty: true,
                                  });
                                  form.setValue(`${fieldArrayName}.${index}.counterResetsOnLongRest`, undefined, {
                                    shouldDirty: true,
                                  });
                                }
                                form.clearErrors(`${fieldArrayName}.${index}.counterMax`);
                                form.clearErrors(`${fieldArrayName}.${index}.counterCurrent`);
                              }}
                            />
                            <Label
                              htmlFor={`${fieldArrayName}-hasCounter-${index}`}
                              className="text-sm font-medium leading-none cursor-pointer">
                              {tBattle("abilityHasCounter")}
                            </Label>
                          </div>
                        </div>
                      )}
                    />
                    {hasCounter && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Controller
                          name={`${fieldArrayName}.${index}.counterMax`}
                          control={form.control}
                          render={({ field: maxField, fieldState }) => (
                            <Field
                              data-invalid={fieldState.invalid}
                              orientation="vertical">
                              <label
                                htmlFor={`${fieldArrayName}-counterMax-${index}`}
                                className="text-sm font-medium">
                                {tBattle("abilityCounterMax")}
                              </label>
                              <Input
                                name={maxField.name}
                                ref={maxField.ref}
                                value={
                                  maxField.value === undefined ||
                                  maxField.value === null ||
                                  maxField.value === ""
                                    ? ""
                                    : String(maxField.value)
                                }
                                id={`${fieldArrayName}-counterMax-${index}`}
                                type="number"
                                inputMode="numeric"
                                className="text-sm tabular-nums"
                                aria-invalid={fieldState.invalid}
                                aria-describedby={
                                  fieldState.error ? `${fieldArrayName}-counterMax-err-${index}` : undefined
                                }
                                onChange={(e) => {
                                  const v = e.target.value;
                                  if (v === "") {
                                    maxField.onChange("");
                                    form.clearErrors(`${fieldArrayName}.${index}.counterMax`);
                                    return;
                                  }
                                  const n = Number(v);
                                  if (!Number.isFinite(n)) return;
                                  maxField.onChange(n);
                                  form.clearErrors(`${fieldArrayName}.${index}.counterMax`);
                                }}
                                onBlur={() => {
                                  const path = `${fieldArrayName}.${index}.counterMax` as const;
                                  const raw = form.getValues(path);
                                  if (raw === "" || raw === undefined || raw === null) {
                                    form.clearErrors(path);
                                    maxField.onBlur();
                                    return;
                                  }
                                  maxField.onBlur();
                                  void form.trigger(path);
                                }}
                              />
                              {fieldState.error && (
                                <FieldError
                                  id={`${fieldArrayName}-counterMax-err-${index}`}
                                  errors={[fieldState.error]}
                                />
                              )}
                            </Field>
                          )}
                        />
                        {showCurrentCounter && (
                          <Controller
                            name={`${fieldArrayName}.${index}.counterCurrent`}
                            control={form.control}
                            render={({ field: curField, fieldState }) => (
                              <Field
                                data-invalid={fieldState.invalid}
                                orientation="vertical">
                                <label
                                  htmlFor={`${fieldArrayName}-counterCurrent-${index}`}
                                  className="text-sm font-medium">
                                  {tBattle("abilityCounterCurrent")}
                                </label>
                                <Input
                                  name={curField.name}
                                  ref={curField.ref}
                                  value={
                                    curField.value === undefined || curField.value === null
                                      ? ""
                                      : String(curField.value)
                                  }
                                  id={`${fieldArrayName}-counterCurrent-${index}`}
                                  type="number"
                                  inputMode="numeric"
                                  max={typeof counterMaxVal === "number" ? counterMaxVal : undefined}
                                  className="text-sm tabular-nums"
                                  aria-invalid={fieldState.invalid}
                                  aria-describedby={
                                    fieldState.error ? `${fieldArrayName}-counterCurrent-err-${index}` : undefined
                                  }
                                  onChange={(e) => {
                                    const v = e.target.value;
                                    if (v === "") {
                                      curField.onChange(undefined);
                                    } else {
                                      const n = parseInt(v, 10);
                                      curField.onChange(Number.isNaN(n) ? undefined : n);
                                    }
                                    form.clearErrors(`${fieldArrayName}.${index}.counterCurrent`);
                                  }}
                                  onBlur={(e) => {
                                    if (e.target.value === "") {
                                      curField.onChange(0);
                                    }
                                    curField.onBlur();
                                    form.trigger(`${fieldArrayName}.${index}.counterCurrent`);
                                  }}
                                />
                                {fieldState.error && (
                                  <FieldError
                                    id={`${fieldArrayName}-counterCurrent-err-${index}`}
                                    errors={[fieldState.error]}
                                  />
                                )}
                              </Field>
                            )}
                          />
                        )}
                        <fieldset className="min-w-0 border-0 p-0 m-0 sm:col-span-2">
                          <legend className="sr-only">{tBattle("abilityCounterResetLegend")}</legend>
                          <div className="grid grid-cols-1 gap-2">
                            <Controller
                              name={`${fieldArrayName}.${index}.counterResetsOnShortRest`}
                              control={form.control}
                              render={({ field: srField }) => (
                                <div className="flex w-full min-w-0 min-h-10 items-start gap-2 rounded-[15px] bg-gray-middle-light pl-2 pr-3 py-1.5">
                                  <Clock
                                    size={20}
                                    className="mt-0.5 shrink-0 text-white sm:size-6"
                                    aria-hidden
                                  />
                                  <Checkbox
                                    id={`${fieldArrayName}-counterResetShort-${index}`}
                                    checked={srField.value === true}
                                    onCheckedChange={(c) => srField.onChange(c === true)}
                                    className="mt-0.5 shrink-0"
                                  />
                                  <Label
                                    htmlFor={`${fieldArrayName}-counterResetShort-${index}`}
                                    className="min-w-0 flex-1 cursor-pointer text-xs sm:text-sm font-normal leading-snug break-words">
                                    <span className="2xl:hidden">{tBattle("abilityCounterResetShortRestShort")}</span>
                                    <span className="hidden 2xl:inline">{tBattle("abilityCounterResetShortRest")}</span>
                                  </Label>
                                </div>
                              )}
                            />
                            <Controller
                              name={`${fieldArrayName}.${index}.counterResetsOnLongRest`}
                              control={form.control}
                              render={({ field: lrField }) => (
                                <div className="flex w-full min-w-0 min-h-10 items-start gap-2 rounded-[15px] bg-gray-middle-light pl-2 pr-3 py-1.5">
                                  <Moon
                                    size={20}
                                    className="mt-0.5 shrink-0 text-white sm:size-6"
                                    aria-hidden
                                  />
                                  <Checkbox
                                    id={`${fieldArrayName}-counterResetLong-${index}`}
                                    checked={lrField.value === true}
                                    onCheckedChange={(c) => lrField.onChange(c === true)}
                                    className="mt-0.5 shrink-0"
                                  />
                                  <Label
                                    htmlFor={`${fieldArrayName}-counterResetLong-${index}`}
                                    className="min-w-0 flex-1 cursor-pointer text-xs sm:text-sm font-normal leading-snug break-words">
                                    <span className="2xl:hidden">{tBattle("abilityCounterResetLongRestShort")}</span>
                                    <span className="hidden 2xl:inline">{tBattle("abilityCounterResetLongRest")}</span>
                                  </Label>
                                </div>
                              )}
                            />
                          </div>
                        </fieldset>
                      </div>
                    )}
                    {abilityCounterMode === "player" && hasCounter && !isInSession && (
                      <p
                        className="text-xs text-muted-foreground"
                        role="note">
                        {tBattle("abilityCounterPlayerSessionNote")}
                      </p>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}
    </Card>
  );
};

export default AbilitiesUpdateSection;
