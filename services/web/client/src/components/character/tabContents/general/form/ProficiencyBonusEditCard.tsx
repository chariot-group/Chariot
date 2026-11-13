import { Button } from "@/components/ui/button";
import { Field, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import GeneralSectionCard from "@/components/character/tabContents/general/shared/GeneralSectionCard";
import { getProficiencyBonusFromLevel, isLevelProficiencyBonusSynced } from "@/utils/global.utils";
import { ArrowRightLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { Controller, UseFormReturn, FieldValues } from "react-hook-form";

interface ProficiencyBonusEditCardProps {
  form: UseFormReturn<FieldValues>;
  accentColor: string;
  className?: string;
}

/** Proficiency bonus field with level sync hint. @see FR-character-general-bento-layout */
export default function ProficiencyBonusEditCard({ form, accentColor, className }: ProficiencyBonusEditCardProps) {
  const t = useTranslations("characterDetail.player.general");
  const tEdit = useTranslations("characterDetail.edit");

  return (
    <GeneralSectionCard
      headingId="character-proficiencybonus-edit"
      title={t("proficiencyBonus")}
      accentColor={accentColor}
      headingClassName="truncate"
      className={className}>
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
              <div className="text-xs text-muted-foreground">
                <span>
                  ⚠️{" "}
                  {t("proficiencyBonusMismatch", {
                    level: currentLevel,
                    bonus: calculatedBonus,
                  })}
                </span>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  form.setValue("stats.proficiencyBonus", calculatedBonus, { shouldDirty: true });
                }}
                className="h-auto min-h-8 whitespace-normal text-xs">
                <ArrowRightLeft className="size-3 mr-1" />
                {t("syncProficiencyBonusButton", { bonus: calculatedBonus })}
              </Button>
            </div>
          );
        })()}
      </div>
    </GeneralSectionCard>
  );
}
