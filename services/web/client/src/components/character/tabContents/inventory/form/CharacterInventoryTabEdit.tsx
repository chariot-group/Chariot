import { Character } from "@/types/character";
import { Controller, UseFormReturn } from "react-hook-form";
import { Field, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useTranslations } from "next-intl";

/**
 * Composant d'édition pour l'onglet Inventaire
 * 
 * 🚧 TEMPLATE À COMPLÉTER PAR LES DÉVELOPPEURS
 * 
 * Ce composant fournit la structure de base pour l'édition de l'inventaire.
 * Commun pour Players et NPCs.
 * 
 * Champs suggérés à implémenter :
 * - Pièces (coins.cp, coins.sp, coins.ep, coins.gp, coins.pp)
 * - Objets (items[])
 * - Équipement (equipment)
 * - Capacité de transport (carryCapacity)
 */
interface CharacterInventoryTabEditProps {
  character: Character;
  accentColor: string;
  form: UseFormReturn<any>;
}

export default function CharacterInventoryTabEdit({ character, accentColor, form }: CharacterInventoryTabEditProps) {
  const t = useTranslations("characterDetail.inventory");
  const tEdit = useTranslations("characterDetail.edit");

  return (
    <div
      className="w-full flex flex-col gap-2 md:gap-4 px-2 sm:px-0"
      role="main"
      aria-labelledby="inventory-tab-edit">
      <h2 id="inventory-tab-edit" className="sr-only">
        {t("coins")}
      </h2>

      {/* Section Monnaie */}
      <Card className="gap-4">
        <h3 className={`text-${accentColor} text-xl font-bold`}>{t("coins")}</h3>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {/* Pièces de Cuivre */}
          <Controller
            name="treasure.cp"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} orientation="vertical">
                <label htmlFor="coins-cp" className="text-sm font-medium">
                  {tEdit("copperPieces")}
                </label>
                <Input
                  {...field}
                  onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                  id="coins-cp"
                  aria-invalid={fieldState.invalid}
                  aria-describedby={fieldState.error ? "coins-cp-error" : undefined}
                  placeholder="PC"
                  type="number"
                />
                {fieldState.error && <FieldError id="coins-cp-error" errors={[fieldState.error]} />}
              </Field>
            )}
          />

          {/* Pièces d'Argent */}
          <Controller
            name="treasure.sp"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} orientation="vertical">
                <label htmlFor="coins-sp" className="text-sm font-medium">
                  {tEdit("silverPieces")}
                </label>
                <Input
                  {...field}
                  onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                  id="coins-sp"
                  aria-invalid={fieldState.invalid}
                  aria-describedby={fieldState.error ? "coins-sp-error" : undefined}
                  placeholder="PA"
                  type="number"
                />
                {fieldState.error && <FieldError id="coins-sp-error" errors={[fieldState.error]} />}
              </Field>
            )}
          />

          {/* Pièces d'Électrum */}
          <Controller
            name="treasure.ep"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} orientation="vertical">
                <label htmlFor="coins-ep" className="text-sm font-medium">
                  {tEdit("electrumPieces")}
                </label>
                <Input
                  {...field}
                  onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                  id="coins-ep"
                  aria-invalid={fieldState.invalid}
                  aria-describedby={fieldState.error ? "coins-ep-error" : undefined}
                  placeholder="PE"
                  type="number"
                />
                {fieldState.error && <FieldError id="coins-ep-error" errors={[fieldState.error]} />}
              </Field>
            )}
          />

          {/* Pièces d'Or */}
          <Controller
            name="treasure.gp"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} orientation="vertical">
                <label htmlFor="coins-gp" className="text-sm font-medium">
                  {tEdit("goldPieces")}
                </label>
                <Input
                  {...field}
                  onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                  id="coins-gp"
                  aria-invalid={fieldState.invalid}
                  aria-describedby={fieldState.error ? "coins-gp-error" : undefined}
                  placeholder="PO"
                  type="number"
                />
                {fieldState.error && <FieldError id="coins-gp-error" errors={[fieldState.error]} />}
              </Field>
            )}
          />

          {/* Pièces de Platine */}
          <Controller
            name="treasure.pp"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} orientation="vertical">
                <label htmlFor="coins-pp" className="text-sm font-medium">
                  {tEdit("platinumPieces")}
                </label>
                <Input
                  {...field}
                  onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                  id="coins-pp"
                  aria-invalid={fieldState.invalid}
                  aria-describedby={fieldState.error ? "coins-pp-error" : undefined}
                  placeholder="PP"
                  type="number"
                />
                {fieldState.error && <FieldError id="coins-pp-error" errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </div>
      </Card>

      {/* 
        🚧 TODO : Ajouter les autres sections ici :
        - Liste des objets (items[])
        - Équipement équipé (equipment)
        - Armes et armures
        - Objets magiques
        - Capacité de transport
        
        Les développeurs peuvent s'inspirer du pattern ci-dessus pour ajouter d'autres champs.
      */}
      <Card className="gap-4 bg-yellow/10 border-yellow">
        <p className="text-sm text-gray-middle-light italic">
          🚧 <strong>{tEdit("todoForDevelopers")}</strong> - Ajouter les champs manquants pour l'onglet Inventaire :
          liste des objets, équipement, armes, armures, objets magiques, etc.
        </p>
      </Card>
    </div>
  );
}
