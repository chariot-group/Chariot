import { Card } from "@/components/ui/card";
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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

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
    <div className="grid grid-cols-2 gap-2">
      {skills.map(({ key, icon: Icon, ability }) => {
        const skillValue = stats?.skills?.[key] || 0;

        return (
          <Tooltip key={key}>
            <TooltipTrigger>
              <Card className="p-2">
                <div className="text-sm grid grid-cols-3 justify-between">
                  <div className="flex items-center col-span-2 gap-2">
                    <Icon
                      className="w-5 h-5 shrink-0"
                      aria-hidden="true"
                    />
                    <p className="text-sm truncate">{t(`skillNames.${key}`)}</p>
                  </div>
                  <div className="flex items-center gap-2 self-end justify-end">
                    <span className="font-bold shrink-0">{skillValue >= 0 ? `+${skillValue}` : `${skillValue}`}</span>
                  </div>
                </div>
              </Card>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t(`abilities.${ability}`)}</p>
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}
