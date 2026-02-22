import { Player } from "@/types/character";
import { Controller, UseFormReturn } from "react-hook-form";
import { Field, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useTranslations } from "next-intl";

interface PlayerGeneralTabEditProps {
  player: Player;
  accentColor: string;
  form: UseFormReturn<any>;
}

export default function PlayerGeneralTabEdit({ player, accentColor, form }: PlayerGeneralTabEditProps) {
  const t = useTranslations("characterDetail.player.general");
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

      {/* Section Profil */}
      <Card className="gap-4">
        <h3 className={`text-${accentColor} text-xl font-bold`}>{tEdit("profile")}</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Race */}
          <Controller
            name="profile.race"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} orientation="vertical">
                <label htmlFor="profile-race" className="text-sm font-medium">
                  {tEdit("race")}
                </label>
                <Input
                  {...field}
                  value={field.value || ""}
                  id="profile-race"
                  aria-invalid={fieldState.invalid}
                  aria-describedby={fieldState.error ? "profile-race-error" : undefined}
                  placeholder={tEdit("race")}
                  type="text"
                />
                {fieldState.error && <FieldError id="profile-race-error" errors={[fieldState.error]} />}
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
        - Compétences (Skills) 
        - Langues
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
