import { Controller, UseFormReturn, FieldValues } from "react-hook-form";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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

interface NpcSkillsEditProps {
  form: UseFormReturn<FieldValues>;
}

export default function NpcSkillsEdit({ form }: NpcSkillsEditProps) {
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
    <div className="grid grid-cols-2 md:grid-cols-1 xl:grid-cols-2 gap-2">
      {skills.map(({ key, icon: Icon, ability }) => {
        const abilityScore = form.watch(`stats.abilityScores.${ability}`) || 10;
        const abilityModifier = Math.floor((abilityScore - 10) / 2);

        return (
          <Controller
            key={key}
            name={`stats.skills.${key}`}
            control={form.control}
            render={({ field }) => (
              <Card className="min-w-0 p-2">
                <div className="grid grid-cols-[auto_minmax(0,1fr)_5rem] items-center gap-2">
                  <Icon
                    className="w-5 h-5 shrink-0"
                    aria-hidden="true"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{t(`skillNames.${key}`)}</p>
                    <p className="text-xs text-gray-middle-light truncate">{t(`abilities.${ability}`)}</p>
                    <p className="text-xs text-gray-middle-light">
                      ({abilityModifier >= 0 ? `+${abilityModifier}` : abilityModifier})
                    </p>
                  </div>
                  <div className="w-20 shrink-0">
                    <Input
                      {...field}
                      value={field.value === 0 ? "" : field.value}
                      className="text-center"
                      type="number"
                      placeholder={t("abilityBonusPlaceholder", {
                        value: abilityModifier >= 0 ? `+${abilityModifier}` : `${abilityModifier}`,
                      })}
                      aria-label={t(`skillNames.${key}`)}
                    />
                  </div>
                </div>
              </Card>
            )}
          />
        );
      })}
    </div>
  );
}
