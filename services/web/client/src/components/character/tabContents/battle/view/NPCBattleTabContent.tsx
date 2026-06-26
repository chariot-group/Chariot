import { Card } from "@/components/ui/card";
import { NPC } from "@/types/character";
import { useTranslations } from "next-intl";
import ActionSection from "@/components/character/tabContents/battle/shared/ActionSection";
import AbilitiesSection from "@/components/character/tabContents/shared/AbilitiesSection";
import SavingThrow from "@/components/character/tabContents/general/shared/SavingThrow";
import NpcStatistics from "@/components/character/tabContents/shared/NpcStatistics";
import { useId } from "react";

interface Props {
  npc: NPC;
  accentColor: string;
  onCharacterUpdate?: (updated?: NPC) => void;
}

const NPCBattleTabContent = ({ npc, accentColor, onCharacterUpdate }: Props) => {
  const t = useTranslations("characterDetail.battle");
  const sectionId = useId();
  const savingThrowsHeadingId = `${sectionId}-saving-throws-heading`;
  const abilitiesHeadingId = `${sectionId}-abilities-traits-heading-npc`;
  const affinitiesHeadingId = `${sectionId}-battle-affinities-heading-npc`;

  return (
    <div className="w-full flex flex-col gap-4 items-start">
      <div className="grid grid-cols-3 md:grid-cols-2 max-[426px]:grid-cols-1 gap-3 md:gap-4 w-full">
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
            aria-labelledby={savingThrowsHeadingId}>
            <h2
              id={savingThrowsHeadingId}
              className={`text-xl sm:text-2xl font-semibold ${accentColor}`}>
              {t("savingThrows")}
            </h2>

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
                      stats={npc.stats}
                    />
                  );
                })}
            </div>
          </Card>
        </div>
        {/* Capacités et traits */}
        <AbilitiesSection
          abilities={npc.abilities}
          accentColor={accentColor}
          title={t("abilitiesAndTraits")}
          headingId={abilitiesHeadingId}
          characterId={npc._id}
          characterKind="npcs"
          onAfterAbilityUse={onCharacterUpdate}
        />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 w-full">
        <Card
          className="gap-3 p-4 md:px-6 h-fit"
          role="region"
          aria-labelledby={affinitiesHeadingId}>
          <h2
            id={affinitiesHeadingId}
            className={`text-xl sm:text-2xl font-semibold ${accentColor}`}>
            {t("affinities")}
          </h2>
          <div className="flex flex-col gap-1">
            {npc?.affinities?.resistances?.length > 0 && (
              <p className="text-sm sm:text-base wrap-break-word">
                <span className="font-semibold">{t("resistances")} :</span> {npc.affinities.resistances.join(", ")}
              </p>
            )}
            {npc?.affinities?.vulnerabilities?.length > 0 && (
              <p className="text-sm sm:text-base wrap-break-word">
                <span className="font-semibold">{t("vulnerabilities")} :</span>{" "}
                {npc.affinities.vulnerabilities.join(", ")}
              </p>
            )}
            {npc?.affinities?.immunities?.length > 0 && (
              <p className="text-sm sm:text-base wrap-break-word">
                <span className="font-semibold">{t("immunities")} :</span> {npc.affinities.immunities.join(", ")}
              </p>
            )}
          </div>
        </Card>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4 w-full">
        {/* Actions Standards */}
        <div className="min-w-0">
          <ActionSection
            title={t("actions")}
            actions={npc.actions.standard}
            accentColor={accentColor}
          />
        </div>
        {/* Actions Légendaires */}
        <div className="min-w-0">
          <ActionSection
            title={t("legendaryActions")}
            actions={npc.actions.legendary}
            accentColor={accentColor}
          />
        </div>
        {/* Actions de Repèrex */}
        <div className="min-w-0">
          <ActionSection
            title={t("lairActions")}
            actions={npc.actions.lair}
            accentColor={accentColor}
          />
        </div>
      </div>
    </div>
  );
};

export default NPCBattleTabContent;
