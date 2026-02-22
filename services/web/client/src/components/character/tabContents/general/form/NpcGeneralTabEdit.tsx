import { NPC } from "@/types/character";
import { Controller, UseFormReturn } from "react-hook-form";
import { Field, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useTranslations } from "next-intl";

interface NpcGeneralTabEditProps {
  npc: NPC;
  accentColor: string;
  form: UseFormReturn<any>;
}

export default function NpcGeneralTabEdit({ npc, accentColor, form }: NpcGeneralTabEditProps) {
  const t = useTranslations("characterDetail.npc.general");
  const tEdit = useTranslations("characterDetail.edit");

  return (
    <div
      className="w-full flex flex-col gap-2 md:gap-4 px-2 sm:px-0"
      role="main"
      aria-labelledby="general-tab-edit">
      <h2 id="general-tab-edit" className="sr-only">
        {t("title")}
      </h2>

      {/* Section Informations de base */}
      <Card className="gap-4">
        <h3 className={`text-${accentColor} text-xl font-bold`}>{tEdit("basicInfo")}</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Prénom */}
          <Controller
            name="firstname"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} orientation="vertical">
                <label htmlFor="firstname" className="text-sm font-medium">
                  {tEdit("firstname")}
                </label>
                <Input
                  {...field}
                  id="firstname"
                  aria-invalid={fieldState.invalid}
                  aria-describedby={fieldState.error ? "firstname-error" : undefined}
                  placeholder={tEdit("firstname")}
                  type="text"
                />
                {fieldState.error && <FieldError id="firstname-error" errors={[fieldState.error]} />}
              </Field>
            )}
          />

          {/* Nom */}
          <Controller
            name="lastname"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} orientation="vertical">
                <label htmlFor="lastname" className="text-sm font-medium">
                  {tEdit("lastname")}
                </label>
                <Input
                  {...field}
                  id="lastname"
                  aria-invalid={fieldState.invalid}
                  aria-describedby={fieldState.error ? "lastname-error" : undefined}
                  placeholder={tEdit("lastname")}
                  type="text"
                />
                {fieldState.error && <FieldError id="lastname-error" errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </div>

        {/* Surnom (optionnel) */}
        <Controller
          name="surname"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} orientation="vertical">
              <label htmlFor="surname" className="text-sm font-medium">
                {tEdit("surname")} <span className="text-gray-middle-light">({tEdit("optional")})</span>
              </label>
              <Input
                {...field}
                value={field.value || ""}
                id="surname"
                aria-invalid={fieldState.invalid}
                aria-describedby={fieldState.error ? "surname-error" : undefined}
                placeholder={tEdit("surname")}
                type="text"
              />
              {fieldState.error && <FieldError id="surname-error" errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </Card>

      {/* Section Challenge Rating (spécifique aux NPCs) */}
      <Card className="gap-4">
        <h3 className={`text-${accentColor} text-xl font-bold`}>{tEdit("challenge")}</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Challenge Rating */}
          <Controller
            name="challenge.challengeRating"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} orientation="vertical">
                <label htmlFor="challenge-rating" className="text-sm font-medium">
                  {tEdit("challengeRating")}
                </label>
                <Input
                  {...field}
                  onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                  id="challenge-rating"
                  aria-invalid={fieldState.invalid}
                  aria-describedby={fieldState.error ? "challenge-rating-error" : undefined}
                  placeholder={tEdit("challengeRating")}
                  type="number"
                  step="0.125"
                />
                {fieldState.error && <FieldError id="challenge-rating-error" errors={[fieldState.error]} />}
              </Field>
            )}
          />

          {/* Experience Points */}
          <Controller
            name="challenge.experiencePoints"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} orientation="vertical">
                <label htmlFor="experience-points" className="text-sm font-medium">
                  {tEdit("experiencePoints")}
                </label>
                <Input
                  {...field}
                  onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                  id="experience-points"
                  aria-invalid={fieldState.invalid}
                  aria-describedby={fieldState.error ? "experience-points-error" : undefined}
                  placeholder={tEdit("experiencePoints")}
                  type="number"
                />
                {fieldState.error && <FieldError id="experience-points-error" errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </div>
      </Card>

      {/* Section Profil */}
      <Card className="gap-4">
        <h3 className={`text-${accentColor} text-xl font-bold`}>{tEdit("profile")}</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Type */}
          <Controller
            name="profile.type"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} orientation="vertical">
                <label htmlFor="profile-type" className="text-sm font-medium">
                  {tEdit("type")}
                </label>
                <Input
                  {...field}
                  value={field.value || ""}
                  id="profile-type"
                  aria-invalid={fieldState.invalid}
                  aria-describedby={fieldState.error ? "profile-type-error" : undefined}
                  placeholder={tEdit("type")}
                  type="text"
                />
                {fieldState.error && <FieldError id="profile-type-error" errors={[fieldState.error]} />}
              </Field>
            )}
          />

          {/* Alignement */}
          <Controller
            name="profile.alignment"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} orientation="vertical">
                <label htmlFor="profile-alignment" className="text-sm font-medium">
                  {tEdit("alignment")}
                </label>
                <Input
                  {...field}
                  value={field.value || ""}
                  id="profile-alignment"
                  aria-invalid={fieldState.invalid}
                  aria-describedby={fieldState.error ? "profile-alignment-error" : undefined}
                  placeholder={tEdit("alignment")}
                  type="text"
                />
                {fieldState.error && <FieldError id="profile-alignment-error" errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </div>
      </Card>

      {/* 
        TODO : Ajouter les autres sections d'édition ici :
        - Caractéristiques (AbilityScores)
        - Capacités spéciales
        - Etc.
        
        Pour l'instant, ce composant montre juste la structure de base.
        Les développeurs peuvent l'étendre avec d'autres champs.
      */}
      <Card className="gap-4 bg-blue/10 border-blue">
        <p className="text-sm text-gray-middle-light italic">
          🚧 {tEdit("editInProgress")} - Les autres champs seront ajoutés progressivement par les développeurs selon
          les besoins de chaque onglet.
        </p>
      </Card>
    </div>
  );
}
