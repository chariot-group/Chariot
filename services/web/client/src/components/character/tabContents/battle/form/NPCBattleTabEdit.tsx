import { NPC } from "@/types/character";
import { UseFormReturn, useFieldArray, FieldValues } from "react-hook-form";
import { Card } from "@/components/ui/card";
import { useTranslations } from "next-intl";
import ActionUpdateSection from "@/components/character/tabContents/battle/shared/ActionUpdateSection";
import AbilitiesUpdateSection from "@/components/character/tabContents/shared/AbilitiesUpdateSection";

import SavingThrowsEdit from "@/components/character/tabContents/general/form/SavingThrowsEdit";
import NpcStatisticsUpdate from "@/components/character/tabContents/shared/NpcStatisticsUpdate";
import { Controller } from "react-hook-form";
import { Field, FieldError } from "@/components/ui/field";
import { DamageTypeTagInput } from "@/components/ui/damage-type-tag-input";
import { useId } from "react";

interface NPCBattleTabEditProps {
  npc: NPC;
  accentColor: string;
  form: UseFormReturn<FieldValues>;
}

export default function NPCBattleTabEdit({ npc, accentColor, form }: NPCBattleTabEditProps) {
  void npc;
  const t = useTranslations("characterDetail.battle");
  const sectionId = useId();
  const savingThrowsHeadingId = `${sectionId}-saving-throws-heading-edit`;
  const affinitiesHeadingId = `${sectionId}-battle-affinities-heading-npc-edit`;

  // Field arrays pour les listes dynamiques
  const {
    fields: abilitiesFields,
    append: appendAbility,
    remove: removeAbility,
  } = useFieldArray({
    control: form.control,
    name: "abilities",
  });

  const {
    fields: standardActionsFields,
    append: appendStandardAction,
    remove: removeStandardAction,
  } = useFieldArray({
    control: form.control,
    name: "actions.standard",
  });

  const {
    fields: legendaryActionsFields,
    append: appendLegendaryAction,
    remove: removeLegendaryAction,
  } = useFieldArray({
    control: form.control,
    name: "actions.legendary",
  });

  const {
    fields: lairActionsFields,
    append: appendLairAction,
    remove: removeLairAction,
  } = useFieldArray({
    control: form.control,
    name: "actions.lair",
  });

  return (
    <div className="w-full flex flex-col gap-4 items-start">
      <div className="grid grid-cols-5 max-[426px]:grid-cols-1 gap-3 md:gap-4 w-full">
        {/* Statistiques */}
        <NpcStatisticsUpdate
          accentColor={accentColor}
          form={form}
        />

        {/* Jets de sauvegarde */}
        <div className="flex flex-col gap-2 col-span-2 2xl:col-span-1">
          <Card
            className="gap-3 p-4 md:px-6 h-fit"
            role="region"
            aria-labelledby={savingThrowsHeadingId}>
            <h2
              id={savingThrowsHeadingId}
              className={`text-xl sm:text-2xl font-semibold ${accentColor}`}>
              {t("savingThrows")}
            </h2>

            <SavingThrowsEdit
              form={form}
              accentColor={accentColor}
            />
          </Card>
        </div>

        {/* Capacités et traits */}
        <div className="col-span-3 2xl:col-span-2">
          <AbilitiesUpdateSection
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 w-full">
        <Card
          className="gap-3 p-4 md:px-6 h-fit"
          role="region"
          aria-labelledby={affinitiesHeadingId}>
          <h2
            id={affinitiesHeadingId}
            className={`text-xl sm:text-2xl font-semibold ${accentColor}`}>
            {t("affinities")}
          </h2>

          <div className="flex flex-col gap-4">
            <Controller
              name="affinities.resistances"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field
                  data-invalid={fieldState.invalid}
                  orientation="vertical">
                  <label
                    htmlFor="battle-npc-resistances"
                    className="text-sm font-medium">
                    {t("resistances")}
                  </label>
                  <DamageTypeTagInput
                    id="battle-npc-resistances"
                    value={field.value || []}
                    onChange={field.onChange}
                    placeholder={t("resistancesPlaceholder")}
                    aria-invalid={fieldState.invalid}
                    aria-describedby={fieldState.error ? "battle-npc-resistances-error" : undefined}
                  />
                  {fieldState.error && (
                    <FieldError
                      id="battle-npc-resistances-error"
                      errors={[fieldState.error]}
                    />
                  )}
                </Field>
              )}
            />

            <Controller
              name="affinities.vulnerabilities"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field
                  data-invalid={fieldState.invalid}
                  orientation="vertical">
                  <label
                    htmlFor="battle-npc-vulnerabilities"
                    className="text-sm font-medium">
                    {t("vulnerabilities")}
                  </label>
                  <DamageTypeTagInput
                    id="battle-npc-vulnerabilities"
                    value={field.value || []}
                    onChange={field.onChange}
                    placeholder={t("vulnerabilitiesPlaceholder")}
                    aria-invalid={fieldState.invalid}
                    aria-describedby={fieldState.error ? "battle-npc-vulnerabilities-error" : undefined}
                  />
                  {fieldState.error && (
                    <FieldError
                      id="battle-npc-vulnerabilities-error"
                      errors={[fieldState.error]}
                    />
                  )}
                </Field>
              )}
            />

            <Controller
              name="affinities.immunities"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field
                  data-invalid={fieldState.invalid}
                  orientation="vertical">
                  <label
                    htmlFor="battle-npc-immunities"
                    className="text-sm font-medium">
                    {t("immunities")}
                  </label>
                  <DamageTypeTagInput
                    id="battle-npc-immunities"
                    value={field.value || []}
                    onChange={field.onChange}
                    placeholder={t("immunitiesPlaceholder")}
                    aria-invalid={fieldState.invalid}
                    aria-describedby={fieldState.error ? "battle-npc-immunities-error" : undefined}
                  />
                  {fieldState.error && (
                    <FieldError
                      id="battle-npc-immunities-error"
                      errors={[fieldState.error]}
                    />
                  )}
                </Field>
              )}
            />
          </div>
        </Card>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 w-full">
        {/* Actions Standards */}
        <ActionUpdateSection
          title={t("actions")}
          form={form}
          fieldArrayName="actions.standard"
          fields={standardActionsFields}
          append={appendStandardAction}
          remove={removeStandardAction}
          accentColor={accentColor}
        />

        {/* Actions Légendaires */}
        <ActionUpdateSection
          title={t("legendaryActions")}
          form={form}
          fieldArrayName="actions.legendary"
          fields={legendaryActionsFields}
          append={appendLegendaryAction}
          remove={removeLegendaryAction}
          accentColor={accentColor}
        />

        {/* Actions de Repaire */}
        <ActionUpdateSection
          title={t("lairActions")}
          form={form}
          fieldArrayName="actions.lair"
          fields={lairActionsFields}
          append={appendLairAction}
          remove={removeLairAction}
          accentColor={accentColor}
        />
      </div>
    </div>
  );
}
