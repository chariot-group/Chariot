import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { StoredUnitNumberInput } from "@/components/ui/stored-unit-number-input";
import { Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Controller, FieldValues, UseFormReturn, useFieldArray } from "react-hook-form";
import { useDistanceUnit } from "@/hooks/useDistanceUnit";

interface SensesUpdateSectionProps {
  accentColor: string;
  form: UseFormReturn<FieldValues>;
  embedded?: boolean;
}

export default function SensesUpdateSection({ accentColor, form, embedded = false }: SensesUpdateSectionProps) {
  const t = useTranslations("characterDetail.player.general");
  const { displayFt, toFeet, unitLabel } = useDistanceUnit();
  const {
    fields: senseFields,
    append: appendSense,
    remove: removeSense,
  } = useFieldArray({
    control: form.control,
    name: "stats.senses",
  });

  const content = (
    <>
      <div className="flex items-center justify-between gap-2">
        {!embedded && (
          <h2
            id="senses-heading-edit"
            className={`text-xl sm:text-2xl font-semibold truncate ${accentColor}`}>
            {t("senses")}
          </h2>
        )}
      </div>

      {senseFields.length > 0 ? (
        <div className="flex flex-col gap-2">
          {senseFields.map((senseField, index) => (
            <div
              key={senseField.id}
              className="grid grid-cols-[minmax(0,1fr)_6.5rem_auto] gap-2 items-start">
              <Controller
                name={`stats.senses.${index}.name`}
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    orientation="vertical"
                    className="min-w-0">
                    <label
                      htmlFor={`sense-name-${index}`}
                      className="sr-only">
                      {t("senseName")}
                    </label>
                    <Input
                      {...field}
                      value={field.value || ""}
                      id={`sense-name-${index}`}
                      aria-invalid={fieldState.invalid}
                      aria-describedby={fieldState.error ? `sense-name-${index}-error` : undefined}
                      placeholder={t("senseNamePlaceholder")}
                      type="text"
                    />
                    {fieldState.error && (
                      <FieldError
                        id={`sense-name-${index}-error`}
                        errors={[fieldState.error]}
                      />
                    )}
                  </Field>
                )}
              />

              <Controller
                name={`stats.senses.${index}.value`}
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    orientation="vertical"
                    className="min-w-0">
                    <label
                      htmlFor={`sense-value-${index}`}
                      className="sr-only">
                      {t("senseValue")}
                    </label>
                    <StoredUnitNumberInput
                      {...field}
                      storedValue={field.value}
                      onStoredChange={field.onChange}
                      toDisplay={displayFt}
                      toStored={toFeet}
                      emptyValue={null}
                      id={`sense-value-${index}`}
                      aria-invalid={fieldState.invalid}
                      aria-describedby={fieldState.error ? `sense-value-${index}-error` : undefined}
                      placeholder={`${t("senseValue")} (${unitLabel})`}
                      type="number"
                      min="0"
                    />
                    {fieldState.error && (
                      <FieldError
                        id={`sense-value-${index}-error`}
                        errors={[fieldState.error]}
                      />
                    )}
                  </Field>
                )}
              />

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeSense(index)}
                className="self-start justify-self-end text-red hover:bg-red/10"
                aria-label={t("removeSense")}>
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm sm:text-base text-muted-foreground">{t("noSenses")}</p>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => appendSense({ name: "", value: null })}
        className="w-fit"
        aria-label={t("addSense")}>
        <Plus className="size-4" />
        <span>{t("addSense")}</span>
      </Button>
    </>
  );

  return embedded ? (
    <div className="flex flex-col gap-3">{content}</div>
  ) : (
    <Card
      className="gap-3 py-4 px-4 md:px-6"
      role="region"
      aria-labelledby="senses-heading-edit">
      {content}
    </Card>
  );
}
