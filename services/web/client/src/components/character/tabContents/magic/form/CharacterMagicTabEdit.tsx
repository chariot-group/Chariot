import { Character } from "@/types/character";
import { Controller, UseFormReturn } from "react-hook-form";
import { Field, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useTranslations } from "next-intl";

interface CharacterMagicTabEditProps {
  character: Character;
  accentColor: string;
  form: UseFormReturn<any>;
}

export default function CharacterMagicTabEdit({ character, accentColor, form }: CharacterMagicTabEditProps) {
  const t = useTranslations("characterDetail.magic");
  const tEdit = useTranslations("characterDetail.edit");

  return (
    <div
      className="w-full flex flex-col gap-2 md:gap-4 px-2 sm:px-0"
      role="main"
      aria-labelledby="magic-tab-edit">
      <h2 id="magic-tab-edit" className="sr-only">
        {t("spells")}
      </h2>

      {/* Section Statistiques de Magie */}
      <Card className="gap-4">
        <h3 className={`text-${accentColor} text-xl font-bold`}>{tEdit("spellcastingStats")}</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Caractéristique d'incantation */}
          <Controller
            name="spellcasting.0.ability"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} orientation="vertical">
                <label htmlFor="spellcasting-ability" className="text-sm font-medium">
                  {tEdit("spellcastingAbility")}
                </label>
                <Input
                  {...field}
                  id="spellcasting-ability"
                  aria-invalid={fieldState.invalid}
                  aria-describedby={fieldState.error ? "spellcasting-ability-error" : undefined}
                  placeholder={tEdit("spellcastingAbility")}
                  type="text"
                />
                {fieldState.error && <FieldError id="spellcasting-ability-error" errors={[fieldState.error]} />}
              </Field>
            )}
          />

          {/* DD des sorts */}
          <Controller
            name="spellcasting.0.saveDC"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} orientation="vertical">
                <label htmlFor="spell-save-dc" className="text-sm font-medium">
                  {tEdit("spellSaveDC")}
                </label>
                <Input
                  {...field}
                  onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                  id="spell-save-dc"
                  aria-invalid={fieldState.invalid}
                  aria-describedby={fieldState.error ? "spell-save-dc-error" : undefined}
                  placeholder={tEdit("spellSaveDC")}
                  type="number"
                />
                {fieldState.error && <FieldError id="spell-save-dc-error" errors={[fieldState.error]} />}
              </Field>
            )}
          />

          {/* Bonus d'attaque de sort */}
          <Controller
            name="spellcasting.0.attackBonus"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} orientation="vertical">
                <label htmlFor="spell-attack-bonus" className="text-sm font-medium">
                  {tEdit("spellAttackBonus")}
                </label>
                <Input
                  {...field}
                  onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                  id="spell-attack-bonus"
                  aria-invalid={fieldState.invalid}
                  aria-describedby={fieldState.error ? "spell-attack-bonus-error" : undefined}
                  placeholder={tEdit("spellAttackBonus")}
                  type="number"
                />
                {fieldState.error && <FieldError id="spell-attack-bonus-error" errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </div>
      </Card>

      {/* 
        🚧 TODO : Ajouter les autres sections ici :
        - Emplacements de sorts par niveau (spellSlots.level1, level2, etc.)
        - Liste des sorts connus/préparés (spells[])
        - Sorts de classe vs sorts raciaux
        - Gestion des composants matériels
        
        Les développeurs peuvent s'inspirer du pattern ci-dessus pour ajouter d'autres champs.
      */}
      <Card className="gap-4 bg-pink/10 border-pink">
        <p className="text-sm text-gray-middle-light italic">
          🚧 <strong>{tEdit("todoForDevelopers")}</strong> - Ajouter les champs manquants pour l'onglet Magie :
          emplacements de sorts, liste des sorts, gestion des sorts préparés, etc.
        </p>
      </Card>
    </div>
  );
}
