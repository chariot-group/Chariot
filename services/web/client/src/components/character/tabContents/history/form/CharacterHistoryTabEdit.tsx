import { Controller, UseFormReturn, FieldValues } from "react-hook-form";
import { Field, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { StoredUnitNumberInput } from "@/components/ui/stored-unit-number-input";
import { Card } from "@/components/ui/card";
import { useTranslations } from "next-intl";
import { Cake, Eye, PersonStanding, Ruler, Scale, Scissors } from "lucide-react";
import { useDistanceUnit } from "@/hooks/useDistanceUnit";
import { Textarea } from "@/components/ui/textarea";

interface CharacterHistoryTabEditProps {
  accentColor: string;
  form: UseFormReturn<FieldValues>;
}

export default function CharacterHistoryTabEdit({ accentColor, form }: CharacterHistoryTabEditProps) {
  const t = useTranslations("characterDetail.history");
  const { displayHeight, heightLabel, toHeightFeet, displayWeight, weightLabel, toWeightLbs } = useDistanceUnit();

  return (
    <div
      className="w-full grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-2 md:gap-4"
      role="main"
      aria-labelledby="history-tab-edit">
      <h2
        id="history-tab-edit"
        className="sr-only">
        {t("backstory")}
      </h2>

      {/* Col 1: Apparence */}
      <div className="xl:row-span-2">
        <Card className="gap-4 h-full">
          <h2
            id="appearance-title"
            className={`${accentColor} text-xl md:text-2xl font-semibold`}>
            {t("appearance")}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Controller
              name="appearance.eyes"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field
                  data-invalid={fieldState.invalid}
                  orientation="vertical">
                  <label
                    htmlFor="appearance-eyes"
                    className="text-sm text-muted-foreground font-medium flex flex-row items-center gap-1">
                    <Eye
                      className="shrink-0 w-4 h-4"
                      aria-hidden="true"
                    />
                    {t("eyes")}
                  </label>
                  <Input
                    {...field}
                    id="appearance-eyes"
                    tabIndex={1}
                    aria-invalid={fieldState.invalid}
                    aria-describedby={fieldState.error ? "appearance-eyes-error" : undefined}
                    placeholder={t("eyes")}
                    type="text"
                  />
                  {fieldState.error && (
                    <FieldError
                      id="appearance-eyes-error"
                      errors={[fieldState.error]}
                    />
                  )}
                </Field>
              )}
            />

            <Controller
              name="appearance.age"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field
                  data-invalid={fieldState.invalid}
                  orientation="vertical">
                  <label
                    htmlFor="appearance-age"
                    className="text-sm text-muted-foreground font-medium flex flex-row items-center gap-1">
                    <Cake
                      className="shrink-0 w-4 h-4"
                      aria-hidden="true"
                    />
                    {t("age")}
                  </label>
                  <Input
                    {...field}
                    min={0}
                    value={field.value ?? ""}
                    id="appearance-age"
                    tabIndex={2}
                    aria-invalid={fieldState.invalid}
                    aria-describedby={fieldState.error ? "appearance-age-error" : undefined}
                    placeholder={t("age")}
                    type="number"
                  />
                  {fieldState.error && (
                    <FieldError
                      id="appearance-age-error"
                      errors={[fieldState.error]}
                    />
                  )}
                </Field>
              )}
            />

            <Controller
              name="appearance.skin"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field
                  data-invalid={fieldState.invalid}
                  orientation="vertical">
                  <label
                    htmlFor="appearance-skin"
                    className="text-sm text-muted-foreground font-medium flex flex-row items-center gap-1">
                    <PersonStanding
                      className="shrink-0 w-4 h-4"
                      aria-hidden="true"
                    />
                    {t("skin")}
                  </label>
                  <Input
                    {...field}
                    id="appearance-skin"
                    tabIndex={3}
                    aria-invalid={fieldState.invalid}
                    aria-describedby={fieldState.error ? "appearance-skin-error" : undefined}
                    placeholder={t("skin")}
                    type="text"
                  />
                  {fieldState.error && (
                    <FieldError
                      id="appearance-skin-error"
                      errors={[fieldState.error]}
                    />
                  )}
                </Field>
              )}
            />

            <Controller
              name="appearance.height"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field
                  data-invalid={fieldState.invalid}
                  orientation="vertical">
                  <label
                    htmlFor="appearance-height"
                    className="text-sm text-muted-foreground font-medium flex flex-row items-center gap-1">
                    <Ruler
                      className="shrink-0 w-4 h-4"
                      aria-hidden="true"
                    />
                    {t("height")} <span className="text-muted-foreground font-normal">({heightLabel})</span>
                  </label>
                  <StoredUnitNumberInput
                    {...field}
                    storedValue={field.value}
                    onStoredChange={field.onChange}
                    toDisplay={displayHeight}
                    toStored={toHeightFeet}
                    id="appearance-height"
                    tabIndex={4}
                    min={0}
                    step={0.1}
                    aria-invalid={fieldState.invalid}
                    aria-describedby={fieldState.error ? "appearance-height-error" : undefined}
                    placeholder={`${t("height")} (${heightLabel})`}
                    type="number"
                  />
                  {fieldState.error && (
                    <FieldError
                      id="appearance-height-error"
                      errors={[fieldState.error]}
                    />
                  )}
                </Field>
              )}
            />

            <Controller
              name="appearance.weight"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field
                  data-invalid={fieldState.invalid}
                  orientation="vertical">
                  <label
                    htmlFor="appearance-weight"
                    className="text-sm text-muted-foreground font-medium flex flex-row items-center gap-1">
                    <Scale
                      className="shrink-0 w-4 h-4"
                      aria-hidden="true"
                    />
                    {t("weight")} <span className="text-muted-foreground font-normal">({weightLabel})</span>
                  </label>
                  <StoredUnitNumberInput
                    {...field}
                    storedValue={field.value}
                    onStoredChange={field.onChange}
                    toDisplay={displayWeight}
                    toStored={toWeightLbs}
                    id="appearance-weight"
                    tabIndex={5}
                    min={0}
                    step={0.1}
                    aria-invalid={fieldState.invalid}
                    aria-describedby={fieldState.error ? "appearance-weight-error" : undefined}
                    placeholder={`${t("weight")} (${weightLabel})`}
                    type="number"
                  />
                  {fieldState.error && (
                    <FieldError
                      id="appearance-weight-error"
                      errors={[fieldState.error]}
                    />
                  )}
                </Field>
              )}
            />

            <Controller
              name="appearance.hair"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field
                  data-invalid={fieldState.invalid}
                  orientation="vertical">
                  <label
                    htmlFor="appearance-hair"
                    className="text-sm text-muted-foreground font-medium flex flex-row items-center gap-1">
                    <Scissors
                      className="shrink-0 w-4 h-4"
                      aria-hidden="true"
                    />
                    {t("hair")}
                  </label>
                  <Input
                    {...field}
                    id="appearance-hair"
                    tabIndex={6}
                    aria-invalid={fieldState.invalid}
                    aria-describedby={fieldState.error ? "appearance-hair-error" : undefined}
                    placeholder={t("hair")}
                    type="text"
                  />
                  {fieldState.error && (
                    <FieldError
                      id="appearance-hair-error"
                      errors={[fieldState.error]}
                    />
                  )}
                </Field>
              )}
            />
          </div>
        </Card>
      </div>

      {/* Cols 2–4 row 1: Traits | Alliés | Liens */}
      <Card className="gap-3 py-4 px-4 md:px-6">
        <h2
          id="background-personalityTraits-title"
          className={`${accentColor} text-xl md:text-2xl font-semibold`}>
          {t("personalityTraits")}
        </h2>

        <Controller
          name="background.personalityTraits"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field
              data-invalid={fieldState.invalid}
              orientation="vertical">
              <Textarea
                {...field}
                id="background-personalityTraits"
                tabIndex={7}
                aria-invalid={fieldState.invalid}
                aria-describedby={fieldState.error ? "background-personalityTraits-error" : undefined}
                placeholder={t("personalityTraits")}
                rows={6}
              />
              {fieldState.error && (
                <FieldError
                  id="background-personalityTraits-error"
                  errors={[fieldState.error]}
                />
              )}
            </Field>
          )}
        />
      </Card>

      <Card className="gap-3 py-4 px-4 md:px-6">
        <h2
          id="background-alliesAndOrgs-title"
          className={`${accentColor} text-xl md:text-2xl font-semibold`}>
          {t("alliesAndOrgs")}
        </h2>

        <Controller
          name="background.alliesAndOrgs"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field
              data-invalid={fieldState.invalid}
              orientation="vertical">
              <Textarea
                {...field}
                id="background-alliesAndOrgs"
                tabIndex={8}
                aria-invalid={fieldState.invalid}
                aria-describedby={fieldState.error ? "background-alliesAndOrgs-error" : undefined}
                placeholder={t("alliesAndOrgs")}
                rows={6}
              />
              {fieldState.error && (
                <FieldError
                  id="background-alliesAndOrgs-error"
                  errors={[fieldState.error]}
                />
              )}
            </Field>
          )}
        />
      </Card>

      <Card className="gap-3 py-4 px-4 md:px-6">
        <h2
          id="background-bonds-title"
          className={`${accentColor} text-xl md:text-2xl font-semibold`}>
          {t("bonds")}
        </h2>

        <Controller
          name="background.bonds"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field
              data-invalid={fieldState.invalid}
              orientation="vertical">
              <Textarea
                {...field}
                id="background-bonds"
                tabIndex={9}
                aria-invalid={fieldState.invalid}
                aria-describedby={fieldState.error ? "background-bonds-error" : undefined}
                placeholder={t("bonds")}
                rows={6}
              />
              {fieldState.error && (
                <FieldError
                  id="background-bonds-error"
                  errors={[fieldState.error]}
                />
              )}
            </Field>
          )}
        />
      </Card>

      {/* Cols 2–4 row 2: Idéaux | Défauts (equal width) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4 xl:col-start-2 xl:col-span-3">
        <Card className="gap-3 py-4 px-4 md:px-6">
          <h2
            id="background-ideals-title"
            className={`${accentColor} text-xl md:text-2xl font-semibold`}>
            {t("ideals")}
          </h2>

          <Controller
            name="background.ideals"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field
                data-invalid={fieldState.invalid}
                orientation="vertical">
                <Textarea
                  {...field}
                  id="background-ideals"
                  tabIndex={10}
                  aria-invalid={fieldState.invalid}
                  aria-describedby={fieldState.error ? "background-ideals-error" : undefined}
                  placeholder={t("ideals")}
                  rows={6}
                />
                {fieldState.error && (
                  <FieldError
                    id="background-ideals-error"
                    errors={[fieldState.error]}
                  />
                )}
              </Field>
            )}
          />
        </Card>

        <Card className="gap-3 py-4 px-4 md:px-6">
          <h2
            id="background-flaws-title"
            className={`${accentColor} text-xl md:text-2xl font-semibold`}>
            {t("flaws")}
          </h2>

          <Controller
            name="background.flaws"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field
                data-invalid={fieldState.invalid}
                orientation="vertical">
                <Textarea
                  {...field}
                  id="background-flaws"
                  tabIndex={11}
                  aria-invalid={fieldState.invalid}
                  aria-describedby={fieldState.error ? "background-flaws-error" : undefined}
                  placeholder={t("flaws")}
                  rows={6}
                />
                {fieldState.error && (
                  <FieldError
                    id="background-flaws-error"
                    errors={[fieldState.error]}
                  />
                )}
              </Field>
            )}
          />
        </Card>
      </div>

      {/* Ligne 2: Histoire | Description */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4 col-span-1 lg:col-span-2 xl:col-span-4">
        <Card className="gap-3 py-4 px-4 md:px-6">
          <h2
            id="background-backstory-title"
            className={`${accentColor} text-xl md:text-2xl font-semibold`}>
            {t("backstory")}
          </h2>

          <Controller
            name="background.backstory"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field
                data-invalid={fieldState.invalid}
                orientation="vertical">
                <Textarea
                  {...field}
                  id="background-backstory"
                  tabIndex={12}
                  aria-invalid={fieldState.invalid}
                  aria-describedby={fieldState.error ? "background-backstory-error" : undefined}
                  placeholder={t("backstory")}
                  rows={6}
                />
                {fieldState.error && (
                  <FieldError
                    id="background-backstory-error"
                    errors={[fieldState.error]}
                  />
                )}
              </Field>
            )}
          />
        </Card>

        <Card className="gap-3 py-4 px-4 md:px-6">
          <h2
            id="background-description-title"
            className={`${accentColor} text-xl md:text-2xl font-semibold`}>
            {t("description")}
          </h2>

          <Controller
            name="appearance.description"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field
                data-invalid={fieldState.invalid}
                orientation="vertical">
                <Textarea
                  {...field}
                  id="appearance-description"
                  tabIndex={13}
                  aria-invalid={fieldState.invalid}
                  aria-describedby={fieldState.error ? "appearance-description-error" : undefined}
                  placeholder={t("description")}
                  rows={6}
                />
                {fieldState.error && (
                  <FieldError
                    id="appearance-description-error"
                    errors={[fieldState.error]}
                  />
                )}
              </Field>
            )}
          />
        </Card>
      </div>
    </div>
  );
}
