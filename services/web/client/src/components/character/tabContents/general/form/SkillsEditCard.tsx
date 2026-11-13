import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { UseFormReturn, FieldValues } from "react-hook-form";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import GeneralSectionCard from "@/components/character/tabContents/general/shared/GeneralSectionCard";
import SkillsEdit, { deriveMasteryToggles } from "@/components/character/tabContents/general/form/SkillsEdit";

interface SkillsEditCardProps {
  form: UseFormReturn<FieldValues>;
  accentColor: string;
  className?: string;
}

/** Player skills editor with half-proficiency / expertise toggles. @see FR-character-general-bento-layout */
export default function SkillsEditCard({ form, accentColor, className }: SkillsEditCardProps) {
  const t = useTranslations("characterDetail.player.general");
  const masteries = form.watch("stats.masteries");
  const [enableHalfProficiency, setEnableHalfProficiency] = useState<boolean>(
    () => deriveMasteryToggles(form.getValues("stats.masteries")).halfProficiency,
  );
  const [enableExpertise, setEnableExpertise] = useState<boolean>(
    () => deriveMasteryToggles(form.getValues("stats.masteries")).expertise,
  );

  // Form values can arrive after mount (reset on load): turn the toggles on when the sheet already uses these levels.
  useEffect(() => {
    const derived = deriveMasteryToggles(masteries);
    if (derived.halfProficiency) setEnableHalfProficiency(true);
    if (derived.expertise) setEnableExpertise(true);
  }, [masteries]);

  return (
    <GeneralSectionCard
      headingId="skills-heading-edit"
      title={t("skills")}
      accentColor={accentColor}
      className={className}>
      {/* Toggles pour demi-maîtrise et expertise */}
      <div className="flex flex-wrap gap-x-4 gap-y-2 text-muted-foreground">
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
    </GeneralSectionCard>
  );
}
