import { NPC } from "@/types/character";
import { UseFormReturn, useFieldArray } from "react-hook-form";
import { Card } from "@/components/ui/card";
import { useTranslations } from "next-intl";
import ActionUpdateSection from "@/components/character/tabContents/battle/shared/ActionUpdateSection";
import AbilitiesUpdateSection from "@/components/character/tabContents/shared/AbilitiesUpdateSection";
import SavingThrowsEdit from "@/components/character/tabContents/general/form/SavingThrowsEdit";
import NpcStatisticsUpdate from "@/components/character/tabContents/shared/NpcStatisticsUpdate";

interface NPCBattleTabEditProps {
  npc: NPC;
  accentColor: string;
  form: UseFormReturn<any>;
}

export default function NPCBattleTabEdit({ npc, accentColor, form }: NPCBattleTabEditProps) {
  const t = useTranslations("characterDetail.battle");
  const tEdit = useTranslations("characterDetail.edit");

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
          npc={npc}
          accentColor={accentColor}
          form={form}
        />
        {/* Jets de sauvegarde */}
        <div className="flex flex-col gap-2 col-span-2 2xl:col-span-1">
          <Card
            className="gap-3 p-4 md:px-6 h-fit"
            role="region"
            aria-labelledby="saving-throws-heading-edit">
            <h2
              id="saving-throws-heading-edit"
              className={`text-xl sm:text-2xl font-semibold ${accentColor}`}>
              {t("savingThrows")}
            </h2>
          </Card>
          <SavingThrowsEdit
            form={form}
            accentColor={accentColor}
          />
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
          />
        </div>
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
