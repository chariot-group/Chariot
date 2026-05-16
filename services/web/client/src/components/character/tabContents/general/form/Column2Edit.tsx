import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { getProficiencyBonusFromLevel, isLevelProficiencyBonusSynced } from "@/utils/global.utils";
import { ArrowRightLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { Controller, UseFormReturn, FieldValues } from "react-hook-form";
import SavingThrowsEdit from "@/components/character/tabContents/general/form/SavingThrowsEdit";
import { Label } from "@/components/ui/label";
import SkillsEdit from "@/components/character/tabContents/general/form/SkillsEdit";
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";

interface Column2EditProps {
  form: UseFormReturn<FieldValues>;
  accentColor: string;
  className?: string;
}

export default function Column2Edit({ form, accentColor, className }: Column2EditProps) {
  const t = useTranslations("characterDetail.player.general");
  const tEdit = useTranslations("characterDetail.edit");
  const [enableHalfProficiency, setEnableHalfProficiency] = useState<boolean>(false);
  const [enableExpertise, setEnableExpertise] = useState<boolean>(false);

  return (
    <section
      className={`flex flex-col gap-2 md:gap-4 ${className || ""}`}
      aria-labelledby="characteristics-skills-section">
      {/* Bonus */}
      <Card
        className="gap-3 py-4 px-4 md:px-6"
        role="region"
        aria-labelledby="character-proficiencybonus">
        <h2
          id="character-proficiencybonus-edit"
          className={`text-xl sm:text-2xl font-semibold ${accentColor}`}>
          {t("proficiencyBonus")}
        </h2>
        {/* Bonus de maîtrise avec synchronisation */}
        <div className="flex flex-col gap-2">
          <Controller
            name="stats.proficiencyBonus"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field
                data-invalid={fieldState.invalid}
                orientation="vertical">
                <label
                  htmlFor="proficiency-bonus"
                  className="text-sm font-medium">
                  {t("proficiencyBonusLabel")}
                </label>
                <Input
                  {...field}
                  value={field.value || ""}
                  id="proficiency-bonus"
                  aria-invalid={fieldState.invalid}
                  aria-describedby={fieldState.error ? "proficiency-bonus-error" : undefined}
                  placeholder={tEdit("proficiencyBonusPlaceholder")}
                  type="number"
                  min="2"
                  max="6"
                />
                {fieldState.error && (
                  <FieldError
                    id="proficiency-bonus-error"
                    errors={[fieldState.error]}
                  />
                )}
              </Field>
            )}
          />

          {/* Suggestions de synchronisation bonus/niveau */}
          {(() => {
            const currentLevel = form.watch("progression.level") || 1;
            const currentProficiencyBonus = form.watch("stats.proficiencyBonus") || 2;
            const calculatedBonus = getProficiencyBonusFromLevel(currentLevel);
            const isSynced = isLevelProficiencyBonusSynced(currentLevel, currentProficiencyBonus);

            if (isSynced) {
              return (
                <div className="flex items-center gap-2 p-2 bg-green/20 text-sm text-green-600 dark:text-green-400 rounded-[23px]">
                  <span>✓ {t("proficiencyBonusSynced")}</span>
                </div>
              );
            }

            return (
              <div className="flex flex-col gap-2">
                <div className="text-xs text-gray-middle-light">
                  <span>⚠️ {t("proficiencyBonusMismatch", { level: currentLevel, bonus: calculatedBonus })}</span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    form.setValue("stats.proficiencyBonus", calculatedBonus, { shouldDirty: true });
                  }}
                  className="text-xs">
                  <ArrowRightLeft className="size-3 mr-1" />
                  {t("syncProficiencyBonusButton", { bonus: calculatedBonus })}
                </Button>
              </div>
            );
          })()}
        </div>
      </Card>
      {/* Jets de sauvegarde */}
      <Card
        className="gap-3 py-4 px-4 md:px-6"
        role="region"
        aria-labelledby="character-savingthrows">
        <h2
          id="character-savingthrows-edit"
          className={`text-xl sm:text-2xl font-semibold ${accentColor}`}>
          {t("savingThrows")}
        </h2>

        <SavingThrowsEdit
          form={form}
          accentColor={accentColor}
        />
      </Card>
      {/* Compétences */}
      <Card
        className="flex flex-wrap justify-between gap-3 py-4 px-4 md:px-6"
        role="region"
        aria-labelledby="skills-heading-edit">
        <h2
          id="skills-heading-edit"
          className={`text-xl sm:text-2xl font-semibold ${accentColor}`}>
          {t("skills")}
        </h2>
        {/* Toggles pour demi-maîtrise et expertise */}
        <div className="flex flex-wrap gap-4 px-3 rounded-lg text-muted-foreground">
          <div className="flex items-center gap-2">
            <Checkbox
              id="enable-half-proficiency"
              className="cursor-pointer"
              checked={enableHalfProficiency}
              onCheckedChange={(checked) => setEnableHalfProficiency(checked === true)}
            />
            <Label
              htmlFor="enable-half-proficiency"
              onClick={() => setEnableHalfProficiency((prev) => !prev)}
              className="cursor-pointer text-sm text-card-foreground">
              {t("enableHalfProficiency")}
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="enable-expertise"
              className="cursor-pointer"
              checked={enableExpertise}
              onCheckedChange={(checked) => setEnableExpertise(checked === true)}
            />
            <Label
              htmlFor="enable-expertise"
              onClick={() => setEnableExpertise((prev) => !prev)}
              className="cursor-pointer text-sm text-card-foreground">
              {t("enableExpertise")}
            </Label>
          </div>
        </div>

        <SkillsEdit
          form={form}
          accentColor={accentColor}
          enableHalfProficiency={enableHalfProficiency}
          enableExpertise={enableExpertise}
        />
      </Card>
    </section>
  );
}
