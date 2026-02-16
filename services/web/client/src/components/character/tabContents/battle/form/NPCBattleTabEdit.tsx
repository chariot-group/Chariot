import { NPC } from "@/types/character";
import { Controller, UseFormReturn } from "react-hook-form";
import { Field, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useTranslations } from "next-intl";

interface NPCBattleTabEditProps {
  npc: NPC;
  accentColor: string;
  form: UseFormReturn<any>;
}

export default function NPCBattleTabEdit({ npc, accentColor, form }: NPCBattleTabEditProps) {
  const t = useTranslations("characterDetail.battle");
  const tEdit = useTranslations("characterDetail.edit");



  return (
    <div
      className="w-full flex flex-col gap-2 md:gap-4 px-2 sm:px-0"
      role="main"
      aria-labelledby="combat-tab-edit">
      <h2 id="combat-tab-edit" className="sr-only">
        {t("stats")}
      </h2>

      {/* Section Points de Vie */}
      <Card className="gap-4">
        <h3 className={`text-${accentColor} text-xl font-bold`}>{t("healthPoints")}</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* PV Actuels */}
          <Controller
            name="stats.currentHitPoints"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} orientation="vertical">
                <label htmlFor="health-current" className="text-sm font-medium">
                  {tEdit("currentHP")}
                </label>
                <Input
                  {...field}
                  onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                  id="health-current"
                  aria-invalid={fieldState.invalid}
                  aria-describedby={fieldState.error ? "health-current-error" : undefined}
                  placeholder={tEdit("currentHP")}
                  type="number"
                />
                {fieldState.error && <FieldError id="health-current-error" errors={[fieldState.error]} />}
              </Field>
            )}
          />

          {/* PV Maximum */}
          <Controller
            name="stats.maxHitPoints"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} orientation="vertical">
                <label htmlFor="health-max" className="text-sm font-medium">
                  {tEdit("maxHP")}
                </label>
                <Input
                  {...field}
                  onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                  id="health-max"
                  aria-invalid={fieldState.invalid}
                  aria-describedby={fieldState.error ? "health-max-error" : undefined}
                  placeholder={tEdit("maxHP")}
                  type="number"
                />
                {fieldState.error && <FieldError id="health-max-error" errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </div>
      </Card>

      {/* Section Défense */}
      <Card className="gap-4">
        <h3 className={`text-${accentColor} text-xl font-bold`}>{tEdit("defense")}</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Classe d'Armure */}
          <Controller
            name="stats.armorClass"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} orientation="vertical">
                <label htmlFor="armor-class" className="text-sm font-medium">
                  {t("armorClass")}
                </label>
                <Input
                  {...field}
                  onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                  id="armor-class"
                  aria-invalid={fieldState.invalid}
                  aria-describedby={fieldState.error ? "armor-class-error" : undefined}
                  placeholder={t("armorClass")}
                  type="number"
                />
                {fieldState.error && <FieldError id="armor-class-error" errors={[fieldState.error]} />}
              </Field>
            )}
          />

          {/* Initiative */}
          <Controller
            name="stats.initiative"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} orientation="vertical">
                <label htmlFor="initiative" className="text-sm font-medium">
                  {tEdit("initiative")}
                </label>
                <Input
                  {...field}
                  onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                  id="initiative"
                  aria-invalid={fieldState.invalid}
                  aria-describedby={fieldState.error ? "initiative-error" : undefined}
                  placeholder={tEdit("initiative")}
                  type="number"
                />
                {fieldState.error && <FieldError id="initiative-error" errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </div>
      </Card>

      {/* 
        🚧 TODO : Ajouter les autres sections ici :
        - Vitesses (speed.walk, speed.fly, speed.swim, speed.climb, speed.burrow)
        - Actions (actions[])
        - Actions légendaires (legendaryActions[])
        - Actions de repaire (lairActions[])
        
        Les développeurs peuvent s'inspirer du pattern ci-dessus pour ajouter d'autres champs.
      */}
      <Card className="gap-4 bg-red/10 border-red">
        <p className="text-sm text-gray-middle-light italic">
          🚧 <strong>{tEdit("todoForDevelopers")}</strong> - Ajouter les champs manquants pour l'onglet Combat des
          NPCs : vitesses, actions, actions légendaires, actions de repaire, etc.
        </p>
      </Card>
    </div>
  );
}
