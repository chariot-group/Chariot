import { Player } from "@/types/character";
import { useFieldArray, UseFormReturn } from "react-hook-form";
import { Card } from "@/components/ui/card";
import { useTranslations } from "next-intl";
import AbilitiesUpdateSection from "@/components/character/tabContents/shared/AbilitiesUpdateSection";
import ActionUpdateSection from "@/components/character/tabContents/battle/shared/ActionUpdateSection";
import SavingThrowsEdit from "@/components/character/tabContents/general/form/SavingThrowsEdit";
import Image from "next/image";

import RedCircle from "@public/assets/icons/red-circle.svg";
import WhiteCircle from "@public/assets/icons/white-circle.svg";
import { Button } from "@/components/ui/button";
import { RefreshCcw } from "lucide-react";
import StatisticsUpdate from "@/components/character/tabContents/shared/StatisticsUpdate";

interface PlayerBattleTabEditProps {
  player: Player;
  accentColor: string;
  form: UseFormReturn<any>;
}

export default function PlayerBattleTabEdit({ player, accentColor, form }: PlayerBattleTabEditProps) {
  const t = useTranslations("characterDetail.battle");
  const tEdit = useTranslations("characterDetail.edit");

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
    name: "actions",
  });

  return (
    <div className="w-full flex flex-col gap-4 items-start">
      <div className="grid grid-cols-4 max-[376px]:grid-cols-1 gap-3 md:gap-4 w-full">
        {/* Section Points de Vie */}
        <StatisticsUpdate
          player={player}
          accentColor={accentColor}
          form={form}
        />

        {/* Jets de Sauvegarde */}
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

        {/* Jets de sauvegarde contre la mort */}
        <Card
          className="gap-3 p-4 md:px-6 h-fit col-span-3 md:col-span-2 lg:col-span-1 items-end"
          role="region"
          aria-labelledby="death-saves-heading">
          <h2
            id="death-saves-heading"
            className={`text-xl sm:text-2xl font-semibold self-start ${accentColor}`}>
            {t("deathSaves")}
          </h2>
          <div className=" grid grid-cols-2 gap-2 items-center w-full">
            <span>{t("successes")}</span>
            <div
              className="grid grid-cols-3 w-2/3 lg:w-4/5"
              role="group"
              aria-label={t("successes")}>
              {Array.from({ length: 3 }).map((_, index) => {
                const currentSuccesses = form.watch("deathSaves.successes") ?? player.deathSaves.successes;
                return (
                  <button
                    key={"death-save-success-" + index}
                    type="button"
                    onClick={() => form.setValue("deathSaves.successes", index + 1, { shouldDirty: true })}
                    className="cursor-pointer hover:opacity-80 transition-opacity p-1"
                    aria-label={`${t("successes")} ${index + 1}`}>
                    <Image
                      src={index < currentSuccesses ? RedCircle : WhiteCircle}
                      alt=""
                      width={20}
                      height={20}
                      className="shrink-0"
                      aria-hidden="true"
                    />
                  </button>
                );
              })}
            </div>
            <span>{t("failures")}</span>
            <div
              className="grid grid-cols-3 w-2/3 lg:w-4/5"
              role="group"
              aria-label={t("failures")}>
              {Array.from({ length: 3 }).map((_, index) => {
                const currentFailures = form.watch("deathSaves.failures") ?? player.deathSaves.failures;
                return (
                  <button
                    key={"death-save-failure-" + index}
                    type="button"
                    onClick={() => form.setValue("deathSaves.failures", index + 1, { shouldDirty: true })}
                    className="cursor-pointer hover:opacity-80 transition-opacity p-1"
                    aria-label={`${t("failures")} ${index + 1}`}>
                    <Image
                      src={index < currentFailures ? RedCircle : WhiteCircle}
                      alt=""
                      width={20}
                      height={20}
                      className="shrink-0"
                      aria-hidden="true"
                    />
                  </button>
                );
              })}
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              form.setValue("deathSaves.successes", 0, { shouldDirty: true });
              form.setValue("deathSaves.failures", 0, { shouldDirty: true });
            }}
            className="flex gap-2 self-start">
            <RefreshCcw />
            {tEdit("reset")}
          </Button>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-2 w-full">
        {/* Capacités et traits */}
        <div className="order-2 lg:order-1">
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
        <div className="flex flex-row gap-2 order-1 lg:order-2">
          {/* Actions */}
          <ActionUpdateSection
            title={t("actions")}
            form={form}
            fieldArrayName="actions"
            fields={standardActionsFields}
            append={appendStandardAction}
            remove={removeStandardAction}
            accentColor={accentColor}
          />
        </div>
      </div>
    </div>
  );
}
