import { NPC } from "@/types/character";
import { Controller, UseFormReturn, useFieldArray, FieldValues } from "react-hook-form";
import { Field, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useTranslations } from "next-intl";
import { SelectTrigger, Select, SelectValue, SelectContent, SelectItem, SelectGroup } from "@/components/ui/select";
import { AlignmentEnum } from "@/schemas/character";
import { TagInput } from "@/components/ui/tag-input";
import CharacterNameFields from "@/components/character/tabContents/general/form/CharacterNameFields";
import AbilityScoresEdit from "@/components/character/tabContents/general/form/AbilityScoresEdit";
import AbilitiesUpdateSection from "@/components/character/tabContents/shared/AbilitiesUpdateSection";
import SavingThrowsEdit from "@/components/character/tabContents/general/form/SavingThrowsEdit";
import NpcSkillsEdit from "@/components/character/tabContents/general/form/NpcSkillsEdit";
import GeneralSectionCard from "@/components/character/tabContents/general/shared/GeneralSectionCard";
import {
  GENERAL_BENTO_CONTAINER_CLASS,
  GENERAL_BENTO_GRID_CLASS,
  GENERAL_BENTO_STACK_GAP_CLASS,
  NPC_EDIT_SLOTS as SLOTS,
} from "@/components/character/tabContents/general/shared/generalBentoLayout";
import NpcStatisticsUpdate from "@/components/character/tabContents/shared/NpcStatisticsUpdate";
import { formatChallengeRating, parseChallengeRatingInput } from "@/utils/challengeRating.utils";
import { useEffect, useState, type ReactNode } from "react";
import SensesUpdateSection from "@/components/character/tabContents/general/shared/SensesUpdateSection";

interface NpcGeneralTabEditProps {
  npc: NPC;
  accentColor: string;
  /** @see FR-character-detail-view */
  avatar?: ReactNode;
  form: UseFormReturn<FieldValues>;
}

export default function NpcGeneralTabEdit({ npc, accentColor, avatar, form }: NpcGeneralTabEditProps) {
  void npc;
  const t = useTranslations("characterDetail.player.general");
  const tNpc = useTranslations("characterDetail.npc");
  const tEdit = useTranslations("characterDetail.edit");
  const tAlignment = useTranslations("alignments");
  const [challengeRatingInput, setChallengeRatingInput] = useState<string>(() =>
    formatChallengeRating(form.getValues("challenge.challengeRating")),
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

  /** @see FR-character-general-bento-layout */
  return (
    <div className={`${GENERAL_BENTO_CONTAINER_CLASS} px-2 sm:px-0`}>
      <div
        className={GENERAL_BENTO_GRID_CLASS}
        role="main"
        aria-label={tNpc("general.npcInfoLabel")}>
        {/* Personnage */}
        <Card
          className={`min-w-0 gap-3 p-4 md:px-6 ${SLOTS.character}`}
          role="region"
          aria-labelledby="character-profile-edit">
          {/* Names next to the avatar, like the read-mode identity list (no empty column beside the avatar) */}
          <div className="flex items-start gap-3">
            <div className="@container flex min-w-0 flex-1 flex-col gap-3">
              <h2
                id="character-profile-edit"
                className={`text-xl sm:text-2xl font-semibold ${accentColor}`}>
                {t("character")}
              </h2>
              <CharacterNameFields form={form} />
            </div>
            {avatar ? <div className="shrink-0">{avatar}</div> : null}
          </div>
          <div className="flex flex-col gap-4">
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
            <div className="flex flex-col gap-3 border-b border-border pb-3">
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
            {/* Alignement (FR-character-identity-card) */}
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
          </div>
        </Card>

        <NpcStatisticsUpdate
          accentColor={accentColor}
          form={form}
          className={`${SLOTS.statistics} justify-between`}>
          {/* Perception passive (FR-character-statistics-card) */}
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
        </NpcStatisticsUpdate>

        <GeneralSectionCard
          headingId="skills-heading-edit"
          title={t("skills")}
          accentColor={accentColor}
          className={SLOTS.skills}>
          <NpcSkillsEdit form={form} />
        </GeneralSectionCard>

        {/* Caractéristiques */}
        <GeneralSectionCard
          headingId="character-characteristics-edit"
          title={t("characteristics")}
          accentColor={accentColor}
          className={SLOTS.abilityScores}>
          <AbilityScoresEdit
            form={form}
            className="flex-1 content-evenly"
          />
        </GeneralSectionCard>

        <GeneralSectionCard
          headingId="character-savingthrows-edit"
          title={t("savingThrows")}
          accentColor={accentColor}
          className={SLOTS.savingThrows}>
          <SavingThrowsEdit
            form={form}
            accentColor={accentColor}
            className="flex-1 content-evenly"
          />
        </GeneralSectionCard>

        {/* Maîtrises */}
        <GeneralSectionCard
          headingId="character-proficiencies-edit"
          title={t("proficiencies")}
          accentColor={accentColor}
          className={SLOTS.proficiencies}>
          <div className="grid flex-1 content-start gap-4 @lg:grid-cols-2">
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

            <div className="flex flex-col gap-2">
              <h3 className="text-sm font-medium">{t("senses")}</h3>
              <SensesUpdateSection
                form={form}
                accentColor={accentColor}
                embedded
              />
            </div>
          </div>
        </GeneralSectionCard>

        {/* Capacités et traits */}
        <AbilitiesUpdateSection
          className={`${GENERAL_BENTO_STACK_GAP_CLASS} ${SLOTS.abilities}`}
          title={t("abilitiesAndTraits")}
          form={form}
          fieldArrayName="abilities"
          fields={abilitiesFields}
          append={appendAbility}
          remove={removeAbility}
          accentColor={accentColor}
          abilityCounterMode="npc"
        />
      </div>
    </div>
  );
}
