import { Accordion } from "@/components/ui/accordion";
import ListCard, { EDIT_LIST_MAX_HEIGHT_CLASS } from "@/components/character/tabContents/shared/listCard/ListCard";
import ListRow from "@/components/character/tabContents/shared/listCard/ListRow";
import ListFormSection from "@/components/character/tabContents/shared/listCard/ListFormSection";
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
  useFormState,
} from "react-hook-form";
import { useTranslations } from "next-intl";
import { useEffect, useId, useRef, useState } from "react";
import { Plus, Trash2, Moon, Clock } from "lucide-react";
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
  /** Layout classes of the wrapping section (e.g. bento slot + gap). */
  className?: string;
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
  className,
}: AbilitiesUpdateSectionProps) => {
  const tMagic = useTranslations("characterDetail.magic");
  const tEdit = useTranslations("characterDetail.edit");
  const tBattle = useTranslations("characterDetail.battle");
  const isInSession = useAppSelector(selectIsInSession);
  const showCurrentCounter = abilityCounterMode === "npc" || (abilityCounterMode === "player" && isInSession);

  const headingId = useId();
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const [openAccordionValues, setOpenAccordionValues] = useState<string[]>([]);
  const hasAbilities = fields.length > 0;
  const { submitCount } = useFormState({ control: form.control });

  // Submitting with errors opens the invalid rows (FR-character-list-card).
  useEffect(() => {
    if (submitCount === 0) return;
    const invalid = fields
      .map((_, index) => (form.getFieldState(`${fieldArrayName}.${index}`).invalid ? `ability-${index}` : null))
      .filter((value): value is string => value !== null);
    if (invalid.length === 0) return;
    setOpenAccordionValues((prev) => Array.from(new Set([...prev, ...invalid])));
    setTimeout(() => {
      document.getElementById(invalid[0])?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 350);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitCount]);

  const addAbility = () => {
    append({ name: "", description: "", hasCounter: false });
    const newIndex = fields.length;
    setOpenAccordionValues((prev) => [...prev, `ability-${newIndex}`]);
    setTimeout(() => {
      document.getElementById(`ability-${newIndex}`)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      document.getElementById(`${fieldArrayName}-name-${newIndex}`)?.focus({ preventScroll: true });
    }, 350);
  };

  const removeAbility = (index: number) => {
    remove(index);
    setOpenAccordionValues((prev) =>
      prev
        .filter((value) => value !== `ability-${index}`)
        .map((value) => {
          const i = Number(value.replace("ability-", ""));
          return i > index ? `ability-${i - 1}` : value;
        }),
    );
    setTimeout(() => {
      const next = document.getElementById(`${headingId}-trigger-${Math.min(index, fields.length - 2)}`);
      (next ?? addButtonRef.current)?.focus();
    }, 0);
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
          onClick={addAbility}
          aria-label={tBattle("abilityAdd")}
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
        if (!hasAbilities) return;
        setOpenAccordionValues(openAccordionValues.length > 0 ? [] : fields.map((_, index) => `ability-${index}`));
      }}
      expandLabel={tMagic("expandAll")}
      collapseLabel={tMagic("collapseAll")}
      emptyLabel={tBattle("noAbilities")}>
      <Accordion
        type="multiple"
        value={openAccordionValues}
        onValueChange={setOpenAccordionValues}
        className="w-full">
        {fields.map((field, index) => {
          const abilityName = form.watch(`${fieldArrayName}.${index}.name`);
          const hasCounter = form.watch(`${fieldArrayName}.${index}.hasCounter`) === true;
          const counterMaxVal = form.watch(`${fieldArrayName}.${index}.counterMax`);
          const counterCurrentVal = form.watch(`${fieldArrayName}.${index}.counterCurrent`) ?? 0;
          const resetsShort = form.watch(`${fieldArrayName}.${index}.counterResetsOnShortRest`) === true;
          const resetsLong = form.watch(`${fieldArrayName}.${index}.counterResetsOnLongRest`) === true;
          const hasError = form.getFieldState(`${fieldArrayName}.${index}`).invalid;
          const label = abilityName || `${index + 1}`;
          const meta = [
            resetsShort && (
              <Clock
                key="short"
                role="img"
                className="inline size-3.5 text-white sm:size-4"
                aria-label={tBattle("abilityCounterResetShortRest")}
              />
            ),
            resetsLong && (
              <Moon
                key="long"
                role="img"
                className="inline size-3.5 text-white sm:size-4"
                aria-label={tBattle("abilityCounterResetLongRest")}
              />
            ),
            hasCounter && counterMaxVal !== undefined && counterMaxVal !== null && counterMaxVal !== "" && (
              <span
                key="counter"
                className="tabular-nums font-medium">
                {tBattle("abilityCounterShort", {
                  current: Number(counterMaxVal) - Number(counterCurrentVal),
                  max: counterMaxVal,
                })}
              </span>
            ),
          ].filter(Boolean);

          return (
            <ListRow
              key={field.id}
              id={`ability-${index}`}
              value={`ability-${index}`}
              triggerId={`${headingId}-trigger-${index}`}
              name={abilityName || "—"}
              meta={meta}
              triggerLabel={`${tBattle("details")} ${label}`}
              isOpen={openAccordionValues.includes(`ability-${index}`)}
              hasError={hasError}
              trailing={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeAbility(index)}
                  className="text-red-500"
                  aria-label={`${tBattle("abilityRemove")} ${label}`}>
                  <Trash2
                    className="size-4"
                    aria-hidden="true"
                  />
                </Button>
              }
              contentClassName="flex flex-col gap-4 pt-1">
              <ListFormSection title={tBattle("formSections.general")}>
                <Controller
                  name={`${fieldArrayName}.${index}.name`}
                  control={form.control}
                  render={({ field: nameField, fieldState }) => (
                    <Field
                      data-invalid={fieldState.invalid}
                      orientation="vertical">
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
                      orientation="vertical">
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
              </ListFormSection>
              <ListFormSection title={tBattle("formSections.counter")}>
                <div className="flex flex-col gap-3">
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
                    <div className="grid grid-cols-1 gap-3 @md:grid-cols-2">
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
                                maxField.value === undefined || maxField.value === null || maxField.value === ""
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
                                  curField.value === undefined || curField.value === null ? "" : String(curField.value)
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
                      <fieldset className="min-w-0 border-0 p-0 m-0 @md:col-span-2">
                        <legend className="sr-only">{tBattle("abilityCounterResetLegend")}</legend>
                        <div className="grid grid-cols-1 gap-2 @md:grid-cols-2">
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
              </ListFormSection>
            </ListRow>
          );
        })}
      </Accordion>
    </ListCard>
  );
};

export default AbilitiesUpdateSection;
