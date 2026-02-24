import { Card } from "@/components/ui/card";
import { NPC } from "@/types/character";
import { useTranslations } from "next-intl";
import ActionSection from "@/components/character/tabContents/battle/shared/ActionSection";
import AbilitiesSection from "@/components/character/tabContents/shared/AbilitiesSection";
import SavingThrow from "@/components/character/tabContents/general/shared/SavingThrow";
import NpcStatistics from "../../shared/NpcStatistics";

interface Props {
  npc: NPC;
  accentColor: string;
}

const NPCBattleTabContent = ({ npc, accentColor }: Props) => {
  const t = useTranslations("characterDetail.battle");

  const tAbilities = useTranslations("characterDetail.player.general.abilities");

  return (
    <div className="w-full flex flex-col gap-4 items-start">
      <div className="grid grid-cols-3 max-[426px]:grid-cols-1 gap-3 md:gap-4 w-full">
        {/* Statistiques */}
        <NpcStatistics
          npc={npc}
          accentColor={accentColor}
        />
        {/* Jet de sauvegarde */}
        <div className="flex flex-col gap-2">
          <Card
            className="gap-3 p-4 md:px-6  h-fit"
            role="region"
            aria-labelledby="saving-throws-heading">
            <h2
              id="saving-throws-heading"
              className={`text-xl sm:text-2xl font-semibold ${accentColor}`}>
              {t("savingThrows")}
            </h2>
          </Card>

          <div
            className="grid max-[376px]:grid-cols-2 grid-cols-1 lg:grid-cols-2 gap-2"
            role="list">
            {npc?.stats &&
              Object.entries(npc?.stats?.savingThrows).map(([key, value]) => {
                const abilityName = tAbilities(key as any);
                return (
                  <SavingThrow
                    key={key}
                    label={abilityName}
                    skillName={key as keyof typeof npc.stats.abilityScores}
                    accentColor={accentColor}
                    stats={npc.stats}
                  />
                );
              })}
          </div>
        </div>
        {/* Capacités et traits */}
        <AbilitiesSection
          abilities={npc.abilities}
          accentColor={accentColor}
          title={t("abilitiesAndTraits")}
          headingId="abilities-traits-heading-npc"
        />
      </div>
      {/* Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 w-full">
        {/* Actions Standards */}
        <ActionSection
          title={t("actions")}
          actions={npc.actions.standard}
          accentColor={accentColor}
        />
        {/* Actions Légendaires */}
        <ActionSection
          title={t("legendaryActions")}
          actions={npc.actions.legendary}
          accentColor={accentColor}
        />
        {/* Actions de Repèrex */}
        <ActionSection
          title={t("lairActions")}
          actions={npc.actions.lair}
          accentColor={accentColor}
        />
      </div>
    </div>
  );
};

export default NPCBattleTabContent;
