import { Card } from "@/components/ui/card";
import SavingThrowsEdit from "@/components/character/tabContents/general/form/SavingThrowsEdit";
import NpcSkillsEdit from "@/components/character/tabContents/general/form/NpcSkillsEdit";
import { useTranslations } from "next-intl";
import { UseFormReturn, FieldValues } from "react-hook-form";

interface NpcColumn2EditProps {
  form: UseFormReturn<FieldValues>;
  accentColor: string;
  className?: string;
}

export default function NpcColumn2Edit({ form, accentColor, className }: NpcColumn2EditProps) {
  const t = useTranslations("characterDetail.player.general");

  return (
    <section
      className={`flex flex-col gap-2 md:gap-4 ${className}`}
      aria-labelledby="characteristics-skills-section">
      {/* Jets de sauvegarde */}
      <Card
        className="gap-3 py-4 px-4 md:px-6"
        role="region"
        aria-labelledby="character-savingthrows-edit">
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
        className="gap-3 py-4 px-4 md:px-6"
        role="region"
        aria-labelledby="skills-heading-edit">
        <h2
          id="skills-heading-edit"
          className={`text-xl sm:text-2xl font-semibold ${accentColor}`}>
          {t("skills")}
        </h2>
        <NpcSkillsEdit form={form} />
      </Card>
    </section>
  );
}
