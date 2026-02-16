import { Card } from "@/components/ui/card";
import { NPC } from "@/types/character";
import Image from "next/image";
import { useTranslations } from "next-intl";
import ShieldIcon from "@public/assets/icons/shield-icon.svg";
import RunningIcon from "@public/assets/icons/running-icon.svg";
import FeatherIcon from "@public/assets/icons/feather-icon.svg";
import CharacterHealthBar from "@/components/character/CharacterHealthBar";
import Skill from "@/components/character/tabContents/general/shared/Skill";
import { Bird, Mountain, Shovel, Waves } from "lucide-react";
import ActionSection from "@/components/character/tabContents/battle/shared/ActionSection";
import AbilitiesSection from "@/components/character/tabContents/shared/AbilitiesSection";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface Props {
  npc: NPC;
  accentColor: string;
}

const NPCBattleTabContent = ({ npc, accentColor }: Props) => {
  const t = useTranslations("characterDetail.battle");

  const tAbilities = useTranslations("characterDetail.player.general.abilities");

  // Configuration des badges de statistiques
  const speedBadges = [
    {
      key: "walk",
      value: npc.stats.speed.walk,
      icon: (
        <Image
          src={RunningIcon}
          alt=""
          aria-hidden="true"
          className="size-6"
        />
      ),
      tooltipKey: "walkSpeedTooltip",
    },
    {
      key: "climb",
      value: npc.stats.speed.climb,
      icon: (
        <Mountain
          size={24}
          className="text-black"
          aria-hidden="true"
        />
      ),
      tooltipKey: "climbSpeedTooltip",
    },
    {
      key: "swim",
      value: npc.stats.speed.swim,
      icon: (
        <Waves
          size={24}
          className="text-black"
          aria-hidden="true"
        />
      ),
      tooltipKey: "swimSpeedTooltip",
    },
    {
      key: "fly",
      value: npc.stats.speed.fly,
      icon: (
        <Bird
          size={24}
          className="text-black"
          aria-hidden="true"
        />
      ),
      tooltipKey: "flySpeedTooltip",
    },
    {
      key: "burrow",
      value: npc.stats.speed.burrow,
      icon: (
        <Shovel
          size={24}
          className="text-black"
          aria-hidden="true"
        />
      ),
      tooltipKey: "burrowSpeedTooltip",
    },
  ];

  return (
    <div className="w-full flex flex-col gap-4 items-start">
      <div className="grid grid-cols-4 max-[376px]:grid-cols-1 gap-3 md:gap-4 w-full">
        {/* Statistiques */}
        <Card
          className="gap-3 p-4 md:px-6 col-span-2 lg:col-span-1 h-fit"
          role="region"
          aria-labelledby="stats-heading-npc">
          <h2
            id="stats-heading-npc"
            className={`text-xl sm:text-2xl font-semibold ${accentColor}`}>
            {t("stats")}
          </h2>
          <div className="flex flex-row justify-start gap-2 text-xl font-extrabold flex-wrap">
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className="bg-white text-black flex flex-row justify-center gap-1 rounded-full p-2 items-center cursor-help focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-2"
                  tabIndex={0}
                  role="img"
                  aria-label={`${t("armorClass")} ${npc.stats.armorClass}`}>
                  <Image
                    src={ShieldIcon}
                    alt=""
                    aria-hidden="true"
                    width={20}
                    height={20}
                    className="size-5"
                  />
                  <span aria-hidden="true">{npc.stats.armorClass}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>{t("armorClassTooltip")}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className="bg-white text-black flex flex-row justify-center gap-1 rounded-full p-2 items-center cursor-help focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-2"
                  tabIndex={0}
                  role="img"
                  aria-label={`${t("initiativeTooltip")} ${npc.stats.initiative > 0 ? `+${npc.stats.initiative}` : npc.stats.initiative}`}>
                  <Image
                    src={FeatherIcon}
                    alt=""
                    aria-hidden="true"
                    width={20}
                    height={20}
                    className="size-5"
                  />
                  <span aria-hidden="true">
                    {npc.stats.initiative > 0 ? `+${npc.stats.initiative}` : npc.stats.initiative}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>{t("initiativeTooltip")}</TooltipContent>
            </Tooltip>
            {speedBadges.map(
              (badge) =>
                badge.value && (
                  <Tooltip key={badge.key}>
                    <TooltipTrigger asChild>
                      <div
                        className="bg-white text-black flex flex-row justify-center gap-1 rounded-full p-2 items-center cursor-help focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-2"
                        tabIndex={0}
                        role="img"
                        aria-label={`${t(badge.tooltipKey as any)} ${badge.value} ${t("feet")}`}>
                        {badge.icon}
                        <span aria-hidden="true">
                          {badge.value}
                          {t("feetAbbr")}
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>{t(badge.tooltipKey as any)}</TooltipContent>
                  </Tooltip>
                ),
            )}
          </div>
          <CharacterHealthBar
            currentHP={npc.stats.currentHitPoints}
            maxHP={npc.stats.maxHitPoints}
            tempHP={npc.stats.tempHitPoints}
          />
          <div className="text-lg px-2">
            <span>{t("hitPointsRoll")}</span>
            {npc.hitPointsRoll && <span className="font-bold"> {npc.hitPointsRoll}</span>}
          </div>
        </Card>
        {/* Jet de sauvegarde */}
        <div className="flex flex-col gap-2 col-span-2 2xl:col-span-1 ">
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
                const abilityScore = npc?.stats?.abilityScores[key as keyof typeof npc.stats.abilityScores] || 0;
                const valeurCalculer = Math.floor((abilityScore - 10) / 2);
                return (
                  <Skill
                    key={key}
                    skillName={abilityName}
                    value={value > 0 ? 2 : 0}
                    accentColor={accentColor}
                    skills={value > 0 ? value : valeurCalculer}
                  />
                );
              })}
          </div>
        </div>
        <div className="grid lg:grid-cols-2 gap-2 w-full"></div>
        {/* Capacités et traits */}
        <AbilitiesSection
          abilities={npc.abilities}
          accentColor={accentColor}
          title={t("abilitiesAndTraits")}
          headingId="abilities-traits-heading-npc"
          className="col-span-full lg:col-span-2"
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
