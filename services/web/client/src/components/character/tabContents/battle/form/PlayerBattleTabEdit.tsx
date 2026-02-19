import { Player } from "@/types/character";
import { Controller, useFieldArray, UseFormReturn } from "react-hook-form";
import { Field, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useTranslations } from "next-intl";
import AbilitiesUpdateSection from "../../shared/AbilitiesUpdateSection";
import ActionUpdateSection from "../shared/ActionUpdateSection";
import Skill from "../../general/shared/Skill";
import Image from "next/image";

import RedCircle from "@public/assets/icons/red-circle.svg";
import WhiteCircle from "@public/assets/icons/white-circle.svg";
import { Button } from "@/components/ui/button";

interface PlayerBattleTabEditProps {
  player: Player;
  accentColor: string;
  form: UseFormReturn<any>;
}

export default function PlayerBattleTabEdit({ player, accentColor, form }: PlayerBattleTabEditProps) {
  const t = useTranslations("characterDetail.battle");
  const tEdit = useTranslations("characterDetail.edit");
  const tAbilities = useTranslations("characterDetail.player.general.abilities");

  const abilityScoreKeys = ["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"] as const;

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
        <Card className="gap-4">
          <h3 className={`text-${accentColor} text-xl font-bold`}>{t("healthPoints")}</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* PV Actuels */}
            <Controller
              name="stats.currentHitPoints"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field
                  data-invalid={fieldState.invalid}
                  orientation="vertical">
                  <label
                    htmlFor="health-current"
                    className="text-sm font-medium">
                    {tEdit("currentHP")}
                  </label>
                  <Input
                    {...field}
                    onChange={(e) => field.onChange(e.target.value === "" ? null : Number(e.target.value))}
                    id="health-current"
                    aria-invalid={fieldState.invalid}
                    aria-describedby={fieldState.error ? "health-current-error" : undefined}
                    placeholder={tEdit("currentHP")}
                    type="number"
                  />
                  {fieldState.error && (
                    <FieldError
                      id="health-current-error"
                      errors={[fieldState.error]}
                    />
                  )}
                </Field>
              )}
            />

            {/* PV Maximum */}
            <Controller
              name="stats.maxHitPoints"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field
                  data-invalid={fieldState.invalid}
                  orientation="vertical">
                  <label
                    htmlFor="health-max"
                    className="text-sm font-medium">
                    {tEdit("maxHP")}
                  </label>
                  <Input
                    {...field}
                    onChange={(e) => field.onChange(e.target.value === "" ? null : Number(e.target.value))}
                    id="health-max"
                    aria-invalid={fieldState.invalid}
                    aria-describedby={fieldState.error ? "health-max-error" : undefined}
                    placeholder={tEdit("maxHP")}
                    type="number"
                  />
                  {fieldState.error && (
                    <FieldError
                      id="health-max-error"
                      errors={[fieldState.error]}
                    />
                  )}
                </Field>
              )}
            />

            {/* PV Temporaires */}
            <Controller
              name="stats.tempHitPoints"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field
                  data-invalid={fieldState.invalid}
                  orientation="vertical">
                  <label
                    htmlFor="health-temp"
                    className="text-sm font-medium">
                    {tEdit("tempHP")}
                  </label>
                  <Input
                    {...field}
                    onChange={(e) => field.onChange(e.target.value === "" ? null : Number(e.target.value))}
                    id="health-temp"
                    aria-invalid={fieldState.invalid}
                    aria-describedby={fieldState.error ? "health-temp-error" : undefined}
                    placeholder={tEdit("tempHP")}
                    type="number"
                  />
                  {fieldState.error && (
                    <FieldError
                      id="health-temp-error"
                      errors={[fieldState.error]}
                    />
                  )}
                </Field>
              )}
            />
          </div>
        </Card>

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
          <div className="grid max-[376px]:grid-cols-2 grid-cols-1 lg:grid-cols-2 gap-2">
            {abilityScoreKeys.map((key) => {
              const abilityName = tAbilities(key as any);
              const abilityScore = form.watch(`stats.abilityScores.${key}`) || 0;
              const savingThrowValue = form.watch(`stats.savingThrows.${key}`) || 0;
              const valeurCalculer = Math.floor((abilityScore - 10) / 2);

              return (
                <Skill
                  key={key}
                  skillName={abilityName}
                  value={savingThrowValue > 0 ? 2 : 0}
                  accentColor={accentColor}
                  skills={savingThrowValue > 0 ? savingThrowValue : valeurCalculer}
                />
              );
            })}
          </div>
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
            variant="outline"
            size="sm"
            onClick={() => {
              form.setValue("deathSaves.successes", 0, { shouldDirty: true });
              form.setValue("deathSaves.failures", 0, { shouldDirty: true });
            }}
            className="flex items-center gap-2">
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
