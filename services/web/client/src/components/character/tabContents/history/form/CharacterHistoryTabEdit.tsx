import { Controller, UseFormReturn, FieldValues } from "react-hook-form";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { StoredUnitNumberInput } from "@/components/ui/stored-unit-number-input";
import { useTranslations } from "next-intl";
import { Cake, Eye, PersonStanding, Ruler, Scale, Scissors } from "lucide-react";
import { useDistanceUnit } from "@/hooks/useDistanceUnit";
import { Textarea } from "@/components/ui/textarea";
import GeneralSectionCard from "@/components/character/tabContents/general/shared/GeneralSectionCard";
import {
  APPEARANCE_DESCRIPTION_FIELD,
  HISTORY_BENTO_GRID_CLASS,
  HISTORY_SUBHEADING_CLASS,
  HISTORY_SLOTS,
  HISTORY_TEXT_FIELDS,
  historyHeadingId,
} from "@/components/character/tabContents/history/shared/historyBentoLayout";

interface CharacterHistoryTabEditProps {
  accentColor: string;
  form: UseFormReturn<FieldValues>;
}

const APPEARANCE_FIELDS = [
  { key: "eyes", icon: Eye, kind: "text" },
  { key: "age", icon: Cake, kind: "number" },
  { key: "skin", icon: PersonStanding, kind: "text" },
  { key: "height", icon: Ruler, kind: "height" },
  { key: "weight", icon: Scale, kind: "weight" },
  { key: "hair", icon: Scissors, kind: "text" },
] as const;

/**
 * History tab, edit mode: same cards and zones as read mode.
 * @see FR-character-history-bento-layout
 */
export default function CharacterHistoryTabEdit({ accentColor, form }: CharacterHistoryTabEditProps) {
  const t = useTranslations("characterDetail.history");
  const { displayHeight, heightLabel, toHeightFeet, displayWeight, weightLabel, toWeightLbs } = useDistanceUnit();
  const units = {
    height: { label: heightLabel, toDisplay: displayHeight, toStored: toHeightFeet },
    weight: { label: weightLabel, toDisplay: displayWeight, toStored: toWeightLbs },
  };

  return (
    <div className={HISTORY_BENTO_GRID_CLASS}>
      <GeneralSectionCard
        headingId={historyHeadingId("appearance")}
        title={t("appearance")}
        accentColor={accentColor}
        className={HISTORY_SLOTS.appearance}>
        <div className="grid min-w-0 grid-cols-2 gap-3 @sm:grid-cols-3 @3xl:grid-cols-6">
          {APPEARANCE_FIELDS.map(({ key, icon: Icon, kind }) => {
            const id = `appearance-${key}`;
            const errorId = `${id}-error`;
            const unit = kind === "height" || kind === "weight" ? units[kind] : null;
            return (
              <Controller
                key={key}
                name={`appearance.${key}`}
                control={form.control}
                render={({ field, fieldState }) => {
                  const shared = {
                    id,
                    "aria-invalid": fieldState.invalid,
                    "aria-describedby": fieldState.error ? errorId : undefined,
                  };
                  return (
                    <Field
                      className="min-w-0"
                      data-invalid={fieldState.invalid}
                      orientation="vertical">
                      <FieldLabel
                        htmlFor={id}
                        className="min-w-0 items-center gap-1 text-sm font-medium text-muted-foreground">
                        <Icon
                          className="size-4 shrink-0"
                          aria-hidden="true"
                        />
                        <span className="wrap-break-word">
                          {t(key)}
                          {unit && <span className="font-normal"> ({unit.label})</span>}
                        </span>
                      </FieldLabel>
                      {unit ? (
                        <StoredUnitNumberInput
                          {...field}
                          {...shared}
                          storedValue={field.value}
                          onStoredChange={field.onChange}
                          toDisplay={unit.toDisplay}
                          toStored={unit.toStored}
                          min={0}
                          step={0.1}
                          placeholder={`${t(key)} (${unit.label})`}
                        />
                      ) : (
                        <Input
                          {...field}
                          {...shared}
                          value={field.value ?? ""}
                          type={kind}
                          min={kind === "number" ? 0 : undefined}
                          placeholder={t(key)}
                        />
                      )}
                      {fieldState.error && (
                        <FieldError
                          id={errorId}
                          errors={[fieldState.error]}
                        />
                      )}
                    </Field>
                  );
                }}
              />
            );
          })}
        </div>
        <Controller
          name={APPEARANCE_DESCRIPTION_FIELD.name}
          control={form.control}
          render={({ field, fieldState }) => {
            const { inputId } = APPEARANCE_DESCRIPTION_FIELD;
            return (
              <Field
                className="min-w-0 gap-1.5"
                data-invalid={fieldState.invalid}
                orientation="vertical">
                <FieldLabel
                  htmlFor={inputId}
                  className={HISTORY_SUBHEADING_CLASS}>
                  {t(APPEARANCE_DESCRIPTION_FIELD.key)}
                </FieldLabel>
                <Textarea
                  {...field}
                  value={field.value ?? ""}
                  id={inputId}
                  aria-invalid={fieldState.invalid}
                  aria-describedby={fieldState.error ? `${inputId}-error` : undefined}
                  placeholder={t(APPEARANCE_DESCRIPTION_FIELD.key)}
                  className="min-h-36"
                />
                {fieldState.error && (
                  <FieldError
                    id={`${inputId}-error`}
                    errors={[fieldState.error]}
                  />
                )}
              </Field>
            );
          }}
        />
      </GeneralSectionCard>
      {HISTORY_TEXT_FIELDS.map(({ key, name, inputId, slot }) => (
        <GeneralSectionCard
          key={key}
          headingId={historyHeadingId(key)}
          title={t(key)}
          accentColor={accentColor}
          className={slot}>
          <Controller
            name={name}
            control={form.control}
            render={({ field, fieldState }) => (
              <Field
                className="flex-1"
                data-invalid={fieldState.invalid}
                orientation="vertical">
                {/* The card heading already names the field. */}
                <FieldLabel
                  htmlFor={inputId}
                  className="sr-only">
                  {t(key)}
                </FieldLabel>
                <Textarea
                  {...field}
                  value={field.value ?? ""}
                  id={inputId}
                  aria-invalid={fieldState.invalid}
                  aria-describedby={fieldState.error ? `${inputId}-error` : undefined}
                  placeholder={t(key)}
                  className="min-h-36 flex-1"
                />
                {fieldState.error && (
                  <FieldError
                    id={`${inputId}-error`}
                    errors={[fieldState.error]}
                  />
                )}
              </Field>
            )}
          />
        </GeneralSectionCard>
      ))}
    </div>
  );
}
