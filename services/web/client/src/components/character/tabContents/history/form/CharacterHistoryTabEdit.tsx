import { Character } from "@/types/character";
import { Controller, UseFormReturn } from "react-hook-form";
import { Field, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useTranslations } from "next-intl";
import { Cake, Eye, PersonStanding, Ruler, Scale, Scissors } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

interface CharacterHistoryTabEditProps {
  character: Character;
  accentColor: string;
  form: UseFormReturn<any>;
}

export default function CharacterHistoryTabEdit({ character, accentColor, form }: CharacterHistoryTabEditProps) {
  const t = useTranslations("characterDetail.history");

  return (
    <div
      className="w-full grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-2 md:gap-4"
      role="main"
      aria-labelledby="history-tab-edit">
      <h2 id="history-tab-edit" className="sr-only">
        {t("backstory")}
      </h2>

      <div className="flex flex-col gap-2 md:gap-4">

        {/* Section Apparence */}
        <Card className="gap-4">
          <h2
            id="appearance-title"
            className={`${accentColor} text-xl md:text-2xl font-semibold`}>
            {t("appearance")}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Yeux */}
            <Controller
              name="appearance.eyes"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} orientation="vertical">
                  <label htmlFor="appearance-eyes" className="text-sm text-muted-foreground font-medium flex flex-row items-center gap-1">
                    <Eye
                      className="shrink-0 w-4 h-4"
                      aria-hidden="true"
                    />
                    {t("eyes")}
                  </label>
                  <Input
                    {...field}
                    id="appearance-eyes"
                    aria-invalid={fieldState.invalid}
                    aria-describedby={fieldState.error ? "appearance-eyes-error" : undefined}
                    placeholder={t("eyes")}
                    type="text"
                  />
                  {fieldState.error && <FieldError id="appearance-eyes-error" errors={[fieldState.error]} />}
                </Field>
              )}
            />

            {/* Âge */}
            <Controller
              name="appearance.age"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} orientation="vertical">
                  <label htmlFor="appearance-age" className="text-sm text-muted-foreground font-medium flex flex-row items-center gap-1">
                    <Cake
                      className="shrink-0 w-4 h-4"
                      aria-hidden="true"
                    />
                    {t("age")}
                  </label>
                  <Input
                    {...field}
                    onChange={(e) => {
                      const value = e.target.valueAsNumber;
                      field.onChange(isNaN(value) ? undefined : value);
                    }}
                    value={field.value ?? ""}
                    id="appearance-age"
                    aria-invalid={fieldState.invalid}
                    aria-describedby={fieldState.error ? "appearance-age-error" : undefined}
                    placeholder={t("age")}
                    type="number"
                  />
                  {fieldState.error && <FieldError id="appearance-age-error" errors={[fieldState.error]} />}
                </Field>
              )}
            />

            {/* Peau */}
            <Controller
              name="appearance.skin"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} orientation="vertical">
                  <label htmlFor="appearance-skin" className="text-sm text-muted-foreground font-medium flex flex-row items-center gap-1">
                    <PersonStanding
                      className="shrink-0 w-4 h-4"
                      aria-hidden="true"
                    />
                    {t("skin")}
                  </label>
                  <Input
                    {...field}
                    id="appearance-skin"
                    aria-invalid={fieldState.invalid}
                    aria-describedby={fieldState.error ? "appearance-skin-error" : undefined}
                    placeholder={t("skin")}
                    type="text"
                  />
                  {fieldState.error && <FieldError id="appearance-skin-error" errors={[fieldState.error]} />}
                </Field>
              )}
            />

            {/* Taille */}
            <Controller
              name="appearance.height"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} orientation="vertical">
                  <label htmlFor="appearance-height" className="text-sm text-muted-foreground font-medium flex flex-row items-center gap-1">
                    <Ruler
                      className="shrink-0 w-4 h-4"
                      aria-hidden="true"
                    />
                    {t("height")}
                  </label>
                  <Input
                    {...field}
                    onChange={(e) => {
                      const value = e.target.valueAsNumber;
                      field.onChange(isNaN(value) ? undefined : value);
                    }}
                    value={field.value ?? ""}
                    id="appearance-height"
                    aria-invalid={fieldState.invalid}
                    aria-describedby={fieldState.error ? "appearance-height-error" : undefined}
                    placeholder={t("height")}
                    type="number"
                  />
                  {fieldState.error && <FieldError id="appearance-height-error" errors={[fieldState.error]} />}
                </Field>
              )}
            />

            {/* Poids */}
            <Controller
              name="appearance.weight"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} orientation="vertical">
                  <label htmlFor="appearance-weight" className="text-sm text-muted-foreground font-medium flex flex-row items-center gap-1">
                    <Scale
                      className="shrink-0 w-4 h-4"
                      aria-hidden="true"
                    />
                    {t("weight")}
                  </label>
                  <Input
                    {...field}
                    onChange={(e) => {
                      const value = e.target.valueAsNumber;
                      field.onChange(isNaN(value) ? undefined : value);
                    }}
                    value={field.value ?? ""}
                    id="appearance-weight"
                    aria-invalid={fieldState.invalid}
                    aria-describedby={fieldState.error ? "appearance-weight-error" : undefined}
                    placeholder={t("weight")}
                    type="number"
                  />
                  {fieldState.error && <FieldError id="appearance-weight-error" errors={[fieldState.error]} />}
                </Field>
              )}
            />

            {/* Cheveux */}
            <Controller
              name="appearance.hair"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} orientation="vertical">
                  <label htmlFor="appearance-hair" className="text-sm text-muted-foreground font-medium flex flex-row items-center gap-1">
                    <Scissors
                      className="shrink-0 w-4 h-4"
                      aria-hidden="true"
                    />
                    {t("hair")}
                  </label>
                  <Input
                    {...field}
                    id="appearance-hair"
                    aria-invalid={fieldState.invalid}
                    aria-describedby={fieldState.error ? "appearance-hair-error" : undefined}
                    placeholder={t("hair")}
                    type="text"
                  />
                  {fieldState.error && <FieldError id="appearance-hair-error" errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </div>
        </Card>

        {/* Section Histoire */}
        <Card className="gap-4">
          <h2
            id="background-alliesAndOrgs-title"
            className={`${accentColor} text-xl md:text-2xl font-semibold`}>
            {t("alliesAndOrgs")}
          </h2>

          <Controller
            name="background.alliesAndOrgs"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} orientation="vertical">
                <Textarea
                  {...field}
                  id="background-alliesAndOrgs"
                  aria-invalid={fieldState.invalid}
                  aria-describedby={fieldState.error ? "background-alliesAndOrgs-error" : undefined}
                  placeholder={t("alliesAndOrgs")}
                  rows={6}
                />
                {fieldState.error && <FieldError id="background-alliesAndOrgs-error" errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </Card>
      </div>
      <div className="flex flex-col gap-2 md:gap-4">
        <Card className="gap-3 py-4 px-4 md:px-6 h-full">
          <h2
            id="background-flaws-title"
            className={`${accentColor} text-xl md:text-2xl font-semibold`}>
            {t("flaws")}
          </h2>

          <Controller
            name="background.flaws"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} orientation="vertical">
                <Textarea
                  {...field}
                  id="background-flaws"
                  aria-invalid={fieldState.invalid}
                  aria-describedby={fieldState.error ? "background-flaws-error" : undefined}
                  placeholder={t("flaws")}
                  rows={6}
                />
                {fieldState.error && <FieldError id="background-flaws-error" errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </Card>
        <Card className="gap-3 py-4 px-4 md:px-6 h-full">
          <h2
            id="background-bonds-title"
            className={`${accentColor} text-xl md:text-2xl font-semibold`}>
            {t("bonds")}
          </h2>

          <Controller
            name="background.bonds"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} orientation="vertical">
                <Textarea
                  {...field}
                  id="background-bonds"
                  aria-invalid={fieldState.invalid}
                  aria-describedby={fieldState.error ? "background-bonds-error" : undefined}
                  placeholder={t("bonds")}
                  rows={6}
                />
                {fieldState.error && <FieldError id="background-bonds-error" errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </Card>
      </div>

      <div className="flex flex-col gap-2 md:gap-4">
        <Card className="gap-3 py-4 px-4 md:px-6 h-full">
          <h2
            id="background-personalityTraits-title"
            className={`${accentColor} text-xl md:text-2xl font-semibold`}>
            {t("personalityTraits")}
          </h2>

          <Controller
            name="background.personalityTraits"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} orientation="vertical">
                <Textarea
                  {...field}
                  id="background-personalityTraits"
                  aria-invalid={fieldState.invalid}
                  aria-describedby={fieldState.error ? "background-personalityTraits-error" : undefined}
                  placeholder={t("personalityTraits")}
                  rows={6}
                />
                {fieldState.error && <FieldError id="background-personalityTraits-error" errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </Card>
        <Card className="gap-3 py-4 px-4 md:px-6 h-full">
          <h2
            id="background-ideals-title"
            className={`${accentColor} text-xl md:text-2xl font-semibold`}>
            {t("ideals")}
          </h2>

          <Controller
            name="background.ideals"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} orientation="vertical">
                <Textarea
                  {...field}
                  id="background-ideals"
                  aria-invalid={fieldState.invalid}
                  aria-describedby={fieldState.error ? "background-ideals-error" : undefined}
                  placeholder={t("ideals")}
                  rows={6}
                />
                {fieldState.error && <FieldError id="background-ideals-error" errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </Card>
      </div>
      <div className="col-span-1 xl:col-span-3">
        <Card className="gap-3 py-4 px-4 md:px-6 h-full">
          <h2
            id="background-backstory-title"
            className={`${accentColor} text-xl md:text-2xl font-semibold`}>
            {t("backstory")}
          </h2>

          <Controller
            name="background.backstory"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} orientation="vertical">
                <Textarea
                  {...field}
                  id="background-backstory"
                  aria-invalid={fieldState.invalid}
                  aria-describedby={fieldState.error ? "background-backstory-error" : undefined}
                  placeholder={t("backstory")}
                  rows={6}
                />
                {fieldState.error && <FieldError id="background-backstory-error" errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </Card>
      </div>

      {/* Description (full width) */}
      <div className="col-span-1 xl:col-span-3">
        <Card className="gap-3 py-4 px-4 md:px-6 h-full">
          <h2
            id="background-description-title"
            className={`${accentColor} text-xl md:text-2xl font-semibold`}>
            {t("description")}
          </h2>

          <Controller
            name="appearance.description"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} orientation="vertical">
                <Textarea
                  {...field}
                  id="appearance-description"
                  aria-invalid={fieldState.invalid}
                  aria-describedby={fieldState.error ? "appearance-description-error" : undefined}
                  placeholder={t("description")}
                  rows={6}
                />
                {fieldState.error && <FieldError id="appearance-description-error" errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </Card>
      </div>
    </div>
  );
}
