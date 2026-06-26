import { Card } from "@/components/ui/card";
import { useTranslations } from "next-intl";
import SavingThrow from "@/components/character/tabContents/general/shared/SavingThrow";
import { NPC } from "@/types/character";
import SkillsNpc from "@/components/character/tabContents/general/shared/SkillsNpc";

interface NpcColumn2Props {
  npc: NPC;
  accentColor: string;
  className?: string;
}

export default function NpcColumn2({ npc, accentColor, className }: NpcColumn2Props) {
  const tNpc = useTranslations("characterDetail.npc");
  const t = useTranslations("characterDetail.player.general");

  return (
    <section
      className={`flex flex-col gap-2 md:gap-4 ${className || ""}`}
      aria-labelledby="characteristics-skills-section"
      aria-label={tNpc("general.characteristicsSkills")}>
      {/* Jets de sauvegarde */}
      <div className="flex flex-col gap-2">
        <Card
          className="gap-3 py-4 px-4 md:px-6"
          role="region"
          aria-labelledby="saving-throws-heading">
          <h2
            id="saving-throws-heading"
            className={`text-xl sm:text-2xl font-semibold ${accentColor}`}>
            {t("savingThrows")}
          </h2>
        </Card>
        <div
          className="grid grid-cols-3 gap-x-2 gap-y-1"
          role="list">
          {npc?.stats &&
            Object.entries(npc?.stats?.savingThrows).map(([key]) => {
              return (
                <SavingThrow
                  key={key}
                  skillName={key as keyof typeof npc.stats.abilityScores}
                  accentColor={accentColor}
                  stats={npc?.stats}
                />
              );
            })}
        </div>
      </div>

      {/* Compétences */}
      <div className="flex flex-col gap-2">
        <Card
          className="gap-3 py-4 px-4 md:px-6"
          role="region"
          aria-labelledby="skills-heading">
          <h2
            id="skills-heading"
            className={`text-xl sm:text-2xl font-semibold ${accentColor}`}>
            {t("skills")}
          </h2>
        </Card>
        <SkillsNpc stats={npc?.stats} />
      </div>
    </section>
  );
}
