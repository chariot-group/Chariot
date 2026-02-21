import { Controller, UseFormReturn } from "react-hook-form";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
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
    form: UseFormReturn<any>;
    accentColor: string;
}

export default function NpcSkillsEdit({ form, accentColor }: NpcSkillsEditProps) {
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {skills.map(({ key, icon: Icon, ability }) => {
                const skillValue = form.watch(`stats.skills.${key}`) || 0;
                const abilityScore = form.watch(`stats.abilityScores.${ability}`) || 10;
                const abilityModifier = Math.floor((abilityScore - 10) / 2);

                return (
                    <Controller
                        key={key}
                        name={`stats.skills.${key}`}
                        control={form.control}
                        render={({ field, fieldState }) => (
                            <Card className="p-2">
                                <div className="flex items-center gap-2">
                                    <Icon className="w-5 h-5 shrink-0" aria-hidden="true" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm truncate">{t(`skillNames.${key}`)}</p>
                                        <p className="text-xs text-gray-middle-light">
                                            {t(`abilities.${ability}`)} ({abilityModifier >= 0 ? `+${abilityModifier}` : abilityModifier})
                                        </p>
                                    </div>
                                    <Input
                                        {...field}
                                        value={field.value === 0 ? "" : field.value}
                                        onChange={(e) => {
                                            const value = e.target.value === "" ? 0 : parseInt(e.target.value);
                                            field.onChange(isNaN(value) ? 0 : value);
                                        }}
                                        className="w-16 text-center"
                                        type="number"
                                        placeholder={abilityModifier >= 0 ? `+${abilityModifier}` : `${abilityModifier}`}
                                        aria-label={t(`skillNames.${key}`)}
                                    />
                                </div>
                            </Card>
                        )}
                    />
                );
            })}
        </div>
    );
}
