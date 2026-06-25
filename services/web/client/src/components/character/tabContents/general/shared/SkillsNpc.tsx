import { useTranslations } from "next-intl";
import {
  Brain,
  Church,
  CircleQuestionMark,
  CrossIcon,
  Drama,
  Eye,
  Footprints,
  LockKeyhole,
  MessageSquare,
  MicVocal,
  Notebook,
  PawPrint,
  Sparkles,
  Sprout,
  TreePine,
  User2Icon,
  VenetianMask,
} from "lucide-react";
import { Stats } from "@/types/character";

interface NpcSkillsEditProps {
  stats: Stats;
}

export default function NpcSkillsEdit({ stats }: NpcSkillsEditProps) {
  const t = useTranslations("characterDetail.player.general");

  // Configuration des compétences avec leur icône et caractéristique associée
  const skills = [
    { key: "athletics", icon: Footprints, ability: "strength" },
    { key: "acrobatics", icon: User2Icon, ability: "dexterity" },
    { key: "sleightHand", icon: LockKeyhole, ability: "dexterity" },
    { key: "stealth", icon: VenetianMask, ability: "dexterity" },
    { key: "arcana", icon: Sparkles, ability: "intelligence" },
    { key: "history", icon: Notebook, ability: "intelligence" },
    { key: "investigation", icon: CircleQuestionMark, ability: "intelligence" },
    { key: "nature", icon: Sprout, ability: "intelligence" },
    { key: "religion", icon: Church, ability: "intelligence" },
    { key: "animalHandling", icon: PawPrint, ability: "wisdom" },
    { key: "insight", icon: Brain, ability: "wisdom" },
    { key: "medicine", icon: CrossIcon, ability: "wisdom" },
    { key: "perception", icon: Eye, ability: "wisdom" },
    { key: "survival", icon: TreePine, ability: "wisdom" },
    { key: "deception", icon: Drama, ability: "charisma" },
    { key: "intimidation", icon: User2Icon, ability: "charisma" },
    { key: "performance", icon: MicVocal, ability: "charisma" },
    { key: "persuasion", icon: MessageSquare, ability: "charisma" },
  ] as const;

  return (
    <div className="grid grid-cols-1 min-[1440px]:grid-cols-2 gap-1">
      {skills.map(({ key, icon: Icon, ability }) => {
        const abilityScore = stats.abilityScores[ability] || 10;
        const skillValue = stats?.skills?.[key] ? stats?.skills?.[key] : Math.floor((abilityScore - 10) / 2);

        const skillFullName = t(`skillNames.${key}`);
        return (
          <div
            key={key}
            className="flex items-center gap-2 px-2 py-1.5 rounded-[10px] hover:bg-gray-middle-light/50 transition-colors">
            {/* Icône compétence */}
            <Icon
              className="w-4 h-4 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />

            {/* Nom + caractéristique */}
            <div className="min-w-0 flex-1">
              <div className="min-w-0">
                <p className="text-sm leading-tight truncate">{skillFullName}</p>
              </div>
              <p className="text-xs text-muted-foreground leading-tight">
                {t(`abilities.${ability}`)}
              </p>
            </div>

            {/* Bonus */}
            <span className="text-sm font-bold tabular-nums shrink-0">
              {skillValue >= 0 ? `+${skillValue}` : `${skillValue}`}
            </span>
          </div>
        );
      })}
    </div>
  );
}
