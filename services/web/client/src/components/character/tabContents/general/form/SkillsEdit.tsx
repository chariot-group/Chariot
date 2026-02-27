import { Controller, UseFormReturn } from "react-hook-form";
import { Card } from "@/components/ui/card";
import Image from "next/image";
import { useTranslations } from "next-intl";
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

interface SkillsEditProps {
  form: UseFormReturn<any>;
  accentColor: string;
  enableHalfProficiency: boolean;
  enableExpertise: boolean;
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

export default function SkillsEdit({ form, accentColor, enableHalfProficiency, enableExpertise }: SkillsEditProps) {
  const t = useTranslations("characterDetail.player.general");

  /**
   * Détermine le prochain niveau de maîtrise selon les toggles actifs
   * @param currentLevel Niveau actuel (0, 1, 2, ou 3)
   * @returns Le prochain niveau
   */
  const getNextMasteryLevel = (currentLevel: number): number => {
    const hasHalf = enableHalfProficiency;
    const hasExpertise = enableExpertise;

    if (!hasHalf && !hasExpertise) {
      // Sans toggles : cycle 0 ↔ 2
      return currentLevel === 0 ? 2 : 0;
    } else if (hasHalf && !hasExpertise) {
      // Avec demi-maîtrise seulement : cycle 0 → 1 → 2 → 0
      if (currentLevel === 0) return 1;
      if (currentLevel === 1) return 2;
      return 0;
    } else if (!hasHalf && hasExpertise) {
      // Avec expertise seulement : cycle 0 → 2 → 3 → 0
      if (currentLevel === 0) return 2;
      if (currentLevel === 2) return 3;
      return 0;
    } else {
      // Avec les deux : cycle 0 → 1 → 2 → 3 → 0
      if (currentLevel === 0) return 1;
      if (currentLevel === 1) return 2;
      if (currentLevel === 2) return 3;
      return 0;
    }
  };

  /**
   * Toggle le niveau de maîtrise d'une compétence
   */
  const toggleSkillProficiency = (skillKey: string, abilityKey: AbilityKey) => {
    const currentMasteryLevel = form.watch(`stats.masteries.${skillKey}`) || 0;
    const nextMasteryLevel = getNextMasteryLevel(currentMasteryLevel);

    // Mettre à jour le niveau de maîtrise dans le formulaire
    form.setValue(`stats.masteries.${skillKey}`, nextMasteryLevel, { shouldDirty: true });
  };

  return (
    <div className="grid grid-cols-2 gap-2">
      {skillsConfig.map(({ key, translationKey, abilityKey, icon }) => {
        const masteryLevel = form.watch(`stats.masteries.${key}`) || 0;
        const proficiencyBonus = form.watch("stats.proficiencyBonus") || 2;
        const abilityScore = form.watch(`stats.abilityScores.${abilityKey}`) || 10;
        const skillBonus = calculateSkillBonus(masteryLevel, abilityScore, proficiencyBonus);
        const isActive = masteryLevel > 0;

        return (
          <Controller
            key={key}
            name={`stats.masteries.${key}`}
            control={form.control}
            render={() => (
              <button
                type="button"
                onClick={() => toggleSkillProficiency(key, abilityKey)}
                className="text-left">
                <Card className="p-2 hover:bg-gray-middle-light/50 transition-colors cursor-pointer">
                  <div className="text-sm grid grid-cols-3 justify-between">
                    <div className="flex items-center col-span-2 gap-2">
                      <span className="shrink-0">{icon}</span>
                      <span className={`truncate ${isActive && "italic"}`}>{t(`skillNames.${translationKey}`)}</span>
                    </div>
                    <div className="flex items-center gap-2 self-end justify-end">
                      <span className="font-bold shrink-0">{skillBonus >= 0 ? `+${skillBonus}` : `${skillBonus}`}</span>
                      <Image
                        src={getIconForValue(masteryLevel, accentColor)}
                        alt={t("masteryLevelIcon", { level: masteryLevel })}
                        width={20}
                        height={20}
                        className="shrink-0"
                        aria-hidden="true"
                      />
                    </div>
                  </div>
                </Card>
              </button>
            )}
          />
        );
      })}
    </div>
  );
}
