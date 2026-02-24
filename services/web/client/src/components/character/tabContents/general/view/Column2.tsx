import { Card } from "@/components/ui/card";
import { Player } from "@/types/character";
import { useTranslations } from "next-intl";
import SavingThrow from "../shared/SavingThrow";
import Skills from "../shared/Skills";

interface Column2Props {
  player: Player;
  accentColor: string;
  className?: string;
}

export default function Column2({ player, accentColor, className }: Column2Props) {
  const t = useTranslations("characterDetail.player.general");
  return (
    <section
      className={`flex flex-col gap-2 md:gap-4 ${className}`}
      aria-labelledby="characteristics-skills-section">
      {/* Bonus */}
      <Card
        className="gap-3 py-4 px-4 md:px-6 flex-row items-center justify-between"
        role="region"
        aria-labelledby="proficiency-bonus-heading">
        <h2
          id="proficiency-bonus-heading"
          className={`text-xl sm:text-2xl font-semibold ${accentColor}`}>
          {t("proficiencyBonus")}
        </h2>
        <p
          className="text-sm sm:text-base font-bold"
          aria-label={`${t("proficiencyBonus")} ${player?.stats?.proficiencyBonus}`}>
          {player?.stats?.proficiencyBonus >= 0
            ? `+${player?.stats?.proficiencyBonus}`
            : `${player?.stats?.proficiencyBonus}`}
        </p>
      </Card>

      {/* Jet de sauvegarde */}
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
          className="grid grid-cols-2 gap-2"
          role="list">
          {player?.stats &&
            Object.entries(player?.stats?.savingThrows).map(([key, value]) => {
              const abilityName = t(`abilities.${key}`);
              return (
                <SavingThrow
                  key={key}
                  label={abilityName}
                  skillName={key as keyof typeof player.stats.abilityScores}
                  accentColor={accentColor}
                  stats={player?.stats}
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
        <Skills
          accentColor={accentColor}
          stats={player?.stats}
        />
      </div>
    </section>
  );
}
