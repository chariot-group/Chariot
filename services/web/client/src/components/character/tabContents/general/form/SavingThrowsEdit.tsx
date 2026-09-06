import { Controller, UseFormReturn, FieldValues } from "react-hook-form";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { getIconForValue } from "@/utils/global.utils";

interface SavingThrowsEditProps {
  form: UseFormReturn<FieldValues>;
  accentColor: string;
}

export default function SavingThrowsEdit({ form, accentColor }: SavingThrowsEditProps) {
  const t = useTranslations("characterDetail.player.general");
  const tAbilities = useTranslations("characterDetail.player.general.abilities");

  const abilityScoreKeys = [
    { key: "strength", label: tAbilities("strength") },
    { key: "dexterity", label: tAbilities("dexterity") },
    { key: "constitution", label: tAbilities("constitution") },
    { key: "intelligence", label: tAbilities("intelligence") },
    { key: "wisdom", label: tAbilities("wisdom") },
    { key: "charisma", label: tAbilities("charisma") },
  ] as const;

  const toggleSavingThrowProficiency = (abilityKey: string) => {
    const currentValue = form.watch(`stats.savingThrows.${abilityKey}`) || 0;
    const proficiencyBonus = form.watch("stats.proficiencyBonus") || 2;

    // Si actuellement maîtrisé (valeur != 0), on démaitrise
    if (currentValue !== 0) {
      form.setValue(`stats.savingThrows.${abilityKey}`, 0, { shouldDirty: true });
      return;
    }
    // Stocker uniquement le bonus de maîtrise (toujours positif)
    // L'affichage calculera: modificateur + proficiencyBonus
    form.setValue(`stats.savingThrows.${abilityKey}`, proficiencyBonus, { shouldDirty: true });
  };

  return (
    <div className="grid max-[376px]:grid-cols-2 grid-cols-1 lg:grid-cols-2 gap-2">
      {abilityScoreKeys.map(({ key, label }) => {
        const abilityScore = form.watch(`stats.abilityScores.${key}`) || 10;
        const savingThrowValue = form.watch(`stats.savingThrows.${key}`) || 0;
        const abilityModifier = Math.floor((abilityScore - 10) / 2);
        const isProficient = savingThrowValue !== 0;
        const displayBonus = isProficient ? abilityModifier + savingThrowValue : abilityModifier;
        const masteryLevel = isProficient ? 2 : 0;

        return (
          <Controller
            key={key}
            name={`stats.savingThrows.${key}`}
            control={form.control}
            render={() => (
              <button
                type="button"
                onClick={() => toggleSavingThrowProficiency(key)}
                className="text-left">
                <div className="p-2 hover:bg-gray-middle-light/50 transition-colors cursor-pointer">
                  <div className="text-sm sm:text-base flex items-center gap-2 justify-between">
                    <span className={`truncate font-medium text-gray-light ${isProficient ? "italic" : ""}`}>
                      {label}
                    </span>{" "}
                    <div className="flex flex-row gap-2">
                      <span className="font-bold shrink-0 text-foreground">
                        {displayBonus >= 0 ? `+${displayBonus}` : `${displayBonus}`}
                      </span>
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
                </div>
              </button>
            )}
          />
        );
      })}
    </div>
  );
}
