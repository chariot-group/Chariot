import { Controller, UseFormReturn } from "react-hook-form";
import { Field, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useTranslations } from "next-intl";

interface AbilityScoresEditProps {
    form: UseFormReturn<any>;
}

export default function AbilityScoresEdit({ form }: AbilityScoresEditProps) {
    const t = useTranslations("characterDetail.player.general");

    const abilityScores = [
        { key: "strength", label: t("abilities.strength") },
        { key: "dexterity", label: t("abilities.dexterity") },
        { key: "constitution", label: t("abilities.constitution") },
        { key: "intelligence", label: t("abilities.intelligence") },
        { key: "wisdom", label: t("abilities.wisdom") },
        { key: "charisma", label: t("abilities.charisma") },
    ] as const;

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {abilityScores.map(({ key, label }) => (
                <Controller
                    key={key}
                    name={`stats.abilityScores.${key}`}
                    control={form.control}
                    render={({ field, fieldState }) => {
                        const score = field.value || 10;
                        const modifier = Math.floor((score - 10) / 2);
                        const modifierText = modifier >= 0 ? `+${modifier}` : `${modifier}`;

            return (
              <Field
                data-invalid={fieldState.invalid}
                orientation="vertical">
                <div className="grid grid-cols-2 items-baseline">
                  <div className="truncate">
                    <label
                      htmlFor={`ability-${key}`}
                      className="text-sm font-medium">
                      {label}
                    </label>
                    <div className="flex items-center gap-2">
                      <Input
                        {...field}
                        value={field.value || ""}
                        id={`ability-${key}`}
                        type="number"
                        min="1"
                        max="30"
                        className="flex-1 px-1"
                        aria-invalid={fieldState.invalid}
                        aria-describedby={fieldState.error ? `ability-${key}-error` : undefined}
                        placeholder={t("abilityScorePlaceholder")}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col min-w-10 items-center gap-3">
                    <label className="text-xs text-gray-middle-light leading-none">{t("abilityBonus")}</label>
                    <span className="text-sm font-bold text-center leading-tight">{modifierText}</span>
                  </div>
                  {fieldState.error && (
                    <FieldError
                      id={`ability-${key}-error`}
                      errors={[fieldState.error]}
                    />
                  )}
                </div>
              </Field>
            );
          }}
        />
      ))}
    </div>
  );
}
