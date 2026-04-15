import { NPC } from "@/types/character";
import { Controller, UseFormReturn, useFieldArray, FieldValues } from "react-hook-form";
import { Field, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useTranslations } from "next-intl";
import { SelectTrigger, Select, SelectValue, SelectContent, SelectItem, SelectGroup } from "@/components/ui/select";
import { AlignmentEnum } from "@/schemas/character";
import { TagInput } from "@/components/ui/tag-input";
import AbilityScoresEdit from "@/components/character/tabContents/general/form/AbilityScoresEdit";
import AbilitiesUpdateSection from "@/components/character/tabContents/shared/AbilitiesUpdateSection";
import NpcColumn2Edit from "@/components/character/tabContents/general/form/NpcColumn2Edit";
import NpcStatisticsUpdate from "@/components/character/tabContents/shared/NpcStatisticsUpdate";
import { formatChallengeRating, parseChallengeRatingInput } from "@/utils/challengeRating.utils";
import { useEffect, useState } from "react";

interface NpcGeneralTabEditProps {
  npc: NPC;
  accentColor: string;
  form: UseFormReturn<FieldValues>;
}

export default function NpcGeneralTabEdit({ npc, accentColor, form }: NpcGeneralTabEditProps) {
  void npc;
  const t = useTranslations("characterDetail.player.general");
  const tNpc = useTranslations("characterDetail.npc");
  const tEdit = useTranslations("characterDetail.edit");
  const tAlignment = useTranslations("alignments");
  const [challengeRatingInput, setChallengeRatingInput] = useState<string>(() =>
    formatChallengeRating(form.getValues("challenge.challengeRating"))
  );

  const watchedChallengeRating = form.watch("challenge.challengeRating");

  useEffect(() => {
    setChallengeRatingInput(formatChallengeRating(watchedChallengeRating));
  }, [watchedChallengeRating]);

  // Gestion dynamique des abilities
  const {
    fields: abilitiesFields,
    append: appendAbility,
    remove: removeAbility,
  } = useFieldArray({
    control: form.control,
    name: "abilities",
  });

  // Calculer la perception passive automatiquement
  const calculatePassivePerception = (): number => {
    const wisdomScore = form.watch("stats.abilityScores.wisdom") || 10;
    const wisdomModifier = Math.floor((wisdomScore - 10) / 2);
    const perceptionSkill = form.watch("stats.skills.perception") || 0;

    // Base : 10 + modificateur de Sagesse
    let passivePerception = 10 + wisdomModifier;

    // Si le NPC a un bonus de compétence Perception, l'utiliser
    if (perceptionSkill > wisdomModifier) {
      passivePerception = 10 + perceptionSkill;
    }

    return passivePerception;
  };

  return (
    <div
      className="w-full flex flex-col gap-2 md:gap-4 px-2 sm:px-0"
      role="main"
      aria-label={tNpc("general.npcInfoLabel")}>
      <section className="grid grid-cols-1 min-[450px]:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-4">
        {/* Colonne 1 : Personnage, Type et Caractéristiques */}
        <section
          className="flex flex-col gap-2 md:gap-4"
          aria-labelledby="character-info-section">
          {/* Personnage */}
          <Card
            className="gap-3 py-4 px-4 md:px-6"
            role="region"
            aria-labelledby="character-profile">
            <h2
              id="character-profile-edit"
              className={`text-xl sm:text-2xl font-semibold ${accentColor}`}>
              {t("character")}
            </h2>
            <div className="flex flex-col gap-4">
              {/* Noms du personnage */}
              <div className="flex flex-col gap-3">
                {/* Prénom */}
                <Controller
                  name="firstname"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field
                      data-invalid={fieldState.invalid}
                      orientation="vertical">
                      <label
                        htmlFor="character-firstname"
                        className="text-sm font-medium">
                        {tEdit("firstname")}
                      </label>
                      <Input
                        {...field}
                        value={field.value || ""}
                        id="character-firstname"
                        aria-invalid={fieldState.invalid}
                        aria-describedby={fieldState.error ? "character-firstname-error" : undefined}
                        placeholder={tEdit("firstname")}
                        type="text"
                      />
                      {fieldState.error && (
                        <FieldError
                          id="character-firstname-error"
                          errors={[fieldState.error]}
                        />
                      )}
                    </Field>
                  )}
                />
                {/* Nom */}
                <Controller
                  name="lastname"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field
                      data-invalid={fieldState.invalid}
                      orientation="vertical">
                      <label
                        htmlFor="character-lastname"
                        className="text-sm font-medium">
                        {tEdit("lastname")}
                      </label>
                      <Input
                        {...field}
                        value={field.value || ""}
                        id="character-lastname"
                        aria-invalid={fieldState.invalid}
                        aria-describedby={fieldState.error ? "character-lastname-error" : undefined}
                        placeholder={tEdit("lastname")}
                        type="text"
                      />
                      {fieldState.error && (
                        <FieldError
                          id="character-lastname-error"
                          errors={[fieldState.error]}
                        />
                      )}
                    </Field>
                  )}
                />
                {/* Surnom */}
                <Controller
                  name="surname"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field
                      data-invalid={fieldState.invalid}
                      orientation="vertical">
                      <label
                        htmlFor="character-surname"
                        className="text-sm font-medium">
                        {tEdit("surname")}
                      </label>
                      <Input
                        {...field}
                        value={field.value || ""}
                        id="character-surname"
                        aria-invalid={fieldState.invalid}
                        aria-describedby={fieldState.error ? "character-surname-error" : undefined}
                        placeholder={tEdit("surname")}
                        type="text"
                      />
                      {fieldState.error && (
                        <FieldError
                          id="character-surname-error"
                          errors={[fieldState.error]}
                        />
                      )}
                    </Field>
                  )}
                />
              </div>

              {/* Type et Subtype */}
              <div className="flex flex-col gap-3">
                <div className="flex flex-row gap-2">
                  {/* Type */}
                  <Controller
                    name="profile.type"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field
                        data-invalid={fieldState.invalid}
                        orientation="vertical"
                        className="flex-1">
                        <label
                          htmlFor="character-type"
                          className="text-sm font-medium">
                          {tEdit("type")}
                        </label>
                        <Input
                          {...field}
                          value={field.value || ""}
                          id="character-type"
                          aria-invalid={fieldState.invalid}
                          aria-describedby={fieldState.error ? "character-type-error" : undefined}
                          placeholder={tEdit("type")}
                          type="text"
                        />
                        {fieldState.error && (
                          <FieldError
                            id="character-type-error"
                            errors={[fieldState.error]}
                          />
                        )}
                      </Field>
                    )}
                  />
                  {/* Subtype */}
                  <Controller
                    name="profile.subtype"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field
                        data-invalid={fieldState.invalid}
                        orientation="vertical"
                        className="flex-1">
                        <label
                          htmlFor="character-subtype"
                          className="text-sm font-medium">
                          {tNpc("subtypeLabel")}
                        </label>
                        <Input
                          {...field}
                          value={field.value || ""}
                          id="character-subtype"
                          aria-invalid={fieldState.invalid}
                          aria-describedby={fieldState.error ? "character-subtype-error" : undefined}
                          placeholder={tNpc("subtypeLabel")}
                          type="text"
                        />
                        {fieldState.error && (
                          <FieldError
                            id="character-subtype-error"
                            errors={[fieldState.error]}
                          />
                        )}
                      </Field>
                    )}
                  />
                </div>
              </div>

              {/* Challenge Rating et Experience Points */}
              <div className="flex flex-col gap-3 border-b border-gray pb-3">
                <div className="flex flex-row gap-2">
                  {/* Challenge Rating */}
                  <Controller
                    name="challenge.challengeRating"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field
                        data-invalid={fieldState.invalid}
                        orientation="vertical"
                        className="flex-1">
                        <label
                          htmlFor="challenge-rating"
                          className="text-sm font-medium">
                          {tEdit("challengeRating")}
                        </label>
                        <Input
                          name={field.name}
                          ref={field.ref}
                          value={challengeRatingInput}
                          onChange={(e) => setChallengeRatingInput(e.target.value)}
                          onBlur={() => {
                            field.onBlur();
                            const parsedValue = parseChallengeRatingInput(challengeRatingInput);

                            if (Number.isNaN(parsedValue)) {
                              setChallengeRatingInput(formatChallengeRating(field.value));
                              return;
                            }

                            field.onChange(parsedValue);
                            setChallengeRatingInput(formatChallengeRating(parsedValue));
                          }}
                          id="challenge-rating"
                          aria-invalid={fieldState.invalid}
                          aria-describedby={fieldState.error ? "challenge-rating-error" : undefined}
                          placeholder={tEdit("challengeRatingPlaceholder")}
                          type="text"
                          inputMode="decimal"
                        />
                        {fieldState.error && (
                          <FieldError
                            id="challenge-rating-error"
                            errors={[fieldState.error]}
                          />
                        )}
                      </Field>
                    )}
                  />

                  {/* Experience Points */}
                  <Controller
                    name="challenge.experiencePoints"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field
                        data-invalid={fieldState.invalid}
                        orientation="vertical"
                        className="flex-1">
                        <label
                          htmlFor="experience-points"
                          className="text-sm font-medium">
                          {tEdit("experiencePoints")}
                        </label>
                        <Input
                          {...field}
                          value={field.value || ""}
                          id="experience-points"
                          aria-invalid={fieldState.invalid}
                          aria-describedby={fieldState.error ? "experience-points-error" : undefined}
                          placeholder={tEdit("zeroPlaceholder")}
                          type="number"
                          min="0"
                        />
                        {fieldState.error && (
                          <FieldError
                            id="experience-points-error"
                            errors={[fieldState.error]}
                          />
                        )}
                      </Field>
                    )}
                  />
                </div>
              </div>
            </div>
          </Card>

          <NpcStatisticsUpdate
            accentColor={accentColor}
            form={form}
          />

          <NpcColumn2Edit
            form={form}
            accentColor={accentColor}
            className="sm:hidden flex"
          />

          {/* Caractéristiques */}
          <Card
            className="gap-3 py-4 px-4 md:px-6"
            role="region"
            aria-labelledby="character-characteristics">
            <h2
              id="character-characteristics-edit"
              className={`text-xl sm:text-2xl font-semibold ${accentColor}`}>
              {t("characteristics")}
            </h2>

            <AbilityScoresEdit form={form} />
          </Card>

          {/* Languages */}
          <Card
            className="gap-3 py-4 px-4 md:px-6"
            role="region"
            aria-labelledby="character-languages">
            <h2
              id="character-languages-edit"
              className={`text-xl sm:text-2xl font-semibold ${accentColor}`}>
              {t("languages")}
            </h2>

            <div className="flex flex-col gap-4">
              <Controller
                name="stats.languages"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    orientation="vertical">
                    <label
                      htmlFor="npc-languages"
                      className="text-sm font-medium">
                      {t("languages")}
                    </label>
                    <TagInput
                      id="npc-languages"
                      value={field.value || []}
                      onChange={field.onChange}
                      suggestions={t.raw("proficiencyOptions.languages")}
                      placeholder={t("languages")}
                      aria-invalid={fieldState.invalid}
                      aria-describedby={fieldState.error ? "npc-languages-error" : undefined}
                    />
                    {fieldState.error && (
                      <FieldError
                        id="npc-languages-error"
                        errors={[fieldState.error]}
                      />
                    )}
                  </Field>
                )}
              />
            </div>
          </Card>
        </section>

        {/* Colonne 2 : Jets de sauvegarde et Compétences */}
        <NpcColumn2Edit
          form={form}
          accentColor={accentColor}
          className="sm:flex hidden"
        />

        {/* Colonne 3 : Alignement, Perception passive et Aptitudes */}
        <section
          className="flex flex-col gap-2 md:gap-4 sm:col-span-2 lg:col-span-1"
          aria-labelledby="additional-info-section">
          {/* Alignement */}
          <Card
            className="gap-3 py-4 px-4 md:px-6"
            role="region"
            aria-labelledby="alignment-heading-edit">
            <h2
              id="alignment-heading-edit"
              className={`text-xl sm:text-2xl font-semibold truncate ${accentColor}`}>
              {t("alignment")}
            </h2>
            <Controller
              name="profile.alignment"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field
                  data-invalid={fieldState.invalid}
                  orientation="vertical">
                  <label
                    htmlFor="alignment"
                    className="text-sm font-medium">
                    {t("alignment")}
                  </label>
                  <Select
                    value={field.value || ""}
                    onValueChange={field.onChange}>
                    <SelectTrigger id="alignment">
                      <SelectValue placeholder={t("alignment")} />
                    </SelectTrigger>
                    <SelectContent position="item-aligned">
                      <SelectGroup>
                        {AlignmentEnum.options.map((alignment) => (
                          <SelectItem
                            key={alignment}
                            value={alignment}>
                            {tAlignment(alignment as Parameters<typeof tAlignment>[0])}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  {fieldState.error && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </Card>

          {/* Perception passive */}
          <Card
            className="gap-3 py-4 px-4 md:px-6"
            role="region"
            aria-labelledby="passive-perception-heading-edit">
            <h2
              id="passive-perception-heading-edit"
              className={`text-xl sm:text-2xl font-semibold truncate ${accentColor}`}>
              {t("passivePerception")}
            </h2>
            <div className="flex flex-col gap-2">
              <Controller
                name="stats.passivePerception"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    orientation="vertical">
                    <label
                      htmlFor="passive-perception"
                      className="text-sm font-medium">
                      {t("passivePerceptionOverride")}
                    </label>
                    <Input
                      {...field}
                      value={field.value || ""}
                      id="passive-perception"
                      aria-invalid={fieldState.invalid}
                      aria-describedby={fieldState.error ? "passive-perception-error" : undefined}
                      placeholder={calculatePassivePerception().toString()}
                      type="number"
                    />
                    {fieldState.error && (
                      <FieldError
                        id="passive-perception-error"
                        errors={[fieldState.error]}
                      />
                    )}
                  </Field>
                )}
              />

              {/* Warning si différent du calcul automatique */}
              {(() => {
                const currentValue = form.watch("stats.passivePerception") || 0;
                const calculatedValue = calculatePassivePerception();

                if (currentValue !== calculatedValue && currentValue !== 0) {
                  return (
                    <div className="text-xs text-orange-600 dark:text-orange-400 p-2 bg-orange-600/10 rounded">
                      {t("passivePerceptionMismatch", { calculated: calculatedValue })}
                    </div>
                  );
                }

                return null;
              })()}
            </div>
          </Card>

          {/* Capacités et traits */}
          <div>
            <AbilitiesUpdateSection
              title={t("abilitiesAndTraits")}
              form={form}
              fieldArrayName="abilities"
              fields={abilitiesFields}
              append={appendAbility}
              remove={removeAbility}
              accentColor={accentColor}
            />
          </div>
        </section>
      </section>
    </div>
  );
}
