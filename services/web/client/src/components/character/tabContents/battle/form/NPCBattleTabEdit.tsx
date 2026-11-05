import { NPC } from "@/types/character";
import { UseFormReturn, useFieldArray, FieldValues } from "react-hook-form";
import { useTranslations } from "next-intl";
import ActionUpdateSection from "@/components/character/tabContents/battle/shared/ActionUpdateSection";
import AbilitiesUpdateSection from "@/components/character/tabContents/shared/AbilitiesUpdateSection";

import SavingThrowsEdit from "@/components/character/tabContents/general/form/SavingThrowsEdit";
import NpcStatisticsUpdate from "@/components/character/tabContents/shared/NpcStatisticsUpdate";
import { Controller } from "react-hook-form";
import { Field, FieldError } from "@/components/ui/field";
import { DamageTypeTagInput } from "@/components/ui/damage-type-tag-input";
import { useId } from "react";
import GeneralSectionCard from "@/components/character/tabContents/general/shared/GeneralSectionCard";
import {
  BATTLE_BENTO_GRID_CLASS,
  BATTLE_BENTO_STACK_GAP_CLASS,
  NPC_BATTLE_SLOTS as SLOTS,
} from "@/components/character/tabContents/battle/shared/battleBentoLayout";

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

  /** @see FR-character-battle-bento-layout */
  return (
    <div className={BATTLE_BENTO_GRID_CLASS}>
      <NpcStatisticsUpdate
        accentColor={accentColor}
        form={form}
        className={`${SLOTS.statistics} justify-between`}
      />

      <GeneralSectionCard
        headingId={savingThrowsHeadingId}
        title={t("savingThrows")}
        accentColor={accentColor}
        className={SLOTS.savingThrows}>
        <SavingThrowsEdit
          form={form}
          accentColor={accentColor}
          className="flex-1 content-evenly"
        />
      </GeneralSectionCard>

      <GeneralSectionCard
        headingId={affinitiesHeadingId}
        title={t("affinities")}
        accentColor={accentColor}
        className={SLOTS.affinities}>
        <div className="grid flex-1 content-between gap-4 @xl:grid-cols-3">
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
      </GeneralSectionCard>

      <ActionUpdateSection
        title={t("actions")}
        form={form}
        fieldArrayName="actions.standard"
        fields={standardActionsFields}
        append={appendStandardAction}
        remove={removeStandardAction}
        accentColor={accentColor}
        className={SLOTS.actions}
      />

      <ActionUpdateSection
        title={t("legendaryActions")}
        form={form}
        fieldArrayName="actions.legendary"
        fields={legendaryActionsFields}
        append={appendLegendaryAction}
        remove={removeLegendaryAction}
        accentColor={accentColor}
        className={SLOTS.actions}
      />

      <ActionUpdateSection
        title={t("lairActions")}
        form={form}
        fieldArrayName="actions.lair"
        fields={lairActionsFields}
        append={appendLairAction}
        remove={removeLairAction}
        accentColor={accentColor}
        className={SLOTS.actions}
      />

      <AbilitiesUpdateSection
        title={t("abilitiesAndTraits")}
        form={form}
        fieldArrayName="abilities"
        fields={abilitiesFields}
        append={appendAbility}
        remove={removeAbility}
        accentColor={accentColor}
        abilityCounterMode="npc"
        className={`${BATTLE_BENTO_STACK_GAP_CLASS} ${SLOTS.abilities}`}
      />
    </div>
  );
}
