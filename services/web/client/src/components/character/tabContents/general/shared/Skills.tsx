import { PlayerStats } from "@/types/character";
import { calculateSkillBonus, getIconForValue } from "@/utils/global.utils";
import {
  User2Icon,
  Sparkles,
  Footprints,
  VenetianMask,
  PawPrint,
  LockKeyhole,
  Notebook,
  Brain,
  CircleQuestionMark,
  CrossIcon,
  Sprout,
  Eye,
  MessageSquare,
  Church,
  MicVocal,
  TreePine,
  Drama,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";

interface SkillsProps {
  accentColor: string;
  stats: PlayerStats;
}

type AbilityKey = "strength" | "dexterity" | "constitution" | "intelligence" | "wisdom" | "charisma";

interface SkillConfig {
  key: string;
  translationKey: string;
  abilityKey: AbilityKey;
  icon: React.ReactElement;
}

const skillsConfig: SkillConfig[] = [
  { key: "acrobatics", translationKey: "acrobatics", abilityKey: "dexterity", icon: <User2Icon aria-hidden="true" /> },
  { key: "arcana", translationKey: "arcana", abilityKey: "intelligence", icon: <Sparkles aria-hidden="true" /> },
  { key: "athletics", translationKey: "athletics", abilityKey: "strength", icon: <Footprints aria-hidden="true" /> },
  { key: "stealth", translationKey: "stealth", abilityKey: "dexterity", icon: <VenetianMask aria-hidden="true" /> },
  {
    key: "animalHandling",
    translationKey: "animalHandling",
    abilityKey: "wisdom",
    icon: <PawPrint aria-hidden="true" />,
  },
  {
    key: "sleightHand",
    translationKey: "sleightHand",
    abilityKey: "dexterity",
    icon: <LockKeyhole aria-hidden="true" />,
  },
  { key: "history", translationKey: "history", abilityKey: "intelligence", icon: <Notebook aria-hidden="true" /> },
  {
    key: "intimidation",
    translationKey: "intimidation",
    abilityKey: "charisma",
    icon: <User2Icon aria-hidden="true" />,
  },
  { key: "insight", translationKey: "insight", abilityKey: "wisdom", icon: <Brain aria-hidden="true" /> },
  {
    key: "investigation",
    translationKey: "investigation",
    abilityKey: "intelligence",
    icon: <CircleQuestionMark aria-hidden="true" />,
  },
  { key: "medicine", translationKey: "medicine", abilityKey: "wisdom", icon: <CrossIcon aria-hidden="true" /> },
  { key: "nature", translationKey: "nature", abilityKey: "intelligence", icon: <Sprout aria-hidden="true" /> },
  { key: "perception", translationKey: "perception", abilityKey: "wisdom", icon: <Eye aria-hidden="true" /> },
  {
    key: "persuasion",
    translationKey: "persuasion",
    abilityKey: "charisma",
    icon: <MessageSquare aria-hidden="true" />,
  },
  { key: "religion", translationKey: "religion", abilityKey: "intelligence", icon: <Church aria-hidden="true" /> },
  { key: "performance", translationKey: "performance", abilityKey: "charisma", icon: <MicVocal aria-hidden="true" /> },
  { key: "survival", translationKey: "survival", abilityKey: "wisdom", icon: <TreePine aria-hidden="true" /> },
  { key: "deception", translationKey: "deception", abilityKey: "charisma", icon: <Drama aria-hidden="true" /> },
];

export default function Skills({ accentColor, stats }: SkillsProps) {
  const t = useTranslations("characterDetail.player.general");

  return (
    <div className="grid grid-cols-1 min-[1440px]:grid-cols-2 gap-1">
      {skillsConfig.map(({ key, translationKey, abilityKey, icon }) => {
        const masteryLevel = stats?.masteries[key as keyof typeof stats.masteries] || 0;
        const proficiencyBonus = stats?.proficiencyBonus || 2;
        const abilityScore = stats?.abilityScores[abilityKey] || 10;
        const skillBonus = calculateSkillBonus(masteryLevel, abilityScore, proficiencyBonus);
        const isActive = masteryLevel > 0;

        const skillFullName = t(`skillNames.${translationKey}`);
        return (
          <div
            key={key}
            className="flex items-center gap-2 px-2 py-1.5 rounded-[10px] hover:bg-gray-middle-light/50 transition-colors">
            {/* Icône compétence */}
            <span className="shrink-0 text-muted-foreground">{icon}</span>

            {/* Nom + caractéristique */}
            <div className="min-w-0 flex-1">
              <div className="min-w-0">
                <span className={`text-sm leading-tight truncate block${isActive ? " italic" : ""}`}>
                  {skillFullName}
                </span>
              </div>
              <div className="text-xs text-muted-foreground leading-tight">
                {/* Abréviation en layout 2 colonnes (≥1440px), nom complet en layout 1 colonne */}
                <abbr
                  className="hidden min-[1440px]:inline no-underline"
                  title={t(`abilities.${abilityKey}`)}>
                  {t(`abilitiesAbbr.${abilityKey}`)}
                </abbr>
                <span className="min-[1440px]:hidden">{t(`abilities.${abilityKey}`)}</span>
              </div>
            </div>

            {/* Bonus + maîtrise */}
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-sm font-bold tabular-nums">
                {skillBonus >= 0 ? `+${skillBonus}` : `${skillBonus}`}
              </span>
              <Image
                src={getIconForValue(masteryLevel, accentColor)}
                alt={t("masteryLevelIcon", { level: masteryLevel })}
                width={18}
                height={18}
                className="shrink-0"
                aria-hidden="true"
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
