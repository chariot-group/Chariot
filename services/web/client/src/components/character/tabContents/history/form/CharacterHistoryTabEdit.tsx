import { Character } from "@/types/character";
import { Controller, UseFormReturn } from "react-hook-form";
import { Field, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useTranslations } from "next-intl";

interface CharacterHistoryTabEditProps {
  character: Character;
  accentColor: string;
  form: UseFormReturn<any>;
}

export default function CharacterHistoryTabEdit({ character, accentColor, form }: CharacterHistoryTabEditProps) {
  const t = useTranslations("characterDetail.history");
  const tEdit = useTranslations("characterDetail.edit");

  return (
    <div
      className="w-full flex flex-col gap-2 md:gap-4 px-2 sm:px-0"
      role="main"
      aria-labelledby="history-tab-edit">
      <h2 id="history-tab-edit" className="sr-only">
        {t("backstory")}
      </h2>

      {/* Section Apparence */}
      <Card className="gap-4">
        <h3 className={`text-${accentColor} text-xl font-bold`}>{t("appearance")}</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Âge */}
          <Controller
            name="appearance.age"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} orientation="vertical">
                <label htmlFor="appearance-age" className="text-sm font-medium">
                  {t("age")}
                </label>
                <Input
                  {...field}
                  id="appearance-age"
                  aria-invalid={fieldState.invalid}
                  aria-describedby={fieldState.error ? "appearance-age-error" : undefined}
                  placeholder={t("age")}
                  type="text"
                />
                {fieldState.error && <FieldError id="appearance-age-error" errors={[fieldState.error]} />}
              </Field>
            )}
          />

          {/* Taille */}
          <Controller
            name="appearance.height"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} orientation="vertical">
                <label htmlFor="appearance-height" className="text-sm font-medium">
                  {t("height")}
                </label>
                <Input
                  {...field}
                  id="appearance-height"
                  aria-invalid={fieldState.invalid}
                  aria-describedby={fieldState.error ? "appearance-height-error" : undefined}
                  placeholder={t("height")}
                  type="text"
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
                <label htmlFor="appearance-weight" className="text-sm font-medium">
                  {t("weight")}
                </label>
                <Input
                  {...field}
                  id="appearance-weight"
                  aria-invalid={fieldState.invalid}
                  aria-describedby={fieldState.error ? "appearance-weight-error" : undefined}
                  placeholder={t("weight")}
                  type="text"
                />
                {fieldState.error && <FieldError id="appearance-weight-error" errors={[fieldState.error]} />}
              </Field>
            )}
          />

          {/* Yeux */}
          <Controller
            name="appearance.eyes"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} orientation="vertical">
                <label htmlFor="appearance-eyes" className="text-sm font-medium">
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

          {/* Peau */}
          <Controller
            name="appearance.skin"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} orientation="vertical">
                <label htmlFor="appearance-skin" className="text-sm font-medium">
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

          {/* Cheveux */}
          <Controller
            name="appearance.hair"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} orientation="vertical">
                <label htmlFor="appearance-hair" className="text-sm font-medium">
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
        <h3 className={`text-${accentColor} text-xl font-bold`}>{t("backstory")}</h3>

        <Controller
          name="backstory"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} orientation="vertical">
              <label htmlFor="backstory" className="text-sm font-medium">
                {t("backstory")}
              </label>
              <textarea
                {...field}
                id="backstory"
                aria-invalid={fieldState.invalid}
                aria-describedby={fieldState.error ? "backstory-error" : undefined}
                placeholder={t("backstory")}
                rows={6}
                className="flex min-h-15 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
              {fieldState.error && <FieldError id="backstory-error" errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </Card>

      {/* 
        🚧 TODO : Ajouter les autres sections ici :
        - Traits de personnalité (personalityTraits)
        - Idéaux (ideals)
        - Liens (bonds)
        - Défauts (flaws)
        - Alliés et organisations (alliesAndOrganizations)
        
        Les développeurs peuvent s'inspirer du pattern ci-dessus pour ajouter d'autres champs.
      */}
      <Card className="gap-4 bg-green/10 border-green">
        <p className="text-sm text-gray-middle-light italic">
          🚧 <strong>{tEdit("todoForDevelopers")}</strong> - Ajouter les champs manquants pour l'onglet Histoire :
          traits de personnalité, idéaux, liens, défauts, alliés, etc.
        </p>
      </Card>
    </div>
  );
}
