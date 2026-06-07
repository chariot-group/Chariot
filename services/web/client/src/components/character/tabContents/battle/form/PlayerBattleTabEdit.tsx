import { Player } from "@/types/character";
import { useFieldArray, UseFormReturn, FieldValues } from "react-hook-form";
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
import { Controller } from "react-hook-form";
import { Field, FieldError } from "@/components/ui/field";
import { DamageTypeTagInput } from "@/components/ui/damage-type-tag-input";
import { useAppSelector } from "@/store/hooks";
import { selectIsInSession } from "@/store/slices/sessionSlice";
import { useId } from "react";

interface PlayerBattleTabEditProps {
  player: Player;
  accentColor: string;
  form: UseFormReturn<FieldValues>;
}

export default function PlayerBattleTabEdit({ player, accentColor, form }: PlayerBattleTabEditProps) {
  const t = useTranslations("characterDetail.battle");
  const tEdit = useTranslations("characterDetail.edit");
  const isInSession = useAppSelector(selectIsInSession);
  const sectionId = useId();
  const savingThrowsHeadingId = `${sectionId}-saving-throws-heading-edit`;
  const deathSavesHeadingId = `${sectionId}-death-saves-heading-edit`;
  const deathSavesNoteId = `${sectionId}-death-saves-session-only-note`;
  const affinitiesHeadingId = `${sectionId}-battle-affinities-heading-player-edit`;

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
          accentColor={accentColor}
          form={form}
        />
        {/* Jets de Sauvegarde */}
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

        {/* Jets de sauvegarde contre la mort */}
        <Card
          className="gap-3 p-4 md:px-6 h-fit col-span-3 md:col-span-2 lg:col-span-1 items-end"
          role="region"
          aria-labelledby={deathSavesHeadingId}
          aria-describedby={!isInSession ? deathSavesNoteId : undefined}>
          <h2
            id={deathSavesHeadingId}
            className={`text-xl sm:text-2xl font-semibold self-start ${accentColor}`}>
            {t("deathSaves")}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-1 xl:grid-cols-2 gap-2 items-center w-full">
            <span>{t("successes")}</span>
            <div
              className="grid grid-cols-3 gap-1 md:gap-2 w-full md:w-3/4 xl:w-full justify-self-end md:justify-self-start xl:justify-self-end"
              role="group"
              aria-label={t("successes")}>
              {Array.from({ length: 3 }).map((_, index) => {
                const currentSuccesses = form.watch("deathSaves.successes") ?? player.deathSaves.successes;
                const isSelected = index < currentSuccesses;
                return (
                  <button
                    key={"death-save-success-" + index}
                    type="button"
                    onClick={() => form.setValue("deathSaves.successes", index + 1, { shouldDirty: true })}
                    disabled={!isInSession}
                    className="cursor-pointer rounded-full p-1 transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-40"
                    aria-pressed={isSelected}
                    aria-describedby={!isInSession ? deathSavesNoteId : undefined}
                    aria-label={t("deathSaveSuccessButton", {
                      index: index + 1,
                      state: isSelected ? t("performedThrow") : t("unperformedThrow"),
                    })}>
                    <Image
                      src={isSelected ? RedCircle : WhiteCircle}
                      alt=""
                      width={20}
                      height={20}
                      className="shrink-0 w-5 h-5"
                      aria-hidden="true"
                    />
                  </button>
                );
              })}
            </div>
            <span>{t("failures")}</span>
            <div
              className="grid grid-cols-3 gap-1 md:gap-2 w-full md:w-3/4 xl:w-full justify-self-end md:justify-self-start xl:justify-self-end"
              role="group"
              aria-label={t("failures")}>
              {Array.from({ length: 3 }).map((_, index) => {
                const currentFailures = form.watch("deathSaves.failures") ?? player.deathSaves.failures;
                const isSelected = index < currentFailures;
                return (
                  <button
                    key={"death-save-failure-" + index}
                    type="button"
                    onClick={() => form.setValue("deathSaves.failures", index + 1, { shouldDirty: true })}
                    disabled={!isInSession}
                    className="cursor-pointer rounded-full p-1 transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-40"
                    aria-pressed={isSelected}
                    aria-describedby={!isInSession ? deathSavesNoteId : undefined}
                    aria-label={t("deathSaveFailureButton", {
                      index: index + 1,
                      state: isSelected ? t("performedThrow") : t("unperformedThrow"),
                    })}>
                    <Image
                      src={isSelected ? RedCircle : WhiteCircle}
                      alt=""
                      width={20}
                      height={20}
                      className="shrink-0 w-5 h-5"
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
            disabled={!isInSession}
            onClick={() => {
              form.setValue("deathSaves.successes", 0, { shouldDirty: true });
              form.setValue("deathSaves.failures", 0, { shouldDirty: true });
            }}
            aria-describedby={!isInSession ? deathSavesNoteId : undefined}
            aria-label={t("resetDeathSaves")}
            className="flex gap-2 self-start">
            <RefreshCcw aria-hidden="true" />
            {tEdit("reset")}
          </Button>
          {!isInSession && (
            <p
              id={deathSavesNoteId}
              className="text-xs text-muted-foreground"
              role="note">
              {t("deathSavesSessionOnlyNote")}
            </p>
          )}
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 max-[376px]:grid-cols-1 gap-2 w-full">
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
            abilityCounterMode="player"
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

        <div className="order-3 lg:order-3">
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
                      htmlFor="battle-player-resistances"
                      className="text-sm font-medium">
                      {t("resistances")}
                    </label>
                    <DamageTypeTagInput
                      id="battle-player-resistances"
                      value={field.value || []}
                      onChange={field.onChange}
                      placeholder={t("resistancesPlaceholder")}
                      aria-invalid={fieldState.invalid}
                      aria-describedby={fieldState.error ? "battle-player-resistances-error" : undefined}
                    />
                    {fieldState.error && (
                      <FieldError
                        id="battle-player-resistances-error"
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
                      htmlFor="battle-player-vulnerabilities"
                      className="text-sm font-medium">
                      {t("vulnerabilities")}
                    </label>
                    <DamageTypeTagInput
                      id="battle-player-vulnerabilities"
                      value={field.value || []}
                      onChange={field.onChange}
                      placeholder={t("vulnerabilitiesPlaceholder")}
                      aria-invalid={fieldState.invalid}
                      aria-describedby={fieldState.error ? "battle-player-vulnerabilities-error" : undefined}
                    />
                    {fieldState.error && (
                      <FieldError
                        id="battle-player-vulnerabilities-error"
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
                      htmlFor="battle-player-immunities"
                      className="text-sm font-medium">
                      {t("immunities")}
                    </label>
                    <DamageTypeTagInput
                      id="battle-player-immunities"
                      value={field.value || []}
                      onChange={field.onChange}
                      placeholder={t("immunitiesPlaceholder")}
                      aria-invalid={fieldState.invalid}
                      aria-describedby={fieldState.error ? "battle-player-immunities-error" : undefined}
                    />
                    {fieldState.error && (
                      <FieldError
                        id="battle-player-immunities-error"
                        errors={[fieldState.error]}
                      />
                    )}
                  </Field>
                )}
              />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
